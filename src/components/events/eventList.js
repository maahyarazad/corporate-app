import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { showToast } from "../../Toast";
import { showConfirm } from "../confirmDialog.component";
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
import useRequest from "../../../hooks/useRequest";

export const EventList = () => {
  const { eventList, getEventsList, setEventList } =
    useContext(LocationContext);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const [showModal, setShowModal] = useState(false);
  const [confirmationMSG, setConfirmationMSG] = useState("");
  const request = useRequest();

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
    showConfirm({
      title: i18n.t("events.confirm-attendance"),
      message: i18n.t("events.confirm-attendance-msg"),
      confirmText: i18n.t("proceed"),
      cancelText: i18n.t("return"),
      onConfirm: () => {
        handleAttend(eventId);
      },
    });
  };

  const confirmAttendanceGuests = (eventId) => {
    showConfirm({
      title: i18n.t("events.confirm-attendance"),
      message: i18n.t("events.confirm-attendance-w-msg"),
      confirmText: i18n.t("proceed"),
      cancelText: i18n.t("return"),
      onConfirm: () => {
        navigate("Attend Guests", {
          id: eventId,
          user_id: user.user_id,
          origin: "Events",
        });
      },
    });
  };

  const confirmCancel = (eventId) => {
    showConfirm({
      title: i18n.t("events.cancel-attendance"),
      message: i18n.t("events.cancel-attendance-msg"),
      confirmText: i18n.t("events.action-button"),
      cancelText: i18n.t("return"),
      destructive: true,
      onConfirm: () => {
        handleCancel(eventId);
      },
    });
  };

  const handleCancel = async (eventId) => {
    try {
      setIsLoading(true);
      const data = {
        eventId,
      };

      // const response = await EventService.cancelAttend(data);
      const response = await request("/v1/api/event/cancel", "post", data);
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
      showToast(
        "error",
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

      const response = await request("/v1/api/event/attend", "post", data);

      if (response.success) {
        getEventsList();
        setConfirmationMSG(i18n.t("events.participation-msg"));
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.log(err);
      showToast(
        "error",
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
        color="white"
        style={{ marginRight: 5 }}
      />
    );
  };

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderCard = ({ item, index }) => {
    // console.log(item);
    return (
      <TouchableOpacity
        onPress={() => handleSelectEvent(item.id, item.registered)}
        style={styles.cardButton}
      >
        <Card style={{ backgroundColor: "white", padding: 0 }}>
          <Card.Cover
            resizeMethod="resize"
            resizeMode="cover"
            style={{
              height: 130,
            }}
            source={{
              uri: `https://www.german-emirates-club.com/uploads/sys/${item.eventImage}`,
            }}
          />
          <Card.Title
            style={{
              marginTop: -15,
              borderRadius: 15,
              backgroundColor: "white",
            }}
            titleNumberOfLines={2}
            titleStyle={{
              fontWeight: "bold",
              paddingVertical: 15,
              fontSize: 20,
            }}
            title={item.eventName}
          ></Card.Title>
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
                paddingHorizontal: 8,
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
                color={theme.colors.icons.active}
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
          <Card.Actions
            style={{
              justifyContent: "space-around",
              paddingBottom: 15,
              marginLeft: -8,
            }}
          >
            <Button
              mode="outlined"
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor: theme.colors.icons.active,
                borderRadius: 12,
              }}
              onPress={() => handleSelectEvent(item.id)}
              contentStyle={styles.cardActionButton}
              labelStyle={{
                color: theme.colors.icons.active,
                fontWeight: "bold",
              }}
            >
              {i18n.t("read-more")}
            </Button>
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
              style={{
                flex: 1,
                borderRadius: 12,
                borderColor: item.registered
                  ? "#842323"
                  : theme.colors.icons.active,
                borderWidth: 2,
              }}
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
              buttonColor={
                item.registered ? "#842323" : theme.colors.icons.active
              }
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
            <Label weight="bold" size="heading">
              {confirmationMSG}
            </Label>
          </View>
        </View>
      </CustomModal>
     
      <View style={styles.container} removeClippedSubviews={true}>
      {eventList && eventList.length > 0 ? (
        <FlatList
          data={eventList}
          extraData={eventList}
          keyExtractor={keyExtractor}
          renderItem={renderCard}
          contentContainerStyle={styles.eventListContainer}
          ItemSeparatorComponent={() => {
            return <View style={{ height: 12 }}></View>;
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Label
            style={styles.emptyText}
            weight="bold"
            size="body"
          >
             {i18n.t("events.no-upcoming-events")}

          </Label>
        </View>
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
    paddingVertical: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000044",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.ui.lightGray,
  },

});
