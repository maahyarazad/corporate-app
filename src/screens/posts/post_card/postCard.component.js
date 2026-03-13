import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Button } from "react-native-paper";
import { CacheImage } from "../../../components/cacheImage";
import { Label } from "../../../components/typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommentSection from "../comments/commentSection.component";
import Avatar from "../avatar/avatar.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";
import usePosts from "./usePosts";
import useTime from "../../../../hooks/useTime";
import { Skeleton } from "../../../components/skeleton";
import useUser from "../../../../hooks/useUser";
import BottomSheetSelector from "../../../components/bottomSheetSelector.component";
import { goback } from "../../../navigation/navigate";
import { height, width } from "../../../components/styles";
import GalleryView from "react-native-image-viewing";
import { companyLogo } from "../../../utils/constants";
import * as VideoThumbnails from "expo-video-thumbnails";
import VideoPlayerModal from "../../../components/videoPlayerModal/videoPlayerModal.component";
import { useTranslation } from "../../../../hooks/useTranslation";

const MemoizedGalleryView = React.memo(GalleryView);

const PostCard = ({
  data,
  comment = false,
  onTitlePress,
  onCommentPress,
  onSharePress,
  commentData,
  viewReplies,
  remainingComments,
  viewPreviousComments,
  origin = "feed",
}) => {
  const { likePost, unlikePost, removePost } = usePosts();
  const { userData } = useUser();
  const { timeDiffString } = useTime();
  const [like, setLike] = useState(data.liked);
  const [likeCount, setLikeCount] = useState(data.likeCount);
  const [commentCount, setCommentCount] = useState(data.commentCount);
  const [showDrawer, setShowDrawer] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const toggleCaption = () => {
    setIsCaptionVisible(!isCaptionVisible);
  };

  const options = [
    {
      title: "Beitrag löschen",
      description: "Anfrage zur Löschung deines Beitrags",
      logo: "trash-can-outline",
      onPress: () => {
        if (commentCount > 0 && userData.old_user_id === data.user_id) {
          Alert.alert(
            "Hinweis",
            "Du kannst einen Beitrag mit Kommentaren nicht löschen."
          );
        } else {
          Alert.alert(
            "Beitrag löschen",
            "Bist du sicher, dass du diesen Beitrag löschen möchtest?",
            [
              { text: "Abbrechen", onPress: () => {}, isPreferred: true },
              {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                  //Call Remove Comment API
                  Alert.alert(
                    "Notice",
                    "Your request has been sent. Please wait for the admin to approve."
                  );
                  removePost(data.post_id, true);
                  onDrawerClose();
                  if (comment) {
                    goback();
                  }
                },
              },
            ]
          );
        }
      },
    },
    // {
    //   title: "Edit Post",
    //   description: "Edit your post",
    //   logo: "pencil",
    //   onPress: () => {
    //     //Call Remove Comment API
    //     navigate("post-edit", { post: data, editMode: true });
    //     onDrawerClose();
    //   },
    // },
  ];

  const [optionsTest, setOptionsTest] = useState([{}]);

  useEffect(() => {
    setLike(data.liked);
    setLikeCount(data.likeCount);
    setCommentCount(data.commentCount);
  }, [data.liked, data.likeCount, data.commentCount]);

  useEffect(() => {
    // console.log("PostCard Renders");
    // if (commentCount > 0 && true) {
    // if (commentCount > 0 && userData.old_user_id === data.user_id) {

    //   const index = options.findIndex((item) => item.title === "Edit Post");
    //   // console.log("index", index, data.title);
    //   options.splice(index, 1);

    //   // console.log("options", options);
    // }
    getThumbnails();

    setOptionsTest(options);

    return () => {
      setThumbnails((prev) => []);
    };
  }, []);

  const onDrawerClose = () => {
    setShowDrawer(false);
  };
  const onDrawerOpen = () => {
    setShowDrawer(true);
  };

  const PostContent = ({ content }) => {
    //cut content to 150 characters
    const [cutContent, setCutContent] = useState(content.slice(0, 150));
    const { i18n } = useTranslation();

    //add read more to content if the length is more than 150
    useEffect(() => {
      if (content.length > 150 && !comment) {
        setCutContent(content.slice(0, 150));
      } else {
        setCutContent(content);
      }
    }, [content]);

    //add 'read more' if the content is more than 150 characters
    if (content.length > 150 && !comment) {
      return (
        <Text>
          {`${cutContent}... `}
          <TouchableWithoutFeedback onPress={onCommentPress}>
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: "bold",
              }}
            >
              {i18n.t("read-more")}
            </Text>
          </TouchableWithoutFeedback>
        </Text>
      );
    }

    return <Text>{`${cutContent}`}</Text>;
  };

  const handleLikePress = async () => {
    const _like = !like;
    //Route to like/unlike post
    setLike(_like);
    setLikeCount((prevCount) => parseInt(prevCount) + (_like ? 1 : -1));
    if (origin === "search") {
      data.likeCount = parseInt(data.likeCount) + (_like ? 1 : -1);
      data.liked = !like;
    }

    try {
      //Wrap in timeout to prevent lag
      setTimeout(() => {
        if (_like) {
          likePost(data.post_id);
        } else {
          unlikePost(data.post_id);
        }
      }, 0);
    } catch (error) {
      setLike(_like);
      setLikeCount((prevCount) => prevCount + (_like ? -1 : 1));
    }
  };

  const handleOptionPress = () => {
    onDrawerOpen();
  };

  const onGalleryClose = () => {
    setGalleryOpen(false);
  };

  const getThumbnails = async () => {
    try {
      const array_images = data.images?.split(",");
      const media_types = data.type?.split(",");

      array_images?.map(async (item, index) => {
        // if (media_types[index] === "video") {
        //   const thumbnail = await VideoThumbnails.getThumbnailAsync(
        //     item + ".mp4",
        //     {
        //       time: 1000,
        //     }
        //   );
        //   setThumbnails((prev) => [
        //     ...prev,
        //     {
        //       uri: thumbnail.uri,
        //       videoURI: item + ".mp4",
        //       type: "video",
        //     },
        //   ]);
        // } else {
        //   setThumbnails((prev) => [
        //     ...prev,
        //     {
        //       uri: item,
        //       type: media_types[index],
        //     },
        //   ]);
        // }
        setThumbnails((prev) => [
          ...prev,
          {
            uri: item,
            videoURI: media_types[index] === "video" ? item + ".mp4" : null,
            type: media_types[index],
          },
        ]);
      });
    } catch (error) {
      console.error("Failed to get thumbnail", error);
    }
  };

  const renderImageGrid = ({ item, index }) => {
    const handlePress = () => {
      if (item.type === "video") {
        setSelectedVideo(item.videoURI);
      } else {
        setImageIndex(index);
        setGalleryOpen(true);
      }
    };
    if (index <= 3 || comment)
      return (
        <TouchableWithoutFeedback onPress={handlePress}>
          <View
            style={{
              backgroundColor: "#eee",
              aspectRatio: comment
                ? 1
                : index === 2 && thumbnails.length === 3
                ? 2
                : 1,
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CacheImage
              uri={item.uri + "_s1.jpg"}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
              }}
            />

            {item.type === "video" && (
              <View
                style={{
                  position: "absolute",
                }}
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={80}
                  color={"white"}
                />
              </View>
            )}

            {index === 3 && thumbnails.length > 4 && !comment && (
              <TouchableWithoutFeedback onPress={onCommentPress}>
                <View
                  style={{
                    position: "absolute",
                    backgroundColor: "#00000088",
                    bottom: 0,
                    top: 0,
                    right: 0,
                    left: 0,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Label size={"title"} color={"white"}>{`+${
                    thumbnails.length - 4
                  } mehr`}</Label>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        </TouchableWithoutFeedback>
      );

    return null;
  };

  const SkeletonComment = () => {
    return (
      //Skeleton for comments
      <View style={{ paddingVertical: 4 }}>
        <View style={[styles.container, styles.title]}>
          <Skeleton
            variant={"circle"}
            width={50}
            height={50}
            opacityMax={0.15}
            opacityMin={0.1}
          />
          <View
            style={[
              styles.authorContainer,
              { marginLeft: 10, justifyContent: "flex-start" },
            ]}
          >
            <View
              style={{
                alignSelf: "stretch",
                justifyContent: "space-between",
                flexDirection: "row",
              }}
            >
              <View style={styles.row}>
                <Skeleton
                  variant={"square"}
                  width={"100%"}
                  height={50}
                  style={{ borderRadius: 10 }}
                  opacityMax={0.15}
                  opacityMin={0.1}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const onVideoClose = () => {
    setSelectedVideo(null);
  };

  const ImageWithCaption = ({ image, isVisible, onPress }) => {
    console.log(isVisible);
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={{ pointerEvents: "box-only" }}
      >
        <View>
          <Image
            source={{ uri: image.uri }}
            style={{ width: "100%", height: 300 }}
          />
          <Label color={"white"}>aw</Label>
          {isVisible && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
              }}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                bobo ka
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.post,
        {
          margin: 0,
          padding: 0,
        },
      ]}
    >
      <VideoPlayerModal video={selectedVideo} onClose={onVideoClose} />
      <View style={styles.background}>
        <TouchableWithoutFeedback onPress={onCommentPress}>
          {/* Title */}
          <View style={[styles.container, styles.title]}>
            {/* avatar */}
            <Avatar image={data.prof_image} />
            <View style={styles.authorContainer}>
              <View
                style={{
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                  flexDirection: "row",
                }}
              >
                <View>
                  {/* name */}
                  <View style={styles.row}>
                    <TouchableWithoutFeedback onPress={onTitlePress}>
                      <View>
                        <Label size={"body"} weight={"bold"}>
                          {`${data.first_name} ${data.last_name}`}
                        </Label>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>

                  {/* position/profession */}
                  {data && data.position && (
                    <View style={{ flexDirection: "row" }}>
                      <Label size={"caption"} weight={"regular"}>
                        {data.position}
                      </Label>
                    </View>
                  )}
                  <View>
                    {/* <Label size={"caption"}>
                      {timeDiffString(data.date_posted)}
                    </Label> */}
                  </View>
                </View>
                <View
                  style={[
                    styles.optionsContainer,
                    { position: "absolute", right: 0, gap: 6 },
                  ]}
                >
                  {/* category */}
                  <View style={[styles.row]}>
                    <View style={[styles.row, styles.chip]}>
                      <Label weight={"bold"} size={12}>
                        {data.category}
                      </Label>
                    </View>
                  </View>
                  
                  
                  {userData.old_user_id === data.user_id && (
                    <View>
                      <View
                        style={{
                          right: 0,
                          top: -4,
                        }}
                      >
                        <TouchableOpacity onPress={handleOptionPress}>
                          <MaterialCommunityIcons
                            name="dots-horizontal"
                            size={25}
                            color={"#aaa"}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              {/* <Label size={"caption"} weight={"regular"}>
                {data.category}
              </Label> */}
              {/* Category */}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Title */}
        <TouchableWithoutFeedback onPress={onCommentPress}>
          <View style={[styles.container, { paddingBottom: 0 }]}>
            <Label weight={"bold"} size={20}>
              {data.title}
            </Label>
          </View>
        </TouchableWithoutFeedback>

        {/* Content */}
        <View style={[styles.container, styles.content]}>
          <PostContent content={data.content} />
        </View>

        {/* Images */}
        {/* <View style={styles.imageGridContainer}> */}
        {/* {Array(4).fill("Test").map(renderImageGrid)} */}
        {thumbnails.length > 0 &&
          (comment ? (
            <FlatList
              data={thumbnails}
              scrollEnabled={false}
              renderItem={renderImageGrid}
            />
          ) : (
            <FlatList
              data={thumbnails}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ columnGap: 2 }}
              style={{ rowGap: 2, maxHeight: width, overflow: "hidden" }}
              renderItem={renderImageGrid}
            />
          ))}

        {/* </View> */}

        <View
          style={[
            styles.container,
            styles.row,
            { justifyContent: "space-between" },
          ]}
        >
          <Label style={styles.counter}>{`${likeCount} Likes`} </Label>
          <Label style={styles.counter}>{`${commentCount} Kommentar${
            commentCount > 1 ? "e" : ""
          }`}</Label>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            style={styles.actionButton}
            textColor={like ? theme.colors.icons.active : "#444"}
            icon={like ? "thumb-up" : "thumb-up-outline"}
            onPress={handleLikePress}
            uppercase={false}
          >
            Like
          </Button>
          <Button
            style={styles.actionButton}
            textColor={"#444"}
            icon={"chat-outline"}
            onPress={onCommentPress}
            uppercase={false}
          >
            Kommentieren
          </Button>
          <Button
            style={styles.actionButton}
            textColor={"#444"}
            icon={"share-outline"}
            onPress={onSharePress}
            uppercase={false}
          >
            Teilen
          </Button>
        </View>
      </View>

      {/* Comments */}
      {comment ? (
        commentData != null ? (
          <View style={[styles.comment, styles.background]}>
            {remainingComments > 0 && (
              <View style={[{ width: "auto", padding: 8 }]}>
                <TouchableOpacity
                  onPress={viewPreviousComments}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Label weight={"bold"}>
                    Vorherige Kommentare anzeigen...
                  </Label>
                </TouchableOpacity>
              </View>
            )}
            <CommentSection
              id={data.id}
              comments={commentData}
              handleViewReplies={viewReplies}
            />
          </View>
        ) : (
          <View>
            {[...Array(3)].map((item, index) => (
              <SkeletonComment key={index} />
            ))}
          </View>
        )
      ) : (
        <></>
      )}

      <BottomSheetSelector
        data={optionsTest}
        onClose={onDrawerClose}
        windowSize="15%"
        display={showDrawer}
      />
      {data.images && (
        <MemoizedGalleryView
          visible={galleryOpen}
          images={thumbnails.map((item) => {
            return item.type === "video"
              ? { uri: item.uri }
              : { uri: item.uri + "_s1.jpg" };
          })}
          imageIndex={imageIndex}
          onRequestClose={onGalleryClose}
          animationType="fade"
          swipeToCloseEnabled={true}
          HeaderComponent={() => (
            <SafeAreaView
              style={{
                flex: 1,
                width: "100%",
                marginTop: 40,
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                  flex: 1,
                }}
              >
                <Image
                  width={100}
                  height={100}
                  source={companyLogo}
                  resizeMode="contain"
                  style={{ width: 100, height: 100 }}
                ></Image>

                <View style={{ top: 20 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onGalleryClose}
                  >
                    <View style={{ padding: 10 }}>
                      <MaterialCommunityIcons
                        name={"close"}
                        size={30}
                        color={"#ddd"}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  image: {
    backgroundColor: "#ddd",
    width: "100%",
    height: "100%",
  },
  commentInput: {
    padding: 0,
    margin: 0,
    fontSize: 14,
  },
  comment: {
    borderWidth: 2,
    borderColor: "#ddd",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 2,
    // borderBottomWidth: 2,
    borderColor: "#ddd",
    margin: 0,
    padding: 0,
    borderRadius: 0,
  },
  content: {
    paddingVertical: 10,
  },
  actionButton: {
    flex: 1,
  },
  title: {
    // backgroundColor: "red",
    flexDirection: "row",
    paddingBottom: 0,
  },
  subtitle: {
    padding: 0,
    margin: 0,
    // backgroundColor: "maroon",
  },
  authorContainer: {
    justifyContent: "center",
    flex: 1,
  },
  post: {
    // elevation: 12,
    // shadowOpacity: 0.1,
    // shadowColor: "black",
    // shadowRadius: 4,
    // shadowOffset: {
    //   height: 5,
    //   width: 0,
    // },
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
  },
  counter: {
    color: "#888",
  },
  chip: {
    backgroundColor: "#ddd",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 50,
    opacity: 0.6,
  },
  background: { backgroundColor: "#fff" },
  imageGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
    paddingHorizontal: 8,
  },
  halfImage: {
    width: "49%",
    height: width / 2,
    backgroundColor: "red",
  },
});

export default React.memo(PostCard);
