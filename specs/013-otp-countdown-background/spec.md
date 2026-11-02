# Feature Specification: OTP resend countdown keeps running in the background

**Feature Branch**: `013-otp-countdown-background`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "in the otpVerification.js there is countdown and when the app is minimized the count down should continue - but in the current implementation when I return to app the counter continues when I minimized the application"

## Problem

`src/screens/login/otpVerification.js` shows "Code sent (Ns)" and only offers "Resend code" once
N reaches 0. N is decremented by one on every `setInterval` tick. JS timers are suspended while
the app is in the background, so a user who minimizes the app at 90s, waits a minute in their SMS
app and comes back still sees 90s, not 30s. The countdown measures time spent *in the app*, not
real time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Countdown reflects real elapsed time (Priority: P1)

A user on the OTP screen switches to their messages app to read the code, then returns. The
countdown shows the time actually remaining, and if the cooldown expired while they were away,
"Resend code" is available immediately.

**Why this priority**: it is the whole bug.

**Independent Test**: open the OTP screen, note the countdown (e.g. 110s), background the app for
30s, return. The countdown reads about 80s on return, not 110s. Background it for more than the
remaining time and return: "Resend code" shows at once.

**Acceptance Scenarios**:

1. **Given** the countdown shows 110s, **When** the app is backgrounded for 30s and reopened,
   **Then** it shows 80s (±1s) on the first frame after returning, and keeps counting down.
2. **Given** the countdown shows 20s, **When** the app is backgrounded for 60s and reopened,
   **Then** the "Resend code" link is shown, with no negative or blank number.
3. **Given** the cooldown has ended, **When** the user taps "Resend code", **Then** the countdown
   restarts at 120s and behaves as in 1 and 2.

### Edge Cases

- The screen unmounts while backgrounded: the timer and the AppState listener are both released.
- The device clock changes while backgrounded: worst case the wait is shortened or lengthened by
  the clock change. Acceptable; it only gates a resend button.

## Requirements *(mandatory)*

- **FR-001**: The remaining seconds MUST be derived from a wall-clock end time, not from a count of
  interval ticks.
- **FR-002**: On returning to the foreground the displayed value MUST update immediately, not on
  the next tick.
- **FR-003**: The displayed value MUST never go below 0 or render as blank.
- **NFR-001**: JS-only, OTA-shippable. No new dependency.

## Success Criteria *(mandatory)*

- **SC-001**: After backgrounding for T seconds, the countdown on return is within 1s of
  `previous - T` (floored at 0).
