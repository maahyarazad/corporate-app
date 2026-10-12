import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { ImageBackground, KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { LoginButton, TextInputForm } from "./login.screen";

export const VerifyInfo = ({ route }) => {
  // Static-config screens receive only `route` - the navigator renders them
  // through a render callback, so `navigation` never arrives as a prop.
  const navigation = useNavigation();

  const [lastname, setLastname] = useState(null);
  const [firstname, setFirstname] = useState(null);
  const [middlename, setMiddlename] = useState(null);
  const [birthday, setBirthday] = useState(new Date());
  const [email, setEmail] = useState(null);
  const [mobile, setMobile] = useState(null);

  const user = route.params.data[0];
  const userBirthday = user.birthday.split(".");
  const birthdayDate = [
    birthday.getMonth() + 1,
    birthday.getDate(),
    birthday.getFullYear(),
  ].join(".");
  

  const birthdayString = new Date(birthday.getTime()).toDateString();

  useEffect(() => {
    setFirstname(user.first_name);
    setLastname(user.name);
    setEmail(user.email);
    setMobile(user.phone);
    setBirthday(new Date(userBirthday[2], userBirthday[1], userBirthday[0]));
  }, []);

  const handleUpdate = () => {
    // console.log({ firstname, lastname, birthdayDate, email, mobile });
  };

  return (
    <ImageBackground
      style={styles.imageBackground}
      source={require("../../../assets/ifza-login-bg.webp")}
    >
      <SafeArea style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "position" : ""}
          style={styles.flexBox}
          contentContainerStyle={styles.safeArea}
        >
          <Label shadow={true} style={styles.label} size="h5" weight="medium">
            Hallo, {firstname}
          </Label>
          <Label shadow={true} style={styles.label} size="body" weight="medium">
            Bitte stellen Sie sicher, dass alle Informationen aktueil und
            korrekt sind.
          </Label>
          <TextInputForm
            value={firstname}
            onChangeText={setFirstname}
            mode="outlined"
            activeOutlineColor="#B57000"
            label="Vorname"
          ></TextInputForm>
          {/* <LoginTextInput
            value={middlename}
            onChangeText={setMiddlename}
            mode="outlined"
            activeOutlineColor="#B57000"
            label="Zweiter Vorname"
          ></LoginTextInput> */}
          <TextInputForm
            value={lastname}
            onChangeText={setLastname}
            mode="outlined"
            activeOutlineColor="#B57000"
            label="Nachname"
          ></TextInputForm>
          <View style={styles.spacer}>
            <TextInputForm
              value={birthday.toLocaleDateString("de-DE", {
                year: "numeric",
                day: "numeric",
                month: "long",
              })}
              onChangeText={setBirthday}
              mode="outlined"
              activeOutlineColor="#B57000"
              label="Geburtsdatum"
              style={styles.textInputForm}
            ></TextInputForm>

               <DateTimePicker onChange={setBirthday}
          value={birthday || new Date()}
          mode="date"
         title="Geburtsdatum"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={dateLimit}
          iosMode="date"
           locale="de"
           isNullable={false}
           style={styles.dateTimePicker}
        />


            {/* <DatePicker
              value={birthday}
              onDateChange={setBirthday}
              title="Geburtsdatum"
              isNullable={false}
              iosMode="date"
              androidMode="date"
              androidDisplay="default"
              textColor="black"
              maximumDate={new Date(Date.now())}
              locale="de"
              style={{
                width: "100%",
                height: 60,
                marginTop: 6,
              }}
            /> */}
          </View>

          <TextInputForm
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            activeOutlineColor="#B57000"
            label="E-Mail Adresse"
            keyboardType="email-address"
          ></TextInputForm>
          {/* <TextInput keyboardType="email-address" */}
          <TextInputForm
            keyboardType={Platform.OS === "ios" ? "phone-pad" : "phone-pad"}
            value={mobile}
            onChangeText={setMobile}
            mode="outlined"
            activeOutlineColor="#B57000"
            label="Mobilnummer"
          ></TextInputForm>

          <View style={styles.spacer2} />
          <LoginButton
            onPress={handleUpdate}
            activeOpacity={0.8}
            checked={true}
          >
            <Label style={styles.label} weight="bold">
              Telefonnummer Verifizieren
            </Label>
          </LoginButton>
        </KeyboardAvoidingView>
      </SafeArea>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  flexBox: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  label: {
    color: "white",
  },
  spacer: {
    marginBottom: 0,
  },
  textInputForm: {
    width: "100%",
    position: "absolute",
  },
  dateTimePicker: {
    width: "100%",
    height: 60,
    marginTop: 6,
  },
  spacer2: {
    marginTop: 8,
  },
});
