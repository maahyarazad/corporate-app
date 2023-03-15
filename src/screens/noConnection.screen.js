import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeArea } from "../components/safearea.component";
import { Spacer } from "../components/spacer/spacer.component";
import { Label } from "../components/typography/label.component";
import { AuthContext } from "../services/auth/auth.context";

export const NoConnectionScreen = () => {
  const test = useNavigation();
  const route = useRoute();
  const { noConnectionRetry } = useContext(AuthContext);
  return (
    <SafeArea style={styles.safearea}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.container}>
        <Label size={"heading"} style={styles.label}>
          Connection Error
        </Label>
        <Spacer size={"small"} position={"top"} />
        <Label size={"title"} style={styles.label}>
          Couldn't connect to Server
        </Label>
        <Spacer size={"medium"} position={"top"} />
        <Button
          mode="outlined"
          color="grey"
          onPress={noConnectionRetry.fn}
          style={{ borderWidth: 2, borderColor: "grey", width: "50%" }}
        >
          Retry
        </Button>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: "black",
  },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: {
    color: "grey",
  },
});
