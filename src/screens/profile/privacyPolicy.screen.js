import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { SafeArea } from "../../components/safearea.component";

export const PrivacyPolicyScreen = () => {
  const pdfUrl = "https://www.german-emirates-club.com/uploads/tnc.pdf";

  // For WebView, Google Docs viewer makes it cross-platform friendly
  const uri = `https://docs.google.com/gview?embedded=true&url=${pdfUrl}`;

  return (
    <SafeArea style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        startInLoadingState
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    width: Dimensions.get("window").width,
  },
});
