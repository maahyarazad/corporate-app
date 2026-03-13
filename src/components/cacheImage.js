import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import shorthash from "shorthash";

const getFileExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const lastDot = cleanUrl.lastIndexOf(".");
  if (lastDot === -1) return ".jpg";
  return cleanUrl.slice(lastDot);
};

export const CacheImage = ({
  uri,
  style,
  imgKey,
  onLoad,
  onLoadStart,
  pointerEvents,
  resizeMode,
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

        const name = shorthash.unique(uri);
        const extension = getFileExtension(uri);
        const path = `${FileSystem.cacheDirectory}${name}${extension}`;

        const fileInfo = await FileSystem.getInfoAsync(path);

        if (fileInfo.exists) {
          if (isMounted) {
            setSource({ uri: fileInfo.uri });
          }
          return;
        }

        const downloaded = await FileSystem.downloadAsync(uri, path);

        if (isMounted) {
          setSource({ uri: downloaded.uri });
        }
      } catch (error) {
        console.log("cache image error:", error);
        if (isMounted) {
          setSource(defaultImage);
        }
      }
    };

    cacheImage();

    return () => {
      isMounted = false;
    };
  }, [uri, local]);

  const deleteCachedImage = async (_uri) => {
    try {
      if (!_uri || local) return;

      const name = shorthash.unique(_uri);
      const extension = getFileExtension(_uri);
      const path = `${FileSystem.cacheDirectory}${name}${extension}`;

      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
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
    />
  );
};