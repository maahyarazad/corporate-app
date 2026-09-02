import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeArea } from "../components/safearea.component";
import { Label } from "../components/typography/label.component";
import useAuth from "../../hooks/useAuth";

export const NoConnectionScreen = () => {
  const test = useNavigation();
  const route = useRoute();
  const { noConnectionRetry } = useAuth();
  return (
    <SafeArea style={styles.safearea}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.container}>
        <Label size="heading" style={styles.label}>
          Connection Error
        </Label>
        
        <View style={styles.spacer}/>
        <Label size="title" style={styles.label}>
          Couldn't connect to Server
        </Label>
        

                <View style={styles.spacer2}/>

        <Button
          mode="outlined"
          color="grey"
          onPress={noConnectionRetry.fn}
          style={styles.button}
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
  spacer: {
    marginTop: 6,
  },
  spacer2: {
    marginTop: 8,
  },
  button: {
    borderWidth: 2,
    borderColor: "grey",
    width: "50%",
  },
});
