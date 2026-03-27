import React, { useEffect, useMemo, useState } from "react";
import { Image } from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import shorthash from "shorthash";

const getSafeExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
};

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
  const [source, setSource] = useState(defaultImage);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cacheImage = async () => {
      try {
        
        if (!uri) {
          if (isMounted) {
            setSource(defaultImage);
            setIsFallback(true);
          }
          return;
        }

        if (local) {
          if (isMounted) {
            setSource({ uri });
            setIsFallback(false);
          }
          return;
        }


        const encodedUri = encodeURI(uri);
        const extension = getSafeExtension(encodedUri);
        const fileName = `${shorthash.unique(encodedUri)}${extension}`;

        // Optional subfolder inside cache
        const cacheDir = new Directory(Paths.cache, "images");
        cacheDir.create({ idempotent: true, intermediates: true });

        const file = new File(cacheDir, fileName);

        // console.log("CacheImage start");
        // console.log("encodedUri:", encodedUri);
        // console.log("fileName:", fileName);
        // console.log("fileUri:", file.uri);
        // console.log("exists:", file.exists);

        if (file.exists) {
          if (isMounted) {
            setSource({ uri: file.uri });
            setIsFallback(false);
          }
          return;
        }

        // Downloads into the directory and returns a File
        const downloadedFile = await File.downloadFileAsync(encodedUri, cacheDir);

        if (isMounted) {
          setSource({ uri: downloadedFile.uri });
          setIsFallback(false);
        }
      } catch (error) {
        // console.log("cache image error:", error, "uri:", uri);

        if (isMounted) {
          // fallback to remote image if available, otherwise local placeholder
          if (uri) {
            setSource({ uri: encodeURI(uri) });
            setIsFallback(false);
          } else {
            setSource(defaultImage);
            setIsFallback(true);
          }
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

      const file = new File(new Directory(Paths.cache, "images"), fileName);

      if (file.exists) {
        file.delete();
      }
    } catch (error) {
    //   console.log("Failed to delete cached image:", error);
    }
  };

  const handleOnError = async () => {
    await deleteCachedImage(uri);
    setSource(defaultImage);
    setIsFallback(true);
  };

  const appliedResizeMode = isFallback ? defaultResizeMode : resizeMode;

  const appliedStyle = useMemo(() => {
    if (!isFallback) return style;

    return [
      style,
      {
        maxWidth: "100%",
        maxHeight: "100%",
        alignSelf: "center",
      },
    ];
  }, [style, isFallback]);

  return (
    <Image
      key={imgKey}
      source={source}
      style={appliedStyle}
      resizeMode={appliedResizeMode}
      onLoad={onLoad}
      onLoadStart={onLoadStart}
      onError={handleOnError}
      pointerEvents={pointerEvents}
      fadeDuration={150}
    />
  );
};