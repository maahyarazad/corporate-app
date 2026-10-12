# Contract: Android Performance Budget

This branch exists because changes shipped without numbers. The contract here is therefore not an
API surface — it is **what a fix must prove before it is allowed to stay**.

## C1 — Every fix carries a before/after number

No change merges on this branch on the strength of its mechanism alone. Each fix records:

| Field | Requirement |
|---|---|
| Device | Model + Android version. A mid-range physical device, **not** an emulator |
| Build | **Release**. Debug numbers are not admissible (`research.md` R2) |
| Scenario | One named scenario from `quickstart.md`, run identically before and after |
| Metric | The metric that suspect predicts — UI-thread frame time for S1/S3, heap for S4 |
| Result | Before, after, and the delta |

**A fix that does not move its metric is reverted, not kept.** Carrying an inert change forward
because it "should help" is the exact failure this plan is correcting.

## C2 — Budgets

Targets on the reference device, release build:

| Scenario | Metric | Budget |
|---|---|---|
| Loaded location screen, **no interaction** | UI-thread janky frames | **< 1%** — a static screen should cost ~nothing |
| Scrolling an image list | Janky frames over 30s | < 10% |
| Scrolling an image list | JS FPS | ≥ 50 sustained |
| 10 location screens visited then popped | Java heap growth | **< 5 MB retained** after GC |
| App cold start to interactive | Wall clock | Record baseline; do not regress |

The first row is the decisive one. Under S1 a static, finished screen is evaluating nine worklets
per frame — if janky frames there are already under 1%, **S1 is wrong** and the plan moves to S2/S3.

## C3 — Measurement method must be identical across runs

Frame stats vary with thermal state, background apps, and battery saver. To compare runs:

- Same device, same build variant, same scenario script, screen brightness fixed
- Reset counters before each run: `adb shell dumpsys gfxinfo <package> reset`
- Let the device cool between runs; a thermally-throttled second run is not a regression
- Take the median of 3 runs, never a single sample

```bash
adb shell dumpsys gfxinfo com.buenapublica.GECRewards reset
# ... run the scenario ...
adb shell dumpsys gfxinfo com.buenapublica.GECRewards framestats
```

## C4 — Component contract: nothing animates while invisible

The rule this regression violated, stated so it holds going forward:

> **An infinite animation must not run while its component is not visible to the user.**
> `display: "none"`, `opacity: 0`, and off-screen placement all count as not visible.

Applies to any `withRepeat(..., -1)` or equivalent. Two acceptable implementations:

1. **Unmount** the component — cleanup runs, `cancelAnimation` fires, nothing is retained.
2. **Gate the loop** on a visibility prop, cancelling when it goes false.

Hiding with `display: "none"` while leaving the animation running satisfies neither, and is what
`skeletonLocation.js:11` does today.

**Corollary**: any effect that starts an animation must list the props it reads in its dependency
array. `skeleton.js` currently uses `[]` while reading `opacityMin` and `opacityMax`.

## C5 — Public props that must not change

Fixes here are internal. These stay as they are, so no caller is touched:

| Component | Preserved |
|---|---|
| `SkeletonLocation` | `display`, `backgroundColor`. If the fix unmounts instead, **every caller changes** — that is a deliberate, listed change, not a silent one |
| `Skeleton` | `variant`, `width`, `height`, `borderRadius`, `color`, `opacityMin`, `opacityMax`, `style`. A visibility prop may be **added**; none may be removed |
| `CacheImage` | `uri`, `style`, `imgKey`, `onLoad` |

## C6 — Gates that must not regress

The existing gates stay green throughout:

```bash
npm run check:animation   # no legacy Animated API, no InteractionManager
npm run audit:lists       # list contract
npm test                  # 27/27
```

If the S1 fallback (reverting `skeleton.js` to RN `Animated`) is taken, `check:animation` **will**
fail. That requires an explicit, documented exemption in the script — not a silent weakening of the
pattern it matches.
