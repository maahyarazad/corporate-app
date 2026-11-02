# Quickstart: validating the iOS keyboard dismiss bar

## Prerequisites

- The branch with the change checked out, `npm install` done.
- An iOS device or simulator and an Android device or emulator running the dev client
  (`npx expo start --dev-client`), or an OTA update published to a test channel.
- On the simulator, turn off **I/O → Keyboard → Connect Hardware Keyboard** so the on-screen
  keyboard appears.
- A test account that can reach Edit Profile, Contact Us, post detail and event guests.

## iOS scenarios

| # | Steps | Expected | Covers |
|---|-------|----------|--------|
| 1 | Edit Profile → tap the numeric field | Grey bar above the number pad with a blue keyboard-close icon on the right | FR-001, FR-002, FR-009 |
| 2 | Type `123`, tap the icon | Keyboard closes; `123` remains; label stays floated | FR-003 |
| 3 | Tap an **empty** field, then the icon | Keyboard closes; label drops back to its resting position | FR-004 |
| 4 | Contact Us → multi-line message → type two lines → icon | Keyboard closes; text intact | SC-001 |
| 5 | Post detail → reply field (has its own `onBlur`) → icon | Keyboard closes and the screen's own leave-field behaviour runs, the same as tapping outside | FR-004, Edge: own leave handling |
| 6 | Registration → tap between the four fields quickly about 20 times | Only one bar is ever visible, always under the focused field | FR-005, SC-002 |
| 7 | Login → focus the password field | Bar shows; iOS password suggestions and autofill still work; login succeeds first time | SC-004 |
| 8 | Turn on VoiceOver, focus a field, swipe to the bar button | Announced as "Close keyboard, button" (DE: "Tastatur schließen, Taste") | FR-010 |
| 9 | Temporarily pass `showKeyboardDismiss={false}` to one field on a test screen | That field shows no bar; other fields still do | FR-006 |
| 10 | Temporarily pass `onFocus={() => console.log("focus")}` to one field | One log line per focus; label still floats | FR-008, SC-005 |

## Android scenarios

| # | Steps | Expected | Covers |
|---|-------|----------|--------|
| 11 | Repeat 1, 4 and 6 on Android | No bar; keyboard and layout identical to the current release | FR-007, SC-003 |
| 12 | Watch Metro logs while opening Login, Registration, Contact Us | No `InputAccessoryView is only supported on iOS` warnings | research R2 |

## Regression spot checks

- Forgot Password → back to Login: drafted values and the label positions are unchanged.
- Birthdate picker field: still opens the picker on tap, with no keyboard and no bar.

## Done when

All rows pass on one iOS and one Android build, and steps 9–10 are reverted before commit.
