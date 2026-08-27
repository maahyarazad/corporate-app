import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { File } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import {
  fileForUrl,
  getCachedImage,
  putCachedImage,
  removeCachedImage,
} from "../../utils/imageCache";

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SHIMMER_WIDTH = 200;

// iOS gets a softer shimmer; Android keeps the original punch.
// Platform.OS can't change at runtime, so resolve this once at module load.
const IS_IOS = Platform.OS === "ios";
const SHIMMER_OPACITY = IS_IOS ? 0.45 : 1;
const SHIMMER_COLORS = [
  "transparent",
  IS_IOS ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
  "transparent",
];

const SkeletonLoader = ({ style }) => {
  const shimmer = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(300);

  useEffect(() => {
    shimmer.value = 0;
    // Easing spelled out because Animated.timing defaulted to inOut(ease)
    // while withTiming defaults to inOut(quad) - keep the original feel.
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );

    // withRepeat has no stoppable handle, unlike the Animated.loop it replaces.
    return () => {
      cancelAnimation(shimmer);
    };
  }, [shimmer]);

  const handleLayout = useCallback((e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // Reads containerWidth directly: useAnimatedStyle re-evaluates when the
  // measured width changes, so the old useMemo interpolation is unnecessary.
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-SHIMMER_WIDTH, containerWidth + SHIMMER_WIDTH]
        ),
      },
    ],
    opacity: SHIMMER_OPACITY,
  }));

  const animatedStyle = useMemo(
    () => [StyleSheet.absoluteFill, shimmerStyle],
    [shimmerStyle]
  );

  return (
    <View style={[styles.skeletonWrapper, style]} onLayout={handleLayout}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={SHIMMER_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

export default memo(SkeletonLoader);

// ─── Resolution + de-duplication ─────────────────────────────────────────────

// Module scope on purpose. Twenty rows sharing one avatar URL should produce
// one download and one SQLite write, not twenty of each. Entries are removed
// as soon as they settle, so this never grows without bound.
const inFlight = new Map();

const resolveImage = (encodedUri) => {
  const existing = inFlight.get(encodedUri);
  if (existing) return existing;

  const promise = (async () => {
    // Hit: SQLite knows this url and the bytes it points at are still on disk.
    // (getCachedImage verifies the file and self-heals if it's gone.)
    const cachedPath = await getCachedImage(encodedUri);
    if (cachedPath) return cachedPath;

    // Miss: download to a deterministic path, then record where it landed.
    // `idempotent` is required, not cosmetic: a miss can coexist with an
    // existing file (an install predating this SQLite table, or a crash between
    // the download and the insert), and without it downloadFileAsync throws
    // DestinationAlreadyExists instead of overwriting.
    const target = fileForUrl(encodedUri);
    const downloadedFile = await File.downloadFileAsync(encodedUri, target, {
      idempotent: true,
    });

    // Bookkeeping only — never block display on it. If the insert fails we
    // just re-download next time.
    putCachedImage(encodedUri, downloadedFile).catch(() => {});

    return downloadedFile.uri;
  })();

  inFlight.set(encodedUri, promise);
  const forget = () => inFlight.delete(encodedUri);
  promise.then(forget, forget);

  return promise;
};

// ─── CacheImage ──────────────────────────────────────────────────────────────

// Hoisted so the default param is one stable reference, not a fresh one per render.
const FALLBACK_IMAGE = require("../../assets/icon.png");

const CacheImageBase = ({
  uri,
  style,
  imgKey,
  onLoad,
  onLoadStart,
  pointerEvents,
  resizeMode = "contain",
  defaultResizeMode = "contain",
  local = false,
  defaultImage = FALLBACK_IMAGE,
}) => {
  const [source, setSource] = useState(null); // null = still resolving
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Read at call time, never a dependency. A caller passing an inline object
  // (defaultImage={{ uri }}) would otherwise re-trigger the effect forever.
  const defaultImageRef = useRef(defaultImage);
  defaultImageRef.current = defaultImage;

  // Monotonic token: only the newest run is allowed to write state. Covers a
  // slow download for a previous `uri` as well as unmount.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const isActive = () => requestId.current === id;

    setIsLoading(true);
    setSource(null);
    setIsFallback(false);

    (async () => {
      if (!uri) {
        if (isActive()) {
          setSource(defaultImageRef.current);
          setIsFallback(true);
          setIsLoading(false);
        }
        return;
      }

      if (local) {
        // isLoading stays true until Image fires onLoad.
        if (isActive()) setSource({ uri });
        return;
      }

      const encodedUri = encodeURI(uri);

      try {
        const path = await resolveImage(encodedUri);
        if (isActive()) setSource({ uri: path });
      } catch {
        // Cache path failed — let Image try the remote URL directly.
        if (isActive()) setSource({ uri: encodedUri });
      }
    })();

    return () => {
      requestId.current++;
    };
  }, [uri, local]);

  const handleOnLoad = useCallback(
    (e) => {
      setIsLoading(false);
      onLoad?.(e);
    },
    [onLoad]
  );

  // A broken image means the cached bytes are bad, so drop the file *and* the
  // row that points at it — leaving the row would keep serving the bad path.
  const handleOnError = useCallback(async () => {
    // The fallback itself failed to decode. Stop, or we loop.
    if (isFallback) {
      setIsLoading(false);
      return;
    }

    if (uri && !local) {
      await removeCachedImage(encodeURI(uri)).catch(() => {});
    }

    setSource(defaultImageRef.current);
    setIsFallback(true);
    setIsLoading(false);
  }, [uri, local, isFallback]);

  // Remounting on source change kills the stale-onError race and replays the fade.
  const imageKey = `${imgKey ?? ""}:${source?.uri ?? "fallback"}`;

  return (
    <View style={[styles.container, style]}>
      {isLoading && <SkeletonLoader style={StyleSheet.absoluteFill} />}

      {source && (
        <Image
          key={imageKey}
          source={source}
          style={[StyleSheet.absoluteFill, isLoading && styles.hidden]}
          resizeMode={isFallback ? defaultResizeMode : resizeMode}
          onLoad={handleOnLoad}
          onLoadStart={onLoadStart}
          onError={handleOnError}
          pointerEvents={pointerEvents}
          fadeDuration={150}
        />
      )}
    </View>
  );
};

// Without this, the useCallbacks above buy nothing: a parent re-render walks
// every CacheImage in the list regardless.
export const CacheImage = memo(CacheImageBase);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    // Lets a borderRadius on the passed-in `style` actually clip the image.
    overflow: "hidden",
  },
  hidden: {
    opacity: 0,
  },
  skeletonWrapper: {
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  shimmerGradient: {
    width: SHIMMER_WIDTH,
    height: "100%",
  },
});