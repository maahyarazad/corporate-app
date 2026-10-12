# Follow-ups from the Reanimated migration

Recorded during implementation so the open decisions are not lost. None of these
block the migration, which is complete and passing its gate.

---

## F1 — Defect D3: state setters fire at animation START, not end (T045)

Two sites wrote `.start(setState(...))`. JS evaluates the argument before calling
`.start()`, so the setter ran immediately and its `undefined` return became the completion
callback. The state change therefore happened when the animation *started*.

**This behaviour was preserved deliberately** during the migration — the setter is now called
explicitly before the animation begins. Changing it would alter UX inside what was scoped as a
refactor. Someone who owns the UX needs to decide whether the original intent was end-of-animation.

| Site | State | Current (preserved) | Alternative |
|---|---|---|---|
| `src/components/customTextInput.js` — `floatUp` / `floatDown` | `setFocused(true/false)` | Fires as the label starts floating | `runOnJS(setFocused)` in the `withTiming` completion callback |
| `src/features/profile/profRedeemHistory.js` — `showBreakdown` / `hideBreakdown` | `setDisplayBreakdown(!displayBreakdown)` | Fires as the panel starts moving | `runOnJS(setDisplayBreakdown)` in the completion callback |

`focused` drives the label colour in `customTextInput`, so moving it to the end would delay the
colour change by 200ms. That is very likely *not* wanted — evidence that the current behaviour is
the intended one and this may simply be closed as "working as intended".

**Recommendation**: close F1 as no-change unless the 200ms colour lag is desired.

---

## F2 — Spring feel needs tuning on a device (T026, T034)

The legacy `Animated.spring` took `speed`, which Reanimated does not implement — it only has the
physical damping/stiffness model, and there is no algebraic conversion from the speed/bounciness
parameterisation. Two sites were converted with starting values that **have not been compared
against the baseline on hardware**:

| Site | Legacy | Current | Notes |
|---|---|---|---|
| `src/components/animatedButton.js` | `speed: 200` (public prop, default kept) | `{ damping: 15, stiffness: speed * 0.75 }` | Prop name and default preserved; higher still means faster |
| `src/screens/login/requestapproval.screen.js` | `speed: 40` ×2 | `{ damping: 20, stiffness: 90 }` | Camera container open/close |

**Action**: run quickstart scenarios B6 and D5 side by side with the baseline recording and adjust.

---

## F3 — ESLint is still not a working gate (T046, partially done)

Repaired during implementation:
- installed `eslint-config-prettier` (was referenced but absent — ESLint would not start at all)
- `"parser": "babel-eslint"` → `"@babel/eslint-parser"` (the named package is not installed)
- dropped `"prettier/react"`, removed from `eslint-config-prettier` v9+
- `lint` / `lint:fix` scripts repointed from the non-existent `app/` to `src`
- added `no-restricted-imports` + `no-restricted-globals` banning `Animated` from `react-native`
  and `InteractionManager` — **verified firing** on a probe file

Still broken, and out of scope for this migration:
- `eslint-import-resolver-alias` is referenced by `settings.import/resolver` but not installed,
  so every `import/*` rule errors with "unable to load resolver".
- `eslint src` reports **7,898 problems** (7,719 errors). The airbnb config has evidently never
  been applied to this codebase — the bulk is `react/prop-types`,
  `react/function-component-definition`, and `import/prefer-default-export`.

**`npm run lint` therefore still does not pass.** It was not passing before this work either.
The enforcement that actually works today is `npm run check:animation`.

**Action**: decide whether to keep airbnb (a large cleanup) or move to a lighter shared config.
Until then, the ESLint rules added above serve as editor feedback only.

---

## F4 — Duplicate success screens

`registrationSuccess.screen.js` and `registrationSuccessByServices.screen.js` are near-identical,
differing mainly in stagger delays (1000/1000/1500ms vs 500ms throughout) and their content. Both
were converted independently and left duplicated on purpose — merging them is a design decision,
not a refactor step.
