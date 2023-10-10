import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Button, Chip } from "react-native-paper";
import { CustomTextInput } from "../../../components/customTextInput";
import { CacheImage } from "../../../components/cacheImage";
import { Label } from "../../../components/typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommentSection from "../comments/commentSection.component";
import Avatar from "../avatar/avatar.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";
import usePosts from "./usePosts";
import useLike from "../../../../hooks/useLike";
import useTime from "../../../../hooks/useTime";
import moment from "moment";
import { Skeleton } from "../../../components/skeleton";
import useUser from "../../../../hooks/useUser";
import BottomSheetSelector from "../../../components/bottomSheetSelector.component";
import { goback, navigate } from "../../../navigation/navigate";

export default function PostCard({
  data,
  comment = false,
  onTitlePress,
  onCommentPress,
  onSharePress,
  commentData,
  viewReplies,
  remainingComments,
  viewPreviousComments,
}) {
  const { timeDiffString } = useTime();
  const [like, setLike] = useState(data.liked);
  const [likeCount, setLikeCount] = useState(data.likeCount);
  const [commentCount, setCommentCount] = useState(data.commentCount);

  const { likePost, unlikePost, removePost } = usePosts();
  const { userData } = useUser();

  const [showDrawer, setShowDrawer] = useState(false);

  const options = [
    {
      title: "Remove Post",
      description: "Remove this post from the feed",
      logo: "trash-can-outline",
      onPress: () => {
        Alert.alert(
          "Remove Post",
          "Are you sure you want to remove this post?",
          [
            { text: "Cancel", onPress: () => {}, isPreferred: true },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                //Call Remove Comment API
                removePost(data.post_id);
                onDrawerClose();
                if (comment) {
                  goback();
                }
              },
            },
          ]
        );
      },
    },
    {
      title: "Edit Post",
      description: "Edit your post",
      logo: "pencil",
      onPress: () => {
        //Call Remove Comment API
        navigate("post-edit", { post: data, editMode: true });
        onDrawerClose();
      },
    },
  ];

  const [optionsTest, setOptionsTest] = useState([{}]);

  useEffect(() => {
    setLike(data.liked);
    setLikeCount(data.likeCount);
    setCommentCount(data.commentCount);
  }, [data.liked, data.likeCount, data.commentCount]);
  useEffect(() => {
    if (commentCount > 0 && userData.old_user_id === data.user_id) {
      const index = options.findIndex((item) => item.title === "Edit Post");
      // console.log("index", index, data.title);
      options.splice(index, 1);

      // console.log("options", options);
    }

    setOptionsTest(options);

    return () => {};
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
              Read more
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
    setLikeCount((prevCount) => prevCount + (_like ? 1 : -1));

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
                    <Label size={"caption"}>
                      {timeDiffString(data.date_posted * 1000)}
                    </Label>
                  </View>
                </View>
                <View style={styles.optionsContainer}>
                  {/* category */}
                  <View style={[styles.row]}>
                    <View style={[styles.row, styles.chip]}>
                      <Label weight={"bold"} size={12}>
                        {data.category}
                      </Label>
                    </View>
                  </View>
                  <Spacer position={"right"} size={"large"} />
                  {userData.old_user_id === data.user_id && (
                    <View
                      style={{
                        position: "absolute",
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

        <View
          style={[
            styles.container,
            styles.row,
            { justifyContent: "space-between" },
          ]}
        >
          <Label style={styles.counter}>{`${likeCount} Likes`} </Label>
          <Label style={styles.counter}>{`${commentCount} Comment${
            commentCount > 1 ? "s" : ""
          }`}</Label>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            style={styles.actionButton}
            color={like ? theme.colors.icons.active : "#444"}
            icon={like ? "thumb-up" : "thumb-up-outline"}
            onPress={handleLikePress}
            uppercase={false}
          >
            Like
          </Button>
          <Button
            style={styles.actionButton}
            color={"#444"}
            icon={"chat-outline"}
            onPress={onCommentPress}
            uppercase={false}
          >
            Comment
          </Button>
          <Button
            style={styles.actionButton}
            color={"#444"}
            icon={"share-outline"}
            onPress={onSharePress}
            uppercase={false}
          >
            ???
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
                  <Label weight={"bold"}>View previous comments...</Label>
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
        windowSize="25%"
        display={showDrawer}
      />
    </View>
  );
}

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
});
