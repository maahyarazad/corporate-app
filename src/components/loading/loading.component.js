import React, { useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { itemSeparatorVL } from "../styles";

export const LoadingOverlay = ({ display, showCancel = false, onCancel }) => {
  // const [cancel, setCancel] = useState(false);

  // const handleCancel = () => {
  //   setCancel(true);
  // };

  return (
    <>
      <View
        style={{
          display: display ? "flex" : "none",
          flex: 1,
          width: "100%",
          height: "100%",
          backgroundColor: "#000000cc",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          zIndex: 100,
        }}
      >
        <ActivityIndicator size="large" color="#FFB400" animating={true} />

        {showCancel && (
          <>
            <View style={{ position: "absolute", bottom: 30 }}>
              <Button
                onPress={onCancel}
                mode="contained"
                contentStyle={{
                  backgroundColor: "#FFB400",
                  paddingHorizontal: 30,
                  paddingVertical: 10,
                }}
              >
                Cancel
              </Button>
            </View>
          </>
        )}
      </View>
    </>
  );
};
