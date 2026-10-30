# Tasks: Membership-expiry guard on the camera screen

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: not requested; verification is manual on device (T009).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Create branch `014-membership-expiry-guard` off `master` and `specs/014-membership-expiry-guard/`

## Phase 2: Foundational

**Blocking prerequisites for US1: the data-access method and the copy the sheet renders.**

- [x] T002 [P] Add `getMembershipEndTime: () => Promise<any>;` to the `UserServiceType` interface in src/@types/user/index.ts
- [x] T003 Add an `async getMembershipEndTime(): Promise<any>` method to `UserService` in src/services/user/user.service.ts that does `axiosInstance.get(`${API_URL}/membership-end-time`)` (no params; token attached by the interceptor) and returns `responseData(response)` (the `{ success, data }` envelope)
- [x] T004 [P] Add a `membership-expired` block (`title`, `message`, `phone`, `email`) to the `en` object in translation/en.json — English copy; `phone` = `+971 56 399 83 00`, `email` = `office2@german-emirates-club.com`
- [x] T005 [P] Add the same `membership-expired` block to the `de` object in translation/de.json — German copy: title "Mitgliedschaft abgelaufen", message "Ihre Mitgliedschaft ist abgelaufen. Bitte kontaktieren Sie +971 56 399 83 00 (Telefon/WhatsApp) oder senden Sie eine E-Mail an office2@german-emirates-club.com."

## Phase 3: User Story 1 - Expired member is blocked with a contact notice (P1) 🎯 MVP

**Goal**: an expired member opening the camera screen is covered by a red, non-dismissable bottom sheet with contact details; a current member sees no change.

**Independent Test**: spec.md US1 acceptance scenarios 1-5.

- [x] T006 [US1] Create src/components/membershipExpiredSheet.component.js — a presentational red, non-dismissable `@gorhom/bottom-sheet` (core `BottomSheet`, `enablePanDownToClose={false}`, `snapPoints={["100%"]}`, `index={0}`); render `i18n.t("membership-expired.title")` and `.message`; make `phone` open `tel:`/WhatsApp and `email` open `mailto:` via RN `Linking`. Takes an `i18n` prop or reads `TranslationContext`.
- [x] T007 [US1] In src/screens/camera.screen.js import `useContext`, `UserService` (`../services/user/user.service`), `TranslationContext` (`../services/translation/translation.context`), and the new sheet component; add `i18n` and an `expired` state (default `false`)
- [x] T008 [US1] In src/screens/camera.screen.js add a mount `useEffect` that `await UserService.getMembershipEndTime()`, reads `data.end_time` only when `success`, parses it with `new Date(String(end).replace(" ", "T"))`, and sets `expired` true only when the parsed ms is a valid number strictly `< Date.now()`; wrap in try/catch (fail-open) and use a `cancelled` flag in cleanup
- [x] T009 [US1] In src/screens/camera.screen.js render `<MembershipExpiredSheet />` over the camera when `expired` is true (sheet is the top layer; it blocks the Flip control)

- [ ] T010 [US1] Verify on an iOS and an Android device: expired account → red sheet rises and can't be swiped away, phone/email tappable, German copy under German locale; current account → camera unchanged; simulate 404/error → not blocked

## Phase 4: Polish

- [x] T011 Run `npx eslint src/screens/camera.screen.js src/components/membershipExpiredSheet.component.js src/services/user/user.service.ts` and fix any new warnings

## Dependencies

- T001 → Phase 2 → T006 → T007 → T008 → T009 → T011 → T010
- Phase 2: T002 and T003 are the service pair (T002 the type, then T003 the method); T004 and T005 are the translation pair. T002/T004/T005 can run in parallel (different files); T003 depends on T002. All of US1 touches `camera.screen.js` in sequence.

## Implementation Strategy

US1 is the whole feature and the MVP. The server route `getMembershipEndTime` is assumed to exist already (provided in the request) and is reached at `user/membership-end-time`; this branch is client-only. Ship as an OTA update once T010 passes.
