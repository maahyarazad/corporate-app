import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ToastConfig } from "react-native-toast-message";
import Toast from "react-native-toast-message";
type Props = {
  text1?: string;
  text2?: string;
};

function BaseToast({ text1, text2, variant }: Props & { variant: "success" | "error" | "info" }) {
  return (
    <View style={[styles.toast, styles[variant]]}>
      {!!text1 && <Text style={styles.title}>{text1}</Text>}
      {!!text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <BaseToast {...props} variant="success" />,
  error: (props) => <BaseToast {...props} variant="error" />,
  info: (props) => <BaseToast {...props} variant="info" />
};

const styles = StyleSheet.create({
  toast: {
    width: "92%",
    alignSelf: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 15, fontWeight: "700" },
  message: { marginTop: 4, fontSize: 13, opacity: 0.9 },

  success: { backgroundColor: "#E7F9EF" },
  error: { backgroundColor: "#FDECEC" },
  info: { backgroundColor: "#EAF2FF" },
});



export const showToast = (type: "success" | "error" | "info", title: string, message?: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
    topOffset: 56,
    visibilityTime: 5000,
  });
};