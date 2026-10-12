# Phase 0 Research — Static Screen Options & Allocation Hygiene

Every claim below that concerns library behaviour was checked against the **installed**
`node_modules`, at the version this project pins. React Navigation's header internals are not part
of its public API and have changed across 6.x patch releases, so recalled knowledge was not treated
as sufficient.

---

## R1 — A hook inside `headerTitle` is a real Rules-of-Hooks violation, not a stylistic one

**Decision**: Extract `Location View`'s `headerTitle` into a module-scope component and render it as
one.

**Rationale**

`navigation.js:473` calls `useContext(SectionContext)` inside the `headerTitle` callback. Whether
this is legal turns entirely on *how the header invokes it*. Two possibilities:

| If the header does… | Then the callback is… | Hooks legal? |
|---|---|---|
| `React.createElement(headerTitle, props)` | a component | Yes |
| `headerTitle(props)` | a plain function call, inlined into the caller's render | **No** |

`@react-navigation/elements/lib/commonjs/Header/Header.js:208` does the second:

```js
}, headerTitle({
  …
}))
```

So the `useContext` runs as part of **`Header`'s own render**, and `Header` — not the callback —
becomes the `SectionContext` subscriber. The screen "works" only by accident of `Header` calling it
once, unconditionally, on every render.

The failure is reachable. `Header.js:170`:

```js
const headerTitle = typeof customTitle !== 'function'
  ? props => React.createElement(HeaderTitle, props)
  : customTitle;
```

A string `headerTitle` selects the first branch, a function selects the second. If the same `Header`
instance ever sees the title switch from this function to a string, React sees a render that called
one fewer hook and throws *"Rendered fewer hooks than expected. This may be caused by an accidental
early return statement."* — a crash, from a header title.

That is not hypothetical in this codebase: `src/screens/posts/postDetail.screen.js:142` already
calls `navigation.setOptions({ headerTitle: label })` with a string. A different screen today, but
the same one-line change away on this one.

**Shape of the fix**

```js
// module scope — a real component, so the hook is its own
const LocationViewTitle = () => {
  const { sectionTitle } = useContext(SectionContext);
  return <Label size="title" weight="bold">{sectionTitle}</Label>;
};

// in the options object
headerTitle: () => <LocationViewTitle />,
```

The callback stays a callback (that is the API), but it now only *creates an element*. The hook
moves inside a component that React owns, gets its own fiber, and subscribes the title — not the
whole header — to `SectionContext`.

**Alternatives considered**

- *Leave it; it works.* Rejected: it is a latent crash with a one-line trigger already present
  elsewhere in the repo, and it makes the entire `Header` re-render on every `sectionTitle` change.
- *Pass the title down via `setOptions` from the screen.* Rejected as a larger behavioural change
  than the defect warrants; it also re-introduces the D3 `setOptions` churn on a screen that does
  not currently have it.

---

## R2 — `headerLeft` receives `onPress` in stack 6.2.1 — verified, not assumed

**Decision**: Drop the `navigation.goBack()` closure and use the injected `onPress`, which is what
makes module scope possible.

**Rationale**

The user's proposed constant depends on `headerLeft` being handed an `onPress`. If it were not, the
object could not leave the component, because it would need the `navigation` from `useNavigation()`.

The type declares it optional (`onPress?: () => void` in
`@react-navigation/elements/lib/typescript/src/types.d.ts:168`), so the type alone is not proof. The
runtime wiring is, at
`@react-navigation/stack/lib/commonjs/views/Header/HeaderSegment.js:116-129`:

```js
const headerLeft = left ? props => left({ ...props,
  backImage: headerBackImage,
  …
  onPress: onGoBack,
  …
  canGoBack: Boolean(onGoBack)
}) : undefined;
```

`onPress` is injected unconditionally, and it is `onGoBack` — the navigator's own back action, which
is what `navigation.goBack()` invokes anyway.

**The one behavioural difference, and why it does not matter here**

`onGoBack` is `undefined` when there is nothing to go back to (hence `canGoBack: Boolean(onGoBack)`
on the next line). On a root screen the custom button would render with `onPress={undefined}` and do
nothing when tapped. The current code would call `navigation.goBack()`, which on a root screen also
does nothing. **Equivalent.** And neither `LocationList` nor the `Zuruck` screens are ever the root
of their stack.

Worth stating explicitly because it is the sort of difference that looks like a regression in review
and is not.

**Alternatives considered**

- *`options={({ navigation }) => ({ … })}`.* React Navigation supports a function form that receives
  `navigation`. Rejected as the primary approach: the function is **called on every render anyway**,
  so it re-creates the object exactly like the inline literal — it solves the closure problem
  without solving the allocation problem. Genuinely useful only where the options depend on route
  params. Kept in reserve for R6.
- *Keep `useNavigation()` and `useMemo` the whole object.* Correct but strictly worse than a
  constant: same result, plus a hook, a deps array, and a per-render comparison.

---

## R3 — Four inline blocks are byte-identical to the existing `slideFromRight`

**Decision**: Replace them with the constant before writing any new constants.

**Rationale**

`slideFromRight` already exists at `navigation.js:92`:

```js
{ headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200 }
```

Four screens re-declare exactly that, field for field:

| Screen | Line | Navigator |
|---|---|---|
| `notifications` | ~292 | `OverlappingStack` |
| `AvailOffer` | ~446 | `MainStack` |
| `AuthEditProfile` | ~534 | `ApprovalStack` |
| `Camera` | ~544 | `ApprovalStack` |

Sixteen other screens already use `options={slideFromRight}`. These four are simply the ones the
earlier pass (commit `30e1705`, which hoisted the `AuthStack` options) did not reach — it stopped at
one navigator.

This is the cheapest and least risky item in the whole plan: a literal replaced by a constant with
identical contents, verifiable by eye.

**Alternatives considered**: none needed.

---

## R4 — A claim in the existing code comment that I checked and could not confirm

**Decision**: Do not repeat the claim. Correct the comment while touching the file.

**Rationale**

`navigation.js:113-117`, added by commit `7a1b9f4`, says of the old inline Entertainer options:

> "…which handed the header a fresh `headerLeft` each time and **threw away the logo subtree with
> it**."

The first half is true. **The second half does not follow, and I could not find a mechanism for
it.** `headerLeft` returns `<View><Image/></View>`. A new function identity produces a new *element*
each render, but React reconciles by element **type and position**, both unchanged. So the subtree
**re-renders**; it is not unmounted, and the `Image` is not re-decoded.

This matters because it changes what the Entertainer fix should be credited with. Two changes landed
in `7a1b9f4`: the options hoist *and* `keepPreviousScreenAttached` (`detachPreviousScreen: false`,
`navigation.js:110`). The latter has a documented native mechanism — react-native-screens destroying
and rebuilding the fragment's view tree, which genuinely does re-measure a `ViewPager2`. **That is
almost certainly what fixed the visible jolt.** The options hoist rode along.

**Consequence for this plan**: D3 (`LocationList`) is still worth fixing — the wasted re-render is
real, and the duplication and the closure are real — but it is presented as hygiene, not as "fixes a
jank bug". Anyone hoping the `LocationList` hoist alone will fix a visible glitch should read this
item first.

Recorded here rather than silently dropped, so the next person does not re-derive it — and so the
overstated comment does not get copied into the new constants.

**Alternatives considered**: *Trust the comment.* Rejected — it is the kind of plausible claim that
becomes folklore, and the plan's credibility rests on not doing that.

---

## R5 — Unmemoized context values are the larger allocation problem

**Decision**: `useMemo` the provider values, following `auth.context.js`.

**Rationale**

Six providers publish a new object identity on every render:

| File | Line | Shape |
|---|---|---|
| `src/services/section/section.context.js` | 11 | `value={{ sectionTitle, setSectionTitle, searchData, setSearchData }}` |
| `src/services/translation/translation.context.js` | 59 | `value={{ i18n, lang, setLang }}` |
| `src/services/socket/socket.context.js` | 11 | `value={{ socket }}` |
| `src/services/location/location.context.js` | 64 | inline literal |
| `src/services/user/user.context.js` | 72 | inline literal |
| `src/services/app/app.context.js` | 46 | `const values = { isOutdated, appState }` |

`app.context.js` is worth calling out: assigning to a `const` first *looks* like it avoids the inline
literal, but it is rebuilt on every render just the same. Naming an allocation does not memoize it.

Why this outranks the navigator work: a new context value re-renders **every consumer**,
unconditionally — `useContext` has no bail-out and no comparison. That is a fan-out across the app,
where the options literal is one object in one component. It is the same "wrong memo boundary" error
the user identified, applied one layer up where it actually costs something.

`src/services/auth/auth.context.js` already does this correctly and is the pattern to copy — no new
convention to invent.

**Caveat to check during implementation**: `useMemo` is only a win if the dependencies are genuinely
stable. `useState` setters are; a `socket` instance and an `i18n` object need a look. If a provider
rebuilds its own dependency every render, the `useMemo` is a no-op with extra steps — the same trap
as memoizing `headerLeft` while leaving `options` inline. Per-provider, not blanket.

**Alternatives considered**

- *Split contexts into value/dispatch pairs.* The standard next step, and it would help more. Out of
  scope: it changes every consumer's import surface. Note it as a follow-up.
- *Leave them.* Rejected — this is the one item in the plan with a plausible claim to being
  user-visible, and the fix is three lines per file.

---

## R6 — `TransactionSummary` is genuinely dynamic; leaving it inline is the right answer

**Decision**: Leave it as an inline literal. Do not `useMemo` it. Add a comment saying why.

**Rationale**

`navigation.js:457`:

```js
options={{
  headerShown: true,
  title: i18n.t("redemption-success.transaction-summary"),
  gestureEnabled: false,
  headerBackTitleVisible: false,
}}
```

`i18n.t(…)` reads context, so this cannot be a module constant — that is exactly the boundary the
rule draws, and it is the one screen in the file on the wrong side of it.

`useMemo(() => ({…}), [i18n])` would be *correct*, and it would still be the wrong call: `MainScreen`
re-renders when `TranslationContext` changes, which is precisely when `i18n` changes, which is
precisely when the memo invalidates. It would rebuild the object on every render it was supposed to
skip, plus a deps comparison. **A memo whose dependency changes exactly when its component
re-renders is pure overhead** — the same lesson as the `headerLeft` question, arrived at from the
other direction.

The `gestureEnabled: false` field duplicates the existing `noSwipeBack` constant
(`navigation.js:100`), but spreading a constant to save one field would obscure more than it saves.
Left alone deliberately.

**Alternatives considered**

- *Function form `options={({ navigation }) => …}`.* No benefit here — no route params are needed,
  and it is re-invoked per render regardless.
- *Move the translation into the screen via `setOptions`.* Rejected: it would add exactly the
  `setOptions` churn that D3 is about removing, to fix a non-problem.

---

## R7 — Scope boundary: why 832 inline styles are out

**Decision**: Navigation options and context values only. No app-wide `StyleSheet` migration.

**Rationale**

"Optimize the entire application" could reasonably extend the rule to every inline object in the
codebase. Measured: **832 `style={{` sites across 167 files**, concentrated in
`requestapproval.screen.js` (28), `mediaUploader.component.js` (24), `availOffer.screen.js` (23),
`map.screen.js` (23), `locationlist.component.js` (23).

Three reasons to stop short:

1. **The cost is not where the count is.** RN's style prop takes an object or an array and diffs it
   shallowly. A new literal per render on a screen that renders twice is free in any sense that
   matters. It is only real when it defeats a `React.memo` boundary or repeats per row in a long
   list.
2. **The risk is real and the payoff is unmeasured.** 832 edits across 167 files, with **one** test
   file in the repo (`pushDestination.test.js`, pure logic) and no component-render harness. There is
   no mechanism that would catch a mistyped style key before a user does.
3. **The valuable subset belongs elsewhere.** List-row styles are the ones that matter, and
   `specs/003-flatlist-optimization` already owns that surface. Splitting it across two features
   would duplicate the review.

This is the same discipline `specs/004-android-performance/follow-ups.md` arrived at the hard way:
ship changes that are defects on their own terms; do not ship a large diff on a hunch.

**Alternatives considered**

- *Do all 832.* Rejected, above.
- *Do the top 5 files.* Rejected as arbitrary — "most inline styles" is not the same as "hottest
  render path", and picking by grep count would be optimizing the metric rather than the app.
- *Add an ESLint rule to stop new ones.* Genuinely attractive and cheap, but it is a tooling change
  with its own configuration discussion. **Noted as the recommended follow-up**, not smuggled in
  here.
