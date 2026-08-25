---
description: "Task list for Event Push Notification Deep Link"
---

# Tasks: Event Push Notification Deep Link

**Input**: Design documents from `/specs/001-event-push-deeplink/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/push-payload.md, quickstart.md

**Tests**: Test tasks ARE included. `plan.md` Phase C and `quickstart.md` ("Unit validation — the resolver") both explicitly require unit tests for `resolvePushDestination` against every shape in `contracts/push-payload.md`. Tests are scoped to the pure resolver only — screen behaviour is verified manually on device per the quickstart device matrix.

**Organization**: Tasks are grouped by user story so each can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

## Path Conventions

Single Expo/React Native client. Source under `src/` at repository root; `navigation.js` and `App.js` at root. Paths below are repository-relative, per the Project Structure section of `plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the repository able to run the unit tests this feature requires.

**⚠️ Note**: `package.json:13` defines `"test": "NODE_ENV=test jest"`, but jest is **not** in `devDependencies` and no jest binary or config exists in the repo. `npm test` currently fails. T001–T002 fix that; without them the resolver tests cannot run.

- [X] T001 Add `jest` and `jest-expo` to `devDependencies` in `package.json` and install them, so the existing `npm test` script has a runner
- [X] T002 Add jest configuration in `package.json` (or a new `jest.config.js` at repository root) using the `jest-expo` preset, with `testMatch` covering `src/**/__tests__/**/*.test.js`
- [X] T003 Verify `npm test` exits successfully with zero tests collected before any feature code is written

**Checkpoint**: `npm test` runs. Foundational work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared destination resolver and the payload diagnostics every user story depends on. This is Phase A + the core of Phase B item 1 from `plan.md`.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — US1, US2, US3, and US4 all route through `resolvePushDestination`.

- [X] T004 Create `src/utils/pushDestination.js` exporting a pure `resolvePushDestination(data)` that reads the destination type from the first non-empty of `path`, `destination_type`, `type`, and the id from the first present of `id`, `destination_id`, `entity_id`, per `contracts/push-payload.md`
- [X] T005 Implement type normalisation in `src/utils/pushDestination.js`: trim, lowercase, and strip one trailing `s` so `"Event"`, `"event"`, `"events"`, and `" EVENT "` all resolve to `event` (data-model.md validation rule 3)
- [X] T006 Implement id coercion in `src/utils/pushDestination.js`: `Number(...)` the id and return `null` when the result is `NaN` or the id key is absent (data-model.md validation rules 2 and 4, FR-003)
- [X] T007 Implement the destination mapping table in `src/utils/pushDestination.js`: `partner → { screen: "Location View", params: { locId } }`, `event → { screen: "Event Detail", params: { id } }`, `post → { screen: "post-detail", params: { id, origin: "push" } }`, and `null` for any other type (data-model.md mapping table)
- [X] T008 Add a `__DEV__`-guarded diagnostic in `src/utils/pushDestination.js` that logs the unresolved raw payload whenever the resolver returns `null`, so malformed pushes are traceable in dev builds (FR-007)
- [X] T009 Add a `__DEV__`-guarded log of the raw `response.notification.request.content.data` inside `handleNotificationResponse` in `src/screens/entertainer.screen.js` (currently commented out at line 60), so the real server payload can be read off a device (FR-007, plan.md Phase A)
- [X] T010 [P] Create `src/utils/__tests__/pushDestination.test.js` covering every accepted shape and normalisation row in `contracts/push-payload.md`: `{path,id}` partner and event, `{destination_type,destination_id}` numeric and string `"720"`, `{path:"Events",id:"720"}`, plus `null` for unknown type `"magazine"`, missing id, and non-numeric id `"abc"`
- [X] T011 Run `npm test` and confirm all `resolvePushDestination` cases pass before wiring any call site

**Checkpoint**: The resolver exists, is unit-tested, and payload diagnostics are in place. User stories can now proceed.

---

## Phase 3: User Story 1 — Tap an event push while backgrounded (Priority: P1) 🎯 MVP

**Goal**: Tapping an event push from the background foregrounds the app on Event Detail for that event, and a failed load shows a visible error with a working back control instead of a blank screen.

**Independent Test**: Background the app, send a test push for event 720, tap it — Event Detail for "BusinessBreakfast - AI Forum" renders with title, date, place, cover image, map, and the attend/unattend action. Then repeat with a nonexistent event id and confirm a visible error state with a working back button.

### Implementation for User Story 1

- [X] T012 [US1] Replace the inline `switch` on `notificationData.path` in `handleNotificationResponse` in `src/screens/entertainer.screen.js` (lines 62-86) with a call to `resolvePushDestination`, navigating via `navigate(screen, params)` only when the result is non-null (FR-001, FR-002)
- [X] T013 [P] [US1] Hoist the back-button `TouchableOpacity` in `src/screens/events/eventDetail.screen.js` out of the `{eventDetails && (…)}` guard at line 333 so it is mounted in every state (FR-005, SC-003)
- [X] T014 [US1] Add an explicit render state machine to `src/screens/events/eventDetail.screen.js` — `loading`, `loaded`, `empty`, `error` per the state-transition diagram in `data-model.md` — replacing the implicit null-only state, with each non-loaded state rendering visible copy alongside the hoisted back control (FR-005)
- [X] T015 [US1] Handle `response.success === false` in the `fetchEventData` effect in `src/screens/events/eventDetail.screen.js` (line 63) by setting the error state and calling `showToast`, instead of silently setting nothing (FR-006)
- [X] T016 [US1] Set the empty state in `src/screens/events/eventDetail.screen.js` when `response.success` is truthy but `response.data` is absent, covering the event-unavailable-in-current-language case (FR-005)
- [X] T017 [US1] Remove the three stray `console.log("======…")` separator lines and the `console.log("event detail:", …)` from `src/screens/events/eventDetail.screen.js` (lines 60-65), replacing any needed diagnostic with a `__DEV__`-guarded log

**Checkpoint**: An event push tapped from the background opens Event Detail, and every failure path is visible and escapable.

---

## Phase 4: User Story 2 — Tap an event push from a cold start (Priority: P1)

**Goal**: A tap from a terminated app lands on Event Detail exactly once — no duplicate stacked screens.

**Independent Test**: Force-quit the app, send an event push for 720, tap it. The app launches on Event Detail; swiping back reveals the tab screen, not a second copy of Event Detail.

### Implementation for User Story 2

- [X] T018 [US2] Add a handled-identifier guard in `src/screens/entertainer.screen.js` — a `useRef` holding the last handled `response.notification.request.identifier` — and return early from `handleNotificationResponse` when the same identifier arrives again (FR-004, research.md Decision 6)
- [X] T019 [US2] Confirm in `src/screens/entertainer.screen.js` that both `addNotificationResponseReceivedListener` (line 89) and the one-shot `getLastNotificationResponseAsync()` (line 103) route through the guarded handler, so the cold-start replay and the live listener cannot double-navigate one tap (FR-004)

**Checkpoint**: Cold-start taps navigate exactly once.

---

## Phase 5: User Story 3 — Partner pushes keep working (Priority: P1)

**Goal**: Partner destinations behave exactly as today, through the new resolver, and the deep-link path shares the same mapping.

**Independent Test**: Send a partner push for 1592 and tap it in foreground, background, and cold start — Location View for 1592 opens, identical to pre-change behaviour. Then run `npx uri-scheme open "<scheme>://partner?id=1592" --ios` and confirm the same destination.

### Implementation for User Story 3

- [X] T020 [US3] Replace the `partner` and `event` branches of the `switch` in `handleOpenURL` in `src/utils/urlRouter.js` (lines 20-33) with `resolvePushDestination({ path, id: params.id })`, navigating only on a non-null result while leaving the `map` branch untouched (FR-008)
- [X] T021 [US3] Delete the dead `eventList.find` block in `src/utils/urlRouter.js` (lines 27-30) whose callback body `{ event.id === params.id; }` never returns, and drop the now-unused `eventList`/`LocationContext` import if nothing else in the file uses it (research.md Decision 7)
- [X] T022 [P] [US3] Add regression cases to `src/utils/__tests__/pushDestination.test.js` asserting `{ path: "partner", id: 1592 }` resolves to `Location View` with `{ locId: 1592 }` and that `post` still resolves to `post-detail` with `{ id, origin: "push" }` (FR-008, SC-002)

**Checkpoint**: Partner and post destinations are unchanged from both push and deep-link entry points.

---

## Phase 6: User Story 4 — Unknown or malformed destination (Priority: P2)

**Goal**: An unrecognised type or a missing id opens the app normally to its default screen, records a diagnostic, and never crashes or hangs.

**Independent Test**: Send a test push with an unrecognised destination type, and another with no destination id. Tap each — the app opens to its default screen, a dev-only diagnostic naming the unresolved payload appears in the Metro log, and nothing crashes.

### Implementation for User Story 4

- [X] T023 [US4] Ensure `handleNotificationResponse` in `src/screens/entertainer.screen.js` treats a `null` resolver result as a silent no-op — no navigation, no thrown error — so the app stays on its default screen (FR-004 edge case, spec US-004)
- [X] T024 [P] [US4] Add malformed-payload cases to `src/utils/__tests__/pushDestination.test.js`: empty object `{}`, `undefined`, `null`, `{ path: "" }`, `{ path: "magazine", id: 5 }`, and `{ path: "event" }` with no id — each expecting `null` and no throw

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

> **T025–T029 are BLOCKED on device access.** They require a physical iOS/Android
> device running a development build plus the ability to dispatch test pushes
> (`is_test = 1`) for partner 1592 and event 720. None of that is available in the
> implementation environment. All code they validate is complete and unit-tested;
> these remain open until someone runs them on hardware.

- [ ] T025 Fill in the confirmation table at the end of `specs/001-event-push-deeplink/contracts/push-payload.md` with the verbatim raw `data` objects observed on a physical device for a partner push and an event push (SC-004, quickstart.md Phase A)
- [ ] T026 If the captured event payload carries no destination fields at all, stop and record the escalation in `specs/001-event-push-deeplink/plan.md` under the escalation condition, attaching the captured evidence — Phase B still ships (plan.md escalation condition)
- [ ] T027 Run the full device matrix in `specs/001-event-push-deeplink/quickstart.md` for partner 1592 and event 720 across foreground, background, and cold start, on both iOS and Android (SC-001, SC-002)
- [ ] T028 Run the failure-state validation in `specs/001-event-push-deeplink/quickstart.md` — nonexistent event id, airplane mode mid-fetch, and a language in which the event is unavailable — confirming a visible state with a working back control each time (SC-003)
- [ ] T029 [P] Run the deep-link regression check in `specs/001-event-push-deeplink/quickstart.md` with `npx uri-scheme open` for both the partner and event schemes (SC-002)
- [X] T030 [P] Run `npm test` one final time and confirm the full `pushDestination` suite passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 for T010/T011 only; T004–T009 can begin without it. **BLOCKS all user stories.**
- **US1 (Phase 3)**, **US2 (Phase 4)**, **US3 (Phase 5)**, **US4 (Phase 6)**: All depend on Phase 2. Independent of each other with one caveat below.
- **Polish (Phase 7)**: Depends on US1–US4. T025/T026 also depend on T009 and require device access.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only. This is the MVP.
- **US2 (P1)**: Depends on Phase 2 only. Touches `entertainer.screen.js`, same file as T012 — sequence T012 before T018 to avoid a conflicting edit.
- **US3 (P1)**: Depends on Phase 2 only. Touches `urlRouter.js`, which no other story touches — fully parallel.
- **US4 (P2)**: Depends on Phase 2 and on T012 (the resolver call site must exist before its null branch can be asserted).

### Within Each User Story

- Resolver before call sites (Phase 2 before Phase 3+).
- In US1: T013 (hoist back control) before T014 (states that rely on it being mounted); T014 before T015/T016.
- Screen work before device validation.

### Parallel Opportunities

- **Phase 2**: T010 (tests) can be written in parallel with T004–T008 if written against the contract rather than the implementation.
- **Phase 3**: T013 is `[P]` — it edits a different file than T012.
- **After Phase 2 completes**: US1, US3, and US4's test task can proceed simultaneously across three developers. US3 is the cleanest parallel candidate — it is the only story confined to `urlRouter.js`.
- **Phase 5/6 test additions**: T022 and T024 both append to the same test file — sequence them, or split into separate `describe` blocks committed independently.
- **Phase 7**: T029 and T030 are `[P]` — different tooling, no shared state.

---

## Parallel Example: After Foundational Completes

```bash
# Three tracks can run simultaneously once T004-T011 are done:
Track A (US1): "Replace switch with resolver in src/screens/entertainer.screen.js"  (T012)
Track B (US1): "Hoist back button out of eventDetails guard in src/screens/events/eventDetail.screen.js"  (T013)
Track C (US3): "Route urlRouter.js through the shared resolver in src/utils/urlRouter.js"  (T020)
```

---

## Implementation Strategy

### MVP First (Phase 1 → Phase 2 → US1)

1. Complete Phase 1: get `npm test` actually running.
2. Complete Phase 2: the resolver, its tests, and the dev payload log. **This is the highest-value phase** — it fixes the suspected root cause (FR-002, FR-003) and produces the diagnostic that confirms it.
3. Complete Phase 3 (US1): event push from background opens Event Detail, and failures are visible.
4. **STOP and VALIDATE**: run T025 and T027's background row on a device. If the event push now works, the root cause is confirmed as the payload naming.

That MVP alone resolves the reported bug and the blank-screen defect. US2, US3, and US4 harden it.

### Incremental Delivery

- **Increment 1** (Phases 1–3): the fix. Ships alone.
- **Increment 2** (Phase 4, US2): cold-start de-duplication. Ships alone.
- **Increment 3** (Phase 5, US3): deep-link consolidation and dead-code removal. Ships alone, no user-visible change — it is the regression guarantee.
- **Increment 4** (Phase 6, US4): malformed-payload hardening. Ships alone.
- **Increment 5** (Phase 7): device validation and contract confirmation.

### Escalation Path

If T025 shows the server omits the destination pair from the Expo `data` object entirely for events, no client change can fix routing. Everything in Phases 2–6 still ships — it is correct and it fixes the blank-screen defect independently — and T026 raises the payload gap as a separate server-side issue.
