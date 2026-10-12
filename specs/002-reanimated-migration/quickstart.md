# Quickstart: Validating the Reanimated Migration

Animation correctness cannot be asserted in Jest here (see `research.md` R6). Validation is an
automated import gate plus a scripted manual sweep on a physical device.

## Prerequisites

- Physical iOS and Android device (Expo Go is not sufficient — this is a dev-client build)
- `npm install` clean
- New Architecture confirmed: `android/gradle.properties` has `newArchEnabled=true` (verified).
  iOS has no explicit flag in `ios/Podfile.properties.json`; Expo SDK 54 defaults it on —
  confirm in the app logs that Fabric is active before starting.

## Baseline capture (do this BEFORE any conversion)

The success criterion is "indistinguishable from before", which requires a before.

```bash
git checkout master
npm install
npm run ios     # and: npm run android
```

Screen-record each scenario in §Sweep on both platforms. Keep the recordings; they are the
comparison target. Without them, "looks the same" is unfalsifiable.

Also record the current state of the two gates so pre-existing failures are not attributed to
this work:

```bash
npm test        # note pass/fail — jest-expo is installed but unconfigured
npx eslint src  # expected to FAIL: missing eslint-config-prettier (known, see research R6)
```

## Automated gates

Add to `package.json` (task T-05a). **Do not gate on the import line** — 9 of the 18 files pull
`Animated` in via a multi-line `import { ... } from "react-native"`, which a single-line regex
misses. Gate on the legacy API surface instead: `Animated.Value`, `.timing`, `.spring`, `.loop`,
`.event` and friends exist only on the React Native API, never on Reanimated's.

```json
"check:animation": "scripts/check-animation.sh"
```

`scripts/check-animation.sh`:

```bash
#!/usr/bin/env bash
# Fails if legacy RN Animated or InteractionManager reappears.
set -uo pipefail
TARGETS=(src App.js navigation.js)
fail=0

if grep -rnE "Animated\.(Value|ValueXY|timing|spring|decay|sequence|parallel|stagger|loop|delay|event|createAnimatedComponent)" \
     --include="*.js" --include="*.jsx" "${TARGETS[@]}"; then
  echo "ERROR: legacy react-native Animated API found (use react-native-reanimated)" >&2
  fail=1
fi

if grep -rn "InteractionManager" --include="*.js" --include="*.jsx" "${TARGETS[@]}"; then
  echo "ERROR: InteractionManager is banned in this codebase" >&2
  fail=1
fi

exit $fail
```

Verified against the tree as it stands today: the first grep matches **61 lines across 17 files**
(the 18th, `headerImage.component.js`, uses only `<Animated.Image>` and is deleted outright), and
the second matches **0**. So the gate fails now and must pass when the migration is done.

Note the paths: source lives in `src/`, plus `App.js` and the root-level `navigation.js`. There is
no `app/` directory, despite what `npm run lint` targets.

Run after every phase:

```bash
npm run check:animation   # must exit 0
npm test                  # must be no worse than baseline
```

Expected end state: both greps return nothing and the script exits 0.

## Sweep — per-scenario manual validation

Run each after its owning phase. Compare against the baseline recording.

### Phase B (mechanical conversions)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| B1 | Validation shake ×5 | Submit each of: corporate registration, registration details, change password, forgot password, update member — with an invalid field | Form container shakes left-right, same amplitude and duration as baseline, on every one of the five |
| B2 | Registration success | Complete registration (both the standard and by-services paths) | Bounce + staggered fade of text then button; same stagger timing |
| B3 | Skeleton shimmer | Open any list while loading; force slow network | Continuous opacity pulse, no stutter, no visible seam at loop boundary |
| B4 | Cached image shimmer | Scroll a list of remote images | Shimmer while loading, stops on load. **Scroll a long list, then check CPU/JS FPS in the dev menu perf monitor — a leaked `withRepeat` shows as FPS decay over time** |
| B5 | Mount fade-ins | Open transaction summary; open a screen rendering `PostCardUpload` | Elements fade in on mount; navigating away and back re-runs it, no flash of the final state |
| B6 | Button press | Press the `AnimatedButton` on the request-approval screen | Scales to 0.9 with a spring and dims on press-in, springs back on release. Feel must match baseline — this is the R5 tuning check |

### Phase C (scroll handler)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| C1 | Location header slide | Open a location detail; scroll the list down past ~270px, then back up | Sticky header slides down into view between scroll offsets 100 and 270, clamps at both ends, and sits **above** the list (`zIndex: 999`) |
| C2 | Pull to refresh | On the same screen, pull down from the top | `RefreshControl` still triggers and spins — verify it was not broken by swapping to the Reanimated `Animated.FlatList` |
| C3 | Fling | Fling the list hard | Header tracks the scroll with no lag. This should be visibly *smoother* than baseline |

### Phase D (JS-driven — the risky ones)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| D1 | Floating label | On every form: focus an empty input, type, blur; then blur while empty | Label floats up on focus/content, drops back only when empty. Scale, X and Y offsets match baseline. **Check a long label and a short label** — X offset is `label.length * -1` |
| D2 | Input imperative ref | Trigger whatever calls `focus()` / `clear()` on the input | Still works — the `forwardRef` contract (contract C1) is intact |
| D3 | Prefilled form | Open a form that loads existing values | Labels start floated (the `useLayoutEffect` path), with no visible animation-from-zero on mount |
| D4 | Offer list expand | Tap show-all on a partner with >2 offers, then collapse | Height animates over 300ms both ways. **`showAll` must flip only after collapse finishes** — if the list content swaps early, `runOnJS` guarding is wrong (contract C3) |
| D5 | Camera container | Open then close the camera on the request-approval screen | Container springs open to `imageHeightRatio + 150`, springs closed after a 200ms delay, and `setIsCameraOpen(false)` fires **after** the close completes — the camera must not unmount mid-animation |
| D6 | Redeem breakdown | Toggle the breakdown panel in profile redeem history | See the note below — this one needs a product decision, not just a visual check |

**D6 is not a like-for-like comparison.** Per defect D4, this animation currently declares
`useNativeDriver: true` while animating `height`, which the native driver does not support — so
it probably does not animate today. After conversion it will. Confirm with the product owner
whether the animating panel is the intended behaviour before signing this off; if not, the
correct fix is to remove the animation, not to reproduce the broken version.

## Regression checklist

- [ ] Both gates pass: `npm run check:animation`, `npm test` no worse than baseline
- [ ] All sweep scenarios pass on **both** iOS and Android
- [ ] No new yellow-box warnings mentioning Reanimated, worklets, or `runOnJS`
- [ ] **Release build tested**, not just dev — `runOnJS` omissions and worklet capture bugs
      frequently only surface in release
- [ ] Perf monitor shows no JS FPS decay after 2 minutes of scrolling image lists (loop leaks)
- [ ] Defect D3 sites reviewed: current behaviour preserved, follow-up logged
- [ ] `git grep -n Extrapolate` returns nothing (contract C5)

## Rollback

Every task is one file and one commit, so any single conversion reverts with
`git revert <sha>` without touching the rest. If a whole phase misbehaves, revert its commit
range — no phase depends on a later phase.
