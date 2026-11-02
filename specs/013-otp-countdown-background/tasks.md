# Tasks: OTP resend countdown keeps running in the background

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: not requested; verification is manual on device (T005).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Create branch `013-otp-countdown-background` off `master` and `specs/013-otp-countdown-background/`

## Phase 2: Foundational

None. The fix is confined to one screen.

## Phase 3: User Story 1 - Countdown reflects real elapsed time (P1) 🎯 MVP

**Goal**: the OTP resend countdown measures wall-clock time, including time spent backgrounded.

**Independent Test**: spec.md US1 acceptance scenarios 1-3.

- [x] T002 [US1] Add `AppState` to the `react-native` import in src/screens/login/otpVerification.js
- [x] T003 [US1] Replace the `setInterval` `useEffect` keyed on `resendStatus` in src/screens/login/otpVerification.js with the end-time version from plan.md (compute `endsAt` once, `tick()` immediately, every 1s, and on `AppState` → `active`; clear the interval and remove the listener on cleanup)
- [x] T004 [US1] Delete the now-unused `cooldownTimer` function in src/screens/login/otpVerification.js
- [ ] T005 [US1] Verify on an iOS and an Android device: background for 30s at ~110s → shows ~80s on return; background past expiry → "Resend code" shows at once; tap it → restarts at 120s

## Phase 4: Polish

- [x] T006 Run `npx eslint src/screens/login/otpVerification.js` and fix any new warnings

## Dependencies

T001 → T002 → T003 → T004 → T006 → T005. All edits touch the same file, so nothing is parallel.

## Implementation Strategy

US1 is the whole feature and the MVP. Ship as an OTA update once T005 passes.
