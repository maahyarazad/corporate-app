import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { AuthContext } from "../services/auth/auth.context";
import { TranslationContext } from "../services/translation/translation.context";
import { Spacer } from "./spacer/spacer.component";
import { Label } from "./typography/label.component";

export const PostCardUpload = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { retrieve } = useContext(AuthContext);
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

  const handleRefresh = () => {
    retrieve();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedView, animatedStyle]}>
        <Label size={"h5"} weight={"bold"} style={styles.label}>
          {i18n.t("card-upload.uploaded.heading")}
        </Label>
        <Label size={"h5"} weight={"bold"} style={styles.label}>
          {i18n.t("card-upload.uploaded.heading")}
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
      <View style={{ flex: 1, marginTop: "40%" }}>
        <Button
          onPress={handleRefresh}
          mode="contained"
          style={{ borderRadius: 100 }}
          contentStyle={{
            height: 100,
            width: 100,
            borderRadius: 100,
            backgroundColor: "orange",
          }}
        >
          <Ionicons name="refresh" size={50} />
        </Button>
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
