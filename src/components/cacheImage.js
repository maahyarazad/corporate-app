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
  local = false,
  defaultImage = "",
  // defaultImage = "https://www.german-emirates-club.com/user/member_images/non_img_men_s1.jpg",
}) => {
  const [state, setState] = useState({ source: null });

  useEffect(() => {
    let isMounted = true;

    const cache = async () => {
      try {
        const name = shorthash.unique(uri);
        const extension = uri.slice(findCharRight(uri, "."));
        const path = `${FileSystem.cacheDirectory}${name}${extension}`;
        const image = await FileSystem.getInfoAsync(path);

        if (local) {
          if (isMounted) {
            // console.log("downloading image to cache");
            setState({
              source: {
                uri: uri,
              },
            });
          }
        } else {
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
        }
      } catch (error) {
        console.log("cache image error: ", error);
      }
    };
    //www.reaconverter.com/howto/wp-content/uploads/2017/02/animation-1.gif
    cache();

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
      onError={() => {
        console.log("ERROR LOADING IMAGE");
        setState({
          source: require("../../assets/icon.png"),
        });
      }}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});
