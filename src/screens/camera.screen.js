import { Camera, CameraType } from "expo-camera";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeArea } from "../components/safearea.component";

export const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [type, setType] = useState(CameraType.back);

  useEffect(() => {
    // (async () => {
    //   const { status } = await Camera.requestCameraPermissionsAsync();
    //   setHasPermission(status === "granted");
    // })();
    // The permission prompt can't be aborted; it resolves whenever the user
    // answers it. This only discards the answer if we're no longer listening.
    let cancelled = false;

    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      if (status === "granted") {
        if (!cancelled) setHasPermission(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const handlePress = () => {
    setType(type === CameraType.back ? CameraType.front : CameraType.back);
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type}>
        <View style={styles.overlay}></View>
        <SafeArea style={styles.safeArea}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.text}> Flip </Text>
            </TouchableOpacity>
          </View>
        </SafeArea>
      </Camera>
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
