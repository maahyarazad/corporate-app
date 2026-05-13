import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, ScrollView } from "react-native";

import { Button } from "react-native-paper";
import { BirthdatePicker } from "../../components/BirthdatePicker";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { CompanyLogo, height } from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { goback } from "../../navigation/navigate";
import { companyLogo, honorificList } from "../../utils/constants";  // DropDownPicker removed
import { expiryToDate } from "../../utils/expiryToDate";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { validateCardExpiryDate } from "../../utils/validateCardExpiryDate";
import { TranslationContext } from "../../services/translation/translation.context";
import useRequest from "../../../hooks/useRequest";
import useUser from "../../../hooks/useUser";
import { theme } from "../../infrastructure/theme";
import { DropDown } from "../../components/DropDown";
import { PartnerService } from "../../services/location/location.service";
import { NationalityInput } from "../../components/NationalityInput";
import { showToast } from "../../Toast";

export const AuthEditProfileScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(true);
  const [stateCopy, setStateCopy] = useState();
  const [state, setState] = useState({
    username: "---",
    firstname: "---",
    middlename: "---",
    lastname: "---",
    honorifics: "---",
    birthdate: new Date(),
    gender: "---",
    email: "---",
    mobile: "---",
    nationality: "---",
    partner_id: "---",
    partner_name: "---",
    card_valid_date: "---",
    cardNumber: "---",
  });

  const dateLimit = new Date();
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);

  // Honorifics items for the custom DropDown
  const honorificItems = honorificList.map((x) => ({ label: x, value: x }));

  const isMounted = useRef(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { i18n, lang } = useContext(TranslationContext);

  const genderItems = [
    { label: i18n.t("gender.male"), value: "M" },
    { label: i18n.t("gender.female"), value: "F" },
  ];

  const { getUserInfo } = useUser();
  const request = useRequest();
  const [userData, setUserData] = useState(null);
  const [partnerList, setPartnerList] = useState([]);

  const getPartners = useCallback(async () => {
    try {
      const response = await PartnerService.getPartners();
      const response_userInfo = await getUserInfo();
      if (response_userInfo) setUserData(response_userInfo);
      if (response.success) setPartnerList(response.data);
    } catch (error) {
      console.log(error);
      showToast("error", "Server Error", error);
    }
  }, []);

  useEffect(() => {
    getPartners();
  }, [getPartners]);

  useEffect(() => {
    if (userData) {
      setState({
        ...state,
        username: userData.username,
        firstname: userData.first_name,
        middlename: userData.middle_name,
        lastname: userData.last_name,
        honorifics: userData.honorifics,
        birthdate: new Date(userData.birthdate),
        gender: userData.gender,
        email: userData.email,
        mobile: `+` + userData.area_code + ` ` + userData.phone_number,
        nationality: userData.nationality,
        partner_id: userData.partner_id,
        card_valid_date: moment(userData.card_valid_date).format("MM/YY").toString(),
        cardNumber: userData.card_number,
      });
    }
  }, [userData]);

  useEffect(() => {
    if (JSON.stringify(state) === JSON.stringify(stateCopy)) {
      setDisableButton(true);
    } else {
      setDisableButton(false);
    }
  }, [state]);

  const handlePartnerChange = (partnerId, partnerName) => {
    setState({ ...state, partner_id: partnerId, partner_name: partnerName });
  };

  const checkForEmpty = () => {
    let empty = false;
    Object.keys(state).forEach((key) => {
      if (state[key] !== "---" && state[key] !== "") {
        empty = false;
      } else {
        empty = true;
      }
    });
    if (empty)
      showToast("error", "Empty Fields", "Please fill in all the required fields");
    return empty;
  };

  const handleSubmit = async () => {
    try {
      const data = { ...state, cardValidity: expiryToDate(state.card_valid_date) };
      setIsSubmitted(true);
      if (checkForEmpty()) return null;
      setIsLoading(true);
      const response = await request("/v2/user/update", "post", data);
      if (response && isMounted.current) {
        setIsLoading(false);
        showToast(
          "success",
          i18n.t("profile-tabs.profile.update.heading"),
          i18n.t("profile-tabs.profile.update.text")
        );
        goback();
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Error", error.data.message);
      setIsLoading(false);
    }
  };

  const handleValidityChange = (prev) => {
    setState({
      ...state,
      card_valid_date: validateCardExpiryDate(state.card_valid_date, prev),
    });
  };

  return (
    <Background>
      {isLoading && <LoadingOverlay display={isLoading} />}
      <SafeArea>
        <View style={styles.container}>
          <CompanyLogo
            style={{ resizeMode: "contain", marginBottom: 15 }}
            source={companyLogo}
          />

          {/* Header row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={goback}
              style={styles.backButton}
              activeOpacity={0.5}
            >
              <Ionicons name="arrow-back" size={35} color="#eee" />
              <Label
                size="body"
                weight="bold"
                style={{ color: "#dfdfdf", justifyContent: "center" }}
              >
                {i18n.t("return")}
              </Label>
            </TouchableOpacity>

            <View style={{ width: 150 }}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                buttonColor={theme.colors.icons.active}
                style={{ borderRadius: 10 }}
                icon={() => (
                  <MaterialCommunityIcons
                    name="content-save-outline"
                    size={20}
                    color="white"
                  />
                )}
              >
                Update
              </Button>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <CustomTextInput
                value={state.username}
                disable={true}
                label={i18n.t("profile-tabs.profile.username") + "*"}
                style={{ marginBottom: 8 }}
              />

              <CustomTextInput
                value={state.email}
                disable={true}
                label={i18n.t("profile-tabs.profile.email") + "*"}
                style={{ marginBottom: 8 }}
              />

              <CustomTextInput
                value={state.mobile}
                disable={true}
                label={i18n.t("profile-tabs.profile.mobile") + "*"}
                style={{ marginBottom: 8 }}
              />

              
                <DropDown
                  items={honorificItems}
                  value={state.honorifics}
                  onChange={(val) => setState((prev) => ({ ...prev, honorifics: val }))}
                  placeholder="Honorifics"
                  style={{ marginBottom: 8 }}
                />
           

              <CustomTextInput
                value={state.firstname}
                onChangeText={(prev) => setState({ ...state, firstname: prev })}
                label={i18n.t("profile-tabs.profile.firstname") + "*"}
                style={{ marginBottom: 8 }}
              />

              <CustomTextInput
                value={state.middlename}
                onChangeText={(prev) => setState({ ...state, middlename: prev })}
                label={i18n.t("profile-tabs.profile.middlename") + "*"}
                style={{ marginBottom: 8 }}
              />

              <CustomTextInput
                value={state.lastname}
                onChangeText={(prev) => setState({ ...state, lastname: prev })}
                label={i18n.t("profile-tabs.profile.lastname") + "*"}
                style={{ marginBottom: 8 }}
              />

                <DropDown
                  items={genderItems}
                  value={state.gender}
                  onChange={(value) => setState((prev) => ({ ...prev, gender: value }))}
                  placeholder={i18n.t("gender.title") + " *"}
                  style={{ marginBottom: 8 }}
                />
              

                <BirthdatePicker
                  value={state.birthdate}
                  onChange={(date) => setState((prev) => ({ ...prev, birthdate: date }))}
                />
                <NationalityInput
                    containerStyle={{marginTop : 8, marginBottom: 8}}
                  value={state.nationality}
                  onChange={(e) => setState({ ...state, nationality: e })}
                />
            
              <CustomTextInput
              
                value={state.cardNumber}
                onChangeText={(prev) => setState({ ...state, cardNumber: prev })}
                keyboardType="numeric"
                label="GEC Card Number *"
                error={isSubmitted && state.cardNumber?.trim() === ""}
                
              />

              
              

             
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});