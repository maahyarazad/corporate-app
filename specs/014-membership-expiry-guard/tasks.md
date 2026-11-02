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

## Phase 5: User Story 2 - Login and forgot-password keep what you typed (P1)

**Goal**: credentials and forgot-password inputs survive navigating between the two screens, until a successful server submit.

**Independent Test**: spec.md US2 acceptance scenarios 1-3.

- [x] T012 [US2] In src/screens/reset-password/forgotPassword.js, change the local `goback` to pop the stack instead of pushing a new Login: replace `navigate("Login")` with the existing `goback` pop helper from `../../navigation/navigate` (import `goback`) — this reveals the still-mounted Login with its username/password intact (and also fixes US3). Remove the now-shadowing local `const goback`, or rename the local handler to `handleBack` calling the imported `goback`.
- [x] T013 [US2] Confirm the forward path stays a push: `handleForgetPassword` in src/screens/login/login.screen.js uses `navigate("ForgotPassword")` (push), so Login is not unmounted on the way to forgot-password. No change expected; verify only.
- [x] T014 [US2] Preserve the forgot-password inputs across leaving/re-entering the screen in src/screens/reset-password/forgotPassword.js: back the `login`, `mobile`, `mobileCode`, `mobileCountry` state with a module-level draft object (e.g. `let draft = {}` at module scope, or a tiny context) — initialise the `useState` from the draft and write the draft on each change. Clear the draft inside `handleSubmit` on a successful server response, right before `navigate("ForgotPasswordOTP", …)`.
- [ ] T015 [US2] Verify on device: type username+password on Login → open Forgot Password → press back → both fields still populated; type email/mobile on Forgot Password → back to Login → reopen Forgot Password → inputs still there; submit successfully → reopening Forgot Password starts empty.

## Phase 6: User Story 3 - Back from forgot-password animates in reverse (P2)

**Goal**: returning from forgot-password plays the reverse of the forward slide.

**Independent Test**: spec.md US3 acceptance scenario 1.

- [x] T016 [US3] No code change beyond T012: with the back action now a stack pop, native-stack reverses the `slideFromRightNative` (`animation: "slide_from_right"`) transition automatically. Confirm `ForgotPassword` in navigation.js keeps `options: slideFromRightNative` (lines ~269-272) — do not switch it to a bottom/other animation.
- [ ] T017 [US3] Verify on device: Login → Forgot Password slides in from the right; back arrow, swipe-back, and hardware back all slide the reverse direction, with no flash of a freshly-created Login screen.

## Polish (added fixes)

- [x] T018 Run `npx eslint src/screens/reset-password/forgotPassword.js src/screens/login/login.screen.js` and fix any new warnings.

## Dependencies

- US1: T001 → Phase 2 → T006 → T007 → T008 → T009 → T011 → T010 (shipped; re-implemented as a login-time gate — see spec note).
- US2/US3: T012 is the shared root-cause fix and must land first; T016 is satisfied by T012. T014 (draft preservation) is independent of T012 and can be done in parallel [P] (both touch `forgotPassword.js`, so coordinate the edits). T013 is verify-only. T015/T017/T018 are verification/polish after T012+T014.

## Implementation Strategy

US1 shipped as a login-time gate (client-only; needs the server to return `expired`). US2 is the next MVP increment: a one-line navigation fix (T012) resolves both the login-state erasure and the reverse-animation bug (US3); T014 adds forgot-password draft preservation. Ship as an OTA update once T015/T017 pass.
