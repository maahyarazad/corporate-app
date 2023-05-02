import React from "react";
import { Modal, StyleSheet, View } from "react-native";

export const CustomModal = ({ children, showModal, type = "fade" }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: 200,
        height: 200,
        position: "absolute",
      }}
    >
      <Modal
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        animationType={type}
        transparent={true}
        visible={showModal}
      >
        {children}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
