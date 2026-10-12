# Contract — `SafeArea` component

The app's UI contract for safe-area handling. Every screen boundary goes through this
component; the ten files in R3 are migrated *to* it rather than to the library directly, so
that this file stays the single place the policy lives.

## Import

```js
import { SafeArea } from "../components/safearea.component";
```

Importing `SafeAreaView` from `react-native` is **prohibited** after Phase D (R1 —
deprecated upstream). Importing `SafeAreaView` from `react-native-safe-area-context`
directly in a screen is discouraged: it scatters edge policy across 36 files.

## Signature

```
SafeArea({ children, style?, pointerEvents?, edges? }) -> element
```

| Prop | Contract |
|---|---|
| `children` | Rendered inside the padded box. |
| `style` | Merged last, so callers always override. |
| `pointerEvents` | Forwarded verbatim to the underlying view. |
| `edges` | Which edges receive insets. Omitted → the component default. |

## Guarantees

1. **Fills its parent.** `flex: 1` is applied unconditionally. Callers may override via `style`.
2. **No platform branching in callers.** A screen must never test `Platform.OS` to compensate
   for insets. If an inset is wrong, fix it here or pass `edges`.
3. **`pointerEvents` is honoured.** `box-none` must leave descendants tappable while the
   wrapper itself is transparent to touch. Verified against `map.screen.js:457`.
4. **Insets are padding, not margin.** Background colours set via `style` therefore extend
   *under* the inset area. This matches the previous behaviour and is what screens with a
   coloured header rely on.

## Prohibited

| Pattern | Why |
|---|---|
| `import { SafeAreaView } from "react-native"` | Deprecated; no-op on Android (R1) |
| `paddingTop: StatusBar.currentHeight` | Manual reimplementation; ignores display cutouts |
| `style={{ flex: 1 }}` inline | Fails `check:styles` (R6) |
| A second `SafeAreaProvider` below the root | Re-measures insets; see R2 |

## Enforcement

Phase D extends the existing `no-restricted-imports` block in `.eslintrc.json` — the same
mechanism `002` used to ban `Animated` and `InteractionManager`.

**This must be done by extending the existing entry, not by adding a second one.**
Verified empirically: `no-restricted-imports` keyed on the same module `name` twice keeps
only the **last** entry and silently discards the earlier restriction.

```
A) two entries for "react-native"      -> 1 problem  (Animated ban SILENTLY LOST)
B) one entry, combined importNames     -> 2 problems (both enforced)
```

Adding a second `{ "name": "react-native", ... }` object would therefore regress `002`'s
guardrail without any warning. The correct edit:

```json
"no-restricted-imports": [
  "error",
  {
    "paths": [
      {
        "name": "react-native",
        "importNames": ["Animated", "InteractionManager", "SafeAreaView"],
        "message": "Animated/InteractionManager: use react-native-reanimated; InteractionManager is banned (002). SafeAreaView: use src/components/safearea.component.js - RN's is deprecated and a no-op on Android (009)."
      }
    ]
  }
]
```

The message is necessarily shared across all three names, because ESLint attaches one
message per path entry, not per import name. Keep it explicit about which name maps to
which rule.

## Contract tests

No automated coverage exists for this — there is no component test harness in the repo. The
checks in `quickstart.md` are the contract tests, and they are manual and on-device.
