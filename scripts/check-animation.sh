#!/usr/bin/env bash
# Guardrail: fails if legacy React Native Animated or InteractionManager reappears.
#
# This codebase animates with react-native-reanimated. The legacy RN Animated API
# runs on the JS thread and InteractionManager defers work behind an opaque queue;
# both are banned. See specs/002-reanimated-migration/.
#
# The gate targets the legacy *API surface* rather than the import statement:
# many files pull Animated in via a multi-line `import { ... } from "react-native"`
# that a single-line import regex would miss. Animated.Value/.timing/.spring/.loop
# and friends exist only on React Native's API, never on Reanimated's.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

TARGETS=(src App.js navigation.js)
fail=0

LEGACY_API='Animated\.(Value|ValueXY|timing|spring|decay|sequence|parallel|stagger|loop|delay|event|createAnimatedComponent)'

if grep -rnE "$LEGACY_API" --include="*.js" --include="*.jsx" "${TARGETS[@]}"; then
  echo "" >&2
  echo "ERROR: legacy react-native Animated API found above." >&2
  echo "       Use react-native-reanimated (useSharedValue / useAnimatedStyle / withTiming)." >&2
  fail=1
fi

if grep -rn "InteractionManager" --include="*.js" --include="*.jsx" "${TARGETS[@]}"; then
  echo "" >&2
  echo "ERROR: InteractionManager is banned in this codebase." >&2
  echo "       Prefer Reanimated worklets or an explicit effect over deferring to its queue." >&2
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "check:animation OK - no legacy Animated API, no InteractionManager."
fi

exit $fail
