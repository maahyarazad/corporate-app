import React, { useContext, useMemo, useRef } from "react";
import { Linking, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "./typography/label.component";
import { TranslationContext } from "../services/translation/translation.context";

// A blocking, full-screen red sheet shown when the member's membership has
// expired. Core BottomSheet (not BottomSheetModal): the app mounts
// GestureHandlerRootView at the root but has no BottomSheetModalProvider, and
// the core component needs only the gesture root.
//
// Non-dismissable by design: enablePanDownToClose is false and there is no
// backdrop to tap, so an expired member cannot swipe past it to the camera.
const MembershipExpiredSheet = () => {
  const { i18n } = useContext(TranslationContext);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const phone = i18n.t("membership-expired.phone");
  const email = i18n.t("membership-expired.email");

  // tel: wants no spaces; WhatsApp/dialer handles the + country code.
  const callNumber = () => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  const sendEmail = () => Linking.openURL(`mailto:${email}`);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleComponent={null}
      backgroundStyle={styles.sheetBackground}
      style={styles.sheet}
    >
      <BottomSheetView style={styles.content}>
        <MaterialCommunityIcons name="card-account-details-outline" size={72} color="#fff" />

        <Label style={styles.title} size="title" weight="bold" color="#fff">
          {i18n.t("membership-expired.title")}
        </Label>

        <Label style={styles.message} color="#fff">
          {i18n.t("membership-expired.message")}
        </Label>

        <TouchableOpacity style={styles.contactRow} onPress={callNumber}>
          <MaterialCommunityIcons name="phone" size={22} color="#fff" />
          <Label style={styles.contactText} weight="bold" color="#fff">
            {phone}
          </Label>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={sendEmail}>
          <MaterialCommunityIcons name="email" size={22} color="#fff" />
          <Label style={styles.contactText} weight="bold" color="#fff">
            {email}
          </Label>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default MembershipExpiredSheet;

const styles = StyleSheet.create({
  sheet: {
    // Sit above the camera overlay (zIndex 20 on the camera's SafeArea).
    zIndex: 100,
  },
  sheetBackground: {
    backgroundColor: "#C62828",
    borderRadius: 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
  },
  message: {
    textAlign: "center",
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  contactText: {
    textDecorationLine: "underline",
  },
});
