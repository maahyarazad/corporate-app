# Feature Specification: Static Screen Options & Allocation Hygiene

**Feature Branch**: `005-static-screen-options`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "The right memo boundary is the whole options object — and since nothing in it depends on props or state, the right 'memo' is no hook at all, just module scope. […] following the provided information optimize the entire application"

> **Note on provenance**: this spec was written *after* `plan.md`, to formalise the user stories that
> `/speckit-tasks` requires. It restates the plan's findings as testable slices; it introduces no new
> scope. `plan.md`, `research.md`, `data-model.md` and `contracts/navigation-options.md` remain the
> authority on mechanism and exact field sets.

## Summary

Screen options in `navigation.js` are declared as inline object literals inside the navigator
components, so they are rebuilt on every render and duplicated across screens. The request is to move
the static ones to module scope, where they are allocated once.

Surveying for places to apply that rule turned up **two defects and one duplicated bug shape** that
are worth more than the allocation win:

- a **Rules-of-Hooks violation** in a header title that is one line away from crashing the app,
- **six context providers** publishing a new value object every render, re-rendering every consumer,
- the `LocationList` screen carrying the exact pattern that commit `7a1b9f4` just fixed on
  Entertainer.

### What this feature does not claim

**No performance improvement is asserted**, because none has been measured. There is no performance
harness in this repo and no device in the authoring environment. `research.md` R4 documents a
performance claim already written into the codebase that was checked and **could not be confirmed**.

The measurable goals are structural: zero inline options literals, zero duplicate option objects,
zero hooks in render callbacks. Every one is checkable with a grep.

### Evidence supplied

| Finding | Location | Verified against |
|---|---|---|
| `useContext` inside `headerTitle` | `navigation.js:473` | `@react-navigation/elements/.../Header.js:208` — plain call, not `createElement` |
| Crash trigger exists in-repo | `postDetail.screen.js:142` | `Header.js:170` — renderer swaps on `typeof customTitle` |
| `headerLeft` receives `onPress` | — | `@react-navigation/stack/.../HeaderSegment.js:121` (v6.2.1) |
| 22 inline `options={{` | `navigation.js` | `grep -c` |
| 4 exact duplicates of `slideFromRight` | lines 292, 446, 534, 544 | field-by-field comparison |
| 6 unmemoized provider values | `src/services/**` | `grep "value={{"` + `app.context.js:46` |

## User Scenarios & Testing

### US-001 — The header title cannot crash the app (Priority: P1)

A user opens a location detail screen. The header shows the section title. Later, any developer adds
a plain-string `headerTitle` to that screen — the same one-line change already present on
`postDetail.screen.js` — and the app must not crash.

Today it would. `headerTitle` is invoked as a plain function inside `Header`'s render, so the
`useContext` in it belongs to `Header`'s fiber. When `Header.js:170` swaps a hook-calling callback for
a non-hook-calling one on the same instance, React throws *"Rendered fewer hooks than expected."*

**Why this priority**: it is a latent crash, not a style preference. It is also the smallest diff in
the feature — one component extracted — and is independently valuable even if nothing else ships.

**Independent Test**: open `Location View`, confirm the title renders and updates; then add a
temporary string `headerTitle` via `setOptions` on that screen and confirm no crash. Gate G2 must
report `CLEAN`.

**Acceptance Scenarios**:

1. **Given** a location detail screen, **When** it is opened, **Then** the section title renders bold
   and left-aligned, exactly as before.
2. **Given** `sectionTitle` changes, **When** the user returns to the screen, **Then** the header
   reflects the new value.
3. **Given** the fix is applied, **When** the repo is scanned for hooks inside
   `headerLeft`/`headerTitle`/`headerRight` callbacks, **Then** there are zero hits.
4. **Given** a string `headerTitle` is set on that screen at runtime, **When** the header re-renders,
   **Then** the app does not crash.

---

### US-002 — Context consumers stop re-rendering for no reason (Priority: P2)

A user moves through the app. Screens that consume `SectionContext`, `TranslationContext`,
`SocketContext`, `LocationContext`, `UserContext` or `AppContext` re-render only when the data they
read actually changes — not every time the provider's own parent happens to render.

`useContext` has no bail-out: a new value object re-renders **every** consumer unconditionally. Six
providers publish a fresh object each render. `app.context.js:46` assigns it to a `const` first,
which looks like it avoids the problem and does not.

**Why this priority**: the widest fan-out of anything in this feature, and the only item with a
plausible claim to being user-visible. Ranked below US-001 only because that one is a crash.
`auth.context.js` already implements the fix, so there is no new pattern to invent.

**Independent Test**: touches only `src/services/**` — no navigation files — so it can be implemented,
reviewed and shipped entirely on its own. Verified by gate G3 plus a device smoke test.

**Acceptance Scenarios**:

1. **Given** a provider re-renders with unchanged contents, **When** consumers are profiled, **Then**
   they do not re-render.
2. **Given** the contents do change, **When** consumers are observed, **Then** they update as before.
3. **Given** all six providers are converted, **When** `src/services/` is scanned, **Then** no
   `value={{` and no rebuilt `const values = {` remain.
4. **Given** a provider whose dependencies are themselves unstable, **When** it is reviewed, **Then**
   the instability is fixed or the `useMemo` is documented as ineffective — not left as decoration.

---

### US-003 — Screen options are declared once and shared (Priority: P2)

*This is the user's original request.*

A developer reading `navigation.js` finds each distinct screen presentation defined exactly once, at
module scope, with a name. Screens wanting the same presentation reference the same constant. Nothing
static is rebuilt per render, and no `headerLeft` closes over `navigation`.

This includes `LocationList` — the screen that prompted the question — which today has both halves of
the pattern `7a1b9f4` fixed on Entertainer: an inline `headerLeft` closure and a `setOptions` call
from the screen.

**Why this priority**: it is the literal ask and the largest diff, but it is hygiene rather than a
defect fix. Per `research.md` R4, it should **not** be expected to fix a visible glitch.

**Independent Test**: ships alone. Every screen must look and behave identically; gate G1 leaves
exactly one inline literal (`TransactionSummary`), and the device walk in `quickstart.md` V4 covers
each converted screen.

**Acceptance Scenarios**:

1. **Given** the conversion is complete, **When** `navigation.js` is scanned, **Then** exactly one
   `options={{` remains, on `TransactionSummary`.
2. **Given** any converted screen, **When** it is opened, **Then** its header, transition and gesture
   are indistinguishable from before.
3. **Given** the `LocationList` back arrow, **When** it is tapped, **Then** the app navigates back —
   using the injected `onPress` rather than a captured `navigation`.
4. **Given** four screens previously duplicating `slideFromRight`, **When** reviewed, **Then** they
   reference the existing constant and declare no fields of their own.
5. **Given** `post-select` and the two `Zuruck` screens, **When** compared, **Then** `post-select`
   still stacks its icon above its label while the other two render side by side.
6. **Given** `MainScreen`, **When** reviewed, **Then** it no longer calls `useNavigation()`.

---

### US-004 — The pattern cannot quietly come back (Priority: P3)

A developer adding a screen next month has a written rule to follow and a misleading comment removed
from their path.

Two specifics: `navigation.js:113` currently claims the inline options "threw away the logo subtree",
which `research.md` R4 could not substantiate — left alone it becomes folklore. And
`contracts/navigation-options.md` exists but nothing enforces it.

**Why this priority**: pure durability. Deliberately last, and deliberately **excludes** adding an
ESLint rule — that is a tooling change with its own configuration discussion, and this plan is
committed to not smuggling in scope. US-004 evaluates it and records a recommendation.

**Independent Test**: documentation-only; verified by reading. No runtime behaviour changes.

**Acceptance Scenarios**:

1. **Given** the corrected comment, **When** read, **Then** it describes only the re-render, not a
   remount.
2. **Given** the contract, **When** a reviewer checks a new screen, **Then** C1–C7 answer whether it
   is acceptable.
3. **Given** the ESLint evaluation, **When** complete, **Then** a recommendation is recorded with no
   config committed.

### Edge Cases

- **Back button at the root of a stack**: `onPress` is `undefined` (`canGoBack: false`). Today's
  `navigation.goBack()` is also a no-op there. Equivalent — but it reads like a regression in review,
  so it is called out. Neither `LocationList` nor the `Zuruck` screens are ever root.
- **`TransactionSummary`**: `title: i18n.t(…)` depends on context and stays inline. A `useMemo` would
  invalidate on exactly the renders it was meant to skip (`research.md` R6).
- **Constant declaration order**: module-scope `const` is not hoisted like `function`. A constant
  referenced above its definition throws at module load — an app that fails to boot, not a subtle bug.
- **`post-entry`'s inert header fields**: `headerTintColor` etc. alongside `headerShown: false`. They
  do nothing, and removing them is a behavioural bet. Preserved.
- **`revealFromBottom`'s mismatched gesture**: `forVerticalIOS` with `gestureDirection: "horizontal"`.
  Looks like a bug, ships today, preserved deliberately — changing it is a product decision.

## Requirements

### Functional Requirements

- **FR-001**: No hook may be called inside a `headerLeft`, `headerTitle`, `headerRight` or
  `headerBackground` callback anywhere in the repository.
- **FR-002**: Header content requiring context or state MUST be a component rendered by the callback.
- **FR-003**: Any options object depending on no props, state, context or hook result MUST be a
  module-scope `const`.
- **FR-004**: Nested objects inside a hoisted constant (`headerStyle`, container styles, styles inside
  a header renderer) MUST also be hoisted.
- **FR-005**: Screens requiring identical options MUST share one constant; screens differing by any
  field MUST NOT be merged.
- **FR-006**: Composition MUST use spread at module scope, never inside JSX.
- **FR-007**: `headerLeft` MUST use the injected `onPress` rather than closing over `navigation`.
- **FR-008**: Context provider values MUST be `useMemo`'d with dependencies that are themselves stable.
- **FR-009**: Every screen's effective options MUST be field-for-field identical to before. The only
  intended runtime difference is FR-007 on `LocationList`.
- **FR-010**: No new runtime dependency may be added.
- **FR-011**: Inline `style={{…}}` objects outside `navigation.js` are **out of scope** and MUST NOT be
  converted (`research.md` R7).
- **FR-012**: No documentation produced may assert a performance improvement that has not been
  measured.

### Key Entities

The "entities" are the shared option constants. `data-model.md` is authoritative for exact field sets.

| Constant | Status | Serves |
|---|---|---|
| `slideFromRight`, `noSwipeBack`, `keepPreviousScreenAttached`, `entertainerScreenOptions` | exist | reuse; do not redefine |
| `noHeader` | new | 6 screens + `AuthStack` navigator `screenOptions` (line 147) |
| `revealFromBottom` | new | `post-search` |
| `modalNoHeader`, `postEntryOptions`, `postSelectOptions`, `postDetailOptions` | new | post flow |
| `plainBlackHeader` | new | `Event Detail`, `Attend Guests`; spread into `locationViewOptions` |
| `locationListOptions` + `renderBackArrow` | new | `LocationList` (US-003) |
| `zurueckHeaderOptions` + `renderZurueckBack` | new | `marketplace-details`, `magazine-details` |
| `LocationViewTitle`, `locationViewOptions` | new | `Location View` (US-001 + US-003) |

## Success Criteria

| # | Criterion | How verified |
|---|---|---|
| SC-001 | Zero hooks in header render callbacks | Gate G2 → `CLEAN` |
| SC-002 | Exactly one inline `options={{` remains | Gate G1 → `1` |
| SC-003 | Zero unmemoized provider values | Gate G3 → `0` |
| SC-004 | `MainScreen` no longer calls `useNavigation()` | Gate G4 |
| SC-005 | Every screen visually and behaviourally unchanged | `quickstart.md` V2–V5 on device |
| SC-006 | Existing Jest suite still passes | `npx jest` |
| SC-007 | Net line count in `navigation.js` decreases | `git diff --stat` |
| SC-008 | No performance claim published without a measurement | Review of `follow-ups.md` |

**Not a success criterion**: any frame-rate, memory or startup-time figure. See "What this feature
does not claim".

## Assumptions

- `@react-navigation/stack` stays at **6.2.1**. The `onPress` injection is an internal detail, not
  public API; an upgrade must re-verify `HeaderSegment.js` (contract C4).
- The existing `revealFromBottom` gesture mismatch and `post-entry`'s inert fields are intentional or
  at least accepted; preserving them is correct until a product decision says otherwise.
- A device or emulator is available to whoever implements this. **If not, US-001, US-002 and US-004
  can still be completed and statically verified; US-003's acceptance depends on the V4 walk** and
  should not be marked done without it.
- `MainScreen` re-renders rarely (only on `TranslationContext` change or a child's `setOptions`), so
  the allocation saved by US-003 is small. This is an assumption about frequency, not a measurement.
