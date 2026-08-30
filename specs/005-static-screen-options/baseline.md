# Baseline — 005 Static Screen Options

Captured on branch `005-static-screen-options` at 7a1b9f4 (2026-08-30).

## Gate values BEFORE implementation

| Gate | Command | Before | Expected after |
|---|---|---|---|
| G1 | `grep -c "options={{" navigation.js` | 22 | 1 |
| G3a | `grep -rn "value={{" src/services/ \| wc -l` | 5 | 0 |
| G3b | `grep -rn "const values = {" src/services/` | 5 hit | 0 |
| G4 | `grep -c "useNavigation" navigation.js` | 2 | import only or 0 |

### G2 — hooks inside header render callbacks
```
navigation.js-474-            const { sectionTitle } = useContext(SectionContext);
```

Expected after: `CLEAN`

## Gate values AFTER implementation

| Gate | After | Expected | Result |
|---|---|---|---|
| G1 inline options | 1 (`TransactionSummary`) | 1 | PASS |
| G2 hooks in header callbacks | CLEAN | CLEAN | PASS |
| G3a `value={{` in services | 2 | 0 | **PARTIAL** — both remaining are dead providers: `socket` (never mounted, zero consumers) and `user` v1 (provider commented out at `App.js:68`). Not memoized because they do not run. |
| G3b unmemoized `const values` | 3 | 0 | **PARTIAL** — `auth_v2`, `post`, `user_v2` deferred with reason (follow-ups.md) |
| G4 `useNavigation` in navigation.js | 0 | 0 | PASS |

### Line counts

| Metric | Before | After | Delta |
|---|---|---|---|
| navigation.js total | 713 | 722 | +9 |
| navigation.js code (non-comment, non-blank) | 633 | 576 | -57 |
| navigation.js comments | 20 | 68 | +48 |

SC-007 ("net line count decreases") is NOT met as written; code lines fell 57 while
explanatory comments rose 48. See follow-ups.md.

### Tests

`npx jest` — 27/27 pass (unchanged; the suite exercises none of this code).
Every edited file parses under babel-preset-expo.

### Not run

V2-V5 device walk — no emulator or device in this environment. US3 is code-complete,
not accepted.
