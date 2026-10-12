# Findings — Android performance regression

Status at the end of the first implementation pass. **No measurement has been taken**: there is no
`adb` and no Android device in this environment, so T002–T010 (every measurement task and the whole
bisect) are untouched.

## What was done, and why it did not need a measurement

Two changes shipped. Both are **defects confirmed by reading the code**, not optimizations chosen
on a hunch — the distinguishing test being that each would still be worth fixing in an app that ran
perfectly.

### F1 — Skeletons animated while invisible (US1, partial)

`src/components/skeletonLocation.js` hides itself with `display: display ? "flex" : "none"`, so its
subtree never unmounts. `src/components/skeleton.js` started `withRepeat(..., -1)` in a `[]` effect
whose `cancelAnimation` cleanup therefore never ran. Nine `<Skeleton>` children kept evaluating a
worklet every frame on a finished, static screen.

This violates `contracts/performance-budget.md` §C4 — *nothing animates while invisible* — which is
a correctness rule, not a performance target.

**Fixed** by adding an `animating` prop to `Skeleton` (defaulting to `true`, so no existing caller
changes) that cancels the loop and resets opacity when false, and threading `animating={display}`
into all nine children. The effect's stale `[]` dependency array also now declares
`[animating, opacityMin, opacityMax]`, which it reads but never re-read.

**Scope is narrower than first assumed.** An audit of all 48 `<Skeleton>` instances across 10 files
found `skeletonLocation.js` is the **only** wrapper using the hide-don't-unmount pattern. Every
other group sits inside a ternary and unmounts correctly. So the leak is bounded at nine worklets
per retained location screen — real, and growing with each screen left in the navigator stack, but
**not obviously enough to explain app-wide "super laggy"**.

That materially raises the relative likelihood of **S2 (a debug build)**, which remains untested and
is still task one.

**Outstanding**: T011 and T016. The effect size is unmeasured. If M3 shows a loaded, untouched
location screen was already under 1% janky frames, this fix was correct but irrelevant to the
reported lag, and the investigation must continue to S2/S3.

### F2 — Unbounded notification id set (US2) — **in the working tree, not committed**

`src/screens/entertainer.screen.js` accumulated notification identifiers in a `Set` that was never
pruned — a genuine unbounded leak, though a small one (one short string per notification *tapped*).

**Fixed** with a `MAX_HANDLED_NOTIFICATION_IDS = 50` cap, evicting the oldest entry. `Set` preserves
insertion order, so the first key is the oldest.

**Verified**, since the set exists to guarantee one tap produces exactly one navigation: the
duplicate check runs *before* eviction, so the cold-start replay is still de-duplicated; the set
stays at 50 across 500 taps; and a payload with no identifier still navigates. A re-tap of an id
evicted long ago will navigate again, which is by design and far outside the replay window the set
covers.

**Not committed.** `src/screens/entertainer.screen.js` also carries an unrelated `useCallback`/
`useMemo` pass the user asked to leave uncommitted, and the two changes are interleaved in one file.
The cap therefore sits in the working tree alongside it. Commit both together, or split them, when
that optimization work is landed.

## Not a leak — do not re-flag

`src/components/cacheImage.js:107`'s `inFlight` Map **is** pruned: `forget()` at line 137 deletes the
entry on settle. Verified while investigating F2.

## Still open — the whole diagnosis

| Task | Blocked on |
|---|---|
| T002–T006 | A physical Android device. **T003 is a stop gate**: if the lag disappears in a release build, close this branch |
| T007–T010 | The bisect. The scenario is written into `quickstart.md`; the four rebuilds are not done |
| T011, T016 | Measuring whether F1 moved anything |
| T022–T026 (S3) | M4 |
| T027–T030 (S4) | Whether the bisect names `01910b4` |
| T031–T034 (S5) | React DevTools on the home screen |
| T035–T041 (S6) | Contingent on the app still missing budget — **no code changes unless it does** |

## The honest summary

Two real defects are fixed. **Neither is confirmed to be the cause of the reported lag**, and the
narrow scope of F1 argues against it being a full explanation.

The single highest-value next action is still **T003**: build release and see whether the problem
survives. It costs one build and can close the entire investigation.
