import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeArea } from "../components/safearea.component";

export const CameraScreen = () => {
  // expo-camera 17 (SDK 54): Camera/CameraType were removed. Use the
  // permission hook and CameraView, and a plain "back"/"front" string.
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
    return <Text>No access to camera</Text>;
  }

  const handlePress = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay} />
        <SafeArea style={styles.safeArea}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.text}> Flip </Text>
            </TouchableOpacity>
          </View>
        </SafeArea>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  button: {
    width: 50,
    backgroundColor: "palegreen",
  },
  buttonContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    zIndex: 1,
    top: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    height: 100,
    width: "100%",
  },
  safeArea: {
    zIndex: 20,
  },
});
