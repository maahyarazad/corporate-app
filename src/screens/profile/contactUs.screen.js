import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { goback } from "../../navigation/navigate";
import { SupportService } from "../../services/support/support.service";
import { UserContext } from "../../services/user/user.context";
import { config } from "../../utils/constants";

export const ContactUsScreen = () => {
    const { userInfo } = useContext(UserContext)
    const [disableButton, setDisableButton] = useState(true)
    const [state, setState] = useState({
    name: ".",
    email: ".",
    mobile: ".",
    message: "",
  });

  useLayoutEffect(() => {
    let isMounted = true
  
    if(userInfo != undefined && isMounted){
        setState({...state, 
            name: `${userInfo.first_name} ${userInfo.last_name}`,
            email: userInfo.email,
            mobile: `${userInfo.area_code}${userInfo.phone_number}`})
    }

    return () => {
     isMounted = false
    };
  }, [])
  
  useEffect(() => {
    const empty = Object.keys(state).find(key => {
        // console.log('There is Empty', key)
        // console.log(state[key])
        return state[key].trim() === ``
    })
    
    if(empty){
        setDisableButton(true)
    }else{

        setDisableButton(false)
    }
  }, [state])
  

  const handleNameChange = (prev) => {
    setState({...state, name: prev})
  }

  const handleEmailChange = (prev) => {
    setState({...state, email: prev})
  }
  
  const handleMessageChange = (prev) => {
    setState({...state, message: prev})
  }

  const handleMobileChange = (prev) => {
    setState({...state, mobile: prev})
  }

  const handleSubmit = async () => {
    const data = {...state, app: config.APP_ID}
    const response = await SupportService.sendFeedbackMsg(data)
    if(response.success){
        Alert.alert('Sent Successfully', 'Your message has been sent. Thank you for contacting us!')
        goback()
    }else{
        Alert.alert('Sending Failed', response.message)
    }
  }

  return (
    <View style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            marginVertical: 16,
            justifyContent: "space-between",
            alignItems: "center",
            alignSelf: "stretch",
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
            <Ionicons name="arrow-back" size={35} color={"#555"} />
            <Label
              size={"body"}
              weight="bold"
              style={{ color: "#555", justifyContent: "center" }}
            >
              Return
            </Label>
          </TouchableOpacity>
        </View>
        <View style={styles.contactContainer}>
          <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
            <Label
              size={"h5"}
              weight="bold"
              style={{ color: "#555", justifyContent: "center" }}
            >
              Contact Us
            </Label>
          </View>
          <KeyboardAwareScrollView
        //   scroll
            // automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : 'on-drag'}
            style={{paddingHorizontal: 16}}
            contentContainerStyle={{paddingVertical: 12}}
          >
            
          <View>
            <CustomTextInput
              value={state.name}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleNameChange}
              label="Name *"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.email}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleEmailChange}
              label="Email *"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.mobile}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleMobileChange}
              label="Phone Number *"
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              value={state.message}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              inputStyle={{
                paddingTop: 16,
                paddingBottom: 16,
              }}
              onChangeText={handleMessageChange}
              label="Message *"
              multiline={true}
            />
            <Spacer position={"top"} size="medium" />
            <Button disabled={disableButton} onPress={handleSubmit} contentStyle={{paddingVertical: 8}} color={'orange'} mode="contained">
                <Label size={'body'} weight={"medium"}>
                    Submit
                </Label>
            </Button>
          </View>
          </KeyboardAwareScrollView>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contactContainer: {
    flex: 1,
  },
});
