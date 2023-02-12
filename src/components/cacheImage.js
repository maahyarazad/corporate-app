import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import * as FileSystem from "expo-file-system";
import shorthash from "shorthash";

export const CacheImage = ({ uri, style, imgKey, onLoad, onLoadStart }) => {
  const [state, setState] = useState({ source: null });

  useEffect(() => {
    let isMounted = true;

    const cache = async () => {
      const name = shorthash.unique(uri);
      const path = `${FileSystem.cacheDirectory}${name}`;
      const image = await FileSystem.getInfoAsync(path);

      if (image.exists) {
        if (isMounted) {
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

    cache();

    return () => {
      isMounted = false;
    };
  }, [uri]);

  return (
    <Image
      key={imgKey}
      onLoad={onLoad}
      onLoadStart={onLoadStart}
      source={state.source}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});
