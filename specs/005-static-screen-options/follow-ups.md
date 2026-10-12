# Findings — Static Screen Options & Allocation Hygiene

Status at the end of the first implementation pass on branch `005-static-screen-options`.

**No device measurement was taken**: there is no emulator or physical device in this environment, so
every device-verification task (T004, T009, T010, T019, T032, T033) is untouched. Per the plan's own
rule, that changes what can be claimed — see "What is not verified" at the bottom.

---

## What shipped

### US1 — the latent header crash (complete, statically verified)

`navigation.js` had `useContext(SectionContext)` inside the `Location View` `headerTitle` callback.
`@react-navigation/elements` `Header.js:208` invokes that callback as a plain function call, so the
hook ran inside `Header`'s render and belonged to `Header`'s fiber.

**Fixed** by extracting a `LocationViewTitle` component; the callback now only creates an element.
Gate G2 goes from one hit to `CLEAN`.

This is the highest-value item in the feature and it was found by accident, while looking for places
to apply an allocation rule.

### US3 — the requested hoist (code complete, **not** accepted)

All 22 inline `options={{…}}` literals in `navigation.js` are now module-scope constants, except the
one deliberate survivor (`TransactionSummary`, whose `title` reads `i18n` from context).

- 4 blocks that were byte-identical to the existing `slideFromRight` now reference it.
- `Event Detail` / `Attend Guests` collapsed into `plainBlackHeader`.
- `marketplace-details` / `magazine-details` collapsed into `zurueckHeaderOptions`, removing two
  identical 14-line JSX headers.
- `post-select` was kept **separate** (`postSelectOptions`) — its inner `<View>` has no style, so its
  icon stacks above its label. Merging it would have changed its appearance.
- `LocationList` now uses the injected `onPress` instead of closing over `navigation`, which let
  `MainScreen` drop `useNavigation()` entirely.

**Code volume**: `navigation.js` went 713 → 722 total lines, but that is 633 → **576 code lines**
(−57) against 20 → 68 comment lines (+48). **SC-007 as literally written ("net line count
decreases") is not met**; the duplication it was proxying for did collapse.

### US4 — the overstated comment (complete)

`navigation.js:113` claimed the old inline options "threw away the logo subtree". `research.md` R4
could not substantiate it, and the comment is now corrected in place: React reconciles by element
type and position, so the subtree re-renders but does not remount. The comment now also credits
`keepPreviousScreenAttached` — which has a documented native mechanism — for the Entertainer jolt,
rather than the hoist.

---

## US2 — context values: **partially complete, and the scope was wrong**

### The plan under-counted the providers

`plan.md` and `spec.md` list **6** unmemoized providers, derived from grepping `value={{`. That grep
misses every provider that assigns to a local first. The real inventory is **12 providers, 10 of them
unmemoized**, and two of the six named in the plan are dead code:

| Provider | Shape | Mounted? | Status |
|---|---|---|---|
| `alert` | `const value = {…}` | yes | **fixed** (+ `useCallback` on `showAlert`) |
| `translation` | inline | yes | **fixed** |
| `app` | `const values = {…}` | yes | **fixed** |
| `section` | inline | yes | **fixed** |
| `location` | inline | yes | **fixed** (+ `useCallback` on `getEventsList`) |
| `upload` | `const contextValue = {…}` | yes | **fixed** (+ `useCallback` ×2) |
| `auth` (v1) | `useMemo` | yes, marked "to be removed" | already correct |
| `auth_v2` | `const values = {…}`, 22 entries | yes | **deferred — see below** |
| `post` | `const values = {…}`, 25 entries | yes | **deferred — see below** |
| `user_v2` | `const values = {…}`, 4 entries | yes | **deferred — see below** |
| `user` (v1) | inline | **no** — commented out in `App.js:68` | not touched (dead) |
| `socket` | inline | **no** — never mounted, zero consumers | not touched (dead) |

Two of the six the plan told me to fix (`user` v1, `socket`) are dead. `socket` has no consumers at
all. `user` v1 still has four importers (`profInfo.js`, `homenavigation.js`,
`updateMember.screen.js`, `contactUs.screen.js`) reading a context whose provider is commented out —
they get the default value. That is a pre-existing bug, outside this feature, and worth its own look.

### Why `auth_v2`, `post` and `user_v2` were deferred rather than memoized

These three publish values dominated by locally-defined functions — 22, 25 and 4 entries. Wrapping
the value in `useMemo` without first stabilising those functions produces a memo whose dependencies
change on every render: **a memo that never hits**. T017 explicitly forbids shipping that, and
contract C7's caveat says the same.

Making them hold would mean `useCallback` on roughly 44 functions across a 285-line auth provider and
a 613-line post provider — the token-refresh path and the entire feed — with **one unrelated test in
the repo**. That is a different piece of work from "add `useMemo` to a provider", and it was not
requested. It is deferred deliberately, not missed.

### The dependency chain — the real finding

While auditing (T017) I traced why the memos that *were* applied cannot currently hit:

```
useRequest()  ->  returns httpRequest, NOT useCallback'd  (hooks/useRequest.js:31)
                        |
auth_v2 value  ->  unmemoized, so useAuth() returns a new object every render
                        |
                        +-> user_v2 (accessToken, authorize, …) -> syncUserInfo unstable
                        +-> upload   (submittedCard)             -> uploadCard  unstable
                        +-> location (via useUser -> userData)   -> getEventsList unstable
```

**So `location` and `upload` now carry correct memos that cannot yet hit.** They were kept, not
reverted: they are correct, they cost one deps comparison, and they become effective the moment the
chain above is fixed. This is recorded here as T017 requires, rather than left to look like a win.

`section`, `translation`, `app` and `alert` depend only on state, setters, module singletons and a
`useCallback`'d function, so those four are **effective today**.

**The keystone is `auth_v2`.** Until its value is stable, memoizing anything downstream of `useAuth()`
is theatre. That is the single highest-value next action for US2, and it should be its own feature
with its own test plan given what it touches.

### One extra defect fixed in passing

`translation.context.js:52` called `i18n.onChange(...)` **in the render body**, pushing a new callback
onto a module-level singleton's listener array on every render — an unbounded leak outliving the
provider. Now registered once in a `[]` effect. Same class as the unbounded-`Set` leak in
`004-android-performance`, found in a file I was already editing.

---

## T035 — ESLint enforcement: recommended, verified, not committed

`eslint-plugin-react-hooks` is **already installed** but is not in `.eslintrc.json`'s `plugins` array,
so `rules-of-hooks` never runs. Enabling it costs no new dependency.

Verified empirically rather than assumed — running the rule against a reproduction of the exact D1
pattern:

```
5:30  error  React Hook "useContext" is called in function "headerTitle" that is neither
             a React function component nor a custom React Hook function.
             react-hooks/rules-of-hooks
```

**It would have caught D1 on the first lint run.** Recommendation:

```jsonc
"plugins": ["react", "react-hooks", "jsx-a11y", "import", "prettier"],
"rules": {
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn"   // warn: this codebase has many stale deps arrays
}
```

**Not committed**, per T035 and the plan's commitment not to smuggle in tooling changes. Note the repo
already has precedent for exactly this kind of guardrail — the `no-restricted-imports` rule banning
`Animated`/`InteractionManager`, added by `002-reanimated-migration`.

---

## What is not verified

| Gate | Result |
|---|---|
| G1 — inline options | **1** (`TransactionSummary` only) ✓ |
| G2 — hooks in header callbacks | **CLEAN** ✓ |
| G3 — unmemoized provider values | **partial** — 6 of 10 fixed, 3 deferred with reason, 1 dead |
| G4 — `useNavigation` in `navigation.js` | **none** ✓ |
| `npx jest` | 27/27 pass ✓ (exercises none of this code) |
| Babel parse of every edited file | OK ✓ |
| V2–V5 device walk | **NOT RUN — no device available** |

**US3 must not be marked accepted.** Its acceptance criterion is FR-009 — every screen visually and
behaviourally identical — and the only evidence for that is the V4 walk against "before" screenshots
that were never captured. The code is on the branch and statically clean; it is not confirmed.

The single highest-risk unverified item is the **`LocationList` back button** (T032): it swaps a
`navigation.goBack()` closure for the stack's injected `onPress`. The injection was verified in
`node_modules` (`HeaderSegment.js:121`), so it should be equivalent — but "should be" is not "was
seen to be".

**No performance figure is claimed.** None was measured, and per `research.md` R4 none is expected
from the hoist alone.

---

## Re-check (2026-08-30) — static re-verification of the remaining work

Gates re-run against the working tree; all four match the values recorded in `baseline.md`.
G1 `1` (survivor confirmed at `navigation.js:513`, `TransactionSummary`), G2 `CLEAN`, G3a `2` /
G3b `3` (the four dead/deferred providers), G4 none. `npx jest` 27/27. `navigation.js` parses.

### Field-for-field swap audit — a partial stand-in for V4

Every one of the 22 converted call sites was diffed against the literal it replaced. All are
identical field-for-field, including the two that carry the real mis-mapping risk:

- `notifications`, `AvailOffer`, `AuthEditProfile`, `Camera` → `slideFromRight`
  (`headerShown:false` / `forHorizontalIOS` / `horizontal` / `200`) — matches all four originals.
- `post-search` → `revealFromBottom` (`forVerticalIOS`) — the vertical/horizontal split the
  quickstart calls "the likeliest place to mis-map" is mapped correctly.
- `Event Detail` / `Attend Guests` → `plainBlackHeader`; the `locationViewOptions` spread reproduces
  `Location View`'s seven inherited fields exactly.
- `post-select` keeps its own unstyled `<View>` (`renderPostSelectBack`) and is **not** merged into
  `zurueckHeaderOptions`.
- `renderZurueckBack` / `renderPostSelectBack` keep `onPress={goback}` verbatim — `goback` is a
  module-level export (`src/navigation/navigate.js:13`), unchanged before and after.

**This narrows the V4 risk but does not close it.** It proves the *values* are unchanged; it cannot
prove the rendered result is, and it says nothing about T032 (the `LocationList` injected `onPress`),
which is a genuine behavioural swap and still the highest-risk unverified item.

### Correction to "no device in this environment"

An Android SDK, a prebuilt `android/` project and an AVD (`Medium_Phone_API_36`) are present;
`adb devices` reports none attached, but one can be started. The device walk is therefore *blocked
on being run*, not impossible. What it still needs and this environment does not supply: sign-in
credentials and seeded content (an offer to avail, marketplace/magazine posts, a redemption to
complete) for the 13-screen V4 table. A boot-only check (V2) needs neither and would close the
module-load / forward-reference failure class on its own.
