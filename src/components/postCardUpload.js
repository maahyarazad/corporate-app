import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TranslationContext } from "../services/translation/translation.context";
import { Label } from "./typography/label.component";
import useUser from "../../hooks/useUser";
import { theme } from "../infrastructure/theme";

export const PostCardUpload = () => {
  const animatedValue = useSharedValue(0);
  const { checkAuthorization } = useUser();
  const { i18n } = useContext(TranslationContext);

  useEffect(() => {
    animatedValue.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });

    return () => {
      cancelAnimation(animatedValue);
      animatedValue.value = 0;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
  }));

  const handleRefresh = async () => {
    checkAuthorization();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedView, animatedStyle]}>
        <View style={styles.wrapper}>

            <Label size="h5" weight="bold" style={styles.label}>
            {i18n.t("card-upload.uploaded.heading")}
            </Label>
        </View>
        
        <View style={styles.wrapper}>

            <Label size="h5" weight="bold" style={styles.label}>
            {i18n.t("card-upload.uploaded.heading2")}
            </Label>
        </View>
        
          <View style={styles.wrapper}>

        <Label size="title" weight="medium" style={styles.label}>
          {i18n.t("card-upload.uploaded.message")}
        </Label>
          </View>
        

        <View style={styles.notecontainer}>
          <Label
            size="body"
            weight="regular"
            style={[styles.label, styles.notelabel]}
          >
            {i18n.t("card-upload.uploaded.note")}
          </Label>
        </View>
      </Animated.View>
      <View style={styles.flexBox}>
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
            <Ionicons name="refresh" size={30} color="white" />
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
  wrapper:{
    marginBottom: 10
  },
  flexBox: {
    flex: 1,
    marginTop: "20%",
  },
});
