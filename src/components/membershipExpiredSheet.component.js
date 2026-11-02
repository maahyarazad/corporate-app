import React, { useContext } from "react";
import { Linking, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "./typography/label.component";
import { TranslationContext } from "../services/translation/translation.context";

// A blocking, full-screen red panel shown when the member's membership has
// expired. Implemented as a plain RN Modal rather than @gorhom/bottom-sheet:
// bottom-sheet v4 calls Reanimated's useWorkletCallback, which Reanimated 4
// (SDK 54) removed, so it crashes on mount. A Modal needs no Reanimated and
// cannot be dismissed (no onRequestClose action), which is what we want.
const MembershipExpiredSheet = () => {
  const { i18n } = useContext(TranslationContext);

  const phone = i18n.t("membership-expired.phone");
  const email = i18n.t("membership-expired.email");

  // tel: wants no spaces; the dialer/WhatsApp handles the + country code.
  const callNumber = () => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  const sendEmail = () => Linking.openURL(`mailto:${email}`);

  return (
    <Modal visible transparent={false} animationType="slide">
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="card-account-details-outline"
          size={72}
          color="#fff"
        />

        <Label style={styles.title} weight="bold" color="#fff">
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
      </View>
    </Modal>
  );
};

export default MembershipExpiredSheet;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: "#C62828",
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
