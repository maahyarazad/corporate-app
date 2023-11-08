import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import { TranslationContext } from "../services/translation/translation.context";
import { Spacer } from "./spacer/spacer.component";
import { Label } from "./typography/label.component";
import useUser from "../../hooks/useUser";
import { theme } from "../infrastructure/theme";

export const PostCardUpload = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { checkAuthorization } = useUser();
  const { i18n } = useContext(TranslationContext);

  useEffect(() => {
    let isMounted = true;

    if (isMounted)
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    return () => {
      isMounted = false;
      animatedValue.setValue(0);
    };
  }, []);

  const animatedStyle = {
    opacity: animatedValue,
  };

  const handleRefresh = async () => {
    checkAuthorization();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedView, animatedStyle]}>
        <Label size={"h5"} weight={"bold"} style={styles.label}>
          {i18n.t("card-upload.uploaded.heading")}
        </Label>
        <Spacer position={"top"} size={"medium"} />
        <Label size={"h5"} weight={"bold"} style={styles.label}>
          {i18n.t("card-upload.uploaded.heading2")}
        </Label>
        <Spacer position={"top"} size={"medium"} />
        <Label size={"title"} weight={"medium"} style={styles.label}>
          {i18n.t("card-upload.uploaded.message")}
        </Label>
        <Spacer position={"top"} size={"large"} />
        <View style={styles.notecontainer}>
          <Label
            size={"body"}
            weight={"regular"}
            style={[styles.label, styles.notelabel]}
          >
            {i18n.t("card-upload.uploaded.note")}
          </Label>
        </View>
      </Animated.View>
      <View style={{ flex: 1, marginTop: "20%" }}>
        <TouchableOpacity onPress={handleRefresh}>
          <View
            style={{
              backgroundColor: "white",
              width: 80,
              aspectRatio: 1,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 100,
              backgroundColor: theme.colors.icons.active,
            }}
          >
            <Ionicons name="refresh" size={30} color={"white"} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  animatedView: {
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "white",
    textAlign: "center",
    lineHeight: 35,
  },
  notecontainer: {
    alignSelf: "flex-start",
  },
  notelabel: {
    textAlign: "left",
  },
});
