import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";

export const UnverifiedEmailScreen = ({ route }) => {
  const { userId } = route.params;
  const [resendStatus, setResendStatus] = useState(false);

  const handleResend = async () => {
    console.log(userId);
    setResendStatus(true);
    const response = await UserService.resendEmailVerification(userId);
    // console.log(response);
  };

  return (
    <Background>
      <SafeArea>
        <View style={styles.container}>
          <View
            style={{ padding: 24, backgroundColor: "white", borderRadius: 100 }}
          >
            <MaterialCommunityIcons
              name="email-remove"
              size={100}
              color="red"
            />
          </View>
          <Spacer position={"top"} size="large" />
          <View style={{ width: "100%", paddingHorizontal: 32 }}>
            <Label
              style={{ color: "white", textAlign: "center" }}
              size={"title"}
              weight={"medium"}
            >
              Your email address is not yet verified. Please click the
              verification link we have sent to your email.
            </Label>
          </View>
          <Spacer position={"top"} size="large" />
          <Button
            onPress={goback}
            color={theme.colors.icons.active}
            contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
            mode="contained"
          >
            <Label size={"body"} weight={"bold"}>
              Back to Login
            </Label>
          </Button>
          <Spacer position={"top"} size="medium" />
          {!resendStatus ? (
            <TouchableOpacity onPress={handleResend}>
              <Label
                style={{ color: "white", textDecorationLine: "underline" }}
                size={"subtitle"}
                weight={"regular"}
              >
                Did not receive the link? Resend Now
              </Label>
            </TouchableOpacity>
          ) : (
            <Label
              style={{ color: "#aaa" }}
              size={"subtitle"}
              weight={"regular"}
            >
              Verification Link has been resent
            </Label>
          )}
        </View>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
