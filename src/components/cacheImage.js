import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import * as FileSystem from "expo-file-system";
import shorthash from "shorthash";
import { findCharRight } from "../utils/findCharRight";

export const CacheImage = ({
  uri,
  style,
  imgKey,
  onLoad,
  onLoadStart,
  pointerEvents,
  resizeMode,
}) => {
  const [state, setState] = useState({ source: null });

  useEffect(() => {
    let isMounted = true;

    const cache = async () => {
      const name = shorthash.unique(uri);
      const extension = uri.slice(findCharRight(uri, "."));
      const path = `${FileSystem.cacheDirectory}${name}${extension}`;
      console.log("filesystem: ", path);
      const image = await FileSystem.getInfoAsync(path);

      if (image.exists) {
        if (isMounted) {
          // console.log("path:", path);
          // console.log("image from cache");
          setState({
            source: {
              uri: image.uri,
            },
          });
        }
        return;
      }
      const newImage = await FileSystem.downloadAsync(uri, path);

      if (isMounted) {
        // console.log("downloading image to cache");
        setState({
          source: {
            uri: newImage.uri,
          },
        });
      }
    };
    //www.reaconverter.com/howto/wp-content/uploads/2017/02/animation-1.gif
    https: cache();

    return () => {
      isMounted = false;
    };
  }, [uri]);

  return (
    <Image
      key={imgKey}
      onLoad={onLoad}
      resizeMode={resizeMode}
      onLoadStart={onLoadStart}
      source={state.source}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});
