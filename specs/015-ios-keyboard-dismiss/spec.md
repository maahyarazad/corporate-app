# Feature Specification: Keyboard dismiss control on iOS text fields

**Feature Branch**: `015-ios-keyboard-dismiss`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Use React Native's built-in InputAccessoryView to attach a bar with a keyboard-dismiss button to the top of the iOS keyboard for each CustomTextInput, with a per-instance ID and a `showKeyboardDismiss` prop (default on); Android ignores it. Also fix the bug where `onFocus` is called inside the TextInput's focus handler but never destructured from props, so a parent's `onFocus` is silently ignored. (Alternative considered: react-native-keyboard-controller's KeyboardToolbar for app-wide done + previous/next.)"

## Problem

On iOS, the keyboard for number pads, phone pads and multi-line fields has no return key, so a
member who opens one of those keyboards has no obvious way to close it. Today that affects, for
example, the numeric field on the edit-profile screen and the multi-line message fields on Contact
Us and post replies. The keyboard then covers buttons and content the member needs, such as Submit.

Separately, the shared text field accepts a "notify me on focus" option from the screen that
uses it, but never passes it on, so any screen that relies on it silently gets nothing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Close the keyboard from any text field on iOS (Priority: P1)

A member typing into any of the app's standard text fields on an iPhone sees a slim bar along
the top of the keyboard with a "close keyboard" button on the right. Tapping it closes the
keyboard and leaves what they typed in place, so they can reach whatever the keyboard was covering.

**Why this priority**: it is the core of the feature and removes a dead end on number-pad,
phone-pad and multi-line fields, where iOS gives no other way to close the keyboard.

**Independent Test**: on an iPhone, open Edit Profile, tap the numeric field, confirm the bar
appears above the number pad, tap the button, and confirm the keyboard closes with the typed
value kept. Repeat on the multi-line Contact Us message field.

**Acceptance Scenarios**:

1. **Given** a member on iOS focuses a standard text field, **When** the keyboard opens,
   **Then** a bar with a close-keyboard button is shown directly above the keyboard.
2. **Given** the bar is visible, **When** the member taps the close-keyboard button, **Then**
   the keyboard closes, the field loses focus and the typed text is unchanged.
3. **Given** the field was empty when the keyboard was closed this way, **When** the keyboard
   closes, **Then** the floating label returns to its resting position, exactly as it does when
   the member taps elsewhere to leave the field.
4. **Given** a screen with several text fields, **When** the member moves focus from one field
   to another, **Then** exactly one bar is shown, belonging to the field that has focus, and its
   button closes the keyboard for that field.
5. **Given** the member is on Android, **When** they focus any text field, **Then** no extra bar
   appears and the keyboard behaves exactly as before.

---

### User Story 2 - A screen can opt a field out of the bar (Priority: P2)

A screen can turn the bar off for a specific field, for example where the field already has its
own way to close the keyboard or where the bar would get in the way of a custom layout.

**Why this priority**: the bar is on by default, so opting out is only needed for exceptions.

**Independent Test**: turn the bar off for one field on a test screen and confirm that field's
keyboard opens with no bar, while other fields on the same screen still show it.

**Acceptance Scenarios**:

1. **Given** a field has the bar turned off, **When** the member focuses it on iOS, **Then** the
   keyboard opens without the bar.
2. **Given** a field does not state a preference, **When** the member focuses it on iOS, **Then**
   the bar is shown, because the default is on.

---

### User Story 3 - Screens are told when a field gains focus (Priority: P3)

A screen that asks to be notified when one of its text fields gains focus is actually notified.
The floating-label animation keeps working as before.

**Why this priority**: it is a latent bug fix. No screen relies on it today, but the option is
part of the field's public surface and silently does nothing.

**Independent Test**: give a field a focus notification on a test screen, focus the field, and
confirm the notification fires once and the label still floats up.

**Acceptance Scenarios**:

1. **Given** a screen asks to be notified on focus, **When** the member focuses the field,
   **Then** the screen is notified once and the label floats up as before.
2. **Given** a screen does not ask to be notified, **When** the member focuses the field,
   **Then** the label floats up and nothing else happens.

---

### Edge Cases

- **Field with its own leave-field handling**: some screens (for example the post-reply field)
  supply their own "on leave" behaviour. Closing the keyboard from the bar must trigger that
  behaviour exactly as tapping elsewhere does.
- **Disabled fields**: a read-only field never opens the keyboard, so no bar appears.
- **Password fields and autofill**: on login and change-password fields, the iOS password
  suggestion strip must remain usable alongside the bar, and password autofill must keep working.
- **Fields inside pop-up panels**: fields shown inside a modal or picker (for example the
  birthdate and partner pickers) must show the bar on top of the keyboard, not behind the panel.
  If they can't, the bar is turned off for those fields rather than shown broken.
- **Hardware keyboard on iPad / Simulator**: when no on-screen keyboard is shown, a leftover bar
  at the bottom of the screen is acceptable iOS behaviour and is not treated as a defect.
- **Rapid focus changes**: tapping quickly between fields must never leave two bars showing, or a
  bar with no keyboard under it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On iOS, every instance of the app's shared text field MUST show a bar directly
  above the on-screen keyboard while that field has focus, unless the bar is turned off for it.
- **FR-002**: The bar MUST contain one close-keyboard control, right-aligned and shown as a
  "keyboard close" icon in the system accent blue, with a touch area at least 44 points tall.
- **FR-003**: Activating the close-keyboard control MUST close the keyboard and remove focus from
  the field, without changing the field's text.
- **FR-004**: Removing focus via the control MUST run the same leave-field behaviour as any
  other way of leaving the field: the floating label returns if the field is empty, and any
  screen-supplied leave behaviour runs.
- **FR-005**: Each field instance MUST have its own bar, so on a screen with several fields only
  the focused field's bar is shown.
- **FR-006**: The bar MUST be on by default and MUST be turnable off per field by the screen that
  uses it.
- **FR-007**: On Android, the field MUST look and behave exactly as before. No bar, no layout
  change.
- **FR-008**: When a screen asks to be notified that a field gained focus, the field MUST notify
  it once per focus, in addition to running its existing floating-label animation.
- **FR-009**: The bar MUST visually match the iOS keyboard surroundings: a light grey background
  with a hairline divider along its top edge.
- **FR-010**: The close-keyboard control MUST be announced by screen readers as a button with a
  spoken label ("Close keyboard" / "Tastatur schließen") in the member's app language.

### Key Entities

- **Shared text field**: the single text input component reused across about 14 screens (login,
  registration, profile editing, contact, events, password reset, posts, pickers). It gains one
  option (show the dismiss bar, default on) and starts honouring its existing focus-notification
  option.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On iOS, a member can close the keyboard from 100% of the app's standard text
  fields, including number-pad, phone-pad and multi-line ones, with a single tap and without
  losing typed text.
- **SC-002**: On a screen with several fields, at most one keyboard bar is ever visible at a time
  across a sequence of 20 rapid focus changes.
- **SC-003**: Android screens using the shared text field show no visual or behavioural
  difference before and after the change, confirmed by side-by-side checks on the login,
  registration and Contact Us screens.
- **SC-004**: Login, biometric login and password autofill continue to succeed on iOS on the
  first attempt with the bar present.
- **SC-005**: A screen that asks for focus notification receives exactly one notification per
  focus.

## Assumptions

- **Scope is the shared text field only.** Other inputs, such as the OTP code boxes and the
  country/phone picker input, are out of scope. The OTP flow already auto-submits.
- **Icon, not text.** The control is a "keyboard close" icon rather than a "Done" label. Swapping
  it for a text label later is a cosmetic change.
- **No previous/next field arrows.** App-wide toolbars with field-to-field navigation (for example
  a third-party keyboard toolbar library) were considered and rejected for this feature: they add
  a new dependency and touch every screen, while the per-field bar fixes the actual dead end with
  no new dependency. This can be revisited separately.
- **One new translation.** The bar has no visible text. The only new EN/DE string is the
  screen-reader label for the control (FR-010).
- **No OTA blocker.** This is a JavaScript-only change using capabilities already in the app, so
  it can ship as an over-the-air update.
- **No current consumers of the focus notification.** No screen passes a focus handler today, so
  fixing it cannot change existing behaviour.
