# Phase 1 Data Model — Shared Screen-Options Constants

There are no runtime entities in this feature: nothing is persisted, fetched, or transformed. The
"model" is the set of **module-scope constants** that replace the 22 inline `options={{…}}` literals
in `navigation.js`, plus the exact field sets that define each one.

Treating them as a model is not a formality. Two blocks that differ by one field are two different
constants; two that match field-for-field must collapse into one. The tables below are the authority
on which is which, so the implementation is a mechanical substitution rather than a judgement call
made 22 times.

Line numbers are as of commit `7a1b9f4`.

---

## 1. Existing constants (already correct — extend, do not redefine)

`navigation.js` already established this pattern. New work must reuse these, not shadow them.

| Constant | Line | Fields |
|---|---|---|
| `slideFromRight` | 92 | `headerShown:false`, `cardStyleInterpolator:forHorizontalIOS`, `gestureDirection:"horizontal"`, `gestureResponseDistance:200` |
| `noSwipeBack` | 100 | `gestureEnabled:false` |
| `keepPreviousScreenAttached` | 110 | `detachPreviousScreen:false` |
| `entertainerScreenOptions` | 137 | `headerShown:true`, `headerTitle:""`, `headerLeftContainerStyle`, `headerRightContainerStyle`, `headerLeft:renderEntertainerHeaderLeft` |

`entertainerScreenOptions` is the reference implementation for a constant that carries a
`headerLeft`: the renderer (`renderEntertainerHeaderLeft`, line 131) and its styles (lines 119, 125)
are themselves hoisted, so the whole graph is allocated once. New header constants follow that shape.

---

## 2. Constants to add

### `noHeader`

```js
const noHeader = { headerShown: false };
```

| Screen | Line | Navigator |
|---|---|---|
| `noconnection` | 81 | `TimeoutStack` |
| `post-tabs` | 252 | `OverlappingStack` |
| `Main` | 399 | `MainStack` |
| `Logout` | 411 | `MainStack` |
| `RequestApproval` | 529 | `ApprovalStack` |
| `Logout` | 554 | `ApprovalStack` |

Six sites. The smallest possible object, and the weakest case in the plan on allocation grounds —
justified by consistency, not by cost. Note `AuthStack` already passes `{ headerShown: false }` as a
`screenOptions` literal on the navigator itself (line 147); that one is a **navigator** prop, not a
screen prop, and should use the same constant.

### `revealFromBottom`

```js
const revealFromBottom = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};
```

| Screen | Line |
|---|---|
| `post-search` | 281 |

Currently one user, and `LocationList` (below) shares the same three motion fields with a header on
top. Named for what it does rather than where it is used, so the second caller does not have to
rename it.

> **Retained oddity**: `forVerticalIOS` with `gestureDirection: "horizontal"` — the card animates
> vertically but is dismissed with a horizontal swipe. That is what ships today on both screens. It
> looks like a mistake and is **deliberately preserved**: this feature's constraint is zero
> behavioural change, and "fix the gesture direction" is a product decision, not a refactor. Flagged
> here so the mismatch is a recorded choice rather than a copied accident.

### `modalNoHeader`

```js
const modalNoHeader = { presentation: "modal", headerShown: false };
```

| Screen | Line |
|---|---|
| `post-select-category` | 303 |

`post-entry` (269) is close but **not identical** — it adds `headerTintColor`, `headerTitleStyle`,
`headerLeftLabelVisible` alongside `headerShown:false`, which are inert while the header is hidden.
Kept as its own constant (`postEntryOptions`) rather than spreading `modalNoHeader`: deleting
dead-looking fields is a behavioural bet, and spreading to add three fields saves nothing.

### `plainBlackHeader`

```js
const plainBlackHeader = {
  headerShown: false,
  headerBackTitleVisible: false,
  headerTitleAlign: "left",
  headerTintColor: "black",
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};
```

| Screen | Line |
|---|---|
| `Event Detail` | 495 |
| `Attend Guests` | 509 |

Byte-identical to each other. `Location View` (468) is this **plus** a `headerTitle` and a
`headerStyle`, so it spreads this constant rather than restating it — see §4.

### `locationListOptions` — the screen from the original question

```js
const locationListBackStyle = { paddingLeft: 15 };

const renderBackArrow = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={locationListBackStyle}>
    <Ionicons name="arrow-back" size={24} color="black" />
  </TouchableOpacity>
);

const locationListOptions = {
  headerBackTitle: "",
  headerTitle: "",
  headerTintColor: "black",
  headerStyle: { shadowColor: "transparent" },
  headerLeft: renderBackArrow,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};
```

| Screen | Line |
|---|---|
| `LocationList` | 423 |

Three changes from the user's draft, all deliberate:

1. **`onPress` replaces `navigation.goBack()`** — the injection verified in `research.md` R2. This is
   the change that lets the object leave the component, and it is the only one with a behavioural
   surface (R2 documents the root-of-stack case and why it is equivalent).
2. **The `headerLeft` renderer is hoisted too**, matching `renderEntertainerHeaderLeft`. Left inline
   in the object it would still be allocated once — but as a named module function it is reusable by
   the `Zuruck` screens and greppable.
3. **`paddingLeft: 15` becomes a named constant.** The style object is a per-call allocation
   otherwise; the constant makes the whole element graph static.

`headerShown` is absent here, exactly as it is today — the header shows because `MainStack` has no
`screenOptions` hiding it. Preserved, not "corrected".

### `zurueckHeaderOptions`

```js
const zurueckRowStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 8,
};

const renderZurueckBack = () => (
  <TouchableOpacity onPress={goback}>
    <View style={zurueckRowStyle}>
      <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
      <Label>Zuruck</Label>
    </View>
  </TouchableOpacity>
);

const zurueckHeaderOptions = {
  headerShown: true,
  title: "",
  headerLeft: renderZurueckBack,
};
```

| Screen | Line | Relationship |
|---|---|---|
| `marketplace-details` | 334 | identical |
| `magazine-details` | 362 | identical |
| `post-select` | 312 | **near-duplicate — do not merge** |

`marketplace-details` and `magazine-details` are byte-identical, including the 14-line JSX. They
collapse to one constant.

`post-select` renders the same icon and label but its `<View>` has **no style prop**, so the icon and
text stack vertically instead of sitting in a row, and it carries `presentation: "modal"`. Merging it
would change its appearance. It gets its own constant (`postSelectOptions`) reusing nothing but the
imports. Recorded because the three blocks look interchangeable at a glance and are not.

These use the module-level `goback` helper (`src/navigation/navigate.js`), already imported at
`navigation.js:15` — so no `onPress` injection is needed and these were always hoistable.

### `postDetailOptions`

```js
const postDetailOptions = {
  headerTintColor: theme.colors.icons.active,
  headerTitleStyle: { color: "black" },
  headerLeftLabelVisible: false,
  headerTitle: "",
};
```

| Screen | Line |
|---|---|
| `post-detail` | 258 |

Reads `theme`, a module-level import (`navigation.js:57`) — not a hook, not state. Safe at module
scope. Worth stating: "reads an external value" and "depends on props or state" are different tests,
and only the second blocks hoisting.

---

## 3. Screens replaced by the existing `slideFromRight`

No new constant. These four are field-for-field identical to line 92 (`research.md` R3):

| Screen | Line | Navigator |
|---|---|---|
| `notifications` | 292 | `OverlappingStack` |
| `AvailOffer` | 446 | `MainStack` |
| `AuthEditProfile` | 534 | `ApprovalStack` |
| `Camera` | 544 | `ApprovalStack` |

---

## 4. Composite: `Location View`

The only screen needing both a spread and the D1 fix.

```js
const LocationViewTitle = () => {                      // a real component — see research.md R1
  const { sectionTitle } = useContext(SectionContext);
  return <Label size="title" weight="bold">{sectionTitle}</Label>;
};

const locationViewHeaderStyle = {
  borderColor: "black",
  shadowColor: "transparent",
  backgroundColor: "transparent",
};

const locationViewOptions = {
  ...plainBlackHeader,
  headerTitle: () => <LocationViewTitle />,
  headerStyle: locationViewHeaderStyle,
};
```

| Screen | Line |
|---|---|
| `Location View` | 468 |

The spread is evaluated **once at module load**, so the composition costs nothing at render time —
unlike a spread inside JSX, which would rebuild the object per render and defeat the entire exercise.

---

## 5. Deliberately left inline

| Screen | Line | Why |
|---|---|---|
| `TransactionSummary` | 457 | `title: i18n.t(…)` depends on context. `research.md` R6 — and a `useMemo` here would invalidate on exactly the renders it was meant to skip. |

One of 22. Worth an explicit row so a future reader knows it was considered, not missed.

---

## 6. Invariants

Checkable properties the result must satisfy. `quickstart.md` V1 greps for the first three.

| # | Invariant |
|---|---|
| I1 | No `options={{` remains in `navigation.js` except `TransactionSummary` (457) |
| I2 | No constant in §2 is defined inside a component function |
| I3 | No hook (`useContext`, `useState`, `use*`) appears inside a `headerLeft` / `headerTitle` / `headerRight` callback anywhere in the repo |
| I4 | Every screen's *effective* option set is field-for-field identical to before — the only intended runtime difference is `LocationList`'s back button using injected `onPress` (R2) |
| I5 | `MainScreen` no longer calls `useNavigation()` |
| I6 | Nested objects (`headerStyle`, container styles) are hoisted too — a constant containing a fresh literal is only half-hoisted |
