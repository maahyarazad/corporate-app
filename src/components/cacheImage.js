import React, { useEffect, useMemo, useRef, useState } from "react";
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
const IOS_SHIMMER_OPACITY = 0.45;   // ← tune this (0.3–0.5 feels subtle)
const IOS_SHIMMER_COLOR  = "rgba(255,255,255,0.15)"; // ← softer white peak
const AND_SHIMMER_COLOR  = "rgba(255,255,255,0.7)";  // ← original

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

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, containerWidth + SHIMMER_WIDTH],
  });

  const isIOS = Platform.OS === "ios";

  return (
    <View
      style={[styles.skeletonWrapper, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            // iOS only: reduce overall shimmer brightness via opacity
            opacity: isIOS ? IOS_SHIMMER_OPACITY : 1,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            isIOS ? IOS_SHIMMER_COLOR : AND_SHIMMER_COLOR,
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: SHIMMER_WIDTH, height: "100%" }}
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
  resizeMode = "cover",
  defaultResizeMode = "contain",
  local = false,
  defaultImage = require("../../assets/icon.png"),
}) => {
  const [source, setSource] = useState(null); // null = still loading
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSource(null);
    setIsFallback(false);

    const cacheImage = async () => {
      try {
        if (!uri) {
          if (isMounted) {
            setSource(defaultImage);
            setIsFallback(true);
            setIsLoading(false);
          }
          return;
        }

        if (local) {
          if (isMounted) {
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
          if (isMounted) {
            setSource({ uri: file.uri });
            setIsFallback(false);
          }
          return;
        }

        const downloadedFile = await File.downloadFileAsync(encodedUri, cacheDir);

        if (isMounted) {
          setSource({ uri: downloadedFile.uri });
          setIsFallback(false);
        }
      } catch (error) {
        if (isMounted) {
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
    return () => { isMounted = false; };
  }, [uri, local, defaultImage]);

  const deleteCachedImage = async (_uri) => {
    try {
      if (!_uri || local) return;
      const encodedUri = encodeURI(_uri);
      const extension = getSafeExtension(encodedUri);
      const fileName = `${shorthash.unique(encodedUri)}${extension}`;
      const file = new File(new Directory(Paths.cache, "images"), fileName);
      if (file.exists) file.delete();
    } catch (_) {}
  };

  const handleOnError = async () => {
    await deleteCachedImage(uri);
    setSource(defaultImage);
    setIsFallback(true);
    setIsLoading(false);
  };

  const handleOnLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const appliedResizeMode = isFallback ? defaultResizeMode : resizeMode;

  const appliedStyle = useMemo(() => {
    if (!isFallback) return style;
    return [style, { maxWidth: "100%", maxHeight: "100%", alignSelf: "center" }];
  }, [style, isFallback]);

  return (
    <View style={style}>
      {/* Skeleton shown while image hasn't fired onLoad yet */}
      {isLoading && (
        <SkeletonLoader style={StyleSheet.absoluteFill} />
      )}

      {/* Image rendered as soon as we have a source (hidden via opacity until loaded) */}
      {source && (
        <Image
          key={imgKey}
          source={source}
          style={[appliedStyle, isLoading && { opacity: 0 }]}
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