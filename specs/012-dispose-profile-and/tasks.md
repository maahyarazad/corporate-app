---
description: "Task list for 012-dispose-profile-and"
---

# Tasks: Disposing Profile and Map when returning to Main

**Input**: Design documents from `/specs/012-dispose-profile-and/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/screen-lifecycle.md`, `quickstart.md`

**Tests**: Test tasks ARE included. `spec.md` § Testing states "Tests are in scope" for the stack-shape
half of this feature. The lifecycle half has no renderer in `jest-expo` (`plan.md` § Technical
Context) and is covered by device-verification tasks instead — those are real tasks with real
acceptance criteria, not placeholders.

**Organization**: Grouped by user story. Every story reverts independently (`quickstart.md` §5).

## Implementation status (2026-09-10)

Code complete for US1, US2, US3, US4 and US5. **31 of 46 tasks done.** The 15 open tasks are
blocked, not skipped, and split into three kinds:

**Device-only (11 tasks)** — T004, T022, T023, T034, T035, T036, T040, T043, T044, plus the
verification halves of T037 and T041. Marked `[D]`; they need a dev build on a physical device,
which this environment does not have. Every one has its acceptance criteria written down already.

**Blocked by pre-existing broken gates (T015, T021, T041)** — see below.

**Commits (T033, T045)** — left for the repo owner rather than made unilaterally.

### Pre-existing gate failures, found by T002 and NOT caused by this feature

Four of the seven gates in NFR-003 were already red on a clean tree at `f0882b3`:

| Gate | Failure | Cause |
|---|---|---|
| `npm test` | `'NODE_ENV' is not recognized` | the `NODE_ENV=test jest` prefix is POSIX-only; npm runs scripts through `cmd.exe` on Windows. Jest itself is fine — `npx jest` passes |
| `npm run lint` | `couldn't find the config "prettier"` | `eslint-config-prettier` is not installed, though `.eslintrc.json` extends it |
| `npm run check:styles` | `Cannot find module '/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core'` | `scripts/check-stylesheet-scope.js:4` hardcodes an absolute path from another machine. This one is a real repo bug, not an environment quirk |
| `npm run check:animation` | `'.' is not recognized` | `./scripts/check-animation.sh` cannot be invoked through `cmd.exe` |

None were touched by this feature and none are in its scope. They are why T015, T021 and T041
cannot be closed here.

**Gates that do run, all green after this feature:**
`check:screen-props` (52 screens), `audit:lists`, `check:cache-coverage` (21 GET call sites — the
same count as before, deliberately preserved; see below), `check:main-return` (new), and `npx jest`
at 66 passing tests, up from 61.

### One implementation note worth carrying forward

US5's first attempt moved `getPartnerTitle` onto the `requestRef.current` pattern that
`availOffer.screen.js` uses. That silently dropped `check:cache-coverage` from 21 GET call sites to
20: its detector is a regex for a literal `request(` (`scripts/check-cache-coverage.js:76`), which
`requestRef.current(` does not match. The endpoint became invisible to the gate that guards feature
011's cache policy. Reworked to declare the fetch inside the `useEffect` — the shape `map.screen.js`
already uses — which keeps `request(` literal, avoids the stale-closure-over-access-token problem,
and restored the count to 21.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4, US5 — maps to `spec.md`
- **[D]**: Requires a physical device with a dev build. Cannot be done from the terminal.

## Path Conventions

Mobile, single React Native codebase at the repository root (`plan.md` § Structure Decision). No
`api/` half — the backend is a separate service this repo does not contain. Tests are colocated in
`__tests__/` next to the code, matching `jest.config.js` `testMatch`.

---

## Phase 1: Setup

**Purpose**: Establish that the tree is green before anything moves, so a later red gate is
attributable to this feature.

- [X] T001 Confirm the working branch is `012-dispose-profile-and` and the tree is clean via `git status`
- [X] T002 Record the baseline by running `npm test`, `npm run lint`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists`, `npm run check:cache-coverage` and pasting the results into the PR description
- [X] T003 Confirm `grep -rn 'navigate("Main"' src/` returns exactly one hit, `src/screens/profile/profile.screen.js:43` — the premise of T024's gate being green on introduction

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capture evidence that becomes unobtainable once US2 ships.

**⚠️ CRITICAL**: T004 must happen BEFORE any US2 code lands. `quickstart.md` §3.1 asks for a
before/after comparison of live native map surfaces; once the focus gate is in, the "before" state
cannot be reproduced without reverting.

- [ ] T004 [D] Capture the "before" evidence for the doubled map surface per `quickstart.md` §3.1 steps 1–3: navigate Home → map icon → tap a pin → **View Offer**, then confirm in Android Studio Layout Inspector (two `MapView` instances) or the Xcode View Hierarchy debugger (two `MKMapView`s) that two native map surfaces are alive at once. Save the screenshot into the PR.

**Checkpoint**: Baseline recorded. All user stories can now begin.

---

## Phase 3: User Story 1 — Returning to Main always leaves one screen standing (Priority: P1) 🎯 MVP

**Goal**: One helper that maps any stack shape — including one that does not contain `Main` — to
exactly `[Main]`, with the tab selected in the same dispatch.

**Independent Test**: From a mocked ref, assert the dispatched action has one route named `Main`, an
explicit `index: 0`, and the nested `{ screen: "Entertainer", params: { screen: "Home" } }` params.
No device needed.

### Tests for User Story 1 ⚠️

> Write these FIRST. They must fail — `returnToMain` does not exist yet.

- [X] T005 [P] [US1] Create `src/navigation/__tests__/navigate.test.js` with a mocked `navigationRef` (`isReady`, `dispatch`) and a failing assertion that `returnToMain()` dispatches an action whose `routes` has length 1 and `routes[0].name === "Main"` — guards FR-001 and `data-model.md` V1
- [X] T006 [US1] Add a test to `src/navigation/__tests__/navigate.test.js` asserting `index` is present and strictly `0` — guards `data-model.md` V4, the `research.md` R8 failure mode; this must fail if `index` is merely omitted, so assert `Object.prototype.hasOwnProperty`, not truthiness
- [X] T007 [US1] Add a test to `src/navigation/__tests__/navigate.test.js` asserting the default params are exactly `{ screen: "Entertainer", params: { screen: "Home" } }` — guards FR-003 and `data-model.md` V5
- [X] T008 [US1] Add a test to `src/navigation/__tests__/navigate.test.js` asserting `returnToMain("Offers")` places `"Offers"` in the innermost `screen` — guards `data-model.md` E2 parameterisation and V6
- [X] T009 [US1] Add a test to `src/navigation/__tests__/navigate.test.js` asserting nothing is dispatched when `navigationRef.isReady()` returns false — guards `contracts/screen-lifecycle.md` G6
- [X] T010 [US1] Run `npx jest src/navigation` and confirm all five tests FAIL for the right reason (`returnToMain is not a function`), not an import or config error

### Implementation for User Story 1

- [X] T011 [US1] Add `returnToMain(tab = "Home")` to `src/navigation/navigate.js`, exported beside the existing `navigate` and `goback`, using `CommonActions.reset` from `@react-navigation/native` with an explicit `index: 0` and a single route `{ name: "Main", params: { screen: "Entertainer", params: { screen: tab } } }`, guarded by the same `navigationRef.isReady()` check the other two exports use — implements `contracts/screen-lifecycle.md` §1 and `data-model.md` E2
- [X] T012 [US1] Add a comment above `returnToMain` in `src/navigation/navigate.js` explaining why `reset` and not `navigate`/`popToTop`: from `TransactionSummary` the stack does not contain `Main` (`research.md` R8), so `navigate` would push and leave the receipt mounted underneath. This is the non-obvious constraint the next reader will otherwise undo
- [X] T013 [US1] Run `npx jest src/navigation` and confirm all five tests now PASS
- [X] T014 [US1] Replace `goHome` at `src/screens/profile/profile.screen.js:38-43` with `returnToMain`, deleting the local `goHome` const and its `navigate` import if it becomes unused, and keeping the existing comment's explanation of the nested-params requirement by moving it to `navigate.js` (T012) rather than duplicating it
- [ ] T015 [US1] Run `npm run lint` and `npm run check:screen-props` to confirm `profile.screen.js` still passes both

**Checkpoint**: US1 is complete and independently shippable. `check:main-return` (T024) can now be written against a tree that already satisfies it.

---

## Phase 4: User Story 2 — A covered Map releases its native map (Priority: P1)

**Goal**: An unfocused `Map` holds no native map surface, so the Map → Location View transition
stops holding two at once.

**Independent Test**: Cover the map, confirm the native view is torn down in the platform inspector,
uncover it and confirm it redraws with pins and issues no request to `/v2/partner/coordinates/100`.

**Depends on**: T004 only (for the before/after comparison). Independent of US1.

### Implementation for User Story 2

- [X] T016 [US2] Add `useIsFocused` to the existing `@react-navigation/native` import at `src/screens/map.screen.js:3`
- [X] T017 [US2] Call `const isFocused = useIsFocused();` in `src/screens/map.screen.js` immediately after `const navigation = useNavigation();` at line 60 — it must sit above the `if (!userLocation)` early return with the other hooks, per `contracts/screen-lifecycle.md` C2 and the file's own "FIX 10" comment
- [X] T018 [US2] Change the conditional at `src/screens/map.screen.js:343` from `partnerLocations && myLocation` to `isFocused && partnerLocations && myLocation`, leaving the `<LoadingOverlay display={true} />` fallback at line 355 as the blurred branch — gating the element, never the screen's return value (`contracts/screen-lifecycle.md` C1, C4; `data-model.md` V9)
- [X] T019 [US2] Reset `showPartnerDetails` to `false` when focus is lost in `src/screens/map.screen.js`, so a partner card cannot float over a torn-down map — `contracts/screen-lifecycle.md` C5, the one visible defect this gate can cause
- [X] T020 [US2] Add a comment at the gate in `src/screens/map.screen.js` recording why remounting is safe here: the camera is uncontrolled after mount and the coordinates come back from SQLite under `PARTNER_CACHE_TTL_MS` (`research.md` R4, `contracts/screen-lifecycle.md` C3)
- [ ] T021 [US2] Run `npm run lint`, `npm run check:screen-props` and `npm run check:styles` against the modified `src/screens/map.screen.js`

### Device verification for User Story 2 ⚠️

- [ ] T022 [D] [US2] Verify SC-002 per `quickstart.md` §3.1 steps 4–5: repeat T004's journey and confirm exactly one native map surface is alive on `Location View` (the preview), then go back and confirm the interactive map redraws with pins. Record which inspector was used — "it looked fine" is not verification
- [ ] T023 [D] [US2] Verify SC-003 per `quickstart.md` §3.2: with the debugger's network panel open, confirm returning to `Map` issues no request to `/v2/partner/coordinates/100` while the 1-hour TTL holds

**Checkpoint**: US2 is complete. This is the largest single win in the feature (`research.md` R3a).

---

## Phase 5: User Story 4 — The guarantee cannot be broken by the next commit (Priority: P2)

**Goal**: A static gate that fails the build when someone reaches for `navigate("Main")`.

**Independent Test**: Add a throwaway file calling `navigate("Main")` and confirm the gate exits
non-zero and names the file.

**Depends on**: US1 (T014). The gate fails against the pre-US1 tree, because `profile.screen.js:43`
is exactly the call site it bans.

### Implementation for User Story 4

- [X] T024 [US4] Create `scripts/check-main-stack-return.js` modelled on `scripts/check-screen-props.js`: reuse its `walk()` recursion over `src/`, its `babel.parseSync` with `presets: ["babel-preset-expo"]` and `configFile: false`, and its treatment of an unparseable file as a hard failure rather than a skip
- [X] T025 [US4] In `scripts/check-main-stack-return.js`, traverse for `CallExpression` nodes whose callee is either the identifier `navigate` or a member expression `<anything>.navigate`, and whose first argument is the string literal `"Main"`; collect them as failures with `path.relative(ROOT, file)` — implements `contracts/screen-lifecycle.md` §3
- [X] T026 [US4] Exclude `src/navigation/navigate.js` from `scripts/check-main-stack-return.js` by path, not by a comment pragma, matching how the other five gates handle exemptions (`contracts/screen-lifecycle.md` §3 Exemptions)
- [X] T027 [US4] Give `scripts/check-main-stack-return.js` the same failure output shape as `check-screen-props.js`: an `ERROR:` line, a one-line explanation naming `returnToMain()` as the replacement, the offending paths indented, and `process.exit(1)`; on success a single `check:main-return OK - ...` line
- [X] T028 [US4] Add `"check:main-return": "node scripts/check-main-stack-return.js"` to the `scripts` block in `package.json`, after `"check:cache-coverage"` on line 21
- [X] T029 [US4] Run `npm run check:main-return` and confirm it passes on the current tree
- [X] T030 [US4] Prove the gate bites per `quickstart.md` §1: create `src/__gate_probe.js` calling `navigate("Main")`, confirm `npm run check:main-return` exits non-zero and names the probe, then delete the probe. A gate never seen to fail has not been tested

**Checkpoint**: US4 complete. The US1 guarantee now survives the next contributor.

---

## Phase 6: User Story 3 — A covered screen stops doing work (Priority: P2)

**Goal**: Blurred screens stop re-rendering on unrelated context writes.

**Independent Test**: Instrument a render counter on a blurred screen and confirm it stops
advancing; then verify on device that nothing else broke.

**⚠️ App-wide blast radius.** This is the only story that touches screens outside this feature.
Land it in its own commit so NFR-002's one-line revert is a clean `git revert`.

### Implementation for User Story 3

- [X] T031 [US3] Add `import { enableFreeze } from "react-native-screens";` and a single module-scope `enableFreeze();` call to `App.js`, placed beside the existing module-scope `sweepApiCache(LONGEST_TTL_MS);` call so both app-wide switches sit together
- [X] T032 [US3] Add a comment at the call in `App.js` recording why it is global: `react-native-screens@4.16.0` reads the flag at `Screen.js:39` via `freezeEnabled()`, and `@react-navigation/native-stack@7.18.10` forwards no per-screen `freezeOnBlur` option — there is no narrower form of this change (`research.md` R2). Note that freezing suspends rendering only and leaves native views mounted, which is why it does not replace T018
- [ ] T033 [US3] Commit T031–T032 alone, with no other story's changes in the same commit — NFR-002

### Device verification for User Story 3 ⚠️

- [ ] T034 [D] [US3] Verify SC-004 per `quickstart.md` §3.5 by exercising the three material top tabs in `Entertainer` with fast repeated swipes — `react-native-pager-view` under `material-top-tabs` is the most likely thing to object
- [ ] T035 [D] [US3] Exercise `post-tabs`, `post-detail`, `post-entry` and `post-search` under `OverlappingNavigator`, plus the auth stack, the approval stack and the no-connection root, per `quickstart.md` §3.5
- [ ] T036 [D] [US3] Verify a push notification arriving while backgrounded, then foregrounding, still routes correctly with freezing on
- [ ] T037 [US3] If anything from T034–T036 breaks, revert T033 rather than patching around it — NFR-002

**Checkpoint**: US3 complete or reverted. Either outcome is a valid ship.

---

## Phase 7: User Story 5 — Profile releases its subtree when covered (Priority: P3)

**Goal**: `Profile` stops holding a rendering subtree while covered.

**Independent Test**: Cover Profile, return, confirm the partner title refetches and the nested stack
is back at `MainProfile`.

**Optional.** US3 already stops `Profile` rendering while blurred. What remains is a mounted subtree
with no native view, which is the smallest cost in the feature. Skip this phase without
consequence if the schedule tightens.

- [X] T038 [P] [US5] Add an `AbortController` to `getPartnerTitle` in `src/screens/profile/profile.screen.js`, passing the signal through `request(...)` and returning early on `isCancel(error)` from `src/utils/cancellation.js`, matching how `map.screen.js` handles the same shape — tidies the gap noted in `research.md` R7
- [X] T039 [US5] Fix the `getPartnerTitle` `useCallback` dependency array in `src/screens/profile/profile.screen.js`: it reads `userData.partner_id` but declares `[]`, while its `useEffect` declares `[userData]`. Confirm against `eslint-plugin-react-hooks` (registered in commit `cb863c6`) before changing behaviour
- [ ] T040 [D] [US5] Verify the profile still loads its partner title and card on a cold open, and after being covered and uncovered

**Checkpoint**: All stories complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T041 Run the full gate set from `quickstart.md` §1 including the new `npm run check:main-return`, and confirm all eight pass
- [X] T042 [P] Re-read `specs/012-dispose-profile-and/research.md` R8 and confirm the `TransactionSummary` back-button finding is still recorded but NOT fixed — it is a product decision about a flow this feature does not own (`quickstart.md` §4)
- [ ] T043 [D] Verify FR-011 per `quickstart.md` §3.4: complete a redemption to land on `TransactionSummary`, trigger the return to Main, and confirm back does not reveal the receipt. This is the path where a `navigate`-based helper would have failed
- [ ] T044 [D] Verify SC-001 per `quickstart.md` §3.3: from a deep stack, return to Main and immediately press Android hardware back — it must not reveal `AvailOffer`, `Location View` or `Map`
- [ ] T045 Record the device verification results in a `docs(012):` commit, following the precedent set by `f0882b3` for feature 010
- [X] T046 [P] Confirm no native change was made — `app.json`, `google-services.json`, `eas.json` and the `expo-*` dependency versions are untouched, so the feature ships OTA (NFR-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: T004 blocks US2's *verification*, not its implementation. It must be captured before T018 lands
- **US1 (Phase 3)**: depends on Setup only
- **US2 (Phase 4)**: depends on Setup and T004. Independent of US1
- **US4 (Phase 5)**: depends on **US1 (T014)** — the gate fails against the pre-US1 tree by design
- **US3 (Phase 6)**: depends on Setup only. Ordered last among the P1/P2 stories because of blast radius, not dependency
- **US5 (Phase 7)**: optional, depends on nothing
- **Polish (Phase 8)**: depends on whichever stories shipped

### Story Dependency Graph

```
Setup (T001-T003)
  ├─▶ US1 (T005-T015) ──▶ US4 (T024-T030)
  ├─▶ T004 [D] ──▶ US2 (T016-T023)
  ├─▶ US3 (T031-T037)          [land last, own commit]
  └─▶ US5 (T038-T040)          [optional]
                                    │
                                    ▼
                            Polish (T041-T046)
```

### Within Each User Story

- US1: tests (T005–T009) written and failing (T010) before implementation (T011)
- US2: import → hook → gate → state reset → comment → lint → device verify
- US4: script → exemption → output shape → wiring → prove it passes → prove it fails
- US3: one commit, then verify, then keep or revert

### Parallel Opportunities

- **T005 is the only [P] task in US1's test block.** T006–T009 append to the file T005 creates, so they are sequential by definition — [P] would be wrong, not merely optimistic
- **US1 and US2 are fully parallel** — different files (`src/navigation/`, `src/screens/profile/` vs `src/screens/map.screen.js`), no shared state. Two developers can take one each
- **US5's T038 and T039** touch the same file, so they are sequential; different concerns, safe in one sitting
- **T042 and T046** are read-only checks and parallel with anything

### Not parallel

- T024–T028 build one script incrementally — sequential
- T016–T020 all edit `src/screens/map.screen.js` — sequential
- Every [D] task needs the one device; they serialise regardless of markings

---

## Parallel Example: US1 and US2 together

```bash
# Developer A — US1, no device needed
Task: "Create src/navigation/__tests__/navigate.test.js with the five assertions (T005-T009)"
Task: "Add returnToMain to src/navigation/navigate.js (T011)"
Task: "Replace goHome at src/screens/profile/profile.screen.js:38-43 (T014)"

# Developer B — US2, needs the device
Task: "Add the useIsFocused gate to src/screens/map.screen.js (T016-T020)"
Task: "Device-verify the single map surface per quickstart.md 3.1 (T022)"
```

---

## Implementation Strategy

### MVP (US1 only)

1. Phase 1 Setup
2. Phase 3 US1
3. **STOP and VALIDATE**: `npx jest src/navigation` green, `profile.screen.js` returns home correctly
4. Ship

US1 alone is a real improvement: it makes the return total rather than path-dependent, and fixes the
`TransactionSummary` case that no current code handles.

### Incremental Delivery

1. Setup → US1 → ship (MVP)
2. + US2 → device-verify → ship (**the largest win — the doubled map surface**)
3. + US4 → ship (locks in US1)
4. + US3 → device-verify → ship **or revert**
5. + US5 → optional

### If the schedule tightens

Ship **US2 alone**. It is independent of everything except T004's before-shot, it is one file, and it
removes a live native map surface that today survives behind two pushed screens. `research.md` R3a
is the argument; the feature request did not know about it.

---

## Notes

- `[D]` tasks need a dev build on a physical device — `expo-maps` will not load in Expo Go
- Every story reverts independently; `quickstart.md` §5 has the per-story revert
- Do **not** write a task to "fix" `goHome` unmounting `Profile`. It already does
  (`research.md` R1); that would ship a no-op
- Do **not** fix the `TransactionSummary` back button here. It is recorded in `research.md` R8 and
  belongs to a flow this feature does not own
- Commit after each phase; the phase boundaries are the checkpoints
