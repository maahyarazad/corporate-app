# Data Model: Keyboard dismiss control on iOS text fields

There is no persisted data. The model here is the component's inputs and derived values.

## CustomTextInput (`src/components/customTextInput.js`)

### New / fixed props

| Prop | Type | Default | Rule |
|------|------|---------|------|
| `showKeyboardDismiss` | boolean | `true` | When `false`, no bar for this instance (FR-006). Ignored on Android. |
| `onFocus` | `(e) => void` | `undefined` | Already called by the focus handler. Now destructured, so it is actually received (FR-008). Called once per focus, after `floatUp()`. |

All other props are unchanged.

### Derived values (per render)

| Name | Value | Notes |
|------|-------|-------|
| `accessoryId` | `` `cti-${useId()}` `` | Stable for the instance's lifetime; unique across mounted instances. |
| `showAccessory` | `Platform.OS === "ios" && showKeyboardDismiss` | Single gate for both the TextInput link and the accessory render. |

### Wiring

- `TextInput.inputAccessoryViewID` = `showAccessory ? accessoryId : undefined`
- `<InputAccessoryView nativeID={accessoryId}>` rendered only when `showAccessory`

### State transitions (unchanged, now also reachable from the bar)

```text
unfocused --tap field--> focused (floatUp, onFocus?)
focused   --tap bar button / tap elsewhere / submit--> blurred
blurred   --> onBlur ?? floatDown   (label returns only if value is empty)
```

## Translation keys

| Key | en | de |
|-----|----|----|
| `keyboard-dismiss` | Close keyboard | Tastatur schließen |
