---

description: "Task list for the iOS keyboard dismiss bar on CustomTextInput"
---

# Tasks: Keyboard dismiss control on iOS text fields

**Input**: Design documents from `/specs/015-ios-keyboard-dismiss/`: [spec.md](./spec.md),
[plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md),
[contracts/custom-text-input.md](./contracts/custom-text-input.md), [quickstart.md](./quickstart.md)

**Prerequisites**: plan.md, spec.md (both present)

**Tests**: not requested. Verification is manual using [quickstart.md](./quickstart.md); the rows are referenced as Q1–Q12.

**Organization**: Tasks are grouped by user story. Almost every code task edits the same file
(`src/components/customTextInput.js`), so only the translation tasks are parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Put the work on its own branch. `main` already contains 014 (PR #59 merged).

- [x] T001 Create branch `015-ios-keyboard-dismiss` from up-to-date `origin/main`, carrying the uncommitted `specs/015-ios-keyboard-dismiss/` directory and the `.specify/feature.json` change (`git fetch origin && git switch -c 015-ios-keyboard-dismiss origin/main`; the untracked/modified files come along). Commit them as `docs(015): spec, plan and tasks for the iOS keyboard dismiss bar`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the string and imports that the US1 bar needs.

- [x] T002 [P] In translation/en.json add `"keyboard-dismiss": "Close keyboard",` to the `en` object on the line directly **after** the existing `"close": "Close",` key (line ~109), not at the end of the object. Keeping it mid-object avoids merge conflicts with other features that append to the end.
- [x] T003 [P] In translation/de.json add `"keyboard-dismiss": "Tastatur schließen",` to the `de` object directly after the existing `"close": "Schließen",` key (line ~110)
- [x] T004 In src/components/customTextInput.js update imports:
  - add `useContext` and `useId` to the `react` named imports;
  - change the `react-native` import to `{ InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, TextInput, View }`;
  - add `import { TranslationContext } from "../services/translation/translation.context";`

**Checkpoint**: the app still builds and runs unchanged. The new imports are unused until US1.

---

## Phase 3: User Story 1 - Close the keyboard from any text field on iOS (Priority: P1) 🎯 MVP

**Goal**: every `CustomTextInput` on iOS shows a floating keyboard-close button (white disc, no bar) above the keyboard; it that closes the keyboard and keeps the text. Android is untouched.

**Independent Test**: quickstart Q1–Q8 on iOS; Q11–Q12 on Android (spec US1 scenarios 1–5).

- [x] T005 [US1] In src/components/customTextInput.js, inside the component body after the existing `useState` hooks, add:
  - `const { i18n } = useContext(TranslationContext);`
  - `` const accessoryId = `cti-${useId()}`; ``
  - `const showAccessory = Platform.OS === "ios";`

  Use `useId`, not `Math.random`, and keep the Platform gate. See research R2/R3 for why.
- [x] T006 [US1] In src/components/customTextInput.js add `inputAccessoryViewID={showAccessory ? accessoryId : undefined}` to the `<TextInput>` props, directly under `ref={inputRef}`
- [x] T007 [US1] In src/components/customTextInput.js render the accessory as the last child of the outer container `<View>`, after the `<Animated.Text>` label:
  ```
  {showAccessory && (
    <InputAccessoryView nativeID={accessoryId}>
      <View style={staticStyles.accessoryBar}>
        <Pressable onPress={Keyboard.dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={i18n.t("keyboard-dismiss")}>
          <MaterialCommunityIcons name="keyboard-close" size={24} color="#007AFF" />
        </Pressable>
      </View>
    </InputAccessoryView>
  )}
  ```
  Render it unconditionally with respect to `focused`, because it must already exist when the field focuses (research R5). Do not change the `onBlur={onBlur ?? floatDown}` wiring: `Keyboard.dismiss` triggers it (FR-004).
- [x] T008 [US1] In src/components/customTextInput.js add an `accessoryBar` entry to the module-level `staticStyles` `StyleSheet.create`: `height: 48`, row, right-aligned, `paddingHorizontal: 10`, **no background or border** (icon-only, per review), plus an `accessoryButton` style: a 38 pt white circle with a soft shadow, applied to the Pressable (opacity 0.6 while pressed)
- [ ] T009 [US1] Verify on an iOS simulator/device (hardware keyboard off) and an Android device: quickstart Q1–Q8 and Q11–Q12. In particular, Q5 (the post-reply field's own `onBlur` still runs), Q6 (never two bars) and Q12 (no `InputAccessoryView` warning in Metro on Android)

**Checkpoint**: US1 is shippable on its own. Every field has the bar on iOS.

---

## Phase 4: User Story 2 - A screen can opt a field out of the bar (Priority: P2)

**Goal**: `showKeyboardDismiss={false}` hides the bar for that field only. The default is on.

**Independent Test**: quickstart Q9 (spec US2 scenarios 1–2).

- [x] T010 [US2] In src/components/customTextInput.js add `showKeyboardDismiss = true,` to the destructured props, after `onSubmitEditing`, and change the gate from T005 to `const showAccessory = Platform.OS === "ios" && showKeyboardDismiss;`. Both the TextInput link (T006) and the render (T007) already read `showAccessory`, so nothing else changes.
- [ ] T011 [US2] Verify quickstart Q9: temporarily pass `showKeyboardDismiss={false}` to one field (for example the first field in src/screens/profile/contactUs.screen.js), confirm that field has no bar and its siblings still do, then revert the temporary prop

**Checkpoint**: US1 plus the opt-out. No screen opts out yet (research R7).

---

## Phase 5: User Story 3 - Screens are told when a field gains focus (Priority: P3)

**Goal**: a parent's `onFocus` is actually called, once per focus, alongside `floatUp()`.

**Independent Test**: quickstart Q10 (spec US3 scenarios 1–2).

- [x] T012 [US3] In src/components/customTextInput.js add `onFocus,` to the destructured props, next to `onBlur`. Leave the existing TextInput `onFocus={(e) => { floatUp(); if (typeof onFocus === "function") onFocus(e); }}` handler unchanged. It now refers to the prop instead of an undeclared identifier (research R6).
- [ ] T013 [US3] Verify quickstart Q10: temporarily pass `onFocus={() => console.log("cti focus")}` to one field, confirm exactly one log per focus and the label still floats, then revert the temporary prop

**Checkpoint**: all three stories done.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 Run `npx eslint src/components/customTextInput.js` (uses the project's .eslintrc.json) and fix any new warnings, such as unused imports if a step was skipped
- [ ] T015 Run the quickstart regression spot checks: Forgot Password → back to Login keeps the draft and label positions; the Birthdate picker field still opens the picker with no keyboard and no bar. Confirm `git diff` touches only src/components/customTextInput.js, translation/en.json, translation/de.json (plus specs)
- [x] T017 Extract the accessory into src/components/keyboardDismissAccessory.component.js (`useKeyboardDismissId(enabled)` + `<KeyboardDismissAccessory nativeID>`), switch src/components/customTextInput.js to it, and add it to the react-native-paper `Searchbar` in src/screens/location/location-list.screen.js via `inputAccessoryViewID` (Paper forwards unknown props to its TextInput)
- [x] T016 Commit as `feat(015): keyboard dismiss bar above the iOS keyboard on CustomTextInput` with a body noting the `onFocus` fix, and mark completed tasks `[x]` in specs/015-ios-keyboard-dismiss/tasks.md

---

## Dependencies & Execution Order

```text
T001 ─► T002 ┐
        T003 ┼─► T004 ─► US1 (T005 ─► T006 ─► T007 ─► T008 ─► T009)
             │                 │
             │                 ├─► US2 (T010 ─► T011)    needs T005's gate
             │                 └─► US3 (T012 ─► T013)    independent of US1 code; ordered only
             │                                            because it edits the same file
             └──────────────────────────────────────────► Polish (T014 ─► T015 ─► T016)
```

- **Setup → Foundational → US1** is strict.
- **US2** depends on US1 (it extends US1's `showAccessory` gate).
- **US3** has no logical dependency on US1/US2. It could be done first, as a one-line fix, but it
  edits the same file, so run it sequentially to avoid conflicting edits.
- **Polish** runs after the stories you are shipping.

## Parallel Opportunities

- **T002 ∥ T003**: different files (en.json, de.json).
- Everything else touches `src/components/customTextInput.js` and is sequential.
- Verification tasks (T009, T011, T013) can be batched into one device session after T012 if
  preferred. Run Q9/Q10 with their temporary props, then revert.

### Parallel example (Foundational)

```text
Task: "T002 Add keyboard-dismiss to translation/en.json after the close key"
Task: "T003 Add keyboard-dismiss to translation/de.json after the close key"
```

## Implementation Strategy

### MVP first (US1 only)

1. T001 → T002/T003 → T004
2. T005–T008, then verify with T009
3. **Stop and validate**: every iOS field can close its keyboard and Android is unchanged. This
   alone fixes the number-pad / phone-pad / multi-line dead end and is OTA-shippable.

### Incremental delivery

1. MVP (US1), then US2 (opt-out prop, one line), then US3 (`onFocus` fix, one line).
2. In practice all three are about 25 lines in one file, so a single PR with one commit per story
   (or one feature commit, as in T016) is reasonable.

## Notes

- Do not render `InputAccessoryView` on Android, even "harmlessly": it logs a warning on every
  render (research R2).
- Do not mount the accessory only while `focused`: iOS would miss it on first focus (research R5).
- No consumer screen changes are required. If one is made during testing (T011/T013), revert it.
