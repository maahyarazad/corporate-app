import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { navigate } from "../navigation/navigate";
import { resolvePushDestination } from "./pushDestination";

export const UrlListener = () => {
  useEffect(() => {
    //Event Listener for Deep linking
    const handleOpenURL = async (event) => {
      const { url } = event;
      const { hostname, path, queryParams: params } = Linking.parse(url);

      // "gecmobile://event?id=720" parses to hostname "event" with a null path;
      // "gecmobile:///event?id=720" parses to path "event". Accept both.
      const target = path || hostname;

      if (target === "map") {
        navigate("Map");

        return;
      }

      // Deep links and push notifications share one destination mapping, so
      // the two entry points cannot drift apart.
      const destination = resolvePushDestination({ path: target, id: params?.id });

      if (!destination) return;

      navigate(destination.screen, destination.params);
    };

    const subscription = Linking.addEventListener("url", handleOpenURL);

    return () => subscription.remove();
  }, []);

  return <></>;
};

const styles = StyleSheet.create({
  container: {},
});
