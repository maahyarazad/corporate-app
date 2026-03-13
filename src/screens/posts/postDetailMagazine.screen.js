import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Label } from "../../components/typography/label.component";
import useRequest from "../../../hooks/useRequest";
import Markdown from "react-native-markdown-display";
import { CacheImage } from "../../components/cacheImage";
import { useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import moment from "moment";
import { Spacer } from "../../components/spacer/spacer.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Avatar from "./avatar/avatar.component";
import { Skeleton } from "../../components/skeleton";

export const MagazineImage = ({ uri }) => {
  const [aspectRatio, setAspectRatio] = useState(1.8);

  const onImageLoad = (e) => {
    const { width: originalWidth, height: originalHeight } =
      e.nativeEvent.source;

    setAspectRatio(originalWidth / originalHeight);
  };

  return (
    <CacheImage
      onLoad={onImageLoad}
      uri={uri}
      style={{ width: "100%", aspectRatio, resizeMode: "contain" }}
    />
  );
};

const PostDetailMagazine = () => {
  const request = useRequest();
  const [article, setArticle] = useState(null);
  const { params } = useRoute();

  const getMagazine = async () => {
    try {
      const response = await request(`/v2/post/magazine/${params.id}`, "GET");

      if (response.success) {
        setArticle(response.data);
      }
    } catch (error) {
      console.error("Failed to get magazine: ", error);
    }
  };

  useEffect(() => {
    getMagazine();

    return () => {};
  }, []);

  const renderImage = (node) => {
    return (
      <MagazineImage key={node.attributes.src} uri={node.attributes.src} />
    );
  };

  const LoadingScreen = () => {
    const SkeletonParagraph = () => {
      return (
        <View style={{ gap: 6 }}>
          <Skeleton
            width={"100%"}
            height={16}
            opacityMax={0.2}
            variant={"circle"}
          />
          <Skeleton
            width={"100%"}
            height={16}
            opacityMax={0.2}
            variant={"circle"}
          />
          <Skeleton
            width={"100%"}
            height={16}
            opacityMax={0.2}
            variant={"circle"}
          />
          <Skeleton
            width={"100%"}
            height={16}
            opacityMax={0.2}
            variant={"circle"}
          />
          <Skeleton
            width={"40%"}
            height={16}
            opacityMax={0.2}
            variant={"circle"}
          />
        </View>
      );
    };
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Skeleton
            width={"100%"}
            height={40}
            opacityMax={0.2}
            variant={"circle"}
          />
          <Skeleton
            width={"50%"}
            height={40}
            opacityMax={0.2}
            variant={"circle"}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Skeleton
            width={50}
            height={50}
            opacityMax={0.2}
            variant={"circle"}
          />
          <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
            <Skeleton
              width={"50%"}
              height={16}
              opacityMax={0.2}
              variant={"circle"}
            />
            <Skeleton
              width={"50%"}
              height={16}
              opacityMax={0.2}
              variant={"circle"}
            />
          </View>
        </View>
        <Skeleton
          width={"100%"}
          height={300}
          opacityMax={0.2}
          variant={"square"}
          borderRadius={10}
        />

        <View style={{ gap: 20 }}>
          <SkeletonParagraph />
          <SkeletonParagraph />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 50,
          paddingTop: 16,
        }}
      >
        {article && article.body ? (
          <View style={{ gap: 14 }}>
            <View>
              <Label size={"heading"} weight={"bold"}>
                {article.title}
              </Label>
              <View style={{marginTop: 6}}/>
              <View style={styles.row}>
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
                        article.author
                          ? { uri: article.author.profileImage }
                          : require("../../../assets/icon.png")
                      }
                    ></Image>
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  <Label size={"caption"} weight={"bold"}>
                    {article.author
                      ? article.author.name
                      : "German Emirates Club"}
                  </Label>
                  <Label size={"caption"}>
                    {moment(article.starttime).format("DD.MM.YYYY, HH:mm")}
                  </Label>
                </View>
              </View>
            </View>
            <MagazineImage uri={article.featuredImage} />
            <Markdown
              style={{
                image: { margin: 0, padding: 0 },
                bullet_list_icon: {
                  fontFamily: "arial black",
                  fontWeight: "bold",
                },
              }}
              rules={{
                image: renderImage,
              }}
            >
              {article.body}
            </Markdown>
          </View>
        ) : (
          <LoadingScreen />
        )}
      </ScrollView>
    </View>
  );
};

export default PostDetailMagazine;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
