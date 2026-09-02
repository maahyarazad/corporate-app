import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { Label } from "../../../components/typography/label.component";
import { useTranslation } from "../../../../hooks/useTranslation";
import useUser from "../../../../hooks/useUser";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navigate } from "../../../navigation/navigate";
import { CacheImage } from "../../../components/cacheImage";

const HomeHeader = ({ notification = false }) => {
  const { i18n } = useTranslation();
  const { userData } = useUser();

  useEffect(() => {
    console.log("Header Rendered");

    return () => {};
  }, []);

  return (
    <View style={styles.row}>
      <Image
        style={styles.image}
        source={require("../../../../assets/GE-LOGO-GOLD.png")}
      />
      <View style={styles.row2}>
        <Label style={styles.label} numberOfLines={1} size="subtitle" weight="bold">
          {/* {`Hi there, ${
                        userInfo != undefined
                          ? userInfo.first_name.split(" ")[0]
                          : ""
                      }!`} */}
          {i18n.t("user_greeting", {
            name:
              userData != undefined ? userData.first_name?.split(" ")[0] : "",
          })}
        </Label>
        {notification && (
          <View style={styles.row3}>
            <TouchableOpacity
              onPress={() => {
                navigate("post-search");
              }}
            >
              <View
                style={styles.box}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={30}
                  style={styles.materialCommunityIcons}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigate("notifications");
              }}
            >
              <View
                style={styles.box2}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={28}
                  style={styles.materialCommunityIcons}
                />
              </View>
              <View style={styles.overlay}></View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigate("Profile");
              }}
            >
              {userData && userData.member_image ? (
                <View style={styles.bordered}>
                  <CacheImage style={styles.cacheImage} uri={userData.member_image} />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-circle" size={30} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  image: {
    height: 40,
    width: 80,
    resizeMode: "contain",
  },
  row2: {
    flex: 1,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
    paddingRight: 4,
    gap: 4,
  },
  label: {
    paddingRight: 8,
    textAlign: "right",
    alignSelf: "center",
  },
  row3: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "center",
  },
  box: {
    width: 30,
    aspectRatio: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  materialCommunityIcons: {
    fontWeight: "",
  },
  box2: {
    width: 28,
    marginRight: 5,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 2,
    right: 6,
    backgroundColor: "red",
    borderRadius: 25,
    width: 10,
    aspectRatio: "1",
  },
  bordered: {
    borderRadius: 25,
    overflow: "hidden",
  },
  cacheImage: {
    width: 30,
    aspectRatio: "1",
  },
});
