# Quickstart: Reproducing and Measuring the Android Regression

Diagnosis first. Do not change code before M1 and M3.

## Prerequisites

- **Physical mid-range Android device.** Emulators mislead badly on graphics work
- USB debugging, `adb` on PATH
- Android Studio (Profiler) — or `adb shell dumpsys gfxinfo` alone for the frame numbers
- Package: `com.buenapublica.GECRewards`

```bash
export PKG=com.buenapublica.GECRewards
adb devices          # confirm exactly one device
```

---

## M1 — Rule out a debug build (do this first)

The highest-prior explanation and the cheapest to eliminate (`research.md` R2).

```bash
npx expo run:android --variant release
```

Repeat whatever made the app feel laggy.

- **Lag gone** → it was a debug build. **Stop here.** Record it and close the report; nothing below
  is needed.
- **Lag persists** → continue to M2. Every measurement from here uses this release build.

---

## M2 — Bisect the regression to a commit

Converts suspicion into a named commit. Do this before fixing anything.

### The bisect scenario (T007) — run these exact steps at every step

Judged the same way each time, on the same device, always a **release** build:

1. Force-stop the app: `adb shell am force-stop com.buenapublica.GECRewards`
2. Launch it and wait for the home screen to settle
3. Open a partner/location detail (this mounts `SkeletonLocation`, `Slideshow`,
   `OfferList` and the `MapView` — S1, S3 and S5 at once)
4. Wait until loading completes and the skeleton is hidden
5. **Wait a further 10 seconds without touching the device**, then scroll the
   screen top-to-bottom twice at a steady pace
6. Back out, and repeat steps 3–5 on **four more** location screens

Verdict: **bad** if scrolling visibly stutters, or if it is noticeably worse on
the fifth screen than the first. That progression is the S1 signature — each
retained screen leaves nine skeleton worklets running.

Prefer `adb shell dumpsys gfxinfo com.buenapublica.GECRewards framestats` over
your own judgement wherever you can; four rebuilds is a lot of subjective calls.

```bash
git bisect start
git bisect bad 003-flatlist-optimization
git bisect good master
# for each step: rebuild release, run the scenario, then:
#   git bisect good   |   git bisect bad
git bisect reset
```

There are ~15 commits across `002` and `003`, so this is ~4 rebuilds. Slow, but decisive — and each
commit was deliberately kept to one concern to make exactly this possible.

Record the named commit. It determines which suspect in `data-model.md` is real.

---

## M3 — The decisive measurement: a static screen that should cost nothing

This is the one that confirms or kills **S1**.

1. Open a location detail screen and **wait for it to finish loading**
2. Do not touch the device
3. Reset and sample:

```bash
adb shell dumpsys gfxinfo $PKG reset
sleep 10
adb shell dumpsys gfxinfo $PKG framestats | head -40
```

**Expected if S1 is real**: a meaningful count of janky frames on a screen where nothing is moving —
nine skeleton worklets are still being evaluated every frame behind `display: none`.

**Expected if S1 is wrong**: janky frames ≈ 0. Move to S2/S3 and do not "fix" S1.

Also open Android Studio's Profiler and watch the **UI thread**, not the JS thread. S1 is a UI-thread
cost; the RN dev-menu perf monitor reports JS FPS prominently and will not show it.

---

## M4 — Scrolling cost (S3, S5)

```bash
adb shell dumpsys gfxinfo $PKG reset
# scroll an image-heavy list steadily for 30s
adb shell dumpsys gfxinfo $PKG framestats
```

Watch whether frame cost **recovers when scrolling stops**. Sustained cost after stopping points at
shimmers still running behind loaded images (S3); cost only while moving is ordinary list work.

---

## M5 — Heap growth (S4, and leak-vs-CPU)

Android Studio → Profiler → Memory.

1. Record the Java heap on the home screen
2. Visit **10** location detail screens, backing out of each
3. Return home, force a GC from the profiler
4. Record the heap again

**Budget: < 5 MB retained** (`contracts/performance-budget.md` C2).

Growth that survives GC is a real leak. Growth that collapses after GC, alongside high UI-thread
cost, is S1 — accumulating *work*, not accumulating *memory*. The report says "memory leaks"; this
step decides which it actually is.

---

## Verification after a fix

Re-run the exact scenario that named the suspect, on the same device, same build variant, and record
before/after per `contracts/performance-budget.md` C1.

- [ ] M1 documented — build variant confirmed
- [ ] M2 documented — commit named, or bisect explicitly abandoned with a reason
- [ ] The metric the suspect predicted actually moved
- [ ] Median of 3 runs, device cooled between runs (C3)
- [ ] `npm run check:animation`, `npm run audit:lists`, `npm test` all green (C6)
- [ ] Skeleton still *looks* right — a stopped animation must not leave a half-faded skeleton on
      screen during genuine loading
- [ ] iOS spot-checked — the fix touches shared components, not Android-only code

## Rollback

Every `002`/`003` commit is a single concern and reverts independently. If the bisect names one and
the fix proves fiddly, `git revert <sha>` is a legitimate outcome — record which behaviour is lost
by doing so.
