# Research — Safe Area Context Migration

Every finding below was verified against the installed tree, not recalled. Paths and line
numbers are reproducible with the commands shown.

---

## R1 — RN's `SafeAreaView` is deprecated, and iOS-only

**Decision**: Migrate off it. This is not a preference; the framework is removing it.

**Evidence**:
```
node_modules/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:25
 * @deprecated Use `react-native-safe-area-context` instead. This component will be
 * removed in a future release.
```

On Android RN's `SafeAreaView` renders a plain `View` — it applies no insets whatsoever.
That is the entire reason `safearea.component.js:7` carries a hand-rolled compensation:

```js
${Platform.OS === "android" ? `padding-top: ${StatusBar.currentHeight}px;` : ""}
```

**Alternatives considered**: keep RN's and expand the manual Android maths to cover the
bottom gesture bar and horizontal notches. Rejected — that is reimplementing the library
that is already a dependency, and `StatusBar.currentHeight` does not describe display
cutouts.

---

## R2 — A provider already exists, but only *inside* the navigators

**Decision**: Add `SafeAreaProvider` at the `App.js` root anyway. It is additive, not a
duplicate.

**Evidence**: `App.js` has no provider. Yet `entertainer.screen.js:18` calls
`useSafeAreaInsets` and works, because `StackView` and `NativeStackView` both render
`SafeAreaProviderCompat`:

```
node_modules/@react-navigation/native-stack/lib/module/views/NativeStackView.js
node_modules/@react-navigation/stack/lib/module/views/Stack/StackView.js
```

`SafeAreaProviderCompat` is explicitly written to stand down when a provider already sits
above it — its own comment says so:

```js
// node_modules/@react-navigation/elements/lib/module/SafeAreaProviderCompat.js
const insets = React.useContext(SafeAreaInsetsContext);
...
if (insets) {
  // If we already have insets, don't wrap the stack in another safe area provider
  // This avoids an issue with updates at the cost of potentially incorrect values
  return <View ref={ref} onLayout={onLayout} style={[styles.container, style]}>{children}</View>;
}
```

So a root provider makes the nested one degrade to a plain `View`. **No double-measure, no
conflict.**

**What it gains**: three subtrees in `App.js` currently render *outside* every navigator and
therefore have no provider above them — `<Toast config={toastConfig} />` (`App.js:87`),
`<ConfirmDialogHost />` (`App.js:88`), and the splash branch that renders before navigation
mounts. A root provider is the only way those can read insets.

---

## R3 — Ten files bypass the wrapper and import RN's `SafeAreaView` directly

**Decision**: In scope. Migrating only `safearea.component.js` leaves the deprecated import
in the bundle.

**Evidence**: `grep -rn "SafeAreaView" src` resolved against each file's import source. All
ten resolve to `"react-native"`:

| File | |
|---|---|
| `src/screens/home.screen.js` | `src/screens/posts/posts.screen.js` |
| `src/screens/posts/postDetail.screen.js` | `src/screens/posts/post_card/postCard.component.js` |
| `src/screens/posts/postSearch.screen.js` | `src/screens/posts/post_entry/postEntry.screen.js` |
| `src/screens/posts/postDetailMarketplace.screen.js` | `src/screens/posts/post_entry/postEntrySelect.screen.js` |
| `src/screens/profile/profile.screen.js` | `src/screens/posts/post_entry/postEntryCategorySelect.screen.js` |

**Consequence — a pre-existing Android bug.** Combined with R1: these ten screens get *no
top inset on Android at all*, because they never had the wrapper's `StatusBar.currentHeight`
compensation. Where a navigator header sits above them the gap is hidden; on headerless
screens, content renders under the status bar today. This migration fixes it incidentally.

---

## R4 — `initialWindowMetrics` removes the cold-start flash

**Decision**: Seed the root provider with it.

**Evidence**: exported by the installed version —
`node_modules/react-native-safe-area-context/lib/typescript/src/InitialWindow.d.ts:2`:
```ts
export declare const initialWindowMetrics: Metrics | null;
```

Without it the provider measures insets asynchronously and the first frame renders with
zero insets, producing a visible jump on cold start. React Navigation's own
`SafeAreaProviderCompat` passes `initialMetrics` for exactly this reason.

---

## R5 — CORRECTED: only Android changes, and `["top"]` would regress iOS

> **This section was rewritten during implementation.** The original version offered
> `edges={["top"]}` as the "faithful, behaviour-neutral" option. That was wrong, and acting on
> it would have caused an iOS regression. The corrected analysis is below.

**Decision**: use the library default (all edges). Do **not** pass `edges` from the shared
component.

### What RN's `SafeAreaView` actually does, per platform

Verified in the source, not assumed:

```js
// react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:29-33
const SafeAreaView = Platform.select({
  ios: require('./RCTSafeAreaViewNativeComponent').default,
  default: View,          // <-- Android: a plain View. No insets. At all.
});
```

The iOS native view applies the full `UIEdgeInsets`
(`React/Views/SafeAreaView/RCTSafeAreaView.m:58`, `setSafeAreaInsets:`) — **all four edges**.

### The corrected comparison

| Platform | Today | With library default (all edges) | With `edges={["top"]}` |
|---|---|---|---|
| **iOS** | all four edges (native) | **identical** | **REGRESSION** — loses home indicator, landscape notch |
| **Android** | top only, hand-rolled `StatusBar.currentHeight` | gains bottom + cutout insets | unchanged |

So `edges={["top"]}` is not the safe option. It is behaviour-neutral on Android and actively
harmful on iOS, where it would drop the home-indicator inset on every one of the 38 call sites.

### Why the default is right

1. **iOS is untouched** — all edges before, all edges after. Zero risk on that platform.
2. **Android changes in exactly one direction: it gains an inset it should always have had.**
   Content stops sitting under the gesture bar. That is the bug being fixed, not a new one.
3. `FR-006` forbids `Platform.OS` branching inside the component. A platform-conditional `edges`
   would reintroduce exactly the hand-rolled platform arithmetic this feature exists to delete.

The `edges` **prop is still added** (`FR-005`) so an individual screen can opt out where its own
layout already accounts for the bottom bar. It simply has no default.

### What still needs a device

The decision no longer does — it is settled by the platform table above. **Verification does.**
The open question is narrower than originally written: *on Android, do any of the 36 screens have
bottom-anchored content that now sits too high?* That is a look-at-it check, not a decision, and
it is scoped to one platform and one edge.

## R6 — The supplied snippet violates a repo gate

**Decision**: use `StyleSheet.create`, not the README's inline form.

The input snippet contains `style={{ flex: 1 }}`. Commit `2ce9948` ("finish the
no-inline-styling pass across src") and the `check:styles` gate exist specifically to keep
those out. Verified: `npm run check:styles` passes today with
"every module-scope StyleSheet references only module-scope bindings".

---

## R7 — `pointerEvents` must survive

**Decision**: keep forwarding it explicitly.

Exactly one call site depends on it — `map.screen.js:457`,
`<SafeArea style={styles.safeArea2} pointerEvents="box-none">`. That screen layers a
touch-transparent overlay above the map; losing `box-none` makes the whole map
untappable. It is the single highest-consequence prop in the component's surface and the
easiest to drop silently during a rewrite.

---

## R8 — Dead code in the current component

`safearea.component.js:22` declares `default: {}` and uses it as
`style={[styles.default, style]}`. An empty style object contributes nothing. Remove it
during the rewrite.

Also: the component is one of the last `styled-components` consumers on a hot path. Dropping
`styled(SafeAreaView)` for the library's component removes a runtime-CSS wrapper from every
one of the 38 call sites, continuing the direction already taken in `map.screen.js`.

---

## Open question carried to implementation

`map.screen.js:457` applies `position: absolute`, `height: "100%"` and `flex: 1` to a
`SafeArea`. Safe-area insets are applied as **padding**, and padding interacts differently
with an absolutely-positioned, percentage-height box than with a flex child. This one call
site needs its own device check regardless of which `edges` option is chosen.
