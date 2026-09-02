import { StyleSheet, View } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { CustomModal } from "../modal/customModal.component";
import { ResizeMode, Video as VideoPlayer } from "expo-av";
import { Label } from "../typography/label.component";

const VideoPlayerModal = ({ video, onClose }) => {
  return (
    <CustomModal showModal={!!video}>
      <StatusBar style="light" />
      <View style={styles.tint}>
        <View style={styles.box}>
          <PanGestureHandler
            onGestureEvent={(event) => {
              if (event.nativeEvent.translationY > 100) {
                onClose();
              }
            }}
          >
            <View style={styles.centerBox}>
              <Label color="#aaa">Nach unten ziehen zum Schlie</Label>
              <VideoPlayer
                source={{
                  uri: video,
                }}
                shouldPlay
                style={styles.videoPlayer}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
              />
            </View>
          </PanGestureHandler>
        </View>
      </View>
    </CustomModal>
  );
};

export default VideoPlayerModal;

const styles = StyleSheet.create({
  tint: {
    flex: 1,
    backgroundColor: "black",
  },
  box: {
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
    maxHeight: "75%",
    marginTop: 20,
  },
});
