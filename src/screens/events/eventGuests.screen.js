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
import { goback, navigate } from "../../navigation/navigate";
import { EventService } from "../../services/event/event.service";
import { LocationContext } from "../../services/location/location.context";
import { TranslationContext } from "../../services/translation/translation.context";
import useRequest from "../../../hooks/useRequest";
import { CustomModal } from "../../components/modal/customModal.component";

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
  const request = useRequest();
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
  const [confirmationMSG, setConfirmationMSG] = useState("");
  const [showModal, setShowModal] = useState(false);

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
        eventId: id,
        guest_type: 1,
        guestList,
      };

      const response = await request(
        "/v1/api/event/attend-with-guests",
        "post",
        data
      );
      if (response.success) {
        // Alert.alert(
        //   i18n.t("events.guest-list.registration-success"),
        //   i18n.t("events.guest-list.registration-success-msg")
        // );
        setConfirmationMSG(i18n.t("events.participation-msg"));
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
        getEventsList();

        navigation.popToTop();
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

  const StatusModal = ({ message }) => {
    return (
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
              {message}
            </Label>
          </View>
        </View>
      </CustomModal>
    );
  };

  return (
    <View style={styles.container}>
      {/* <Text>Hello</Text> */}
      <SafeArea>
        <StatusModal message={confirmationMSG} />
        <View style={styles.innerContainer}>
          <View
            style={{
              flexDirection: "row",
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
            style={{
              paddingVertical: 8,
              marginHorizontal: -15,
              paddingHorizontal: 15,
            }}
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
                    <View style={{marginTop: 8}} />
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
                    <View style={{marginTop: 6}}/>

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
                <View style={{marginTop: 6}}/>
                <CustomTextInput
                  label={i18n.t("events.guest-list.firstname")}
                  value={newGuest.first_name}
                  onChangeText={handleChangeFirstName}
                  // placeholder={i18n.t("events.guest-list.firstname")}
                  style={{ borderWidth: 1, borderColor: "#ccc" }}
                />
                <View style={{marginTop: 6}}/>
                <CustomTextInput
                  label={i18n.t("events.guest-list.lastname")}
                  value={newGuest.last_name}
                  onChangeText={handleChangeLastName}
                  // placeholder={i18n.t("events.guest-list.lastname")}
                  style={{ borderWidth: 1, borderColor: "#ccc" }}
                />
                <View style={{marginTop: 6}}/>
                <Button
                  mode="contained"
                  contentStyle={{ paddingVertical: 8 }}
                  style={[{ borderRadius: 10 }, styles.buttonShadow]}
                  buttonColor={theme.colors.icons.active}
                  onPress={handleAddGuest}
                  disabled={guestEmpty}
                >
                  {i18n.t("events.guest-list.confirm-guest")}
                </Button>
                <View style={{marginTop: 6}}/>
                <Button
                  mode="contained"
                  contentStyle={{ paddingVertical: 8 }}
                  style={[{ borderRadius: 10 }, styles.buttonShadow]}
                  buttonColor={"#9E3333"}
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
                  style={[
                    { shadowOpacity: 1, borderRadius: 10 },
                    styles.buttonShadow,
                  ]}
                  labelStyle={{
                    fontWeight: "bold",
                    fontSize: 16,
                    paddingVertical: 8,
                  }}
                  textColor="white"
                  contentStyle={{
                    backgroundColor: theme.colors.icons.active,
                    justifyContent: "center",
                  }}
                  onPress={handleAddGuestForm}
                  icon={() => (
                    <MaterialCommunityIcons
                      size={24}
                      name="plus-circle"
                      color={"white"}
                    />
                  )}
                >
                  {i18n.t("events.guest-list.add-more")}
                </Button>
                <View style={{marginTop: 6}}/>
              </>
            )}
          </KeyboardAwareScrollView>
          <View style={{marginTop: 6}}/>
          <Button
            mode="contained"
            style={[{ borderRadius: 10 }, styles.buttonShadow]}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor={theme.colors.icons.active}
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
    paddingHorizontal: 15,
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
  buttonShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000044",
    justifyContent: "center",
    alignItems: "center",
  },
});
