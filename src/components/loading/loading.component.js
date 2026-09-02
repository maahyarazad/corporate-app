import React from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";

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
      <View style={[styles.overlay2, { display: display ? "flex" : "none" }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFB400" animating={true} />
        </View>

        {showCancel && (
          <>
            <View style={styles.overlay}>
              <Button
                onPress={onCancel}
                mode="contained"
                contentStyle={styles.buttonContent}
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

const styles = StyleSheet.create({
  centerBox: {
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
  },
  overlay: {
    position: "absolute",
    bottom: 30,
  },
  buttonContent: {
    backgroundColor: "#FFB400",
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  overlay2: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#00000055",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 100,
  },
});
