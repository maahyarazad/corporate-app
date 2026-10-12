---
description: "Task list for Static Screen Options & Allocation Hygiene"
---

# Tasks: Static Screen Options & Allocation Hygiene

**Input**: Design documents from `/specs/005-static-screen-options/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/navigation-options.md`, `quickstart.md`

**Tests**: No test tasks are generated. The repo has **one** test file
(`src/utils/__tests__/pushDestination.test.js`, pure logic, unrelated) and no component-render
harness, and no TDD approach was requested. Verification is instead the **grep gates (G1–G4)** and the
**device walk (V2–V5)** in `quickstart.md`. Those are treated as first-class tasks below, not
optional polish — for this feature they *are* the test suite.

**Organization**: Grouped by user story. US1, US2 and US4 touch disjoint files and can ship in any
order. US3 is the user's original request and has one cross-story dependency, called out at T024.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 / US4 — user story phases only

> **Why so few `[P]` markers**: almost every code change in US3 edits the single file
> `navigation.js`. Marking those parallel would invite conflicting concurrent edits to one file.
> They are deliberately sequential.

## Path Conventions

Mobile app, single package. Root-level `navigation.js`; app code under `src/`. Paths below are
repo-relative. Line numbers are as of commit `7a1b9f4` and will drift as edits land — **locate by the
quoted symbol, not by the number**.

---

## Phase 1: Setup

**Purpose**: Establish the branch and capture the before-state that every acceptance check compares against.

- [X] T001 Create branch `005-static-screen-options` from `fix/entertainer-return-jank` with `git checkout -b 005-static-screen-options`, and confirm `git status` is clean before editing
- [X] T002 Create `specs/005-static-screen-options/baseline.md` and record the four gate values from `quickstart.md` V1 — expect G1 `22`, G2 one hit at `navigation.js:474`, G3 `5` plus one `const values = {` in `src/services/app/app.context.js`, G4 one `useNavigation` call site
- [X] T003 Append to `specs/005-static-screen-options/baseline.md` the output of `npx jest` and of `wc -l navigation.js` (713), to support SC-006 and SC-007

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm the two external facts the plan depends on. T004 blocks every device-verification task in all stories; T005 blocks US3 specifically.

- [ ] T004 Build and launch the app on a device or emulator, and capture "before" screenshots of the 13 screens listed in the `quickstart.md` V4 table — this is the only record of the pre-change appearance and FR-009 cannot be verified without it
- [X] T005 [P] Re-verify the `onPress` injection at `node_modules/@react-navigation/stack/lib/commonjs/views/Header/HeaderSegment.js` lines 116–129, confirm `@react-navigation/stack` is still `6.2.1` in `package.json`, and record both in `specs/005-static-screen-options/baseline.md`; **if `onPress` is absent, stop and re-plan US3** — `research.md` R2 and contract C4 are the whole basis for hoisting `locationListOptions`

**Checkpoint**: the before-state is captured and the injection is confirmed. US1, US2 and US4 may now proceed in any order; US3 requires T005 green.

---

## Phase 3: User Story 1 — The header title cannot crash the app (Priority: P1)

**Goal**: Move `useContext(SectionContext)` out of the `headerTitle` callback and into a component, eliminating the latent *"Rendered fewer hooks than expected"* crash (`research.md` R1, FR-001, FR-002).

**Independent Test**: `Location View` renders and updates its title as before; gate G2 reports `CLEAN`; adding a temporary string `headerTitle` no longer crashes.

- [X] T006 [US1] Add a `LocationViewTitle` component at module scope in `navigation.js`, placed above `MainScreen` (~line 391), that calls `useContext(SectionContext)` and returns the existing `<Label size="title" weight="bold">{sectionTitle}</Label>` — `SectionContext` is already imported at `navigation.js:25`
- [X] T007 [US1] Replace the hook-calling `headerTitle` callback in the `Location View` options block in `navigation.js` (~line 473) with `headerTitle: () => <LocationViewTitle />`, deleting the inline `useContext` call at line 474
- [X] T008 [US1] Run gate G2 from `quickstart.md` V1 against `navigation.js` and `src/` and confirm it prints `CLEAN`
- [ ] T009 [US1] Verify on device per `quickstart.md` V5 — the section title renders bold and left-aligned, and updates when `sectionTitle` changes
- [ ] T010 [US1] Temporarily add `navigation.setOptions({ headerTitle: "test" })` to `src/screens/location/location-view.screen.js`, confirm the app does not crash (spec acceptance scenario 4), then revert the temporary line

**Checkpoint**: US1 is independently shippable. It touches only `navigation.js` and is valuable even if US2–US4 are dropped.

---

## Phase 4: User Story 2 — Context consumers stop re-rendering for no reason (Priority: P2)

**Goal**: Memoize the six provider values so `useContext` consumers re-render only on real changes (`research.md` R5, contract C7, FR-008).

**Independent Test**: touches only `src/services/**` — no navigation files — so it can be implemented, reviewed and shipped entirely on its own. Gate G3 returns `0` and no `const values = {`.

**Reference implementation**: `src/services/auth/auth.context.js` already does this correctly. Copy its shape; invent nothing.

- [X] T011 [P] [US2] Wrap the provider value in `useMemo` in `src/services/section/section.context.js:11`, with deps `[sectionTitle, setSectionTitle, searchData, setSearchData]`
- [X] T012 [P] [US2] Wrap the provider value in `useMemo` in `src/services/translation/translation.context.js:59`, with deps `[i18n, lang, setLang]`
- [ ] T013 [P] [US2] Wrap the provider value in `useMemo` in `src/services/socket/socket.context.js:11`, with deps `[socket]` — **SKIPPED: dead code.** `SocketContext` has no provider mounted anywhere and zero consumers. Memoizing a provider that never runs is noise; see follow-ups.md
- [X] T014 [P] [US2] Wrap the provider value in `useMemo` in `src/services/location/location.context.js:64`, deriving deps from the literal's current fields
- [ ] T015 [P] [US2] Wrap the provider value in `useMemo` in `src/services/user/user.context.js:72`, deriving deps from the literal's current fields — **SKIPPED: dead code.** This provider is commented out at `App.js:68` and marked "to be removed". Its four importers read a default value — a pre-existing bug outside this feature
- [X] T016 [P] [US2] Replace the rebuilt `const values = { isOutdated, appState }` at `src/services/app/app.context.js:46` with a `useMemo` over `[isOutdated, appState]` — naming an allocation does not memoize it
- [X] T017 [US2] Audit all six providers for the `research.md` R5 caveat: for each dependency that is **not** a `useState` setter or a stable ref (notably `socket` in `socket.context.js` and `i18n` in `translation.context.js`), confirm it is not itself rebuilt each render; fix the source of the churn or record in `specs/005-static-screen-options/follow-ups.md` that the `useMemo` is currently ineffective — do not leave a decorative memo (spec acceptance scenario 4)
- [ ] T018 [US2] Run gate G3 from `quickstart.md` V1 and confirm `grep -rn "value={{" src/services/` returns `0` and the `const values = {` grep returns nothing — **RUN, ASSERTION FAILED**: G3a is `2` (both dead providers) and G3b is `3` (auth_v2, post, user_v2, deferred with reason). Cannot pass without the auth_v2 refactor; see follow-ups.md
- [ ] T019 [US2] Verify on device per `quickstart.md` V2 — the app boots, sign-in works, and screens consuming these contexts still update (language switch, section title, socket-driven content)

**Checkpoint**: US2 is independently shippable and is the item most likely to produce a real effect.

---

## Phase 5: User Story 3 — Screen options are declared once and shared (Priority: P2)

**Goal**: The user's original request. Hoist every static options object in `navigation.js` to module scope, collapse duplicates, and remove the `navigation` closure from `headerLeft` (FR-003 – FR-007, FR-009).

**Independent Test**: gate G1 leaves exactly one inline literal (`TransactionSummary`); every screen in the `quickstart.md` V4 table is visually and behaviourally identical to its T004 screenshot.

**Authority**: `data-model.md` is the exact field set for every constant. Do not re-derive them from the inline blocks — the point of the model is that the merge/keep-separate decisions are already made.

**Ordering note**: T020–T024 add constants; T025–T028 swap call sites over. Constants must be **declared above the component that uses them** — module-scope `const` is not hoisted like `function`, and a forward reference throws at module load (spec Edge Cases). Place them in the existing constants block near `slideFromRight` (line 92).

### Add the constants

- [X] T020 [US3] Add `noHeader`, `revealFromBottom`, `modalNoHeader` and `plainBlackHeader` to the module-scope constants block in `navigation.js` (~line 92–144), per `data-model.md` §2 — carry over the `revealFromBottom` note that its `forVerticalIOS` + `gestureDirection: "horizontal"` mismatch is preserved deliberately
- [X] T021 [US3] Add `locationListBackStyle`, `renderBackArrow` (taking `({ onPress })`, **not** closing over `navigation`) and `locationListOptions` to `navigation.js`, per `data-model.md` §2 — model the shape on the existing `renderEntertainerHeaderLeft` at line 131
- [X] T022 [US3] Add `zurueckRowStyle`, `renderZurueckBack` and `zurueckHeaderOptions`, plus a **separate** `postSelectOptions`, to `navigation.js` — `post-select`'s inner `<View>` has no style prop and must keep stacking vertically, so it must not be merged into `zurueckHeaderOptions` (`data-model.md` §2, spec acceptance scenario 5)
- [X] T023 [US3] Add `postDetailOptions` and `postEntryOptions` to `navigation.js`, keeping `post-entry`'s inert `headerTintColor` / `headerTitleStyle` / `headerLeftLabelVisible` fields rather than pruning them
- [X] T024 [US3] Add `locationViewHeaderStyle` and the `locationViewOptions` composite (`{ ...plainBlackHeader, headerTitle: () => <LocationViewTitle />, headerStyle: locationViewHeaderStyle }`) to `navigation.js` — **depends on T006**; if US1 has not landed, create `LocationViewTitle` here and mark T006 done

### Swap the call sites

- [X] T025 [US3] Replace the four blocks that duplicate `slideFromRight` with `options={slideFromRight}` in `navigation.js` — `notifications` (~292), `AvailOffer` (~446), `AuthEditProfile` (~534), `Camera` (~544); confirm field-for-field equality before each swap (`research.md` R3)
- [X] T026 [US3] Replace the six `options={{ headerShown: false }}` literals with `options={noHeader}` in `navigation.js` — `noconnection` (~81), `post-tabs` (~252), `Main` (~399), `Logout` (~411), `RequestApproval` (~529), `Logout` (~554) — and the `AuthStack.Navigator` `screenOptions={{ headerShown: false }}` at line 147
- [X] T027 [US3] Replace the post-flow options literals in `navigation.js` with their constants — `post-detail` (~258) → `postDetailOptions`, `post-entry` (~269) → `postEntryOptions`, `post-search` (~281) → `revealFromBottom`, `post-select-category` (~303) → `modalNoHeader`, `post-select` (~312) → `postSelectOptions`, `marketplace-details` (~334) and `magazine-details` (~362) → `zurueckHeaderOptions`
- [X] T028 [US3] Replace the remaining `MainStack` literals in `navigation.js` — `LocationList` (~423) → `locationListOptions`, `Location View` (~468) → `locationViewOptions`, `Event Detail` (~495) and `Attend Guests` (~509) → `plainBlackHeader`

### Finish and verify

- [X] T029 [US3] Remove the now-unused `const navigation = useNavigation()` from `MainScreen` at `navigation.js:393`, and remove the `useNavigation` import at line 66 if no other call site remains (FR + spec acceptance scenario 6)
- [X] T030 [US3] Add a short comment above the `TransactionSummary` options literal at `navigation.js:457` explaining that `title: i18n.t(…)` depends on context so it stays inline, and that a `useMemo` would invalidate on exactly the renders it was meant to skip — cite `research.md` R6
- [X] T031 [US3] Run gates G1 and G4 from `quickstart.md` V1 — G1 must print `1` and the single surviving `options={{` must be `TransactionSummary`; any other survivor is a miss, not a judgement call
- [ ] T032 [US3] Verify on device per `quickstart.md` V3 — **the highest-risk change in the feature**: the `LocationList` back arrow renders inset with no label, tapping it navigates back via the injected `onPress`, and the swipe gesture still works; do not expect a smoothness change (`research.md` R4)
- [ ] T033 [US3] Verify on device per `quickstart.md` V4 — walk all 13 screens against the T004 screenshots, paying particular attention to the `post-search` vertical vs. `notifications` horizontal transition split, and to `post-select` stacking while `marketplace-details` / `magazine-details` sit side by side

**Checkpoint**: the user's original request is complete and every screen is confirmed unchanged.

---

## Phase 6: User Story 4 — The pattern cannot quietly come back (Priority: P3)

**Goal**: Remove a misleading comment and record an enforcement recommendation. Documentation only; no runtime behaviour changes.

**Independent Test**: read the corrected comment and the recommendation. Nothing to run.

- [X] T034 [P] [US4] Correct the comment at `navigation.js:113–117` — it claims the inline options "threw away the logo subtree", which `research.md` R4 could not substantiate (React reconciles by element type and position, so the subtree re-renders but does not remount); rewrite it to describe only the re-render, and note that `keepPreviousScreenAttached` is the change with the documented native mechanism for the Entertainer jolt
- [X] T035 [P] [US4] Evaluate whether `react-hooks/rules-of-hooks` catches contract C1 as written and whether a `no-restricted-syntax` rule can catch C2, and record the finding plus a recommendation in `specs/005-static-screen-options/follow-ups.md` — **do not commit an ESLint config**; the plan is explicit that tooling changes are a separate decision

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T036 Run `npx jest` and confirm the existing suite still passes, satisfying SC-006 — use `npx jest`, not `npm test`, whose `NODE_ENV=test` prefix fails in PowerShell
- [X] T037 Run the full V1 gate sweep from `quickstart.md` (G1–G4) one final time and record the after-values beside the T002 baseline in `specs/005-static-screen-options/baseline.md`
- [X] T038 Append an outcomes section to `specs/005-static-screen-options/follow-ups.md` recording what shipped, what was skipped and why, and — per FR-012 and SC-008 — **stating no performance figure that was not measured**; if V6 profiling was run, record the actual numbers, otherwise record that it was not run
- [X] T039 Run `git diff --stat` against `fix/entertainer-return-jank` and confirm `navigation.js` shrank (SC-007); if it grew, re-check that duplicates were collapsed rather than merely renamed

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → no dependencies
- **Foundational (Phase 2)** → depends on Phase 1. **Blocks device verification in every story**; T005 additionally gates US3
- **US1 (Phase 3)** → depends on Phase 2 only
- **US2 (Phase 4)** → depends on Phase 2 only. Fully independent of US1 and US3 (disjoint files)
- **US3 (Phase 5)** → depends on Phase 2, and T024 depends on **T006** (US1)
- **US4 (Phase 6)** → depends on Phase 2. T034 edits `navigation.js`, so run it after US3's edits settle to avoid a needless conflict
- **Polish (Phase 7)** → depends on every story that was actually implemented

### Story independence

| Story | Files touched | Independent of |
|---|---|---|
| US1 | `navigation.js` | US2, US4 |
| US2 | `src/services/**` only | US1, US3, US4 — fully disjoint |
| US3 | `navigation.js` | US2; needs `LocationViewTitle` from US1 (T024 can create it) |
| US4 | `navigation.js`, `follow-ups.md` | US2 |

### The one cross-story dependency

T024 (`locationViewOptions`) needs `LocationViewTitle` from T006. If US3 is implemented without US1,
T024 creates the component itself — which means **US3 cannot reintroduce the inline `useContext`**
even when taken alone. Called out because the naive conversion of `Location View` would hoist the
hook-calling callback verbatim and preserve the defect inside a constant.

---

## Parallel Execution Examples

### US2 — the real parallel opportunity

Six providers, six files, no shared state. All of T011–T016 can run at once:

```text
T011  src/services/section/section.context.js
T012  src/services/translation/translation.context.js
T013  src/services/socket/socket.context.js
T014  src/services/location/location.context.js
T015  src/services/user/user.context.js
T016  src/services/app/app.context.js
```

Then T017 (stability audit) must run **after** all six, since it reasons across them.

### Phase 2

T005 (reading `node_modules`) runs alongside T004 (device build).

### Phase 6

T034 (`navigation.js`) and T035 (`follow-ups.md`) touch different files.

### Across stories

US2 in full can run alongside US1 and US3 — disjoint file sets. **US1 and US3 cannot run in
parallel with each other**: both edit `navigation.js`, and T024 depends on T006.

---

## Implementation Strategy

### Suggested MVP: User Story 1 alone

Five tasks, one extracted component, one callback rewritten. It removes a latent crash, is verified by
a grep and a two-minute device check, and needs nothing else in this feature to be worth merging.

### Recommended increments

1. **US1** — smallest diff, highest severity. Merge on its own.
2. **US2** — widest effect, disjoint files, reference implementation already in the repo. Merge on its own.
3. **US3** — the user's original request; the large diff. Merge only with the T033 device walk done.
4. **US4** — documentation cleanup; fold into the US3 PR or ship after.

### If no device is available

T004 cannot be done, and with it T009, T010, T019, T032 and T033. In that case:

- **US1, US2 and US4 can still be completed** and statically verified by gates G2, G3 and review.
- **US3 must not be marked complete.** Its acceptance is FR-009 — every screen unchanged — and the
  only evidence for that is the V4 walk. Land the constants behind an unmerged branch, or defer.

This is the same discipline `specs/004-android-performance/follow-ups.md` arrived at: ship what is a
defect on its own terms, and do not claim what has not been checked.

### Definition of done

All of SC-001 through SC-008 in `spec.md`, with SC-005 evidenced by the T004/T033 screenshot
comparison and SC-008 by review of `follow-ups.md`. **No frame-rate, memory or startup figure is part
of done** — the feature claims none.
