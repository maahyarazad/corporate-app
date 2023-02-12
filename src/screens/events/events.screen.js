import React, { useContext, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { EventList } from "../../components/events/eventList";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { TranslationContext } from "../../services/translation/translation.context";

export const EventsScreen = () => {
  const { i18n } = useContext(TranslationContext);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Label style={styles.header}>{i18n.t("events.title")}</Label>
        </View>
        <EventList />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignSelf: "stretch",
    padding: 16,
    paddingBottom: 6,
  },
  header: {
    fontSize: 25,
    fontWeight: "bold",
  },
});
