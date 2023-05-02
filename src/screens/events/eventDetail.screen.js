import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, Checkbox } from "react-native-paper";
import { Map } from "../../components/map/map.component";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback, navigate } from "../../navigation/navigate";
import { AuthContext } from "../../services/auth/auth.context";
import { EventService } from "../../services/event/event.service";
import { LocationContext } from "../../services/location/location.context";
import { TranslationContext } from "../../services/translation/translation.context";

export const EventDetailScreen = () => {
  const route = useRoute();
  const { id } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [attendLoading, setAttendLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState();
  const [includeGuests, setIncludeGuests] = useState(false);
  const { user } = useContext(AuthContext);
  const { getEventsList } = useContext(LocationContext);
  const { i18n, lang } = useContext(TranslationContext);
  const [actions, setActions] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getEvent = async () => {
      try {
        setIsLoading(true);
        const data = {
          id,
          user_id: user.user_id,
          lang,
        };
        console.log(data);
        const response = await EventService.getOneEvent(data);
        if (response.success && isMounted) {
          console.log(response.data);
          setEventDetails(response.data);
        }
      } catch (err) {
        Alert.alert("Error Occurred", "Could not get the event");
      } finally {
        setIsLoading(false);
      }
    };

    getEvent();

    return () => {
      isMounted = false;
    };
  }, [actions]);

  const confirmAttendance = () => {
    Alert.alert(
      i18n.t("events.confirm-attendance"),
      i18n.t("events.confirm-attendance-msg"),
      [
        {
          text: i18n.t("cancel"),
          onPress: () => {},
        },
        {
          text: i18n.t("proceed"),
          onPress: () => {
            handleAttend(id);
          },
        },
      ]
    );
  };

  const confirmAttendanceGuests = () => {
    Alert.alert(
      i18n.t("events.confirm-attendance"),
      i18n.t("events.confirm-attendance-w-msg"),
      [
        {
          text: i18n.t("cancel"),
          onPress: () => {},
        },
        {
          text: i18n.t("proceed"),
          onPress: () => {
            navigate("Attend Guests", {
              id,
              user_id: user.user_id,
              origin: i18n.t("events.event-detail"),
            });
          },
        },
      ]
    );
  };

  const confirmCancel = () => {
    Alert.alert(
      i18n.t("events.cancel-attendance"),
      i18n.t("events.cancel-attendance-msg"),
      [
        {
          text: i18n.t("cancel"),
          onPress: () => {},
        },
        {
          text: i18n.t("events.action-button"),
          onPress: () => {
            handleCancel(id);
          },
        },
      ]
    );
  };

  const handleCancel = async (eventId) => {
    try {
      setAttendLoading(true);

      const data = {
        user_id: user.user_id,
        eventId: eventId,
      };

      const response = await EventService.cancelAttend(data);
      //Refresh Page
      getEventsList();
      setActions(!actions);
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    } finally {
      setAttendLoading(false);
    }
  };

  const handleAttend = async (eventId) => {
    try {
      setAttendLoading(true);
      const data = {
        user_id: user.user_id,
        eventId: eventId,
        guest_type: 1,
      };

      const response = await EventService.attendEvent(data);
      //Refresh Page
      getEventsList();
      setActions(!actions);
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    } finally {
      setAttendLoading(false);
    }
  };

  const getDirections = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${eventDetails?.lat},${eventDetails?.lng}`;
    const label = eventDetails?.eventPlace;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <SafeArea>
        <KeyboardAwareScrollView>
          {eventDetails && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  paddingLeft: 12,
                }}
              >
                <TouchableOpacity
                  onPress={goback}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color={"#111"} />
                  <Label
                    // size={"title"}
                    weight="bold"
                    style={{
                      fontSize: 16,
                      color: "#111",
                      justifyContent: "center",
                    }}
                  >
                    {i18n.t("bottom-tabs.events")}
                  </Label>
                </TouchableOpacity>
              </View>
              <Image
                style={{
                  height: 130,
                  alignSelf: "stretch",
                  marginHorizontal: 18,
                  borderRadius: 10,
                }}
                source={{
                  uri: `https://www.german-emirates-club.com/uploads/sys/${eventDetails?.file}`,
                }}
              />
              <View style={styles.innerContainer}>
                <Label
                  size={"heading"}
                  style={{ marginVertical: 8 }}
                  weight={"bold"}
                >
                  {eventDetails.eventName}
                </Label>
                <Label>
                  <MaterialCommunityIcons
                    color={theme.colors.ui.lightGray}
                    size={18}
                    name="calendar-clock-outline"
                  />
                  {` ` +
                    moment(eventDetails.eventTime).format(
                      "DD.MMMM YYYY h:mm A"
                    )}
                </Label>
                <Label>
                  <MaterialCommunityIcons
                    color={theme.colors.ui.lightGray}
                    size={18}
                    name="map-marker"
                  />
                  {` ` + eventDetails.eventPlace}
                </Label>
                {eventDetails &&
                  eventDetails.guests === 1 &&
                  !eventDetails.registered && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Checkbox.Android
                        status={includeGuests ? "checked" : "unchecked"}
                        onPress={() => {
                          setIncludeGuests(!includeGuests);
                        }}
                        uncheckedColor="black"
                        color="black"
                      />
                      <Label
                        onPress={() => {
                          setIncludeGuests(!includeGuests);
                        }}
                      >
                        {i18n.t("events.include-guests")}
                      </Label>
                    </View>
                  )}
                <Button
                  mode="contained"
                  style={{ marginVertical: 8 }}
                  color={
                    eventDetails.registered
                      ? "#842323"
                      : theme.colors.icons.active
                  }
                  loading={attendLoading}
                  disabled={attendLoading}
                  contentStyle={{ paddingVertical: 8 }}
                  labelStyle={{ fontWeight: "bold", fontSize: 16 }}
                  onPress={
                    eventDetails.registered
                      ? confirmCancel
                      : includeGuests
                      ? confirmAttendanceGuests
                      : confirmAttendance
                  }
                >
                  {eventDetails.registered
                    ? i18n.t("events.unattend")
                    : includeGuests
                    ? i18n.t("events.attend-w-guests")
                    : i18n.t("events.attend")}
                </Button>

                <View style={{ marginVertical: 16 }}>
                  <Map
                    lat={eventDetails.lat}
                    lng={eventDetails.lng}
                    zoom={13}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      flex: 1,
                    }}
                  >
                    <Button
                      mode="contained"
                      labelStyle={{
                        color: "#1282FF",
                        fontWeight: "bold",
                      }}
                      contentStyle={{ height: 50 }}
                      style={styles.mapButtons}
                      onPress={getDirections}
                    >
                      {i18n.t("offer-details.get-directions")}
                    </Button>
                  </View>
                </View>

                <Label>{eventDetails.eventDescription}</Label>
                {eventDetails &&
                  eventDetails.guests === 1 &&
                  !eventDetails.registered && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 16,
                      }}
                    >
                      <Checkbox.Android
                        status={includeGuests ? "checked" : "unchecked"}
                        onPress={() => {
                          setIncludeGuests(!includeGuests);
                        }}
                        uncheckedColor="black"
                        color="black"
                      />
                      <Label
                        onPress={() => {
                          setIncludeGuests(!includeGuests);
                        }}
                      >
                        {i18n.t("events.include-guests")}
                      </Label>
                    </View>
                  )}
                <Button
                  mode="contained"
                  style={{ marginVertical: 8 }}
                  color={
                    eventDetails.registered
                      ? "#842323"
                      : theme.colors.icons.active
                  }
                  loading={attendLoading}
                  disabled={attendLoading}
                  contentStyle={{ paddingVertical: 8 }}
                  labelStyle={{ fontWeight: "bold", fontSize: 16 }}
                  onPress={
                    eventDetails.registered
                      ? confirmCancel
                      : includeGuests
                      ? confirmAttendanceGuests
                      : confirmAttendance
                  }
                >
                  {eventDetails.registered
                    ? i18n.t("events.unattend")
                    : includeGuests
                    ? i18n.t("events.attend-w-guests")
                    : i18n.t("events.attend")}
                </Button>
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>
      </SafeArea>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingHorizontal: 16,
  },
  mapButtons: {
    flex: 1,
    backgroundColor: "#ddd",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
});
