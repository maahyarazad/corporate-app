import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    <View
      style={{
        flexDirection: "row",
        paddingBottom: 8,
        paddingHorizontal: 4,
      }}
    >
      <Image
        style={{
          height: 40,
          width: 80,
          resizeMode: "contain",
        }}
        source={require("../../../../assets/GE-LOGO-GOLD.png")}
      />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignContent: "center",
          justifyContent: "flex-end",
          paddingRight: 4,
          gap: 4,
        }}
      >
        <Label
          style={{
            paddingRight: 8,
            textAlign: "right",
            alignSelf: "center",
          }}
          numberOfLines={1}
          size="subtitle"
          weight="bold"
        >
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
          <View
            style={{
              flexDirection: "row",
              gap: 4,

              alignSelf: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                navigate("post-search");
              }}
            >
              <View
                style={{
                  width: 30,
                  aspectRatio: 1,
                  // borderRadius: 35,
                  // backgroundColor: "#eee",
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={30}
                  style={{ fontWeight: "" }}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigate("notifications");
              }}
            >
              <View
                style={{
                  width: 28,
                  // borderRadius: 35,
                  // backgroundColor: "#eee",
                  marginRight: 5,
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={28}
                  style={{ fontWeight: "" }}
                />
              </View>
              <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 6,
                  backgroundColor: "red",
                  borderRadius: 25,
                  width: 10,
                  aspectRatio: "1",
                }}
              ></View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigate("Profile");
              }}
            >
              {userData && userData.member_image ? (
                <View style={{ borderRadius: 25, overflow: "hidden" }}>
                  <CacheImage
                    style={{ width: 30, aspectRatio: "1" }}
                    uri={userData.member_image}
                  />
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

const styles = StyleSheet.create({});
