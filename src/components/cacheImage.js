import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import * as FileSystem from "expo-file-system";
import shorthash from "shorthash";

const getSafeExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? `.${match[1]}` : ".jpg";
};

export const CacheImage = ({
  uri,
  style,
  imgKey,
  onLoad,
  onLoadStart,
  pointerEvents,
  resizeMode = "cover",
  local = false,
  defaultImage = require("../../assets/icon.png"),
}) => {
  const [source, setSource] = useState(defaultImage);

  useEffect(() => {
    let isMounted = true;

    const cacheImage = async () => {
      try {
        if (!uri) {
          if (isMounted) setSource(defaultImage);
          return;
        }

        if (local) {
          if (isMounted) {
            setSource({ uri });
          }
          return;
        }

        const encodedUri = encodeURI(uri);
        const extension = getSafeExtension(encodedUri);
        const fileName = `${shorthash.unique(encodedUri)}${extension}`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          if (isMounted) {
            setSource({ uri: fileInfo.uri });
          }
          return;
        }

        const downloadResult = await FileSystem.downloadAsync(encodedUri, fileUri);

        if (downloadResult.status !== 200) {
          throw new Error(`Image download failed with status ${downloadResult.status}`);
        }

        if (isMounted) {
          setSource({ uri: downloadResult.uri });
        }
      } catch (error) {
        console.log("cache image error:", error, "uri:", uri);

        if (isMounted) {
          // fallback to remote image first, then local placeholder if remote also fails
          setSource(uri ? { uri: encodeURI(uri) } : defaultImage);
        }
      }
    };

    cacheImage();

    return () => {
      isMounted = false;
    };
  }, [uri, local, defaultImage]);

  const deleteCachedImage = async (_uri) => {
    try {
      if (!_uri || local) return;

      const encodedUri = encodeURI(_uri);
      const extension = getSafeExtension(encodedUri);
      const fileName = `${shorthash.unique(encodedUri)}${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (error) {
      console.log("Failed to delete cached image:", error);
    }
  };

  const handleOnError = async () => {
    await deleteCachedImage(uri);
    setSource(defaultImage);
  };

  return (
    <Image
      key={imgKey}
      source={source}
      style={style}
      resizeMode={resizeMode}
      onLoad={onLoad}
      onLoadStart={onLoadStart}
      onError={handleOnError}
      pointerEvents={pointerEvents}
      fadeDuration={150}
    />
  );
};