import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

// Imperative confirm dialog, mirroring the showToast() pattern. A single
// <ConfirmDialogHost /> is mounted once at the app root; showConfirm() can then
// be called from anywhere — including non-component files such as context
// providers — to present an in-app confirmation that preserves button actions
// (unlike a toast). Replaces native Alert.alert([...buttons]) confirmations.
//
// Usage:
//   showConfirm({
//     title: "Log out",
//     message: "Are you sure?",
//     confirmText: "Log out",
//     cancelText: "Cancel",
//     destructive: true,
//     onConfirm: () => doLogout(),
//     onCancel: () => {},
//   });
//
// Also returns a Promise<boolean> for await-style usage:
//   if (await showConfirm({ title, message })) { ... }

let hostInstance = null;

export const showConfirm = (options = {}) =>
  new Promise((resolve) => {
    if (!hostInstance) {
      // Host not mounted yet; resolve as "cancelled" so callers never hang.
      resolve(false);
      return;
    }
    hostInstance.open(options, resolve);
  });

export const ConfirmDialogHost = () => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({});
  const resolver = useRef(null);

  useEffect(() => {
    hostInstance = {
      open: (opts, resolve) => {
        resolver.current = resolve;
        setOptions(opts || {});
        setVisible(true);
      },
    };
    return () => {
      hostInstance = null;
    };
  }, []);

  const close = (confirmed) => {
    setVisible(false);
    if (confirmed) {
      options.onConfirm?.();
    } else {
      options.onCancel?.();
    }
    resolver.current?.(confirmed);
    resolver.current = null;
  };

  const {
    title = "Confirm",
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    destructive = false,
  } = options;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => close(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                destructive && styles.destructiveButton,
              ]}
              onPress={() => close(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "white",
    borderRadius: 14,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: "#444",
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    minWidth: 90,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#207ede",
  },
  destructiveButton: {
    backgroundColor: "#CC1515",
  },
  cancelText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
