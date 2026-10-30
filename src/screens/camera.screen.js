import { Camera, CameraType } from "expo-camera";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeArea } from "../components/safearea.component";
import { UserService } from "../services/user/user.service";
import MembershipExpiredSheet from "../components/membershipExpiredSheet.component";

export const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
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

  // Membership-expiry guard. Fail-open: a null/404 response, a non-success
  // payload, a missing end_time or any thrown error leaves the screen unblocked
  // - only an end_time strictly in the past raises the expired sheet.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await UserService.getMembershipEndTime();
        const end = res?.success ? res?.data?.end_time : null;
        if (!end) return;

        // MySQL DATETIME ("2027-03-08 16:23:20"): iOS rejects the space form,
        // so normalise to ISO before parsing.
        const endMs = new Date(String(end).replace(" ", "T")).getTime();
        if (!Number.isNaN(endMs) && endMs < Date.now() && !cancelled) {
          setExpired(true);
        }
      } catch {
        // fail-open: never block a member on a failed check
      }
    })();

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
      {expired && <MembershipExpiredSheet />}
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
