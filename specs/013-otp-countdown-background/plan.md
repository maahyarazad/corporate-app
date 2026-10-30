# Implementation Plan: OTP resend countdown keeps running in the background

**Branch**: `013-otp-countdown-background` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the tick-decrementing cooldown in `src/screens/login/otpVerification.js` with one that
records the end time (`Date.now() + OTP_COOLDOWN * 1000`) when the cooldown starts, and on every
tick computes `ceil((endsAt - Date.now()) / 1000)`. Add an `AppState` `change` listener that runs
the same computation the moment the app becomes `active`, so the value is correct on the first
frame back rather than up to a second later.

## Technical Context

**Language/Version**: JavaScript, React 19.1.0, React Native 0.81.5, Expo SDK 54
**Primary Dependencies**: `react-native` `AppState` (already in RN, no new dependency)
**Storage**: none
**Testing**: manual on device (spec did not ask for automated tests)
**Target Platform**: iOS and Android
**Constraints**: OTA-shippable (NFR-001)
**Scale/Scope**: one file, one `useEffect` replaced, `cooldownTimer` removed

## Design

The current code has two further defects the rewrite removes as a side effect:

- `cooldownTimer` calls `setResendStatus(false)` *inside* a `setOtpCooldown` updater, a side
  effect in a function React may call twice.
- At 0 that updater returns `undefined`, so `otpCooldown` becomes `undefined`.

New effect, keyed on `resendStatus`:

```js
useEffect(() => {
  if (!resendStatus) return;
  const endsAt = Date.now() + OTP_COOLDOWN * 1000;
  const tick = () => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setOtpCooldown(left);
    if (left === 0) setResendStatus(false);
  };
  tick();
  const interval = setInterval(tick, 1000);
  const sub = AppState.addEventListener("change", (s) => s === "active" && tick());
  return () => { clearInterval(interval); sub.remove(); };
}, [resendStatus]);
```

`handleResend` already flips `resendStatus` back to `true`, which re-runs the effect with a fresh
`endsAt`, so it needs no change.

## Project Structure

```text
specs/013-otp-countdown-background/
├── spec.md
├── plan.md
└── tasks.md
src/screens/login/otpVerification.js   # modified
```
