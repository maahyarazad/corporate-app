# Quickstart — Verifying Static Screen Options

**Read this first.** This feature changes how screen options are *allocated*, not what they contain.
The intended user-visible difference is **none**. So verification is not "does it feel faster" — it
is "did anything change that should not have".

There is exactly one automated test in this repo (`src/utils/__tests__/pushDestination.test.js`, pure
logic, unrelated). There is no component-render harness. **The device walk in V2–V5 is the real test
suite for this feature**, not an optional extra.

## Prerequisites

```bash
npm install          # if the tree is cold
```

For V2–V5: an iOS simulator, Android emulator, or a physical device with Expo Go / a dev build.
V6 additionally wants React DevTools.

> **Windows note**: `npm test` is defined as `NODE_ENV=test jest`, which is POSIX-only and fails in
> PowerShell. Use `npx jest`, or run it from Git Bash.

---

## V1 — Static gates (seconds, run after every commit)

These are greps, not tests, but they are the only thing that mechanically enforces the contract.
Run from the repo root in Git Bash.

**G1 — inline options eliminated** (contract C2)

```bash
grep -c "options={{" navigation.js
```

| | Expected |
|---|---|
| Before | `22` |
| After | `1` — `TransactionSummary` only (`data-model.md` §5) |

Then confirm the survivor is the expected one:

```bash
grep -n "options={{" navigation.js
```

Must print a single line at the `TransactionSummary` screen. **Any other survivor is a miss**, not a
judgement call — every other block is accounted for in `data-model.md`.

**G2 — no hooks in header callbacks** (contract C1, the D1 defect)

```bash
grep -rn -A5 -E "header(Left|Right|Title|Background) *: *\(?[^)]*\)? *=> *\{" \
  navigation.js src/ --include=*.js | grep -E "use[A-Z][a-zA-Z]*\(" || echo "CLEAN"
```

| | Expected |
|---|---|
| Before | one hit — `navigation.js:474`, `useContext(SectionContext)` |
| After | `CLEAN` |

**G3 — context provider values memoized** (contract C7)

```bash
grep -rn "value={{" src/services/ --include=*.js | wc -l
grep -rn "const values = {" src/services/ --include=*.js
```

| | Expected |
|---|---|
| Before | `5`, plus one `const values = {` in `app.context.js` |
| After | `0` and no output |

**G4 — no stale `useNavigation` in `MainScreen`** (invariant I5)

```bash
grep -n "useNavigation" navigation.js
```

After Stage 2 the `MainScreen` call site is gone. If the import is now unused, remove it too.

**G5 — nothing else regressed**

```bash
npx jest
```

Expect the existing suite to pass. It exercises none of this code; it is a smoke check that the
module graph still loads.

---

## V2 — App boots and the shell renders

1. Launch the app and sign in.
2. **Expect**: the Entertainer screen with the gold logo in the header-left, as before.

**Fails if**: a blank header, a missing logo, or a red-box on a `headerLeft` that is now `undefined`.
That would mean a constant was referenced before its definition — module-scope `const` is not
hoisted the way `function` is, so **every options constant must be declared above the component that
uses it**.

---

## V3 — `LocationList` back button — the highest-risk change

This is the screen from the original question and the only change with a real behavioural surface
(`research.md` R2 — the `navigation.goBack()` closure is replaced by the injected `onPress`).

1. Navigate to a location list.
2. **Expect**: a black `arrow-back` icon at the header-left, inset from the edge, no back label, no
   header title, no shadow under the header.
3. **Tap it.** Expect a return to the previous screen.
4. Go back in, and **swipe** to dismiss. Expect the existing gesture to still work.
5. Re-enter and leave the screen three or four times.

**Fails if**: the arrow renders but tapping does nothing. That is the `onPress` injection not
arriving — re-check `HeaderSegment.js:121` against the installed navigation version before assuming
the code is wrong.

**Not a failure**: no change in transition smoothness. R4 explains why none is expected, and why the
Entertainer fix that motivated this work was probably `detachPreviousScreen`, not the options hoist.

---

## V4 — Every converted screen still looks identical

The substitution is mechanical, so the risk is a mis-mapped constant — a screen silently picking up
the wrong option set. Walk each one. `data-model.md` is the expected-value table.

| Screen | Reach it via | Check |
|---|---|---|
| `notifications` | bell icon | slides in **horizontally**, no header |
| `AvailOffer` | an offer → avail | slides horizontally, no header |
| `AuthEditProfile`, `Camera` | approval flow | slide horizontally, no header |
| `post-search` | search from post tabs | reveals **vertically** — different from the four above; this is the `revealFromBottom` / `slideFromRight` split and the likeliest place to mis-map |
| `Event Detail`, `Attend Guests` | an event | identical to each other: no header, black tint, left-aligned |
| `marketplace-details`, `magazine-details` | a marketplace / magazine post | identical `Zuruck` back: arrow **and** label **side by side in a row** |
| `post-select` | new post | `Zuruck` arrow and label **stacked vertically**, in a modal |
| `post-detail` | any post | black title text, no back label |
| `post-entry`, `post-select-category` | new post flow | present as modals |
| `TransactionSummary` | complete a redemption | title still translated; switch app language and confirm it still follows |

**`post-select` vs. the `Zuruck` pair is the trap.** They look mergeable and are not — `post-select`'s
inner `<View>` has no style, so its icon and label stack. If it now renders as a row, `post-select`
was wrongly merged into `zurueckHeaderOptions`.

---

## V5 — `Location View` title (the D1 fix)

1. Open a location's detail view.
2. **Expect**: the section title in the header, bold, left-aligned — exactly as before.
3. Navigate somewhere that changes `sectionTitle`, return, and confirm the header updates.

**Fails if**: the title is blank or stale. The `useContext` now lives in `LocationViewTitle` rather
than leaking into `Header`; if the title stopped updating, the component is being created inline per
render or the context provider is above the wrong subtree.

**Regression check for the crash this fixes**: with the title now owned by a component, a screen
setting a *string* `headerTitle` on the same header can no longer change the hook count mid-life
(`research.md` R1).

---

## V6 — Optional: did any of it move a number?

**Non-blocking.** The plan claims no performance improvement (gate G1 in `plan.md`), and this feature
is complete without V6. Run it only to find out — not to justify the work after the fact.

1. React DevTools → Profiler, "Record why each component rendered".
2. Record: open the app, navigate into `LocationList`, back out, repeat 3×.
3. Compare `MainScreen` / `Header` render counts before and after.

**Honest expectations:**

| Change | Expected effect |
|---|---|
| Options hoisting | Fewer allocations. Frame time: **unmeasurably different.** |
| `useMemo` on context values (C7) | The one item that could show up — fewer consumer re-renders on unrelated provider renders |
| Anything on the Android jank in `004` | None. Different mechanism entirely; see `004/follow-ups.md`. |

If a frame-time improvement does appear, record the numbers in a `follow-ups.md` — it would mean the
render churn was costing more than this plan credited, which is worth knowing.

---

## Rollback

Every change is self-contained per screen and per provider. If V4 finds one bad screen, restore that
one `options={{…}}` literal — the constants are additive and nothing else depends on it.

Stage 1 (D1, D2) is independently valuable: those are defects on their own terms and should stay
even if the whole hoist is reverted.
