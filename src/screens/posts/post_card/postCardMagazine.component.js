import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect } from "react";
import PostCardHeader from "./postCardHeader.component";
import Avatar from "../avatar/avatar.component";
import { companyLogo } from "../../../utils/constants";
import { Label } from "../../../components/typography/label.component";
import { CacheImage } from "../../../components/cacheImage";
import { MagazineImage } from "../postDetailMagazine.screen";
import { Button } from "react-native-paper";
import { theme } from "../../../infrastructure/theme";
import { navigate } from "../../../navigation/navigate";
import { useTranslation } from "../../../../hooks/useTranslation";

const PostCardMagazine = ({ item }) => {
  const { i18n } = useTranslation();
  useEffect(() => {
    // console.log("magazine rendered", item.post_id);

    return () => {};
  }, []);

  const handleReadMore = () => {
    const id = item.post_id.match(/\d+/)[0];

    navigate("magazine-details", { id });
  };

  const body = item.body.replace(/\n/g, " ");
  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.rowCenter,
          {
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={styles.rowCenter}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircleMask,
                {
                  borderRadius: 50,
                  width: 50,
                  height: 50,
                  flex: 0,
                  flexGrow: 0,
                  borderColor: "#ddd",
                  borderWidth: 1,
                },
              ]}
            >
              <Image
                style={{
                  width: "100%",
                  height: "100%",
                }}
                source={
                  item.author_image
                    ? { uri: item.author_image }
                    : require("../../../../assets/icon.png")
                }
              ></Image>
            </View>
          </View>
          <Label weight="bold">{item.author ?? "German Emirates Club"}</Label>
        </View>
        <View style={[styles.row]}>
          <View style={[styles.row, styles.chip]}>
            <Label weight="bold" size={12}>
              Magazin
            </Label>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 12 }}>
        <TouchableWithoutFeedback onPress={handleReadMore}>
          <View style={{ gap: 12 }}>
            <Label size={20} weight="bold">
              {item.title}
            </Label>
            <MagazineImage uri={item.image} />
            {/* <CacheImage
          uri={
            "https://www.german-emirates-club.com/uploads/sys/__upload_4c5fd158cebd3_1281347928.JPG"
          }
          style={{
            width: "100%",
            aspectRatio: 3 / 2,
          }}
          resizeMode="cover"
        /> */}
            <Label>
              {`${body}${item.moreBody ? "..." : ""}`}{" "}
              {item.moreBody && (
                <TouchableWithoutFeedback onPress={handleReadMore}>
                  <Text style={{ fontWeight: "bold" }}>
                    {i18n.t("read-more")}
                  </Text>
                </TouchableWithoutFeedback>
              )}
            </Label>
          </View>
        </TouchableWithoutFeedback>
        {/* { item.moreBody && (
          <Button
            mode="contained"
            labelStyle={{ fontWeight: "bold" }}
            buttonColor={theme.colors.icons.active}
            style={{ borderRadius: 8, paddingVertical: 4 }}
            onPress={handleReadMore}
          >
            Weiterlesen
          </Button>
        )} */}
      </View>
    </View>
  );
};

export default PostCardMagazine;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 8,
    paddingBottom: 15,
    gap: 8,
  },
  row: {
    flexDirection: "row",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    backgroundColor: "#ddd",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 50,
    opacity: 0.6,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarCircleMask: {
    backgroundColor: "#ddd",
    flex: 1,
    overflow: "hidden",
  },
});
