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
import { Button, Card } from "react-native-paper";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";
import { AuthContext } from "../../services/auth/auth.context";
import { EventService } from "../../services/event/event.service";
import { LocationContext } from "../../services/location/location.context";
import { Spacer } from "../spacer/spacer.component";
import { width } from "../styles";
import { Label } from "../typography/label.component";

export const EventList = () => {
  const { eventList, getEventsList } = useContext(LocationContext);
  const { user } = useContext(AuthContext);

  const handleSelectEvent = (eventId, registered) => {
    navigate("Event Detail", {
      id: eventId,
      registered,
    });
  };

  const confirmAttendance = (eventId) => {
    Alert.alert(
      "Confirm Attendance",
      "Are you sure you want to attend this event?",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Proceed",
          onPress: () => {
            handleAttend(eventId);
          },
        },
      ]
    );
  };

  const confirmCancel = (eventId) => {
    Alert.alert(
      "Cancel Attendance",
      "Are you sure you want to cancel your attendance?",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Proceed",
          onPress: () => {
            handleCancel(eventId);
          },
        },
      ]
    );
  };

  const handleCancel = async (eventId) => {
    try {
      const data = {
        user_id: user.user_id,
        eventId: eventId,
      };

      const response = await EventService.cancelAttend(data);
      getEventsList();
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    }
  };

  const handleAttend = async (eventId) => {
    try {
      const data = {
        user_id: user.user_id,
        eventId: eventId,
        guest_type: 1,
      };

      const response = await EventService.attendEvent(data);
      getEventsList();
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request."
      );
    }
  };

  const renderCard = ({ item }) => {
    console.log(item);
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
                {moment(item.eventTime).format("LLL")}
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
              READ MORE
            </Button>
            <Spacer position={"left"} size={"small"} />
            <Button
              onPress={() => {
                if (item.registered) {
                  confirmCancel(item.id);
                } else {
                  confirmAttendance(item.id);
                }
              }}
              mode="contained"
              style={{ flex: 1 }}
              contentStyle={[styles.cardActionButton]}
              labelStyle={{
                fontWeight: "bold",
                color: "white",
              }}
              color={item.registered ? "#842323" : theme.colors.icons.active}
            >
              {item.registered ? "UNATTEND" : "ATTEND"}
            </Button>
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* <Label>Events</Label> */}
        <View></View>
        {eventList && eventList.length > 0 && (
          <FlatList
            data={eventList}
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
});
