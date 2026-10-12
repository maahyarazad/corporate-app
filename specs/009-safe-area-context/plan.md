# Implementation Plan: Safe Area Context Migration

**Branch**: `009-safe-area-context` (not yet created — branch from `008-gesture-handler-root`)
**Date**: 2026-09-04
**Input**: "replace safearea.component.js with `import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'` … `<SafeAreaProvider><SafeAreaView style={{flex:1}}>`"

## Summary

React Native's `SafeAreaView` is deprecated. `node_modules/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:25` says so outright:

> `@deprecated Use react-native-safe-area-context instead. This component will be removed in a future release.`

`react-native-safe-area-context@5.6.2` is already a direct dependency (`package.json:114`), and one screen already uses it (`entertainer.screen.js:18`, `useSafeAreaInsets`). This feature finishes the job.

### The request bundles two separate changes

The supplied snippet is the library's generic README example. Applied literally to `safearea.component.js` it would be wrong, because the two imports belong in different places:

| | Goes where | Why |
|---|---|---|
| `SafeAreaProvider` | **`App.js`, once, at the root** | It is a context provider. Putting it inside `safearea.component.js` would mount a *new* provider per screen — 38 of them — each re-measuring insets. |
| `SafeAreaView` | **inside `safearea.component.js`** | Straight swap for the deprecated import. |

Separating them is the most useful thing this plan does. They are also independently shippable: the provider can land first with zero visual change.

### Scope is larger than the one file named

`safearea.component.js` is used by **26 files / 38 call sites**. But a survey turned up a second, parallel pattern: **10 more files import RN's `SafeAreaView` directly**, bypassing the wrapper entirely.

```
src/screens/home.screen.js                                src/screens/posts/posts.screen.js
src/screens/posts/postDetail.screen.js                    src/screens/posts/post_card/postCard.component.js
src/screens/posts/postSearch.screen.js                    src/screens/posts/post_entry/postEntry.screen.js
src/screens/posts/postDetailMarketplace.screen.js         src/screens/posts/post_entry/postEntrySelect.screen.js
src/screens/profile/profile.screen.js                     src/screens/posts/post_entry/postEntryCategorySelect.screen.js
```

Every one resolves to `react-native`. Migrating only the named component would leave the deprecated import in the tree and the migration half-done.

### A latent bug this surfaces

RN's `SafeAreaView` **does nothing on Android** — it renders a plain `View`. `safearea.component.js` compensates by hand:

```js
${Platform.OS === "android" ? `padding-top: ${StatusBar.currentHeight}px;` : ""}
```

The 10 direct-import files never got that compensation. **On Android those ten screens have had no top inset at all.** Where a navigator header covers the gap this is invisible; on headerless screens it is content under the status bar. This is pre-existing, not a regression from this work, and the migration fixes it as a side effect.

## Technical Context

**Platform**: React Native 0.81.5, Expo SDK 54, Hermes, New Architecture / Fabric enabled
**Navigation**: React Navigation 7 (`007`), `@react-navigation/native-stack` 7.18.10
**Library**: `react-native-safe-area-context@5.6.2`, already installed and already used once
**Testing**: Jest (27 tests, pure logic). No component or visual-regression harness. **All verification of this feature is manual, on device, on both platforms.**

**Repo gates that must stay green**: `npm test`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`.

**Style constraint**: the snippet's `style={{ flex: 1 }}` is an inline style literal. This repo finished a no-inline-styling pass (commit `2ce9948`) and enforces `check:styles`. The implementation must use `StyleSheet.create`, not the inline form from the README.

### NEEDS CLARIFICATION

1. **Which edges by default?** RN's `SafeAreaView` applied all four. The new one does too, but *actually works on Android now*. Keeping the default changes Android layout on every migrated screen. Resolved in `research.md` R5 — **needs a device decision**, not an assumption.
2. **Android bottom inset.** The single highest-risk behaviour change. Today Android gets top padding only; after migration it gets the gesture-bar inset at the bottom as well. Screens with bottom-anchored buttons will move. See R5.
3. **Device availability.** `006` and `007` both stalled because no Android device was available (`specs/006-android-navigation-lag/follow-ups.md`: "no code written. That is the correct outcome so far."). This feature is *entirely* visual. If no device is available, implementation must stop after Phase A.

## Constitution Check

`.specify/memory/constitution.md` **is an unfilled template** — every principle is still a `[PRINCIPLE_N_NAME]` placeholder. There are no ratified principles to gate against, so this section cannot be evaluated as intended.

Falling back to the constraints this repo actually enforces:

| Gate | Status |
|---|---|
| `npm test` green | Must hold — no logic touched, expect no change |
| `check:styles` | **At risk** — the snippet's inline style would fail it. Mitigated by using StyleSheet. |
| `check:screen-props` | Unaffected |
| `check:animation` | Unaffected |
| `audit:lists` | Unaffected |
| No new inline styles (`2ce9948`) | Must hold |
| Prefer removing `styled-components` where static (`009` continues the direction set in `map.screen.js`) | Advisory |

**Recommendation**: fill in the constitution, or delete it. A template full of placeholders makes every future `/speckit-plan` run report a meaningless gate.

## Project Structure

### Documentation (this feature)

```
specs/009-safe-area-context/
├── plan.md              # this file
├── research.md          # R1-R8, the mechanism findings
├── data-model.md        # the SafeArea prop contract
├── contracts/
│   └── safe-area.md     # component contract + edge semantics
└── quickstart.md        # device validation script
```

### Source Code

```
App.js                                  # + SafeAreaProvider, initialWindowMetrics
src/components/safearea.component.js    # RN SafeAreaView -> safe-area-context, drop styled-components
src/screens/**                          # 10 files: replace direct RN SafeAreaView imports
```

## Phased Approach

The phases are ordered so that risk rises monotonically and each can ship alone.

### Phase A — mount the provider (zero visual change)

Add `SafeAreaProvider` to `App.js` wrapping the tree, seeded with `initialWindowMetrics`.

This is safe today because a provider *already exists further down*: `StackView` and `NativeStackView` both render `SafeAreaProviderCompat` (`@react-navigation/elements`), which is why `entertainer.screen.js`'s `useSafeAreaInsets` works at all. `SafeAreaProviderCompat` checks `SafeAreaInsetsContext` and does not double-mount when a provider is already above it — so adding one at the root makes the existing nested one a no-op rather than a conflict.

What it buys: insets become available *outside* the navigators too — `Toast`, `ConfirmDialogHost` and the pre-navigation splash currently render with no provider above them — and `initialWindowMetrics` removes the one-frame zero-inset flash on cold start.

### Phase B — swap the shared component

Rewrite `safearea.component.js` to use `SafeAreaView` from the library. Drops the `styled-components` wrapper and the manual `StatusBar.currentHeight` arithmetic in one move. 26 files inherit the change with no edit of their own.

Also removes dead code: `styles.default` is `{}` and has always been a no-op in `style={[styles.default, style]}`.

### Phase C — the 10 direct importers

Point them at the shared `SafeArea` component (preferred — one pattern in the codebase) or at the library's `SafeAreaView`. This is where the Android top inset appears on screens that never had one, so it is the phase most likely to need per-screen layout adjustment.

### Phase D — lock it in

Add a lint rule banning `SafeAreaView` from `react-native`, in the shape of the existing `no-restricted-imports` block in `.eslintrc.json` that already bans `Animated` and `InteractionManager` from `002`. Without this the deprecated import creeps back.

## Complexity Tracking

| Risk | Severity | Mitigation |
|---|---|---|
| Android bottom inset shifts layout on ~36 screens | **High** | Phase C is per-screen and device-verified; `edges` prop can pin behaviour to today's if needed |
| No device available | **High** | Stop after Phase A, as `006`/`007` correctly did |
| Double provider | Low | Verified: `SafeAreaProviderCompat` no-ops under an existing provider |
| `pointerEvents` regression | Low | Only `map.screen.js:457` uses it (`box-none`); contract test in quickstart |
| Absolute-positioned SafeArea | Medium | `map.screen.js:457` uses `position: absolute` + `height: 100%`; padding semantics differ — explicit check |

## Out of Scope

- Converting the remaining `styled-components` usages elsewhere in the app
- `react-native-screens` / edge-to-edge display mode
- Any change to navigator header inset handling (owned by `007`)
