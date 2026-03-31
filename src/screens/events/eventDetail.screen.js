import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import moment from "moment";
import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { CustomModal } from "../../components/modal/customModal.component";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback, navigate } from "../../navigation/navigate";
import { AuthContext } from "../../services/auth/auth.context";
import { LocationContext } from "../../services/location/location.context";
import { TranslationContext } from "../../services/translation/translation.context";
import useRequest from "../../../hooks/useRequest";

export const EventDetailScreen = () => {
  const route = useRoute();
  const { id } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [attendLoading, setAttendLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [includeGuests, setIncludeGuests] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actions, setActions] = useState(false);
  const [confirmationMSG, setConfirmationMSG] = useState("");

  const { user } = useContext(AuthContext);
  const { getEventsList } = useContext(LocationContext);
  const { i18n, lang } = useContext(TranslationContext);

  const request = useRequest();

  useEffect(() => {
    let cancelled = false;

    const fetchEventData = async () => {
      try {
        setIsLoading(true);

        const data = {
          id,
          lang,
        };

        const response = await request("/v1/api/event/detail", "post", data);
        console.log("=============================================================================")
        console.log("=============================================================================")
        console.log("=============================================================================")
        if (!cancelled && response?.success) {
          console.log("event detail:", response.data);
          setEventDetails(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          Alert.alert("Error Occurred", "Could not get the event");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchEventData();

    return () => {
      cancelled = true;
    };
  }, [id, lang, actions]);

  const eventDescription = useMemo(() => {
    const raw =
      eventDetails?.eventDescription ??
      eventDetails?.event_description ??
      eventDetails?.description ??
      "";

    if (typeof raw !== "string") return String(raw || "");

    return raw
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
  }, [eventDetails]);

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
        eventId,
      };

      await request("/v1/api/event/cancel", "post", data);

      setConfirmationMSG(i18n.t("events.cancellation-msg"));
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
      }, 1500);

      getEventsList();
      setActions((prev) => !prev);
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
        eventId,
        guest_type: 1,
      };

      await request("/v1/api/event/attend", "post", data);

      setConfirmationMSG(i18n.t("events.participation-msg"));
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
      }, 1500);

      getEventsList();
      setActions((prev) => !prev);
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

  const getDirections = async () => {
    try {
      const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
      });

      const latLng = `${eventDetails?.lat},${eventDetails?.lng}`;
      const label = eventDetails?.eventPlace || "Event Location";

      const url = Platform.select({
        ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
        android: `${scheme}${latLng}(${encodeURIComponent(label)})`,
      });

      await Linking.openURL(url);
    } catch (error) {
      console.log("Failed to get directions:", error);
    }
  };

  const GuestCheckbox = () => {
    if (!eventDetails || eventDetails.guests !== 1 || eventDetails.registered) {
      return null;
    }

    return (
      <View style={styles.guestRow}>
        <Checkbox.Android
          status={includeGuests ? "checked" : "unchecked"}
          onPress={() => setIncludeGuests((prev) => !prev)}
          uncheckedColor="black"
          color={theme.colors.icons.active}
        />
        <Label onPress={() => setIncludeGuests((prev) => !prev)}>
          {i18n.t("events.include-guests")}
        </Label>
      </View>
    );
  };

  const RegisterButton = () => {
    if (!eventDetails) return null;

    return (
      <Button
        mode="contained"
        style={styles.registerButton}
        buttonColor={
          eventDetails.registered ? "#842323" : theme.colors.icons.active
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
    );
  };

  const EventDetails = () => {
    if (!eventDetails) return null;

    return (
      <View style={styles.eventMetaContainer}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            color={theme.colors.ui.lightGray}
            size={18}
            name="calendar-clock-outline"
          />
          <Label>
            {moment(eventDetails.eventTime).format("DD.MMMM YYYY h:mm A")}
          </Label>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            color={theme.colors.ui.lightGray}
            size={18}
            name="map-marker"
          />
          <Label>{eventDetails.eventPlace}</Label>
        </View>
      </View>
    );
  };

  const StatusModal = ({ message }) => {
    return (
      <CustomModal type="fade" showModal={showModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Label weight="bold" size="heading">
              {message}
            </Label>
          </View>
        </View>
      </CustomModal>
    );
  };

  return (
    <View style={styles.container}>
      <SafeArea>
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <StatusModal message={confirmationMSG} />

          {eventDetails && (
            <View>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={goback}
                  style={styles.backButton}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color="#111" />
                  <Label weight="bold" style={styles.backLabel}>
                    {i18n.t("bottom-tabs.events")}
                  </Label>
                </TouchableOpacity>
              </View>

              <Image
                style={styles.coverImage}
                source={{
                  uri: `https://www.german-emirates-club.com/uploads/sys/${eventDetails?.file}`,
                }}
              />

              <View style={styles.innerContainer}>
                <Label
                  size="heading"
                  style={{ marginVertical: 8 }}
                  weight="bold"
                >
                  {eventDetails.eventName}
                </Label>

                <EventDetails />

                <GuestCheckbox />
                <RegisterButton />

                <View style={styles.mapSection}>
                  <Map
                    lat={eventDetails.lat}
                    lng={eventDetails.lng}
                    zoom={13}
                  />

                  <View style={{ flexDirection: "row", flex: 1 }}>
                    <Button
                      mode="contained"
                      labelStyle={styles.directionLabel}
                      contentStyle={{ height: 50 }}
                      style={styles.mapButtons}
                      onPress={getDirections}
                    >
                      {i18n.t("offer-details.get-directions")}
                    </Button>
                  </View>
                </View>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>
                    {eventDescription || "No description available"}
                  </Text>
                </View>
               

                <GuestCheckbox />
                <RegisterButton />
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  innerContainer: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    paddingLeft: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backLabel: {
    fontSize: 16,
    color: "#111",
    justifyContent: "center",
  },
  coverImage: {
    height: 130,
    alignSelf: "stretch",
    marginHorizontal: 18,
    borderRadius: 10,
  },
  mapSection: {
    marginVertical: 16,
  },
  mapButtons: {
    flex: 1,
    backgroundColor: "#ddd",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  directionLabel: {
    color: "#1282FF",
    fontWeight: "bold",
  },
  registerButton: {
    marginVertical: 8,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 12,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: -8,
  },
  eventMetaContainer: {
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111",
    flexWrap: "wrap",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000044",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "white",
    width: "80%",
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    borderRadius: 15,
  },
});