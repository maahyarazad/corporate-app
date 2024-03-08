import React, { useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { itemSeparatorVL } from "../styles";

export const LoadingOverlay = ({
  display,
  showCancel = false,
  onCancel,
  background = true,
}) => {
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
          backgroundColor: "#00000055",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          zIndex: 100,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            elevation: 12,
            borderRadius: 12,
          }}
        >
          <ActivityIndicator size="large" color="#FFB400" animating={true} />
        </View>

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
