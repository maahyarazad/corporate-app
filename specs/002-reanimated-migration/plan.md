# Implementation Plan: Migrate RN `Animated` → Reanimated

**Branch**: `002-reanimated-migration` (not yet created — see *Branch Note*) | **Date**: 2026-08-27
**Input**: "refactor the entire code base, this application is using Reanimated (react-native-reanimated) refactor anywhere is required for migrating from Animated to Reanimated and avoid using InteractionManager"

## Branch Note

`/speckit-plan` normally plans the *current* branch's spec. The current branch is
`001-event-push-deeplink`, whose spec is an unrelated push-notification fix. This plan
was therefore written into a new feature directory, `specs/002-reanimated-migration/`,
rather than overwriting `001`'s artifacts. Create the branch before implementing:

```bash
git checkout master && git checkout -b 002-reanimated-migration
```

There is no `spec.md` for this feature — the request is a mechanical refactor with a
precise, enumerable scope, and the codebase survey below serves as the requirement set.
Run `/speckit-specify` first if a formal spec is wanted.

## Summary

The app already depends on `react-native-reanimated@4.1.7` (with `react-native-worklets@0.5.1`)
and three components already use it. Eighteen files still drive animations through React
Native's legacy `Animated` API. This plan converts every one of them to Reanimated shared
values + `useAnimatedStyle`, removes two dead Reanimated-v1 leftovers, fixes three latent
bugs found during the survey, and installs lint guardrails so `Animated` from `react-native`
and `InteractionManager` cannot come back.

**Key survey finding**: `InteractionManager` has **zero occurrences** in the codebase today.
The "avoid InteractionManager" requirement is therefore *preventive*, not a migration — it
becomes a CI grep gate (T-05a) plus, later, an ESLint rule (T-05b) — not refactor work.

## Technical Context

**Language/Version**: JavaScript (ES2021), React 19.1.0, React Native 0.81.5 via Expo SDK 54

**Animation stack (installed, verified)**:
| Package | Version |
|---|---|
| `react-native-reanimated` | 4.1.7 (`~4.1.1` declared) |
| `react-native-worklets` | 0.5.1 |
| `react-native-gesture-handler` | ~2.28.0 |
| `react-native-reanimated-carousel` | ^4.0.3 |
| `react-native-screens` | ~4.16.0 |

**Babel**: `babel.config.js` lists `react-native-reanimated/plugin`. In Reanimated 4 that
path is a two-line re-export of `react-native-worklets/plugin` (verified in
`node_modules/react-native-reanimated/plugin/index.js`), so it *works*, but the canonical
name should be used (T-01).

**Testing**: Jest configured via `npm test` (`NODE_ENV=test jest`). One existing suite:
`src/utils/__tests__/pushDestination.test.js`. No animation tests exist; animations are
verified manually on device (see `quickstart.md`).

**Target Platform**: iOS (Hermes — confirmed in v3.3.0) and Android

**Project Type**: Single Expo/React Native mobile client

**Constraints**:
- Reanimated 4 requires the New Architecture. Confirm Fabric is enabled before starting (T-00).
- Four call sites use `useNativeDriver: false` (JS-driven layout/colour). These are the
  highest-value conversions *and* the highest-risk — layout height animation on the UI
  thread behaves differently. They are sequenced last.
- No visual regression is acceptable: durations, easings and output ranges must be preserved
  exactly unless a defect is being fixed.

**Scale**: 18 files to convert, ~155 `Animated` references, 29 `useNativeDriver` call sites.

## Constitution Check

`.specify/memory/constitution.md` is an **unpopulated template** — every principle is still a
`[PRINCIPLE_N_NAME]` placeholder. There are no ratified gates to evaluate, so this section
passes vacuously. Consider running `/speckit-constitution` to establish real gates.

Self-imposed gates adopted for this refactor in their absence:

| Gate | Status |
|---|---|
| No behaviour change without an explicit, listed justification | PASS — deviations listed in `data-model.md` §Defects |
| No new dependencies | PASS — everything needed is already installed |
| Each converted file independently revertable | PASS — one file per task, one commit per task |
| Guardrail prevents regression | PASS — T-05a `check:animation` script |

## Codebase Survey

Full per-file inventory with patterns, risk and target API: **[data-model.md](./data-model.md)**.
Summary by pattern class:

| # | Class | Files | Driver | Risk |
|---|---|---|---|---|
| A | Validation shake | 5 | native | Low |
| B | Success entrance sequence | 2 | native | Low |
| C | Looping shimmer | 2 | native | Low |
| D | Mount fade-in | 2 | native | Low |
| E | Press scale | 1 | native | Low (+bug) |
| F | Scroll-driven header | 1 | native | Medium |
| G | JS-driven layout/colour | 4 | **JS** | **High** |
| H | Dead code | 2 | — | None |

Classes A–E are near-mechanical. Class F needs `useAnimatedScrollHandler`. Class G is where
Reanimated actually pays off (these animations currently run on the JS thread and jank).

## Phased Approach

**Phase A — Foundation** (T-00…T-05): verify New Architecture and the `npm test` baseline,
correct the Babel plugin name, delete dead code, add the shared `useShakeAnimation` hook, install
the `check:animation` grep gate. **ESLint does not currently run at all in this repo** (missing
`eslint-config-prettier`, stale `babel-eslint` parser, and `npm run lint` points at a
non-existent `app/` directory) — repairing it is tracked as follow-up T-05b and does not block
this migration. See `research.md` R6.

**Phase B — Mechanical conversions** (T-10…T-19): classes A–E. Each is one file, one commit,
visually identical output.

**Phase C — Scroll handler** (T-20): `location-view.screen.js`.

**Phase D — JS-driven conversions** (T-30…T-33): class G, the layout/colour animations. Done
last so that if schedule pressure hits, the app is already fully migrated for everything that
was cheap, and only the genuinely tricky four remain.

**Phase E — Verification** (T-40…T-42): device sweep per `quickstart.md`, grep gate, lint gate.

Task breakdown belongs in `tasks.md` — run `/speckit-tasks` next.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| New shared hook `src/hooks/useShakeAnimation.js` | The identical 20-line shake block is copy-pasted across 5 screens | Converting each in place would preserve five copies of the same worklet; the hook is smaller than the duplication it removes |
| Height animations move to the UI thread | This is the point of the migration — `offerList`, `requestapproval`, `profRedeemHistory` currently animate height on the JS thread | Leaving them on `Animated` would leave the migration incomplete against the stated request |

## Progress

- [x] Phase 0: Research → `research.md`
- [x] Phase 1: Design → `data-model.md`, `contracts/`, `quickstart.md`
- [x] Constitution check (vacuous — template unpopulated)
- [ ] Phase 2: Tasks (`/speckit-tasks`)
- [ ] Phase 3: Implementation (`/speckit-implement`)
