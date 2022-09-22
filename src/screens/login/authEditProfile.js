import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  CountryCodeList,
} from "react-native-country-picker-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { DatePicker } from "react-native-woodpicker";
import { AnimatedButton } from "../../components/animatedButton";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { CompanyLogo } from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { goback, navigate } from "../../navigation/navigate";
import { UserContext } from "../../services/user/user.context";
import { companyLogo, genderEnum, honorificList } from "../../utils/constants";
import ModalDropdown from "react-native-modal-dropdown";
import DropDownPicker from "react-native-dropdown-picker";
import { UserService } from "../../services/user/user.service";
import { AuthContext } from "../../services/auth/auth.context";
import { expiryToDate } from "../../utils/expiryToDate";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { useNavigation } from "@react-navigation/native";
import { validateCardExpiryDate } from "../../utils/validateCardExpiryDate";

export const AuthEditProfileScreen = () => {
  const { user } = useContext(AuthContext);
  const { userInfo, getUserInfo } = useContext(UserContext);
  const [showCountries, setShowCountries] = useState(false);
  const [isOpenGender, setIsOpenGender] = useState(false);
  const [isOpenHonorifics, setIsOpenHonorifics] = useState(false);
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
    cardNumber: "---",
    cardValidity: "---",
  });
  const dateLimit = new Date();
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);
  const honorificLabelList = honorificList.map((x) => ({ label: x, value: x }));
  const isMounted = useRef(true);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    isMounted.current = true;
    console.log(userInfo);

    if (userInfo != undefined) {
      const data = {
        ...state,
        user_id: user.user_id,
        username: userInfo.username,
        email: userInfo.email,
        mobile: `+${userInfo.area_code}${userInfo.phone_number}`,
        firstname: userInfo.first_name,
        middlename: userInfo.middle_name,
        lastname: userInfo.last_name,
        birthdate: new Date(userInfo.birthdate),
        nationality: userInfo.nationality,
        gender: userInfo.gender.toLowerCase(),
        honorifics: userInfo.honorifics,
        cardNumber: userInfo.card_number,
        cardValidity: moment(userInfo.card_valid_date).format("MM/YY"),
      };
      setState(data);
      setStateCopy(data);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (JSON.stringify(state) === JSON.stringify(stateCopy)) {
      setDisableButton(true);
    } else {
      setDisableButton(false);
    }
    return () => {};
  }, [state]);

  const handleSubmit = async () => {
    try {
      const data = { ...state, cardValidity: expiryToDate(state.cardValidity) };

      setIsLoading(true);
      const response = await UserService.updateUser(data);
      if (response) {
        if (isMounted.current) {
          setIsLoading(false);
          getUserInfo(state.user_id);
          Alert.alert(
            "Successfully Updated",
            "Your profile information has been saved."
          );
          navigation.reset({ routes: [{ name: "RequestApproval" }] });
        }
      }
    } catch (error) {
      console.log(error.data.error);
      alert(error.data.message);
      setIsLoading(false);
    }
  };

  const handleValidity = (prev) => {
    setState({
      ...state,
      cardValidity: validateCardExpiryDate(state.cardValidity, prev),
    });
  };

  const toggleDropDownGender = useCallback(() => {
    setIsOpenGender(!isOpenGender);
    setIsOpenHonorifics(false);
  }, []);

  const toggleDropDownHonorifics = useCallback(() => {
    setIsOpenHonorifics(!isOpenHonorifics);
    setIsOpenGender(false);
  }, []);

  return (
    <Background>
      {isLoading && <LoadingOverlay display={isLoading} />}
      <SafeArea>
        <View style={styles.container}>
          <CompanyLogo
            style={{
              resizeMode: "contain",
            }}
            source={companyLogo}
          />
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              justifyContent: "space-between",
              alignItems: "center",
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
              <Ionicons name="arrow-back" size={35} color={"#eee"} />
              <Label
                size={"body"}
                weight="bold"
                style={{ color: "#dfdfdf", justifyContent: "center" }}
              >
                Return
              </Label>
            </TouchableOpacity>
            <Label
              size={"title"}
              weight="bold"
              style={{ color: "#dfdfdf", justifyContent: "center" }}
            >
              Edit Profile
            </Label>
          </View>
          <KeyboardAwareScrollView
            contentContainerStyle={{
              flexGrow: 1,
              flexDirection: "column",
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps={"always"}
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            automaticallyAdjustKeyboardInsets={true}
          >
            <CustomTextInput
              value={state.username}
              disable={true}
              label="Username"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput value={state.email} disable={true} label="Email" />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.mobile}
              disable={true}
              label="Mobile Number"
            />
            <Spacer position={"top"} size="medium" />
            <View
              style={{
                flex: 1,
                height: 55,
              }}
            >
              <CustomTextInput
                style={{
                  position: "absolute",
                }}
                value={state.honorifics}
                onChangeText={(prev) => {
                  setState({ ...state, firstname: prev });
                }}
                label="Honorifics"
              />
              <Button
                style={{ opacity: 0 }}
                contentStyle={{ height: "100%" }}
                onPress={toggleDropDownHonorifics}
              ></Button>
            </View>
            <DropDownPicker
              style={{
                display: "none",
              }}
              items={honorificLabelList}
              open={isOpenHonorifics}
              setOpen={setIsOpenHonorifics}
              onSelectItem={({ label }) => {
                setState({ ...state, honorifics: label });
              }}
              listMode="SCROLLVIEW"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.firstname}
              onChangeText={(prev) => {
                setState({ ...state, firstname: prev });
              }}
              label="First Name"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.middlename}
              onChangeText={(prev) => {
                setState({ ...state, middlename: prev });
              }}
              label="Middle Name"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.lastname}
              onChangeText={(prev) => {
                setState({ ...state, lastname: prev });
              }}
              label="Last Name"
            />
            <Spacer position={"top"} size="medium" />

            <View
              style={{
                flex: 1,
                height: 55,
              }}
            >
              <CustomTextInput
                value={
                  genderEnum[state.gender.toLowerCase()] != undefined
                    ? genderEnum[state.gender.toLowerCase()]
                    : "---"
                }
                label={"Gender"}
                style={{
                  width: "100%",
                  maxHeight: 58,
                  position: "absolute",
                }}
                right={
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={25}
                    onPress={() => {
                      setShowCountries(true);
                    }}
                  />
                }
              ></CustomTextInput>
              <Button
                style={{ opacity: 0 }}
                contentStyle={{ height: "100%" }}
                onPress={toggleDropDownGender}
              ></Button>
            </View>
            <DropDownPicker
              style={{
                display: "none",
              }}
              items={[
                { label: "Male", value: "m" },
                { label: "Female", value: "f" },
              ]}
              open={isOpenGender}
              setOpen={setIsOpenGender}
              onSelectItem={({ value }) => {
                setState({ ...state, gender: value });
              }}
              listMode="SCROLLVIEW"
            />
            <Spacer position={"top"} size="medium" />

            <View style={{ height: 55, flex: 1 }}>
              <CustomTextInput
                value={moment(state.birthdate).format("LL")}
                // onChangeText={setBirthdate}
                label={"Birthdate"}
                style={{
                  width: "100%",
                  maxHeight: 60,
                  position: "absolute",
                }}
              ></CustomTextInput>
              <DatePicker
                value={state.birthdate}
                onDateChange={(date) => setState({ ...state, birthdate: date })}
                title="Birthdate"
                isNullable={false}
                iosMode="date"
                androidMode="date"
                androidDisplay="default"
                textColor="black"
                maximumDate={dateLimit}
                locale="en"
                iosDisplay="spinner"
                style={{
                  width: "100%",
                  height: 58,
                  marginTop: 6,
                }}
              />
            </View>
            <Spacer position={"top"} size="medium" />
            <View
              style={{
                height: 58,
                justifyContent: "center",
                position: "relative",
              }}
            >
              <CustomTextInput
                value={state.nationality}
                label={"Nationality"}
                style={{
                  width: "100%",
                  height: 58,
                  position: "absolute",
                  zIndex: -1,
                }}
                right={
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={25}
                    onPress={() => {
                      setShowCountries(true);
                    }}
                  />
                }
              />
              <View
                style={{
                  flex: 1,
                  paddingTop: 10,
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  zIndex: 1,
                }}
              >
                <CountryPicker
                  countryCodes={CountryCodeList}
                  onSelect={(country) => {
                    setState({ ...state, nationality: country.name });
                  }}
                  withEmoji={true}
                  withFilter
                  placeholder=""
                  containerButtonStyle={{
                    height: "100%",
                    width: "100%",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                  visible={showCountries}
                />
              </View>
            </View>
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.cardNumber}
              keyboardType="numeric"
              maxLength={12}
              onChangeText={(prev) => {
                setState({ ...state, cardNumber: prev });
              }}
              label="IFZA Card Number"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.cardValidity}
              //   value={state.cardValidity}
              placeholder={"mm/yy"}
              keyboardType="numeric"
              maxLength={5}
              onChangeText={handleValidity}
              label="Validity Date"
            />
            <Spacer position={"top"} size="medium" />
            <AnimatedButton
              onPress={handleSubmit}
              buttonColorFrom={disableButton ? "#999" : "rgba(230,135,0,1)"}
              buttonColorTo={"rgba(210,115,0,1)"}
              iconName={"content-save-edit-outline"}
              iconSize={30}
              textColor={"#fff"}
              textSize={"title"}
              textWeight={"medium"}
              label={"Update"}
              disabled={disableButton}
            ></AnimatedButton>
          </KeyboardAwareScrollView>
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
});
