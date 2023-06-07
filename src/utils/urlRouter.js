import React, { useContext, useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import * as Linking from "expo-linking";
import { navigate } from "../navigation/navigate";
import { LocationContext } from "../services/location/location.context";
import { config } from "./constants";

export const UrlListener = () => {
  const { eventList } = useContext(LocationContext);
  useEffect(() => {
    let isMounted = true;

    //Event Listener for Deep linking
    const handleOpenURL = async (event) => {
      const { url } = event;
      const { path, queryParams: params } = Linking.parse(url);

      switch (path) {
        case "map":
          navigate("Map");
          // Alert.alert("DEEP LINKING WORKS!", params.location);
          break;
        case "partner":
          navigate("Location View", {
            locId: params.id,
          });
          break;
        case "event":
          const eventFound = eventList.find((event) => {
            event.id === params.id;
          });

          console.log(eventFound);
          navigate("Event Detail", {
            id: params.id,
          });
          break;
      }
    };

    const subscription = Linking.addEventListener("url", handleOpenURL);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return <></>;
};

const styles = StyleSheet.create({
  container: {},
});
