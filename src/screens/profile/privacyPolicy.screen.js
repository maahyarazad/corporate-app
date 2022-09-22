import React from "react";
import { StyleSheet, View } from "react-native";
import PDFReader from "rn-pdf-reader-js";
import { SafeArea } from "../../components/safearea.component";

export const PrivacyPolicyScreen = () => {
  return (
    <SafeArea style={styles.container}>
      <PDFReader
        // useGoogleReader={true}
        source={{
          uri: `https://www.german-emirates-club.com/uploads/tnc.pdf`,
        }}
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

{
  /* <View style={styles.container}>
      <PDFReader
        useGoogleReader={true}
        source={{
          uri: `https://www.german-emirates-club.com/uploads/tnc.pdf`,
        }}
      />
    </View> */
}
