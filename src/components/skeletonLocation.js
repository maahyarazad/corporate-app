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
      <View
        style={{
          height: 260,
          width: "100%",
        }}
      >
        <Skeleton
          animating={display}
          variant="square"
          height="100%"
          width="100%"
          opacityMax={0.2}
          opacityMin={0.1}
        />
      </View>
      <View style={{ padding: 16 }}>
        <View
          style={{
            height: 100,
            width: "100%",
            marginVertical: 16,
            flexDirection: "row",
          }}
        >
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
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Skeleton
          animating={display}
              variant="square"
              height="30%"
              width="100%"
              opacityMax={0.2}
              opacityMin={0.1}
              borderRadius={10}
              style={{ marginBottom: 10 }}
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

        <View style={{ marginVertical: 16 }}>
          <Skeleton
          animating={display}
            variant="square"
            height={30}
            width="50%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={{ marginBottom: 10 }}
          />
          <Skeleton
          animating={display}
            variant="square"
            height={100}
            width="100%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={{ marginBottom: 10 }}
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

        <View style={{ marginVertical: 16 }}>
          <Skeleton
          animating={display}
            variant="square"
            height={30}
            width="50%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={{ marginBottom: 10 }}
          />
          <Skeleton
          animating={display}
            variant="square"
            height={100}
            width="100%"
            opacityMax={0.2}
            opacityMin={0.1}
            borderRadius={10}
            style={{ marginBottom: 10 }}
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
});
