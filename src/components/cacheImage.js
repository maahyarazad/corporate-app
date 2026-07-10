import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Image, StyleSheet, View, Platform } from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import shorthash from "shorthash";
import { LinearGradient } from "expo-linear-gradient";

const getSafeExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
};

const SHIMMER_WIDTH = 200;

// iOS gets a softer shimmer; Android keeps the original punch
const IOS_SHIMMER_OPACITY = 0.45; // ← tune this (0.3–0.5 feels subtle)
const IOS_SHIMMER_COLOR = "rgba(255,255,255,0.15)"; // ← softer white peak
const AND_SHIMMER_COLOR = "rgba(255,255,255,0.7)"; // ← original

// Platform.OS can't change at runtime, so resolve the shimmer config once at
// module load instead of recomputing it on every render.
const IS_IOS = Platform.OS === "ios";
const SHIMMER_OPACITY = IS_IOS ? IOS_SHIMMER_OPACITY : 1;
const SHIMMER_COLORS = [
  "transparent",
  IS_IOS ? IOS_SHIMMER_COLOR : AND_SHIMMER_COLOR,
  "transparent",
];

const SkeletonLoader = ({ style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(300);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  // Recreate the interpolation only when the measured width changes.
  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-SHIMMER_WIDTH, containerWidth + SHIMMER_WIDTH],
      }),
    [shimmer, containerWidth]
  );

  const handleLayout = useCallback((e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const animatedStyle = useMemo(
    () => [
      StyleSheet.absoluteFill,
      { transform: [{ translateX }], opacity: SHIMMER_OPACITY },
    ],
    [translateX]
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

const styles = StyleSheet.create({
  skeletonWrapper: {
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  shimmerGradient: {
    width: SHIMMER_WIDTH,
    height: "100%",
  },
});

export default SkeletonLoader;
// ─────────────────────────────────────────────────────────────────────────────

export const CacheImage = ({
  uri,
  style,
  imgKey,
  onLoad,
  onLoadStart,
  pointerEvents,
  resizeMode = "contain",
  defaultResizeMode = "contain",
  local = false,
  defaultImage = require("../../assets/icon.png"),
}) => {
  const [source, setSource] = useState(null); // null = still loading
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // expo-file-system downloads can't be aborted, so this run always finishes;
    // it just may no longer be the one whose result matters. Cleanup runs both
    // when `uri` changes and on unmount, so this single flag covers a slow
    // download for a previous `uri` as well as the unmount case.
    let cancelled = false;
    const isActive = () => !cancelled;

    setIsLoading(true);
    setSource(null);
    setIsFallback(false);

    const cacheImage = async () => {
      try {
        if (!uri) {
          if (isActive()) {
            setSource(defaultImage);
            setIsFallback(true);
            setIsLoading(false);
          }
          return;
        }

        if (local) {
          if (isActive()) {
            setSource({ uri });
            setIsFallback(false);
            // isLoading stays true until Image onLoad fires
          }
          return;
        }

        const encodedUri = encodeURI(uri);
        const extension = getSafeExtension(encodedUri);
        const fileName = `${shorthash.unique(encodedUri)}${extension}`;

        const cacheDir = new Directory(Paths.cache, "images");
        cacheDir.create({ idempotent: true, intermediates: true });

        const file = new File(cacheDir, fileName);

        if (file.exists) {
          if (isActive()) {
            setSource({ uri: file.uri });
            setIsFallback(false);
          }
          return;
        }

        const downloadedFile = await File.downloadFileAsync(encodedUri, cacheDir);

        if (isActive()) {
          setSource({ uri: downloadedFile.uri });
          setIsFallback(false);
        }
      } catch (error) {
        if (isActive()) {
          if (uri) {
            setSource({ uri: encodeURI(uri) });
            setIsFallback(false);
          } else {
            setSource(defaultImage);
            setIsFallback(true);
            setIsLoading(false);
          }
        }
      }
    };

    cacheImage();

    return () => {
      cancelled = true;
    };
  }, [uri, local, defaultImage]);

  const deleteCachedImage = useCallback(
    async (_uri) => {
      try {
        if (!_uri || local) return;
        const encodedUri = encodeURI(_uri);
        const extension = getSafeExtension(encodedUri);
        const fileName = `${shorthash.unique(encodedUri)}${extension}`;
        const file = new File(new Directory(Paths.cache, "images"), fileName);
        if (file.exists) file.delete();
      } catch (_) {}
    },
    [local]
  );

  const handleOnError = useCallback(async () => {
    await deleteCachedImage(uri);
    setSource(defaultImage);
    setIsFallback(true);
    setIsLoading(false);
  }, [deleteCachedImage, uri, defaultImage]);

  const handleOnLoad = useCallback(
    (e) => {
      setIsLoading(false);
      onLoad?.(e);
    },
    [onLoad]
  );

  const appliedResizeMode = useMemo(
    () => (isFallback ? defaultResizeMode : resizeMode),
    [isFallback, defaultResizeMode, resizeMode]
  );

  const appliedStyle = useMemo(() => {
    if (!isFallback) return style;
    return [style, { maxWidth: "100%", maxHeight: "100%", alignSelf: "center" }];
  }, [style, isFallback]);

  const imageStyle = useMemo(
    () => [appliedStyle, isLoading && { opacity: 0 }],
    [appliedStyle, isLoading]
  );

  return (
    <View style={style}>
      {/* Skeleton shown while image hasn't fired onLoad yet */}
      {isLoading && <SkeletonLoader style={StyleSheet.absoluteFill} />}

      {/* Image rendered as soon as we have a source (hidden via opacity until loaded) */}
      {source && (
        <Image
          key={imgKey}
          source={source}
          style={imageStyle}
          resizeMode={appliedResizeMode}
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