# Implementation Plan: Keyboard dismiss control on iOS text fields

**Branch**: `015-ios-keyboard-dismiss` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-ios-keyboard-dismiss/spec.md`

## Summary

On iOS, give every `CustomTextInput` its own React Native `InputAccessoryView`: a 44 pt light-grey
bar above the keyboard holding one right-aligned "keyboard-close" icon button that calls
`Keyboard.dismiss()`. Each instance gets a stable, unique `nativeID` from React's `useId()`. A new
`showKeyboardDismiss` prop (default `true`) lets a screen opt a field out. On Android nothing is
rendered. In the same file, destructure the `onFocus` prop that the focus handler already calls,
so a parent's `onFocus` is actually invoked. Add one EN/DE string for the button's screen-reader
label. The change is JS-only, touches one component and two translation files, and is
OTA-shippable.

## Technical Context

**Language/Version**: JavaScript, React 19.1.0, React Native 0.81.5 (New Architecture enabled), Expo SDK 54

**Primary Dependencies**: RN core `InputAccessoryView`, `Keyboard`, `Platform`, `Pressable`;
  `@expo/vector-icons` `MaterialCommunityIcons` (`keyboard-close` glyph verified present);
  `TranslationContext` (`src/services/translation/translation.context.js`) for the a11y label

**Storage**: N/A

**Testing**: manual on device/simulator (see [quickstart.md](./quickstart.md)); the spec asks for no automated tests

**Target Platform**: iOS (feature), Android (must be unchanged)

**Project Type**: mobile app (Expo / React Native)

**Performance Goals**: no visible delay when the keyboard opens; one extra native view per field instance

**Constraints**: JS-only, no new dependency, no native rebuild; Android output identical

**Scale/Scope**: 1 component (`src/components/customTextInput.js`) used by 33 instances
  across 14 files; 2 translation files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, with no ratified principles,
so there are no gates to evaluate. **PASS (vacuous)**, both before research and after design.
The plan follows the conventions of previous features: smallest change, JS-only and OTA-safe,
no new dependencies, behaviour of unrelated paths preserved.

## Key decisions

Full rationale and alternatives are in [research.md](./research.md).

1. **Per-instance `InputAccessoryView`, gated on `Platform.OS === "ios" && showKeyboardDismiss`.**
   The gate is required, not just tidy. On Android, RN's `InputAccessoryView` calls
   `console.warn('<InputAccessoryView> is only supported on iOS.')` on every render, so rendering
   it unconditionally would flood the logs from 33 instances.
2. **`useId()` for the `nativeID`**, prefixed `cti-`, instead of `Math.random()` in a ref. It is
   stable for the component's life, unique per instance, deterministic and already in React 19.
3. **`Keyboard.dismiss()`** as the action. It blurs the focused input, which fires the
   TextInput's `onBlur`, so the existing `onBlur ?? floatDown` logic runs unchanged (FR-004).
   That means `floatDown` by default, or the screen's own handler (for example `fieldOnBlur` on
   post detail).
4. **The accessory is always mounted while the field is mounted**, not only while it's focused.
   iOS resolves `inputAccessoryViewID` when the field becomes first responder, so the view must
   already exist at that point. This also ensures only the focused field's bar is shown (FR-005).
5. **Fix `onFocus`** by adding it to the destructured props. The focus handler's
   `typeof onFocus === "function"` guard stays as is. Verified: no screen passes `onFocus` today,
   so this cannot change current behaviour.
6. **A11y label** `i18n.t("keyboard-dismiss")` comes from `TranslationContext`, added as a
   top-level key next to the existing `close` key: EN "Close keyboard", DE "Tastatur schließen".
7. **No per-screen changes.** The default is on, and no current field needs to opt out: none sit
   inside an RN `Modal`, and the only picker-hosted instance (`BirthdatePicker`) is
   `pointerEvents="none"` and never focuses. `react-native-keyboard-aware-scroll-view` reads the
   iOS keyboard frame, which already includes the accessory height, so scroll offsets stay correct.

## Project Structure

### Documentation (this feature)

```text
specs/015-ios-keyboard-dismiss/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1: component props/state
├── quickstart.md        # Phase 1: manual validation
├── contracts/
│   └── custom-text-input.md   # Phase 1: public prop contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/components/
└── customTextInput.js     # MODIFIED: imports, onFocus + showKeyboardDismiss props,
                           #   useId nativeID, inputAccessoryViewID, accessory bar, style
translation/
├── en.json                # MODIFIED: + "keyboard-dismiss": "Close keyboard"
└── de.json                # MODIFIED: + "keyboard-dismiss": "Tastatur schließen"
```

**Structure Decision**: single existing component plus translations. No new files under `src/`,
and none of the 14 consumer screens change.

## Complexity Tracking

None. There are no constitution violations to justify.
