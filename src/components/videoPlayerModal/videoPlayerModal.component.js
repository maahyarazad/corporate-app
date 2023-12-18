import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { CustomModal } from "../modal/customModal.component";
import { ResizeMode, Video as VideoPlayer } from "expo-av";
import { Label } from "../typography/label.component";

const VideoPlayerModal = ({ video, onClose }) => {
  return (
    <CustomModal showModal={!!video}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
        }}
      >
        <GestureHandlerRootView
          style={{
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <PanGestureHandler
            onGestureEvent={(event) => {
              if (event.nativeEvent.translationY > 100) {
                onClose();
              }
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Label color={"#aaa"}>Drag down to close</Label>
              <VideoPlayer
                source={{
                  uri: video,
                }}
                shouldPlay
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "75%",
                  marginTop: 20,
                }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
              />
            </View>
          </PanGestureHandler>
        </GestureHandlerRootView>
      </View>
    </CustomModal>
  );
};

export default VideoPlayerModal;

const styles = StyleSheet.create({});
