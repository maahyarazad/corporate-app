# Research: Keyboard dismiss control on iOS text fields

No NEEDS CLARIFICATION items came out of the spec or the Technical Context. The items below
record the decisions taken and the facts checked in the codebase and `node_modules`.

## R1. Mechanism for a bar above the iOS keyboard

- **Decision**: React Native core `InputAccessoryView`, one per `CustomTextInput` instance, linked
  through `TextInput.inputAccessoryViewID`.
- **Rationale**: it is built in (no dependency, no native rebuild, OTA-safe), and it attaches to
  the keyboard natively, so it moves with the keyboard and is included in the keyboard frame.
  It also works under the New Architecture, which this app has enabled
  (`android/gradle.properties` `newArchEnabled=true`); RN 0.81 ships a Fabric component for it.
- **Alternatives considered**:
  - `react-native-keyboard-controller` `KeyboardToolbar`: app-wide, adds previous/next arrows.
    Rejected because it is a new native dependency (store build required), needs a provider at
    the root, and goes beyond the spec's scope (spec, Assumptions).
  - A shared single accessory with one fixed `nativeID` for all fields: rejected. When the same
    view is attached to several mounted fields, which field it belongs to becomes ambiguous, and
    the spec requires one bar per field (FR-005).
  - An absolutely positioned bar driven by `Keyboard` show/hide events: rejected. It needs manual
    frame tracking and safe-area handling, and fights `KeyboardAwareScrollView`.

## R2. Android behaviour of `InputAccessoryView`

- **Finding** (`node_modules/react-native/Libraries/Components/TextInput/InputAccessoryView.js`):
  on non-iOS platforms it calls `console.warn('<InputAccessoryView> is only supported on iOS.')`
  and returns `null`. On iOS it already wraps its children in a `SafeAreaView` sized to the window
  width.
- **Decision**: gate both the render and the `inputAccessoryViewID` on `Platform.OS === "ios"`.
  The proposal's claim that "Android ignores it" is true for layout, but without the gate every
  Android render of 33 instances would log a warning.

## R3. Unique, stable `nativeID` per instance

- **Decision**: `const accessoryId = \`cti-${useId()}\`;`
- **Rationale**: `useId` (React 18+, present in 19.1.0) is unique per mounted instance, stable
  across re-renders, and deterministic. It is an opaque string, which is all `nativeID` needs.
- **Alternative**: `useRef(\`cti-${Math.random()...}\`).current`, from the proposal. It works,
  but it is non-deterministic and allocates a string on every render before the ref discards it.
  `useId` is the purpose-built API.

## R4. Dismiss action and label/blur behaviour

- **Decision**: `onPress={Keyboard.dismiss}`.
- **Rationale**: `Keyboard.dismiss` blurs the currently focused input, which fires that
  TextInput's `onBlur`. `CustomTextInput` passes `onBlur={onBlur ?? floatDown}`, so the default
  float-down and any screen-supplied blur handler run exactly as when the member taps elsewhere
  (FR-003, FR-004). Typed text is untouched.
- **Alternative**: `inputRef.current?.blur()`. Equivalent in practice, since the visible bar
  always belongs to the focused field. `Keyboard.dismiss` is kept because it matches the proposal
  and needs no closure.

## R5. When the accessory must be mounted

- **Decision**: render `InputAccessoryView` whenever the field is mounted (subject to R2's gate),
  not conditionally on `focused`.
- **Rationale**: iOS looks up the accessory by ID when the field becomes first responder. A view
  mounted only after focus would miss the first keyboard presentation. Unfocused fields' accessory
  views are not displayed, so a screen never shows more than one bar (FR-005, SC-002).

## R6. The `onFocus` defect

- **Finding**: `customTextInput.js` calls `onFocus(e)` behind `typeof onFocus === "function"`, but
  `onFocus` is not in the destructured props. It resolves to an undeclared identifier, so the
  guard is always false and the parent handler is never called. (No ReferenceError is thrown,
  because `typeof` on an undeclared identifier returns `"undefined"`.)
- **Usage scan**: no `<CustomTextInput … onFocus=…>` exists in `src/`, so the fix cannot change
  any current screen.
- **Decision**: add `onFocus` to the props list. Leave the handler as is.

## R7. Fields in modals, pickers and keyboard-aware scroll views

- **Findings**:
  - No `CustomTextInput` is rendered inside an RN `Modal`. `BirthdatePicker`'s instance sits
    outside its `Modal`, inside `pointerEvents="none"`, so it never focuses. `partnerPicker` is a
    normal inline field. `eventGuests` / `registrationDetails` import modal components, but their
    inputs are not inside them.
  - `KeyboardAwareScrollView` uses the iOS keyboard frame, which includes the input accessory's
    height, so focused-field scrolling already accounts for the extra 44 pt.
- **Decision**: no opt-outs needed now. `showKeyboardDismiss={false}` remains available for future
  exceptions.

## R8. Accessibility label translation

- **Decision**: new top-level key `keyboard-dismiss` in `translation/en.json` ("Close keyboard")
  and `translation/de.json` ("Tastatur schließen"), read via `useContext(TranslationContext).i18n`,
  the same pattern as `membershipExpiredSheet.component.js`. The button gets
  `accessibilityRole="button"`.
- **Alternative**: reuse the existing `close` key ("Close" / "Schließen"). Rejected because it is
  ambiguous for screen-reader users ("close" what?).
