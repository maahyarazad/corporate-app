# Findings — Safe Area Context Migration

## Status: code complete, device verification outstanding

Phases 1, 3, 4, 5 and 6 are implemented. Every check that can be made without hardware is green.
**Nothing here has been seen running on a device**, and this feature is entirely visual, so it is
not done.

## Shipped

| Task | Change |
|---|---|
| T001–T002 | Baselines recorded: 32 raw `SafeAreaView` greps, 0 providers, 1 `StatusBar.currentHeight`; all 5 gates green; eslint 7919 |
| T005–T008 | `SafeAreaProvider` mounted once in `App.js:66`, seeded with `initialWindowMetrics`, inside `GestureHandlerRootView` and above the `Toast`/`ConfirmDialogHost` siblings |
| T010–T016 | `safearea.component.js` rewritten onto `react-native-safe-area-context`; `styled-components`, the `Platform.OS` branch and the `StatusBar.currentHeight` arithmetic all deleted; dead `styles.default` replaced with a real `styles.container`; `edges` passthrough added |
| T017 | **Resolved analytically, not on a device** — see below |
| T018–T027 | All 10 direct importers moved onto the shared `SafeArea` |
| T021 | The inline `{ backgroundColor: "white" }` in `postDetailMarketplace.screen.js:386` removed — `styles.container` already sets it, so it was a redundant duplicate |
| T029–T032 | `SafeAreaView` added to the existing `no-restricted-imports` entry; **verified `002`'s ban survived** |

## T017 — the `edges` decision, and a correction to my own research

`research.md` R5 originally recommended shipping `edges={["top"]}` as the "faithful,
behaviour-neutral" option. **That was wrong**, and implementing it would have caused an iOS
regression. R5 has been rewritten; the correction is recorded here too because it is the single
most important judgement in this feature.

Reading the source settled it:

```js
// react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:29-33
const SafeAreaView = Platform.select({
  ios: require('./RCTSafeAreaViewNativeComponent').default,   // all four edges
  default: View,                                              // Android: no insets at all
});
```

| Platform | Before | Library default (shipped) | `edges={["top"]}` (rejected) |
|---|---|---|---|
| iOS | all four edges, native | **identical** | **regression** — loses home indicator |
| Android | top only, hand-rolled | gains bottom + cutout | unchanged |

So the library default is the only option that does not regress iOS, and `FR-006` forbids the
`Platform.OS` branch that would be needed to be faithful to both. **Shipped with no `edges`
default.** The prop still exists so a screen can opt out per-edge.

The decision needed evidence, not a device. The *verification* still needs one.

## Blocked — needs an Android device

| Task | What to check |
|---|---|
| T003, T004 | Baseline screenshots were never taken — there was no device at implementation time |
| T009 | App boots both platforms; no first-frame inset jump; toast and confirm dialog clear the status bar |
| T028 | The 10 migrated screens start below the Android status bar (the F3 fix) and nothing is double-padded |
| T036 | **`map.screen.js` is the highest-risk check** — pan, zoom and marker taps must still work through the `pointerEvents="box-none"` overlay at `:457`, and the absolutely-positioned `safeArea2` must still sit correctly |
| T037 | Rotation, and toggling Android gesture ↔ three-button nav while the app runs |

**The one to look at first**: Android bottom spacing across the ~36 migrated screens. That inset is
newly applied and is the only intended behaviour change in this feature. Screens with
bottom-anchored buttons will move up.

## Checked and deliberately not changed

### T027 — `postCard.component.js` is not double-wrapped

Its `SafeArea` (`:594`) sits inside `MemoizedGalleryView`'s `HeaderComponent`, and that gallery is
`react-native-image-viewing`, which renders in a React Native `<Modal>`
(`node_modules/react-native-image-viewing/dist/ImageViewing.js:40`). A Modal is its own native
window, so it is outside the host screen's safe-area tree. No nested inset. No change needed.

### `profile.screen.js` uses both patterns

`SafeArea` at `:65` and the migrated one at `:242`. Both were checked; the file now has a single
import and both render paths use the shared component.

## Lint delta

7919 → 7928, **+9** — exactly one per newly-added import, all `import/no-unresolved`. That rule is
a repo-wide false positive: the `alias` resolver fails to load in 1766 places already, and every
one of the 9 paths was verified to resolve on disk. Import placement was corrected once during
implementation to sit in the relative-import group, which removed 10 `import/order` errors an
earlier placement had introduced.

No `no-restricted-imports` violations exist in `src` — the new ban is satisfied everywhere.

## Not done

- **T038 is this file.**
- `specs/009-safe-area-context/spec.md` SC-001 and SC-003 are worded as raw greps that also match
  comments and the component's own legitimate `SafeAreaView` usage. The accurate criteria are
  "no file imports `SafeAreaView` from `react-native`" (verified: 0 of 165 files) and "no live
  `StatusBar.currentHeight` call sites" (verified: 0). The greps in the spec should be tightened.
- The constitution (`.specify/memory/constitution.md`) is still an unfilled template, so the
  Constitution Check gate in `plan.md` remains unevaluable.
