import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback } from "../../navigation/navigate";
import { EventService } from "../../services/event/event.service";
import { LocationContext } from "../../services/location/location.context";
import { TranslationContext } from "../../services/translation/translation.context";

export const EventGuestsScreen = () => {
  const defaultGuest = {
    first_name: "",
    last_name: "",
  };
  const MAX_GUESTS = 5;
  const location = useRoute();
  const { origin, id, user_id } = location.params;
  const navigation = useNavigation();
  const [guestList, setGuestList] = useState([]);
  const [addGuest, setAddGuest] = useState(true);
  const [newGuest, setNewGuest] = useState(defaultGuest);
  const [guestEmpty, setGuestEmpty] = useState(true);
  const { getEventsList } = useContext(LocationContext);
  const { i18n } = useContext(TranslationContext);

  const handleAddGuest = () => {
    setGuestList(
      guestList.concat({
        ...newGuest,
        first_name: newGuest.first_name.trim(),
        last_name: newGuest.last_name.trim(),
      })
    );
    setAddGuest(false);
  };

  const handleAddGuestForm = () => {
    setGuestEmpty(true);
    setAddGuest(true);
    setNewGuest(defaultGuest);
  };

  const handleChangeFirstName = (value) => {
    setNewGuest({ ...newGuest, first_name: value });
    if (newGuest.last_name && value && value.trim() !== "") {
      setGuestEmpty(false);
    } else {
      setGuestEmpty(true);
    }
  };

  const handleChangeLastName = (value) => {
    setNewGuest({ ...newGuest, last_name: value });
    if (newGuest.first_name && value && value.trim() !== "") {
      setGuestEmpty(false);
    } else {
      setGuestEmpty(true);
    }
  };

  const handleCancel = () => {
    setGuestEmpty(true);
    setAddGuest(false);
    setNewGuest(defaultGuest);
  };

  const handleRemoveGuest = (index) => {
    setGuestList(guestList.filter((_, count) => count !== index));
  };

  const handleAttendGuests = async () => {
    // navigation.reset({ routes: [{ name: "Events" }] });
    // console.log(navigation);

    try {
      const data = {
        user_id,
        eventId: id,
        guest_type: 1,
        guestList,
      };

      const response = await EventService.attendEventGuests(data);
      if (response.success) {
        Alert.alert(
          i18n.t("events.guest-list.registration-success"),
          i18n.t("events.guest-list.registration-success-msg")
        );
        getEventsList();
        navigation.pop();
      } else {
        const { title = "Error Occurred" } = response;
        Alert.alert(title, response.message);
      }
    } catch (error) {
      Alert.alert(
        "Error Occurred",
        "Something went wrong while processing your request"
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text>Hello</Text> */}
      <SafeArea>
        <View style={styles.innerContainer}>
          <View
            style={{
              flexDirection: "row",
              paddingLeft: 0,
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
                {origin}
              </Label>
            </TouchableOpacity>
          </View>
          <View>
            <Label
              style={{ marginVertical: 10 }}
              size={"heading"}
              weight={"bold"}
            >
              {i18n.t("events.guest-list.header")}
            </Label>
            <Label size={"title"}>
              {i18n.t("events.guest-list.subheader-1")}
              <Label size={"title"} weight={"bold"}>
                {MAX_GUESTS}
              </Label>
              {i18n.t("events.guest-list.subheader-2")}
            </Label>
          </View>
          <KeyboardAwareScrollView
            style={{ paddingVertical: 8 }}
            keyboardShouldPersistTaps={"always"}
          >
            {guestList &&
              guestList.length > 0 &&
              guestList.map((guest, index) => {
                return (
                  <View key={guest + index} style={styles.guestListItem}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Label size={"title"} weight={"bold"}>
                        {`${i18n.t("events.guest-list.guest")} #${index + 1}`}
                      </Label>
                      <TouchableOpacity
                        onPress={() => handleRemoveGuest(index)}
                      >
                        <MaterialCommunityIcons
                          name="account-cancel"
                          size={25}
                          color="#9E3333"
                        />
                      </TouchableOpacity>
                    </View>
                    <Spacer position={"top"} size={"medium"} />
                    <View style={{ flexDirection: "row" }}>
                      <View style={styles.guestLabel}>
                        <Label size={"title"} weight={"bold"}>
                          {i18n.t("events.guest-list.firstname")}
                        </Label>
                        <Label size={"subtitle"} weight={"regular"}>
                          {guest.first_name}
                        </Label>
                      </View>
                      <View style={styles.guestLabel}>
                        <Label size={"title"} weight={"bold"}>
                          {i18n.t("events.guest-list.lastname")}
                        </Label>
                        <Label size={"subtitle"} weight={"regular"}>
                          {guest.last_name}
                        </Label>
                      </View>
                    </View>
                    <Spacer position={"top"} size={"small"} />

                    {/* <Text>{guest.first_name}</Text>
                    <Text>{guest.last_name}</Text> */}
                  </View>
                );
              })}
            {addGuest && (
              <View style={styles.guestListItem}>
                <Label size={"title"} weight={"bold"}>
                  {`${i18n.t("events.guest-list.guest")} #${
                    guestList.length + 1 ?? 1
                  }`}
                </Label>
                <Spacer position={"top"} size={"small"} />
                <CustomTextInput
                  label={i18n.t("events.guest-list.firstname")}
                  value={newGuest.first_name}
                  onChangeText={handleChangeFirstName}
                  placeholder={i18n.t("events.guest-list.firstname")}
                  style={{ borderWidth: 1, borderColor: "#ccc" }}
                />
                <Spacer position={"top"} size={"small"} />
                <CustomTextInput
                  label={i18n.t("events.guest-list.lastname")}
                  value={newGuest.last_name}
                  onChangeText={handleChangeLastName}
                  placeholder={i18n.t("events.guest-list.lastname")}
                  style={{ borderWidth: 1, borderColor: "#ccc" }}
                />
                <Spacer position={"top"} size={"small"} />
                <Button
                  mode="contained"
                  contentStyle={{ paddingVertical: 8 }}
                  color={theme.colors.icons.active}
                  onPress={handleAddGuest}
                  disabled={guestEmpty}
                >
                  {i18n.t("events.guest-list.confirm-guest")}
                </Button>
                <Spacer position={"top"} size={"small"} />
                <Button
                  mode="contained"
                  contentStyle={{ paddingVertical: 8 }}
                  color={"#9E3333"}
                  onPress={handleCancel}
                >
                  {i18n.t("cancel")}
                </Button>

                {/* <Text>{guest.first_name}</Text>
                    <Text>{guest.last_name}</Text> */}
              </View>
            )}

            {!addGuest && guestList.length < MAX_GUESTS && (
              <>
                <Button
                  style={{ shadowOpacity: 1 }}
                  contentStyle={{
                    backgroundColor: theme.colors.icons.active,
                  }}
                  onPress={handleAddGuestForm}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingVertical: 4,
                    }}
                  >
                    <MaterialCommunityIcons
                      color={"white"}
                      size={25}
                      name="plus-circle"
                    />
                    <Spacer position={"left"} size={"small"} />
                    {/* <Text>Add Guest</Text> */}
                    <Label style={{ color: "white" }} weight={"bold"}>
                      {i18n.t("events.guest-list.add-more")}
                    </Label>
                  </View>
                </Button>
                <Spacer position={"top"} size={"small"} />
              </>
            )}
          </KeyboardAwareScrollView>
          <Spacer position={"top"} size={"small"} />
          <Button
            mode="contained"
            contentStyle={{ paddingVertical: 8 }}
            color={theme.colors.icons.active}
            onPress={handleAttendGuests}
            disabled={guestList.length < 1}
          >
            <Label style={{ color: "white" }} weight={"bold"}>
              {i18n.t("events.confirm-attendance")}
            </Label>
          </Button>
        </View>
      </SafeArea>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingHorizontal: 8,
    flex: 1,
    // backgroundColor: "red",
  },
  guestLabel: {
    flex: 1,
  },
  guestListItem: {
    flexDirection: "column",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
});
