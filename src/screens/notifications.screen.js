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
import React, { useCallback, memo, useEffect, useRef, useState } from "react";
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
import { SafeArea } from "../components/safearea.component";
import { isCancel } from "../utils/cancellation";

const RenderNotification = memo(({ item, index }) => {
  const [hasRead, setHasRead] = useState(item.read);
  const request = useRequest();

  const calculateRemainingTime = (time) => {
    const finalAppend = (text) => {
      return "vor " + text;
    };

    const remainingDays = moment(moment()).diff(time, "days");
    if (!(remainingDays > 0)) {
      const remainingHours = moment(moment()).diff(time, "hours");

      if (!(remainingHours > 0)) {
        const remainingMinutes = moment(moment()).diff(time, "minutes");

        if (!(remainingMinutes > 0)) {
          return `Gerade eben`;
        }

        return finalAppend(remainingMinutes + ` Min.`);
      }

      return finalAppend(remainingHours + ` Std.`);
    }

    return finalAppend(remainingDays + ` Tagen`);
  };

  const handlePress = (show) => {
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
      case "forum":
        
        navigate("post-detail", {
          id: link[1],
          showPrompt: item.msg_id === 3 || item.msg_id === 4,
        });
        break;
      case "marketplace":
        navigate("marketplace-details", {
          post: {
            post_id: link[1],
          },
          showPrompt: item.msg_id === 3 || item.msg_id === 4,
        });
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
                resizeMode="contain"
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
          <Label>{item.time && calculateRemainingTime(item.time)}</Label>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
});

const NotificationsScreen = () => {
  const { i18n } = useTranslation();
  const request = useRequest();
  const [notifications, setNotifications] = useState(null);
  const videoRef = useRef(null);
  // const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    // alert(window.location.host);

    getNotifications(controller.signal);

    return () => controller.abort();
  }, []);

  const getNotifications = async (signal) => {
    try {
      const response = await request(
        "/v2/user/notifications",
        "GET",
        undefined,
        undefined,
        signal
      );

      if (response.success) {
        setNotifications(response.data);
        console.log("notifications", response.data);
      }
    } catch (error) {
      if (isCancel(error)) return;
      console.log("error", error);
    }
  };

  const keyExtractor = useCallback(
    (item) => String(item.msg_id ?? item.id),
    []
  );

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

  const renderItem = ({ item, index }) => (
    <RenderNotification item={item} index={index} />
  );

  return (
    <SafeArea style={{ backgroundColor: "white" }}>
      <View style={[styles.container]}>
        <View style={{ paddingHorizontal: 0 }}>
          <TouchableOpacity
            onPress={goback}
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
            activeOpacity={0.5}
          >
            <Ionicons name="arrow-back" size={35} color="#555" />
            <Label
              size="body"
              weight="bold"
              style={{ color: "#555", justifyContent: "center" }}
            >
              {i18n.t("return")}
            </Label>
          </TouchableOpacity>
        </View>
        <Label weight="bold" size="h5">
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
            renderItem={renderItem}
            keyExtractor={keyExtractor}
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
                  <Label size={20} weight="bold" color="#bbb">
                    No notifications
                  </Label>
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeArea>
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
