import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Label } from "../components/typography/label.component";
import { goback, navigate } from "../navigation/navigate";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import useRequest from "../../hooks/useRequest";
import { theme } from "../infrastructure/theme";
import { ResizeMode, Video } from "expo-av";
import moment from "moment";
import { companyLogo, config } from "../utils/constants";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native-paper";
import { CacheImage } from "../components/cacheImage";

const NotificationsScreen = () => {
  const { i18n } = useTranslation();
  const isMounted = useRef(false);
  const request = useRequest();
  const [notifications, setNotifications] = useState(null);
  const videoRef = useRef(null);
  // const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    isMounted.current = true;

    // alert(window.location.host);

    getNotifications();

    return () => {
      isMounted.current = true;
    };
  }, []);

  const getNotifications = async () => {
    try {
      const response = await request("/v2/user/notifications", "GET");

      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const calculateRemainingTime = (time) => {
    console.log("calculate time");
    const remainingDays = moment(moment()).diff(time, "days");
    console.log(remainingDays);
    if (!(remainingDays > 0)) {
      const remainingHours = moment(moment()).diff(time, "hours");
      console.log(remainingHours);

      if (!(remainingHours > 0)) {
        const remainingMinutes = moment(moment()).diff(time, "minutes");
        console.log(remainingMinutes);

        if (!(remainingMinutes > 0)) {
          return `Just now`;
        }

        return remainingMinutes + `Today`;
      }

      return remainingHours + `Today`;
    }

    return remainingDays + `d`;
  };

  const RenderNotification = ({ item, index }) => {
    const [hasRead, setHasRead] = useState(item.read);

    const handlePress = () => {
      setHasRead(true);
      const link = item.href.slice(1).split("/");

      const read = async () => {
        try {
          const response = await request(
            `/v2/user/notifications/${item.id}`,
            "POST"
          );
        } catch (error) {
          console.log("Failed to read notification:", error);
        }
      };

      read();

      switch (link[0]) {
        case "post":
          navigate("post-detail", {
            id: link[1],
          });
          break;
      }
    };

    return (
      <TouchableWithoutFeedback onPress={handlePress}>
        <View
          style={[
            styles.notification,
            {
              backgroundColor: hasRead
                ? "white"
                : theme.colors.icons.active + "44",
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 15,
              flex: 12,
            }}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  height: "60%",
                  alignSelf: "flex-start",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              {item.image ? (
                <CacheImage
                  uri={`${item.image}_s1.jpg`}
                  resizeMode={"contain"}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 100,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",

                    backgroundColor: "white",
                    borderRadius: 100,
                    padding: 6,
                  }}
                >
                  <Image
                    source={companyLogo}
                    style={{
                      aspectRatio: 1,
                      flex: 1,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
            <Label
              style={{
                flexWrap: "wrap",
                flex: 1,
              }}
            >
              {item.message}
            </Label>
          </View>
          <View style={{ flex: 4, alignItems: "flex-end" }}>
            <Label>
              {item.time && calculateRemainingTime(item.time) + " ago"}
            </Label>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "#ddd",
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 0 }}>
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
              {i18n.t("return")}
            </Label>
          </TouchableOpacity>
        </View>
        <Label weight={"bold"} size={"h5"}>
          Benachrichtigungen
        </Label>
        <View style={{ flex: 1 }}>
          {/* Test Video */}
          {/* <View>
            <Video
              ref={videoRef}
              style={{ width: "100%", height: 300 }}
              source={{
                uri: `https://www.german-emirates-club.com/user/videos/IKE_2111.MP4`,
                // uri: `${config.SERVER_HOST}/uploads/app/forum/ace.mp4`,
              }}
              useNativeControls
              posterSource={companyLogo}
              posterStyle={{
                width: "20%",
              }}
              usePoster
              resizeMode={ResizeMode.CONTAIN}

              // onPlaybackStatusUpdate={(status) => setVideoStatus(StatusBar)}
            />
          </View> */}
          <FlatList
            data={notifications}
            renderItem={({ item, index }) => (
              <RenderNotification item={item} index={index} />
            )}
            style={{ marginHorizontal: -8 }}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={() => {
              return (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    paddingVertical: 50,
                  }}
                >
                  <Label size={20} weight={"bold"} color={"#bbb"}>
                    No notifications
                  </Label>
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    minHeight: 80,
  },
  iconContainer: {
    height: "80%",
    aspectRatio: "1",
    borderRadius: 100,
    backgroundColor: "#ddd",
    maxHeight: 80,
    maxWidth: 80,
    borderColor: "#ddd",
    borderWidth: 1,
  },
});
