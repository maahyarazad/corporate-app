# Data Model — Safe Area Context Migration

This feature has no persisted data, no API and no schema. The "entities" are the component
contract and the inset values flowing through context. They are documented here because the
migration changes both.

---

## Entity: `SafeArea` (the shared wrapper)

`src/components/safearea.component.js` — the app's single safe-area boundary.

### Props

| Prop | Type | Required | Today | After |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | rendered inside | unchanged |
| `style` | `StyleProp<ViewStyle>` | no | merged as `[styles.default, style]` | merged as `[styles.container, style]` — `styles.default` was `{}` (R8) |
| `pointerEvents` | `"box-none" \| "none" \| "box-only" \| "auto"` | no | forwarded | **must stay forwarded** (R7) |
| `edges` | `("top"\|"bottom"\|"left"\|"right")[]` | no | *does not exist* | **new** — passthrough to `SafeAreaView`; default decided by R5 |

`edges` is the only addition. It exists so individual screens can opt out of an inset
without reintroducing manual `StatusBar` arithmetic.

### Invariants

1. `flex: 1` is always applied. Every one of the 38 call sites assumes the wrapper fills its
   parent; dropping it collapses the screen to zero height.
2. Caller `style` always wins over the component's own — it is last in the array.
3. The component owns *no* platform branching after migration. The `Platform.OS === "android"`
   test at `safearea.component.js:7` is deleted, not relocated.

---

## Entity: `Metrics` (from `react-native-safe-area-context`)

Read-only, produced by the provider and consumed via context.

```ts
type Metrics = {
  frame:  { x: number; y: number; width: number; height: number };
  insets: { top: number; left: number; right: number; bottom: number };
};
```

### Values by platform

| Inset | iOS today | Android today | Android after |
|---|---|---|---|
| `top` | notch / status bar | `StatusBar.currentHeight` (manual) | real inset, incl. display cutout |
| `bottom` | home indicator | **0 — never applied** | gesture bar / nav bar |
| `left` / `right` | landscape notch | 0 | display cutout in landscape |

The `bottom` row is the behaviour change described in R5.

### Seeding

`initialWindowMetrics` (R4) supplies a synchronous first value so frame 1 is not rendered
with all-zero insets. It is `Metrics | null` — null on web and in test environments, which
is why React Navigation's compat wrapper falls back to a zero-inset object rather than
assuming it exists.

---

## State transitions

The provider re-publishes `Metrics` on:

- device rotation
- Android navigation-mode change (gesture ↔ three-button), which fires while the app is running
- multi-window / split-screen resize
- keyboard show/hide on some Android OEM builds

Consumers re-render on each. Nothing in this feature caches or derives from insets, so no
invalidation logic is required — which is precisely why `useSafeAreaInsets` is preferred
over reading `StatusBar.currentHeight` once at module scope, as the current implementation
effectively does inside a styled-components template.

---

## Provider placement

Exactly one provider, at the `App.js` root, above `<AppNavigation />` and above the
sibling `Toast` / `ConfirmDialogHost` subtrees.

```
GestureHandlerRootView          (008)
└── SafeAreaProvider            (009 — new, seeded with initialWindowMetrics)
    ├── ThemeProvider … AppNavigation
    │   └── StackView → SafeAreaProviderCompat  ← degrades to a plain View (R2)
    ├── Toast                   ← gains insets
    └── ConfirmDialogHost       ← gains insets
```

Nesting order matters: `SafeAreaProvider` goes **inside** `GestureHandlerRootView`, which
`008` established must remain the outermost element.
