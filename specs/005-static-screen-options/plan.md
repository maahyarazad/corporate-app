# Implementation Plan: Static Screen Options & Allocation Hygiene

**Branch**: `005-static-screen-options` (not yet created — branch from `fix/entertainer-return-jank`)
**Date**: 2026-08-30
**Input**: "The right memo boundary is the whole options object — and since nothing in it depends on props or state, the right 'memo' is no hook at all, just module scope. […] following the provided information optimize the entire application"

## Summary

The premise is correct, and it generalises. But the survey that produced this plan turned up
something more valuable than the allocation win: **two real defects and one duplicated bug shape**,
found while looking for places to apply the rule. Those lead the plan; the allocation cleanup
follows them.

### The honest headline: this is a correctness and duplication fix, not a speed-up

Hoisting a static `options` object to module scope saves one object literal and one closure per
navigator render. `MainScreen` re-renders only when `TranslationContext` changes or when a child
calls `navigation.setOptions()`. The allocation saved is a few hundred bytes, a handful of times per
session. **Anyone who expects a measurable frame-time improvement from the hoist alone will not get
one**, and this plan does not promise it. See `research.md` R4, where I checked the performance
claim written in the existing code comment and could not confirm it.

What the hoist actually buys is: the duplication goes away (four inline blocks are byte-identical to
the existing `slideFromRight`), the `navigation` closure disappears so `MainScreen` can drop
`useNavigation()`, and the pattern that produced a real user-visible bug once already stops being
reachable.

### D1 — `headerTitle` calls `useContext` from inside a render callback (real defect)

`navigation.js:473`, the `Location View` screen:

```js
headerTitle: () => {
  const { sectionTitle } = useContext(SectionContext);   // hook in a plain callback
  return <Label size="title" weight="bold">{sectionTitle}</Label>;
},
```

This is the same class of error as the interview question that prompted this work, and it is in
production code. `headerTitle` is **not** rendered as a component. Verified in
`node_modules/@react-navigation/elements/lib/commonjs/Header/Header.js:208`, where the header
invokes it as a plain call — `headerTitle({ … })`, not `React.createElement(headerTitle, …)`.

So the `useContext` executes inside **`Header`'s** render, silently subscribing `Header` to
`SectionContext`. It works today only because `Header` happens to call it exactly once and
unconditionally.

**Concrete failure**: `Header.js:170` picks the title renderer with
`typeof customTitle !== 'function'`. If this screen ever sets a *string* title — including via
`navigation.setOptions({ headerTitle: "…" })`, which is exactly what `postDetail.screen.js:142`
already does on another screen — the same `Header` instance swaps a hook-calling function for a
non-hook-calling one and React throws *"Rendered fewer hooks than expected"*. It is a latent crash,
not a style complaint. Fix in `research.md` R1.

### D2 — Five context providers publish a fresh value object every render

`section`, `translation`, `socket`, `location`, `user` all pass an inline literal (or, in
`app.context.js:46`, a `const values = {…}` rebuilt each render, which is the same thing). Every
consumer of those contexts re-renders whenever the provider re-renders, whether or not the contents
changed. Only `auth.context.js` uses `useMemo`.

This matters more than the navigator allocations, because `TranslationContext` is consumed by
`MainScreen` itself and `SectionContext` is consumed — via D1 — by the header. It is the same
"wrong memo boundary" mistake the user's snippet identifies, one layer up.

### D3 — `LocationList` is the Entertainer bug, un-fixed

Commit `7a1b9f4` on this branch fixed the Entertainer screen by hoisting its options out of the
navigator. The comment there (`navigation.js:113`) explains the mechanism: the stack re-renders on
every `setOptions()` call the screen makes, which handed the header a fresh `headerLeft` each time.

**`LocationList` has both halves of that shape and neither fix**: an inline `headerLeft` closure
(`navigation.js:429`) and a `setOptions()` call in an effect (`location-list.screen.js:110`) that
re-runs whenever `headerTitle` changes. It is the screen the user had open when they asked the
question.

Note carefully what this does and does not do — see R4. The re-render is real; the *remount* the
existing comment implies is not.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 19.1.0, JSX via Babel/Metro — no TypeScript

**Primary Dependencies**: React Native 0.81.5, Expo SDK 54, `@react-navigation/native` 6.0.10,
`@react-navigation/stack` **6.2.1**, `@react-navigation/bottom-tabs` 6.3.1,
`@react-navigation/material-top-tabs` ^6.2.2

**Storage**: N/A — no persistence touched

**Testing**: Jest. **One test file exists** (`src/utils/__tests__/pushDestination.test.js`, pure
logic). There is no component-render harness and no performance harness. Verification for this
feature is therefore *static* plus a manual device walk — see the Verification Strategy below and
`quickstart.md`.

**Target Platform**: iOS and Android (React Native, New Architecture / Fabric enabled)

**Project Type**: Mobile application, single package, 167 `.js` files under `src/` plus a
713-line root `navigation.js`

**Performance Goals**: **None claimed.** This feature is not permitted to assert a frame-rate or
memory improvement it has not measured. The measurable, checkable goals are structural: zero
inline `options={{…}}` literals in `navigation.js`, zero duplicate option objects, zero hooks in
render callbacks.

**Constraints**:
- **No visual or behavioural change.** Every screen must look and behave identically afterwards.
- `@react-navigation/stack` **6.2.1 specifically** — the `onPress` injection this plan relies on is
  version-dependent and was verified in the installed tree, not assumed. See R2.
- No new dependencies.

**Scale/Scope**: 22 inline `options={{` blocks in `navigation.js`; 5 unmemoized context providers
plus `app.context.js`; 1 hook-in-callback defect; 832 inline `style={{` across `src/` that are
**explicitly out of scope** (see "Explicitly Not Doing" — the largest single decision in this plan).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**`.specify/memory/constitution.md` is an unfilled template.** Every principle is still a
`[PRINCIPLE_N_NAME]` placeholder with example comments; nothing has been ratified. There are no
project gates to check against, and inventing some here would be fabricating authority this plan
does not have.

**Gate result: PASS by vacancy, not by compliance.** Recorded honestly rather than reported as a
clean pass. The one governance-shaped rule this feature does inherit is a real, written one from a
sibling feature: `specs/004-android-performance/contracts/performance-budget.md`. This plan adopts
its framing — fix things that are *defects* on their own terms, and do not ship optimisations
justified by a hunch.

Two self-imposed gates, both checkable:

| Gate | Rule | Where enforced |
|---|---|---|
| G1 | No performance claim without a measurement | This plan states none; `quickstart.md` V6 is opt-in and unblocking |
| G2 | No behavioural change | `quickstart.md` V1–V5, screen-by-screen |

*Post-Phase-1 re-check: still PASS. The design added no dependency, no new abstraction beyond plain
module-scope constants, and no unmeasured claim.*

## Project Structure

### Documentation (this feature)

```text
specs/005-static-screen-options/
├── plan.md              # This file
├── research.md          # Phase 0 — R1..R7, including one discarded claim
├── data-model.md        # Phase 1 — the shared-options taxonomy
├── quickstart.md        # Phase 1 — manual verification script
├── contracts/
│   └── navigation-options.md   # Phase 1 — rules screen options must satisfy
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
navigation.js                          # 713 lines — primary target. 5 navigators,
                                       #   22 inline options blocks, 2 headerLeft closures,
                                       #   1 headerTitle hook violation (D1)
src/
├── services/                          # Context providers — D2
│   ├── section/section.context.js     #   :11  inline value, consumed by the header via D1
│   ├── translation/translation.context.js  # :59  inline value, consumed by MainScreen
│   ├── socket/socket.context.js       #   :11
│   ├── location/location.context.js   #   :64
│   ├── user/user.context.js           #   :72
│   ├── app/app.context.js             #   :46  `const values = {…}` — same defect, different shape
│   └── auth/auth.context.js           #   already useMemo'd — reference implementation
└── screens/
    ├── location/location-list.screen.js    # :110 setOptions — D3, pairs with navigation.js:423
    ├── entertainer.screen.js               # :362 setOptions — already fixed by 7a1b9f4
    └── posts/postDetail.screen.js          # :142 setOptions({headerTitle: string}) — the D1 trigger
```

## Phase 0: Research

Complete — see `research.md`. Seven items, R1–R7. R2 and R4 were the two that could have sunk the
approach, and both were checked against the installed `node_modules`, not recalled:

- **R2** confirms `headerLeft` receives `onPress` at
  `@react-navigation/stack/lib/commonjs/views/Header/HeaderSegment.js:121`, which is what allows the
  `navigation.goBack()` closure to be dropped and the object moved to module scope.
- **R4** is a claim from the existing code that I checked and **could not confirm** — recorded so it
  is not propagated further.

No `NEEDS CLARIFICATION` markers remain. The single scoping question — how far "the entire
application" reaches — is resolved in R7 and in "Explicitly Not Doing" below, as a decision with a
stated rationale rather than a question handed back to the user.

## Phase 1: Design

Complete. `data-model.md` defines the constant taxonomy (the "entities" here are the shared option
objects and their exact field sets); `contracts/navigation-options.md` states the rules any screen
options must satisfy; `quickstart.md` is the manual verification script, since no automated harness
exists.

### Work in dependency order

**Stage 1 — defects (independently justified; ship even if the rest is dropped)**
1. D1: rewrite `Location View`'s `headerTitle` as a real component defined at module scope, so the
   `useContext` runs inside a component that owns it. (R1)
2. D2: `useMemo` the five inline provider values plus `app.context.js`'s `values`, matching the
   existing `auth.context.js` pattern. (R5)

**Stage 2 — the requested hoist**
3. Add the shared constants from `data-model.md` to `navigation.js`'s module scope, beside the
   existing `slideFromRight` / `entertainerScreenOptions`.
4. Replace the 4 byte-identical duplicates of `slideFromRight` with the constant. (R3)
5. Convert the remaining static blocks, including `LocationList` (D3) using the `onPress` injection
   from R2, and the two identical `Zuruck` headers.
6. Drop the now-unused `useNavigation()` from `MainScreen`.

**Stage 3 — the one genuinely dynamic case**
7. `TransactionSummary` reads `i18n.t(…)`, so it cannot be a module constant. R6 explains why
   leaving it inline is the defensible choice and why `useMemo` here would be theatre.

### Explicitly Not Doing

**The 832 inline `style={{…}}` objects across `src/` will not be mass-converted to `StyleSheet`.**

This is the biggest judgement call in the plan, and it is a deliberate narrowing of the literal ask
("optimize the entire application"), so here is the reasoning rather than a silent omission:

- An inline style is a new object per render, but RN's style diff is shallow and cheap. The cost is
  only real where it defeats a `React.memo` boundary or runs per row in a long list.
- An 832-site mechanical edit across 167 files, with one test file in the repo and no component
  harness, is a large regression surface bought for an unmeasured gain. That trade is exactly what
  `004`'s follow-ups warn against.
- The subset that *would* matter — list-row components — belongs with the list work in `003`, next
  to the virtualisation decisions, not here.

If the intent was in fact a full styling sweep, that is a separate feature with its own
measurement-first plan. **The work in this plan is complete on its own terms** and does not depend
on that decision.

### Verification Strategy

There is no automated safety net, so verification is explicit and layered:

| Layer | What it catches | Cost |
|---|---|---|
| `npx jest` | Nothing here (1 unrelated test) — run only to prove no regression | seconds |
| Static grep gates (`quickstart.md` V1) | Leftover inline options, hooks in callbacks | seconds |
| Screen-by-screen walk (V2–V5) | The real risk: a wrong back button or a lost transition | ~15 min on device |
| Optional profiling (V6) | Whether any of it moved a number | opt-in, non-blocking |

**The highest-risk change is the `LocationList` back button**, because it swaps a `goBack()` closure
for an injected `onPress`. R2 documents the one behavioural difference (root-of-stack, where
`onPress` is `undefined`) and why it is equivalent in practice. V3 tests it directly.

## Complexity Tracking

No constitutional violations to justify. The design adds no abstraction layer, no dependency, and no
indirection: it moves object literals from inside a function to outside it, and adds `useMemo` where
`auth.context.js` already demonstrates the pattern. Net line count is expected to *fall*, since four
duplicated blocks and two duplicated `Zuruck` headers collapse into shared constants.
