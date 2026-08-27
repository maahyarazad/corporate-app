# Phase 0 Research: Animated → Reanimated Migration

All items below were resolved against the installed packages and the actual source tree.
No `NEEDS CLARIFICATION` remains.

---

## R1 — Which Reanimated major is installed, and does it change the migration target?

**Decision**: Target the Reanimated **4** API surface.

**Rationale**: `node_modules/react-native-reanimated/package.json` reports **4.1.7**
(`package.json` declares `~4.1.1`). `react-native-worklets@0.5.1` is installed alongside it,
which is the Reanimated 4 architecture — worklets were split into their own package.

**Consequences for this migration**:
- Reanimated 4 requires the **New Architecture (Fabric)**. This must be confirmed before any
  conversion work (task T-00) — if the app is still on the old architecture the existing
  Reanimated components are already in an unsupported configuration.
- `Extrapolate` is the deprecated spelling; Reanimated 4 uses **`Extrapolation`**. Both
  `slideshowV2.component.js` and `hotpicks.component.js` import the old name. Fix while touching.
- CSS-style animations and `"worklet"`-free `useAnimatedStyle` inference are available but are
  **not** used in this migration — staying on the classic shared-value API keeps the diff
  reviewable and matches the three components already written this way.

**Alternatives considered**: Pinning to the Reanimated 3 API for familiarity — rejected, the
installed runtime is 4 and 3-only APIs are already gone.

---

## R2 — Is the Babel configuration correct for Reanimated 4?

**Decision**: Change `babel.config.js` from `react-native-reanimated/plugin` to
`react-native-worklets/plugin`. Low priority, non-breaking.

**Rationale**: Verified directly —

```js
// node_modules/react-native-reanimated/plugin/index.js
const plugin = require('react-native-worklets/plugin');
module.exports = plugin;
```

The current config therefore functions correctly; this is a hygiene change to the canonical
name, not a bug fix. It stays in Phase A so the foundation is unambiguous, but nothing is
blocked on it.

**Also confirmed**: the Reanimated plugin is listed **last** in the `plugins` array, which is
the required position. `env.production` adds `transform-remove-console`, which does not
interact with worklet transformation.

**Alternatives considered**: Leaving it as-is — defensible, but the alias may be dropped in
Reanimated 5 and the rename costs one line.

---

## R3 — Where is `InteractionManager` used?

**Decision**: Nowhere. Convert the requirement from *migration* to *prevention*.

**Rationale**: `grep -rn "InteractionManager" --include="*.js" --include="*.jsx"` over the repo
(excluding `node_modules`) returns **zero matches**. The user's instruction to avoid it is
already satisfied; the risk is reintroduction, typically as a `runAfterInteractions` wrapper
around navigation or data fetching.

**Implementation**: a `npm run check:animation` grep gate (T-05a) that fails on any
`InteractionManager` reference or any `Animated` imported from `react-native`, plus ESLint
`no-restricted-imports`/`no-restricted-syntax` rules once the lint config is repaired (T-05b).
The grep gate leads because **ESLint does not currently run at all in this repo** — see R6. This
guardrail is the durable deliverable for the InteractionManager half of the request.

**Alternatives considered**: ESLint alone — rejected, it is broken today and fixing it is a
bigger job than the guardrail. Doing nothing, since there are zero usages — rejected, the user
asked for the constraint to hold going forward, not just today.

---

## R4 — How should each legacy pattern map onto Reanimated?

**Decision**: Five mappings cover all eighteen files.

| Legacy | Reanimated 4 |
|---|---|
| `useRef(new Animated.Value(v)).current` | `useSharedValue(v)` |
| `Animated.timing(av, {toValue, duration, easing}).start(cb)` | `av.value = withTiming(to, {duration, easing}, cb)` |
| `Animated.spring(av, {toValue, speed})` | `av.value = withSpring(to, {damping, stiffness})` — see R5 |
| `Animated.sequence([...])` | `withSequence(...)` |
| `Animated.loop(Animated.sequence([...]))` | `withRepeat(withSequence(...), -1, true)` |
| `Animated.delay(n)` | `withDelay(n, ...)` |
| `av.interpolate({inputRange, outputRange, extrapolate:'clamp'})` | `interpolate(av.value, inputRange, outputRange, Extrapolation.CLAMP)` inside `useAnimatedStyle` |
| `Animated.event([{nativeEvent:{contentOffset:{y: av}}}])` | `useAnimatedScrollHandler(({contentOffset}) => { av.value = contentOffset.y })` |
| `<Animated.View>` from `react-native` | `<Animated.View>` from `react-native-reanimated` |
| `Animated.FlatList` from `react-native` | `Animated.FlatList` from `react-native-reanimated` |

**Rationale**: These are the documented one-to-one equivalents and match the style already in
`slideshowV2.component.js` and `hotpicks.component.js`, so the codebase converges on one idiom.

**Callback note**: `Animated.*.start(cb)` fires `cb` on the JS thread. The Reanimated equivalent
is the third argument to `withTiming`/`withSpring`, which runs **on the UI thread** — any state
setter inside it must be wrapped in `runOnJS`. Three call sites do exactly this
(`offerList.collapse`, `requestapproval.closeCamera`, `postCardUpload`) and will break silently
if `runOnJS` is omitted. This is the single most likely source of migration bugs.

---

## R5 — `Animated.spring({speed})` has no Reanimated equivalent. What replaces it?

**Decision**: Convert to `withSpring({ damping, stiffness })` and tune per call site against the
current feel, rather than attempting a numeric formula.

**Rationale**: Legacy `Animated.spring` accepts either a `speed`/`bounciness` pair or a
`stiffness`/`damping`/`mass` triple. Reanimated only implements the physical model. There is no
exact algebraic conversion from `speed` — the legacy `speed`/`bounciness` model is a separate
parameterisation. Affected call sites:

- `animatedButton.js` — `speed: 200` (a prop default), press-scale to `0.9`
- `requestapproval.screen.js` — `speed: 40`, two calls, animating a container height

**Approach**: start from `{ damping: 15, stiffness: 150 }` for the fast button press and
`{ damping: 20, stiffness: 90 }` for the slower camera container, then compare side by side on
device. Because `speed` is a public prop of `AnimatedButton`, keep the prop name and map it
internally so no caller changes.

**Alternatives considered**: Replacing the springs with `withTiming` + easing — rejected, it
changes the feel of a component used across the app.

---

## R6 — What can the existing test and lint setup actually verify?

**Decision**: Rely on manual device verification for animation behaviour; use lint + grep as the
automated gate. Do not build a Reanimated Jest harness for this refactor.

**Rationale**:
- Jest exists (`npm test`) with exactly one suite, `src/utils/__tests__/pushDestination.test.js`,
  testing a pure module. There is no React Native testing-library setup and no
  `jest.config`/`jest` key in `package.json`.
- Reanimated ships a Jest mock, but asserting on animated style values requires
  `@testing-library/react-native` plus timer control — a meaningful new test-infrastructure
  project, out of scope for a refactor whose success criterion is "looks and feels identical".
- **`npm run lint` is broken outright** — see the verified failure below. It cannot serve as a
  gate without repair work.

**ESLint is currently broken — verified, not assumed.** `npx eslint src/components/skeleton.js`
fails before linting a single line:

```
ESLint couldn't find the config "prettier" to extend from.
The config "prettier" was referenced from .eslintrc.json
```

`.eslintrc.json` extends `["airbnb", "prettier", "prettier/react"]`, but `eslint-config-prettier`
is **not installed** (only `eslint-plugin-prettier` is). It also sets `"parser": "babel-eslint"`,
a package that is not installed either — the installed parser is `@babel/eslint-parser`. And
`.eslintignore` does not exclude `src/`, so nothing about the source tree is being checked today.

The lint script is therefore broken three ways: wrong target directory (`app/`), missing config
package, and a stale parser name. **Repairing ESLint is a prerequisite of the lint guardrail, and
is a larger job than the guardrail itself.** To avoid coupling the migration to a lint-config
repair project, the guardrail ships in two independent parts:

- **T-05a (blocking, cheap)**: a `npm run check:animation` script — two `grep` invocations that
  exit non-zero on any `Animated` import from `react-native` or any `InteractionManager`
  reference. Works today, no dependencies, wire it into CI.
- **T-05b (non-blocking, follow-up)**: repair `.eslintrc.json` (install `eslint-config-prettier`,
  switch `parser` to `@babel/eslint-parser`, drop the removed `prettier/react`, point the script
  at `src/`), then add the equivalent `no-restricted-imports` / `no-restricted-syntax` rules for
  editor-level feedback. Track separately; do not block the migration on it.

**What is automatable and will be enforced** (Phase E):
1. `npm run check:animation` passes — no `Animated` from `react-native`, no `InteractionManager`.
2. `npm test` still passes (regression check that the refactor broke no module graph).
3. Manual device sweep per `quickstart.md`.

Note `npm test` is also on thin ice: `jest-expo` is installed but there is **no** `jest.config.js`
and no `jest` key in `package.json`, so the preset is unconfigured. Confirm `npm test` actually
passes before starting (T-00) so a pre-existing failure is not blamed on this refactor.

**Alternatives considered**: Snapshot tests — they would capture the initial static style only
and give false confidence about the animation itself.

---

## R7 — Ordering: what sequence minimises risk?

**Decision**: Foundation → native-driver conversions → scroll handler → JS-driver conversions.

**Rationale**: The 14 `useNativeDriver: true` call sites already run off the JS thread, so
converting them changes implementation without changing runtime characteristics — pure,
low-risk, and they build team familiarity with the idiom. The four `useNativeDriver: false`
sites (`customTextInput`, `offerList`, `requestapproval`, `profRedeemHistory`) genuinely change
where the work happens and touch layout height and colour, which behave differently on the UI
thread. Doing those last means an interruption leaves the codebase in a coherent state.

`customTextInput.js` deserves particular care: it is the app's shared text input, its floating
label animates `transform` derived from `label.length`, and it is wrapped in
`forwardRef`/`useImperativeHandle`. A regression there is visible on every form in the app.

**Alternatives considered**: Highest-value-first (JS-driven sites) — rejected, it front-loads
all the risk before the idiom is established.
