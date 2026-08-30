# Contract — Navigation Screen Options

**Applies to**: every `options` / `screenOptions` prop in `navigation.js` and every
`navigation.setOptions()` call under `src/screens/`.

**Status**: proposed with this feature. Modelled on
`specs/004-android-performance/contracts/performance-budget.md`, which distinguishes *correctness
rules* (always enforced) from *budgets* (measured). Everything here is a correctness rule — none of
it requires a device or a profiler to check, which is why it can be enforced in review from day one.

---

## C1 — No hooks inside a header render callback

`headerLeft`, `headerTitle`, `headerRight` and `headerBackground` are invoked as **plain function
calls** from inside `Header`'s render, not via `React.createElement`. Verified at
`@react-navigation/elements/lib/commonjs/Header/Header.js:159` (left/right) and `:208` (title).

A hook inside one of them therefore executes as part of `Header`'s render and belongs to `Header`'s
fiber. It is a Rules-of-Hooks violation whose failure mode is a **crash** — *"Rendered fewer hooks
than expected"* — the first time the same `Header` instance swaps a hook-calling callback for one
that does not call hooks. `Header.js:170` performs exactly that swap when a title changes between a
function and a string.

**Required**: the callback creates an element and nothing else. State lives in a component.

```js
// ✗ hook runs inside Header's render
headerTitle: () => {
  const { sectionTitle } = useContext(SectionContext);
  return <Label>{sectionTitle}</Label>;
}

// ✓ hook belongs to a component React owns
const LocationViewTitle = () => {
  const { sectionTitle } = useContext(SectionContext);
  return <Label>{sectionTitle}</Label>;
};
headerTitle: () => <LocationViewTitle />,
```

Current violations: `navigation.js:473`. Target: zero.

---

## C2 — Static options live at module scope

If an options object references no props, state, context, or hook result, it must be a module-level
`const`.

The test is **"does it depend on props or state?"**, not "does it reference anything outside
itself". Module-level imports — `theme`, `CardStyleInterpolators`, `goback`, a `require`d asset — are
fixed for the process lifetime and do not block hoisting.

**Not acceptable as substitutes:**

| Attempt | Why it fails |
|---|---|
| `useMemo` around the object | Correct but strictly worse than a constant: adds a hook, a deps array, and a per-render comparison to produce a value that never changes. |
| `useMemo` around `headerLeft` only | The enclosing `options={{…}}` literal is still new each render, so the descriptor still changes. Memoizes the leaf, leaves the branch. |
| `const opts = {…}` inside the component | An allocation with a name is still an allocation. Cf. `src/services/app/app.context.js:46`. |
| `options={() => ({…})}` | The function form is re-invoked on every render, so the object is rebuilt regardless. Use it for genuine `route.params` dependence, not to dodge this rule. |

---

## C3 — Hoist the whole graph, not just the top level

A module-scope constant containing a fresh nested literal is only half-hoisted. `headerStyle`,
`headerLeftContainerStyle`, and any `style` prop inside a `headerLeft` renderer are allocations too.

`entertainerScreenOptions` (`navigation.js:119-144`) is the reference: styles, asset, and renderer
are each their own constant.

---

## C4 — Prefer injected props over closing over `navigation`

A `headerLeft` that closes over `navigation` cannot leave its component. The stack injects
`onPress` (the navigator's own back action), `canGoBack`, `tintColor` and `label` — verified at
`@react-navigation/stack/lib/commonjs/views/Header/HeaderSegment.js:116-129`.

```js
// ✗ pins the object inside the component
headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} …/>

// ✓ hoistable
const renderBackArrow = ({ onPress }) => <TouchableOpacity onPress={onPress} …/>
```

`onPress` is `undefined` at the root of a stack (`canGoBack: false`), where `navigation.goBack()`
is also a no-op. Equivalent — but state it in review, because it reads like a regression.

**Version-bound**: `@react-navigation/stack@6.2.1`. These internals are not public API. Re-verify
`HeaderSegment.js` on any navigation upgrade; C4 is the first thing an upgrade can silently break.

---

## C5 — No duplicate option objects

Two screens wanting the same options share one constant. Field-for-field identical blocks must
collapse; blocks differing by even one field stay separate, or compose by spreading a constant **at
module scope** (never inside JSX, which rebuilds per render).

Current: 4 blocks duplicate `slideFromRight`; `Event Detail` / `Attend Guests` duplicate each other;
`marketplace-details` / `magazine-details` duplicate each other, including 14 lines of JSX.

**Do not over-merge.** `post-select` looks like the `Zuruck` pair and is not — its inner `<View>`
carries no style, so its layout differs. See `data-model.md` §2.

---

## C6 — `setOptions` from a screen is a stack re-render

`navigation.setOptions()` updates the screen's descriptor and re-renders the navigator, which
re-evaluates every sibling's `options` prop. A screen calling `setOptions` in an effect therefore
amplifies any inline options literal in that navigator.

**Required**: the value passed to `setOptions` obeys C1–C4. Callbacks passed to it should be stable —
hoisted if static, `useCallback`'d if they close over state.

Current callers: `entertainer.screen.js:362` (already addressed by `7a1b9f4`),
`location-list.screen.js:110`, `postDetail.screen.js:142`,
`registration.screen.js:83`, `registrationDetails.screen.js:102`.

> **Scope note**: `research.md` R4 examined and **rejected** the stronger claim — written into
> `navigation.js:113` — that this churn unmounts the header subtree. React reconciles by element type
> and position; the subtree re-renders, it does not remount. C6 is a waste-and-duplication rule. Do
> not cite it as a jank fix without a measurement.

---

## C7 — Context providers publish stable values

Same rule, one layer up, and the layer where it actually costs something: `useContext` has no
bail-out, so a new provider value re-renders **every** consumer unconditionally.

**Required**: `value` is `useMemo`'d with honest dependencies.
Reference implementation: `src/services/auth/auth.context.js`.

Current violations: `section:11`, `translation:59`, `socket:11`, `location:64`, `user:72`,
`app:46`.

**Caveat**: `useMemo` only helps if its dependencies are themselves stable. `useState` setters are;
a freshly-constructed object or handler in the same component is not. A `useMemo` over unstable deps
is the C2 mistake in a new costume — check per provider.

---

## Enforcement

No linter enforces this today. `quickstart.md` V1 provides grep gates for C1, C2 and C5, which is
enough for review.

The durable fix is an ESLint rule — `react-hooks/rules-of-hooks` already catches C1 if the callbacks
are recognised as such, and a `no-restricted-syntax` rule can catch C2. Deliberately **not** bundled
into this feature: it is a tooling change with its own configuration discussion, and this plan is
committed to not smuggling in scope. Recommended as the immediate follow-up.
