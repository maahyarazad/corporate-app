# Contract: `CustomTextInput` public surface (delta)

The component is consumed by 14 files in `src/`. This contract defines what callers may rely on
after this feature ships. Everything not listed here is unchanged.

## Props

```ts
showKeyboardDismiss?: boolean   // default true
onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
```

## Guarantees

1. **iOS, `showKeyboardDismiss` true or omitted**: while this field has focus, a bar 44 pt tall
   is shown above the keyboard. Its only control is a right-aligned button with
   `accessibilityRole="button"` and the translated `keyboard-dismiss` label.
2. **Pressing the button** closes the keyboard and blurs this field. The caller's `onBlur` runs if
   supplied; otherwise the built-in label float-down runs. `value` is not modified and
   `onChangeText` is not called.
3. **iOS, `showKeyboardDismiss={false}`**: no bar, and the field is not linked to any accessory view.
4. **Android**: output is identical to before this feature, whatever `showKeyboardDismiss` is set
   to. No `InputAccessoryView` is rendered and no warning is logged.
5. **`onFocus`**: if it's a function, it is called exactly once per focus, after the label
   float-up starts.
6. **Isolation**: each instance has its own accessory ID. Several instances on one screen never
   share a bar or show more than one at a time.
7. **Imperative handle** (`focus`, `blur`, `clear`, `getNativeInput`): unchanged.

## Non-goals

- No previous/next field navigation in the bar.
- No visible text in the bar.
