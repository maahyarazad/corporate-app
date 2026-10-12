import { Image, ScrollView, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Label } from "../../components/typography/label.component";
import useRequest from "../../../hooks/useRequest";
import Markdown from "react-native-markdown-display";
import { CacheImage } from "../../components/cacheImage";
import { useRoute } from "@react-navigation/native";
import moment from "moment";
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
      style={[styles.cacheImage, { aspectRatio }]}
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
      console.log("Failed to get magazine: ", error);
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
        <View style={styles.box}>
          <Skeleton
            width="100%"
            height={16}
            opacityMax={0.2}
            variant="circle"
          />
          <Skeleton
            width="100%"
            height={16}
            opacityMax={0.2}
            variant="circle"
          />
          <Skeleton
            width="100%"
            height={16}
            opacityMax={0.2}
            variant="circle"
          />
          <Skeleton
            width="100%"
            height={16}
            opacityMax={0.2}
            variant="circle"
          />
          <Skeleton
            width="40%"
            height={16}
            opacityMax={0.2}
            variant="circle"
          />
        </View>
      );
    };
    return (
      <View style={styles.box2}>
        <View style={styles.box3}>
          <Skeleton
            width="100%"
            height={40}
            opacityMax={0.2}
            variant="circle"
          />
          <Skeleton
            width="50%"
            height={40}
            opacityMax={0.2}
            variant="circle"
          />
        </View>
        <View style={styles.row2}>
          <Skeleton
            width={50}
            height={50}
            opacityMax={0.2}
            variant="circle"
          />
          <View style={styles.flexBox}>
            <Skeleton
              width="50%"
              height={16}
              opacityMax={0.2}
              variant="circle"
            />
            <Skeleton
              width="50%"
              height={16}
              opacityMax={0.2}
              variant="circle"
            />
          </View>
        </View>
        <Skeleton
          width="100%"
          height={300}
          opacityMax={0.2}
          variant="square"
          borderRadius={10}
        />

        <View style={styles.box4}>
          <SkeletonParagraph />
          <SkeletonParagraph />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.tint}>
      <ScrollView contentContainerStyle={styles.contentContainerPad}>
        {article && article.body ? (
          <View style={styles.box5}>
            <View>
              <Label size="heading" weight="bold">
                {article.title}
              </Label>
              <View style={styles.spacer}/>
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
                      style={styles.image}
                      source={
                        article.author
                          ? { uri: article.author.profileImage }
                          : require("../../../assets/icon.png")
                      }
                    ></Image>
                  </View>
                </View>
                <View style={styles.box6}>
                  <Label size="caption" weight="bold">
                    {article.author
                      ? article.author.name
                      : "German Emirates Club"}
                  </Label>
                  <Label size="caption">
                    {moment(article.starttime).format("DD.MM.YYYY, HH:mm")}
                  </Label>
                </View>
              </View>
            </View>
            <MagazineImage uri={article.featuredImage} />
            <Markdown
              style={styles.markdown}
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
  box: {
    gap: 6,
  },
  box2: {
    gap: 16,
  },
  box3: {
    gap: 8,
  },
  row2: {
    flexDirection: "row",
    gap: 6,
  },
  flexBox: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  box4: {
    gap: 20,
  },
  tint: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainerPad: {
    paddingHorizontal: 12,
    paddingBottom: 50,
    paddingTop: 16,
  },
  box5: {
    gap: 14,
  },
  spacer: {
    marginTop: 6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  box6: {
    gap: 4,
  },
  markdown: {
    image: {
      margin: 0,
      padding: 0,
    },
    bullet_list_icon: {
      fontFamily: "arial black",
      fontWeight: "bold",
    },
  },
  cacheImage: {
    width: "100%",
    resizeMode: "contain",
  },
});
