import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, Checkbox, Modal } from "react-native-paper";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";
import { AuthContext } from "../../services/auth/auth.context";
import { EventService } from "../../services/event/event.service";
import { LocationContext } from "../../services/location/location.context";
import { TranslationContext } from "../../services/translation/translation.context";
import { CustomModal } from "../modal/customModal.component";
import { Spacer } from "../spacer/spacer.component";
import { Label } from "../typography/label.component";

export const EventList = () => {
  const { eventList, getEventsList, setEventList } =
    useContext(LocationContext);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const [showModal, setShowModal] = useState(false);
  const [confirmationMSG, setConfirmationMSG] = useState("");

  const handleSelectEvent = (eventId, registered) => {
    navigate("Event Detail", {
      id: eventId,
      registered,
    });
  };

  useEffect(() => {
    return () => {};
  }, []);

  const confirmAttendance = (eventId) => {
    Alert.alert(
      i18n.t("events.confirm-attendance"),
      i18n.t("events.confirm-attendance-msg"),
      [
        {
          text: i18n.t("return"),
          onPress: () => {},
        },
        {
          text: i18n.t("proceed"),
          onPress: () => {
            handleAttend(eventId);
          },
        },
      ]
    );
  };

  const confirmAttendanceGuests = (eventId) => {
    Alert.alert(
      i18n.t("events.confirm-attendance"),
      i18n.t("events.confirm-attendance-w-msg"),
      [
        {
          text: i18n.t("return"),
          onPress: () => {},
        },
        {
          text: i18n.t("proceed"),
          onPress: () => {
            navigate("Attend Guests", {
              id: eventId,
              user_id: user.user_id,
              origin: "Events",
            });
          },
        },
      ]
    );
  };

  const confirmCancel = (eventId) => {
    Alert.alert(
      i18n.t("events.cancel-attendance"),
      i18n.t("events.cancel-attendance-msg"),
      [
        {
          text: i18n.t("return"),
          onPress: () => {},
        },
        {
          text: i18n.t("events.action-button"),
          onPress: () => {
            handleCancel(eventId);
          },
        },
      ]
    );
  };

  const handleCancel = async (eventId) => {
    try {
      setIsLoading(true);
      const data = {
        user_id: user.user_id,
        eventId: eventId,
      };

      const response = await EventService.cancelAttend(data);
      getEventsList();
      if (response.success) {
        setConfirmationMSG(i18n.t("events.cancellation-msg"));
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttend = async (eventId) => {
    try {
      setIsLoading(true);
      const data = {
        user_id: user.user_id,
        eventId: eventId,
        guest_type: 1,
      };

      const response = await EventService.attendEvent(data);
      getEventsList();

      if (response.success) {
        setConfirmationMSG(i18n.t("events.participation-msg"));
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const guestIcon = (item) => {
    return (
      <MaterialCommunityIcons
        size={20}
        name={item.includeGuests ? "account-group" : "account"}
        color={"white"}
        style={{ marginRight: 5 }}
      />
    );
  };

  const renderCard = ({ item, index }) => {
    // console.log(item);
    return (
      <TouchableOpacity
        onPress={() => handleSelectEvent(item.id, item.registered)}
        style={styles.cardButton}
      >
        <Card>
          <Card.Cover
            resizeMethod={"resize"}
            resizeMode={"cover"}
            style={{ height: 130 }}
            source={{
              uri: `https://www.german-emirates-club.com/uploads/sys/${item.eventImage}`,
            }}
          />
          <Card.Title title={item.eventName}></Card.Title>
          <Card.Content>
            <Label>{item.eventDescription}</Label>

            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                color={theme.colors.ui.lightGray}
                size={18}
                name="calendar-clock-outline"
              />
              <Label
                style={{
                  marginLeft: 5,
                  color: theme.colors.ui.lightGray,
                }}
              >
                {moment(item.eventTime).format("DD.MMMM YYYY h:mm A")}
              </Label>
            </View>

            <View style={[styles.dateContainer, { marginTop: 5 }]}>
              <MaterialCommunityIcons
                color={theme.colors.ui.lightGray}
                size={18}
                name="map-marker"
              />
              <Label
                style={{
                  marginLeft: 5,
                  color: theme.colors.ui.lightGray,
                }}
              >
                {item.eventPlace}
              </Label>
            </View>
          </Card.Content>
          {item.guests === 1 && !item.registered && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Checkbox.Android
                status={item.includeGuests ? "checked" : "unchecked"}
                onPress={() => {
                  setEventList(
                    eventList.map((element, index1) =>
                      index1 === index
                        ? { ...element, includeGuests: !item.includeGuests }
                        : element
                    )
                  );
                  // console.log(eventList[index]);
                }}
                uncheckedColor="black"
                color="black"
              />
              <Label
                onPress={() => {
                  setEventList(
                    eventList.map((element, index1) =>
                      index1 === index
                        ? { ...element, includeGuests: !item.includeGuests }
                        : element
                    )
                  );
                }}
              >
                {i18n.t("events.include-guests")}
              </Label>
            </View>
          )}
          <Card.Actions style={{ flex: 1, justifyContent: "space-around" }}>
            <Button
              mode="outlined"
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor: theme.colors.icons.active,
              }}
              onPress={() => handleSelectEvent(item.id)}
              contentStyle={styles.cardActionButton}
              labelStyle={{
                color: theme.colors.icons.active,
                fontWeight: "bold",
              }}
              color={theme.colors.icons.active}
            >
              {i18n.t("read-more")}
            </Button>
            <Spacer position={"left"} size={"small"} />
            <Button
              loading={isLoading}
              disabled={isLoading}
              onPress={() => {
                if (item.registered) {
                  confirmCancel(item.id);
                } else if (item.includeGuests) {
                  confirmAttendanceGuests(item.id);
                } else {
                  confirmAttendance(item.id);
                }
              }}
              mode="contained"
              style={{ flex: 1 }}
              icon={
                item.registered
                  ? null
                  : () => {
                      return guestIcon(item);
                    }
              }
              contentStyle={[styles.cardActionButton]}
              labelStyle={{
                fontWeight: "bold",
                color: "white",
              }}
              color={item.registered ? "#842323" : theme.colors.icons.active}
            >
              {item.registered
                ? i18n.t("events.unattend")
                : i18n.t("events.attend")}
            </Button>
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <CustomModal type="fade" showModal={showModal}>
        <View style={styles.modalContainer}>
          <View
            style={{
              backgroundColor: "white",
              width: "80%",
              height: "15%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 25,
              borderRadius: 15,
            }}
          >
            <Label weight={"bold"} size="heading">
              {confirmationMSG}
            </Label>
          </View>
        </View>
      </CustomModal>
      <View style={styles.container} removeClippedSubviews={true}>
        {/* <Label>Events</Label> */}

        {eventList && eventList.length > 0 && (
          <FlatList
            data={eventList}
            extraData={eventList}
            renderItem={renderCard}
            contentContainerStyle={styles.eventListContainer}
            ItemSeparatorComponent={() => {
              return <View style={{ height: 12 }}></View>;
            }}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  eventListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  cardButton: {
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 3,
      height: 5,
    },
    elevation: 10,
  },
  cardActionButton: {
    paddingVertical: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000044",
    justifyContent: "center",
    alignItems: "center",
  },
});
