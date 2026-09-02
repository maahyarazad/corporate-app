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



// Callers pass whatever landed in a `catch`, and an axios rejection is an
// object. Rendering one as a `<Text>` child crashes the whole tree, so every
// non-string value is reduced to its message here rather than at each site.
const toMessage = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  const source = value as Record<string, any>;
  const candidate =
    source?.data?.message ?? source?.message ?? source?.data?.title ?? source?.title;

  if (typeof candidate === "string") return candidate;

  return "Error Occurred";
};

export const showToast = (
  type: "success" | "error" | "info",
  title: unknown,
  message?: unknown
) => {
  Toast.show({
    type,
    text1: toMessage(title),
    text2: toMessage(message),
    position: "top",
    topOffset: 56,
    visibilityTime: 5000,
  });
};