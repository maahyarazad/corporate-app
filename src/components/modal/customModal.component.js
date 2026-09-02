import React from "react";
import { Modal, StyleSheet, View } from "react-native";

export const CustomModal = ({ children, showModal, type = "fade" }) => {
  return (
    <View style={styles.overlay}>
      <Modal
        style={styles.modal}
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
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 200,
    position: "absolute",
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
