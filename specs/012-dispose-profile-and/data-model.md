# Phase 1 Data Model: Disposing Profile and Map when returning to Main

**Feature**: `012-dispose-profile-and` | **Date**: 2026-09-10

This feature stores nothing. It adds no table, no column, no `AsyncStorage` key and no
`SecureStore` key — `011` added the last persistent state this app needed, and `012` deliberately
adds none, because the premise is that disposed screens keep nothing.

What it does have is **state shapes**: the navigation state the return helper must produce, and the
lifecycle states a screen moves through. Those are the entities below. They are what the tests in
`quickstart.md` assert against.

---

## E1 — `MainScreenStack`

The navigation state of the `MainScreen` navigator declared in `navigation.js`.

| Field | Type | Notes |
|---|---|---|
| `index` | integer | Index of the focused route in `routes`. |
| `routes` | array of `{ name, key, params? }` | Ordered bottom to top. |

**Route names** (the complete registered set, from `navigation.js`): `Main`, `Profile`, `Logout`,
`Map`, `LocationList`, `AvailOffer`, `TransactionSummary`, `Location View`, `Event Detail`,
`Attend Guests`.

`Main` is not a screen but a nested navigator — the `OverlappingNavigator`, whose own routes are
`Entertainer`, `post-tabs`, `post-detail`, `post-entry`, `post-search`, `notifications`,
`post-select-category`, `post-select`, `marketplace-details`, `magazine-details`.

### Validation rules

- **V1** — After `returnToMain()`, `routes.length === 1` and `routes[0].name === "Main"` (FR-001).
- **V2** — V1 must hold for any prior value of `routes`, including one that does not contain `Main`
  (FR-011; the `TransactionSummary` state from `research.md` R8).
- **V3** — `index` must equal `0` after the return, which follows from V1 but is asserted separately
  because `reset` derives `index` when it is omitted, and that derivation is what produces the R8
  behaviour.

### States

There are exactly three shapes this feature cares about:

| State | Shape | Reached by |
|---|---|---|
| `AtHome` | `[Main]` | `returnToMain()`; also cold start |
| `Covering` | `[Main, …, X]` where `X` is focused and at least one route sits between | any `navigate()` to a route not in the stack |
| `Detached` | `routes` does not contain `Main` | `availOffer.screen.js:168-170` (`research.md` R8) |

`returnToMain()` maps all three to `AtHome`. That total-function property is the whole of US1.

---

## E2 — `ReturnToMainAction`

The action object `returnToMain()` dispatches. It is a plain object, which is what makes US1
testable in `jest-expo` without a renderer.

```
CommonActions.reset({
  index: 0,
  routes: [
    {
      name: "Main",
      params: { screen: "Entertainer", params: { screen: "Home" } },
    },
  ],
})
```

| Field | Value | Why |
|---|---|---|
| `index` | `0`, always explicit | Never derived. `research.md` R8 is what an omitted `index` costs. |
| `routes` | exactly one entry | FR-001, FR-002 — everything else is dropped and unmounted. |
| `routes[0].name` | `"Main"` | The route name in `navigation.js`, byte-identical. |
| `routes[0].params` | nested screen selection | FR-003. Preserves what `profile.screen.js:43` does today. |

### Validation rules

- **V4** — `index` is present and `0`. A test must fail if it is omitted, because omitting it is
  correct-by-accident here (one route ⇒ derived index is also 0) and becomes wrong the moment
  someone adds a second route.
- **V5** — The nested `params` shape matches `goHome`'s exactly. The comment at
  `profile.screen.js:38-42` explains why the nesting is not optional: a bare `navigate("Home")`
  resolves to nothing, because `Home` is a `Tab.Screen` inside `Entertainer`, not a sibling.
- **V6** — The default tab is `"Home"`. Callers may override it; the helper takes an optional tab
  name and defaults to `Home`.

### Parameterisation

`returnToMain(tab)` — `tab` defaults to `"Home"` and must be one of the routes registered on the
`Tab.Navigator` in `entertainer.screen.js`: currently `Home`, `Offers`, `Events`. (`Feed` is
commented out at `entertainer.screen.js:518-524`; it is not a valid value while that stays.)

An unrecognised tab name is not validated at runtime — React Navigation logs its own "not handled by
any navigator" warning, and duplicating that check here would be a second source of truth for the
tab list.

---

## E3 — `ScreenLifecycleState`

The state a `MainScreen` route is in, from the point of view of what it is costing. This is the
vocabulary `contracts/screen-lifecycle.md` is written in.

| State | React | Native views | Re-renders? | Reached by |
|---|---|---|---|---|
| `Focused` | mounted | present | yes | being `routes[index]` |
| `Covered` | mounted | **present** | **yes** | another route pushed above it |
| `Frozen` | mounted | present | no | `Covered` + `enableFreeze()` (US3) |
| `Released` | mounted | **absent** | no if also frozen | `Covered` + the focus gate (US2) |
| `Disposed` | unmounted | absent | n/a | removed from `routes` |

**The transition this feature adds is `Covered → Released`.** Today the app has only `Focused`,
`Covered` and `Disposed`; a covered screen keeps everything.

### State transitions

```
Focused ──push above──▶ Covered ──focus gate──▶ Released
   ▲                       │                        │
   └───────pop─────────────┴────regains focus───────┘
                           │
                           └──returnToMain()──▶ Disposed
```

- **T1** — `Focused → Covered` on losing focus. Automatic; nothing to build.
- **T2** — `Covered → Released` when the focus gate applies (US2, `Map` only in this feature).
  Tears down the native view. Irreversible in the sense that returning does not restore — it
  rebuilds (FR-006).
- **T3** — `Released → Focused` on regaining focus. The screen remounts its map with a fresh
  `initialCamera` and coordinates served from SQLite (FR-005). Camera position and selected partner
  are lost, by design.
- **T4** — anything `→ Disposed` via `returnToMain()`. Runs `useEffect` cleanup, which aborts
  in-flight requests (FR-009, `research.md` R7).

### Validation rules

- **V7** — No transition may require serialising or restoring screen state (FR-006).
- **V8** — `Main` never enters `Released` or `Disposed` as a result of this feature's code (FR-007).
- **V9** — `T2` must not change hook order. `map.screen.js`'s own "FIX 10" comment documents the
  crash this rule prevents; the gate therefore goes on an element inside an existing conditional,
  never on a new early return from the screen component.

---

## Non-entities

Recorded so their absence is a decision rather than an oversight:

- **No cache of disposed state.** FR-006. Adding one would recreate the preservation this feature
  exists to avoid.
- **No registry of "heavy" screens.** `Map` gets the focus gate because `research.md` R4 measured
  what it holds. A generic mechanism applied to every screen would be speculative.
- **No new SQLite table.** `011` owns `cache.db`; `012` only benefits from it (FR-005).
