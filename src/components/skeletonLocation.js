import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "./skeleton";

export const SkeletonLocation = ({ display, backgroundColor = "#efefef" }) => {
  return (
    <View
      style={[
        styles.container,
        {
          display: display ? "flex" : "none",
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <View style={styles.hero}>
        <Skeleton
          animating={display}
          variant="square"
          height="100%"
          width="100%"
          opacityMax={0.2}
          opacityMin={0.1}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <View>
            <Skeleton
          animating={display}
              variant="circle"
              height={100}
              width={100}
              opacityMax={0.2}
              opacityMin={0.1}
              borderRadius={10}
            />
          </View>
          <View style={styles.infoText}>
            <Skeleton
          animating={display}
              variant="square"
              height="30%"
              width="100%"
              opacityMax={0.2}
              opacityMin={0.1}
              borderRadius={10}
              style={styles.line}
            />
            <Skeleton
          animating={display}
              variant="square"
              height="30%"
              width="50%"
              opacityMax={0.2}
              opacityMin={0.1}
              borderRadius={10}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Skeleton
          animating={display}
            variant="square"
            height={30}
            width="50%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={styles.line}
          />
          <Skeleton
          animating={display}
            variant="square"
            height={100}
            width="100%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={styles.line}
          />
          <Skeleton
          animating={display}
            variant="square"
            height={100}
            width="100%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
          />
        </View>

        <View style={styles.section}>
          <Skeleton
          animating={display}
            variant="square"
            height={30}
            width="50%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={styles.line}
          />
          <Skeleton
          animating={display}
            variant="square"
            height={100}
            width="100%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={styles.line}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: "#efefef",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
  },
  hero: { height: 260, width: "100%" },
  body: { padding: 16 },
  infoRow: {
    height: 100,
    width: "100%",
    marginVertical: 16,
    flexDirection: "row",
  },
  infoText: { flex: 1, paddingLeft: 16 },
  section: { marginVertical: 16 },
  line: { marginBottom: 10 },
});
