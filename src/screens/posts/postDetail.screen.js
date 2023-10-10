import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import { Label } from "../../components/typography/label.component";
import { CustomTextInput } from "../../components/customTextInput";
import { theme } from "../../infrastructure/theme";
import { Button } from "react-native-paper";
import { Spacer } from "../../components/spacer/spacer.component";
import useUser from "../../../hooks/useUser";

const COMMENT_MAXLENGTH = 500;

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const router = useRoute();
  const [post, setPost] = useState(null);
  const {
    // posts,
    // addComment,
    // like,
    // unlike,
    fetchComments,
    replyTo,
    resetReply,
    testFunction,
    likePost,
    unlikePost,
    addComment,
  } = usePosts();
  const { userData } = useUser();
  const [comment, setComment] = useState("");
  const [postComments, setPostComments] = useState(null);
  const isMounted = useRef(true);
  const keyboardRef = useRef(null);
  const scrollRef = useRef(null);
  const [focus, setFocus] = useState(false);
  const [page, setPage] = useState(0);
  const [remainingComments, setRemainingComments] = useState(null);
  const [oldest, setOldest] = useState(null);
  const [openOptions, setOpenOptions] = useState(false);

  const { author, updateData, post: homePost } = router.params;

  useEffect(() => {
    isMounted.current = true;
    changeHeader(`${author}'s post`);

    setPost(router.params.post);

    const getComments = async () => {
      const response = await fetchComments(router.params.post.id, 0);
      if (isMounted && response.success) {
        // const tree = makeTree(response.data);
        setPostComments(response.data);
        setRemainingComments(response.remaining);
        if (response.data.length > 0) setOldest(response.data[0].id);

        // setOgPostComments(response.data);
        // console.log(
        //   "ver 1",
        //   JSON.stringify(makeHierarchy(response.data))
        // );
        // console.log("ver 2", JSON.stringify(makeTree(response.data)));
      }
    };
    getComments();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const [elapsedTime, setElapsedTime] = useState(0);

  //Refreshes the rendered components every minute
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     console.log(elapsedTime);
  //     setElapsedTime(elapsedTime + 1);
  //   }, 60000);

  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, [elapsedTime]);

  useEffect(() => {
    isMounted.current = true;

    if (replyTo && keyboardRef && keyboardRef.current) {
      keyboardRef.current.focus();
      setFocus(true);
      setComment(`@${replyTo.name} `);
    }

    return () => {
      isMounted.current = false;
    };
  }, [replyTo]);

  const changeHeader = (label) => {
    navigation.setOptions({
      headerTitle: label,
    });
  };

  const fieldOnBlur = () => {
    setFocus(false);
    setTimeout(() => {
      resetReply();
    }, 0);
  };
  const handleCommentSend = async () => {
    try {
      console.log("REPLIED TO ", replyTo ? replyTo.id : router.params.post.id);

      const newComment = new Post();
      newComment.id = new Date().getTime();
      newComment.order_id = replyTo ? replyTo.id : router.params.post.id;
      newComment.user_id = userData.old_user_id;
      newComment.prof_image = userData.member_image;
      newComment.date_posted = new Date() / 1000;
      newComment.first_name = userData.first_name;
      newComment.last_name = userData.last_name;
      newComment.content = comment;
      newComment.like = false;
      newComment.likeCount = 0;
      newComment.hideActions = true;

      setPostComments([...postComments, newComment]);
      const localComments = [...postComments, newComment];
      setComment("");
      post.commentCount += 1;
      //Wait for the comment to be added in the array before scrolling to end
      setTimeout(() => {
        if (newComment.order_id === router.params.post.id) {
          // scrollRef.current.scrollToEnd();
        }
        Keyboard.dismiss();
      }, 0);

      // console.log("update", JSON.stringify(postComments.data));
      const response = await addComment(router.params.post.id, newComment);
      if (!response.success) {
        console.log(response.success);
        const revert = localComments.filter(
          (comment) => comment.id !== response.id
        );
        post.commentCount -= 1;
        setPostComments(revert);
      } else {
        newComment.id = response.newId;
        newComment.hideActions = false;
        setPostComments([...postComments, newComment]);
      }

      // setOgPostComments([...ogPostComments, newComment]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCommentChange = (value) => {
    setComment(value);
  };

  const viewMoreReplies = async (id) => {
    try {
      const response = await fetchComments(id, 1);

      const _postComments = postComments.map((comment) => {
        if (comment.id === id) {
          comment.commentCount = 0;
        }
        return comment;
      });

      setPostComments([..._postComments, ...response.data]);
    } catch (error) {
      console.log("Unable to view more comments:", error);
    }
  };

  const handleCommentLikePress = (comment_id, liked) => {};

  const handleLikePress = (post_id, liked) => {
    if (liked) {
      likePost(post_id);
    } else {
      unlikePost(post_id);
    }
  };

  const handleCommentPress = () => {
    keyboardRef.current.focus();
  };

  const makeTree = (flatlist) => {
    if (!flatlist) {
      return null;
    }

    let map = {},
      node,
      roots = [],
      i,
      list = JSON.parse(JSON.stringify(flatlist)); //Deep Copy

    for (i = 0; i < list.length; i += 1) {
      map[list[i].id] = i; // initialize the map
      list[i].comments = []; // initialize the children
    }

    for (i = 0; i < list.length; i += 1) {
      node = list[i];
      if (node.order_id !== router.params.post.id) {
        // if you have dangling branches check that map[node.parentId] exists
        list[map[node.order_id]].comments.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  };

  const viewPreviousComments = async () => {
    try {
      const _page = page + 1;
      const response = await fetchComments(router.params.post.id, 0, oldest);

      //count how many elements of postComments that have orderId === 11887

      setRemainingComments(response.remaining);
      setPage(_page);
      setOldest(response.data[0].id);
      setPostComments([...response.data, ...postComments]);
      console.log("new top level comments: ", response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTest = () => {
    if (post) testFunction(post.post_id);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={135}
      >
        <ScrollView
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
        >
          {post && (
            <PostCard
              data={post}
              comment={true}
              onLikePress={handleLikePress}
              onCommentPress={handleCommentPress}
              commentData={makeTree(postComments)}
              viewReplies={viewMoreReplies}
              viewPreviousComments={viewPreviousComments}
              remainingComments={remainingComments}
            />
          )}
        </ScrollView>

        {/* Comment Field */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: theme.colors.icons.active + "55",
          }}
        >
          {replyTo && focus && (
            <>
              <Label>
                {`Replying to `}
                <Label weight={"bold"}>{replyTo.name}</Label>
              </Label>
              <Spacer position={"bottom"} size={"small"} />
            </>
          )}
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <View style={{ flexDirection: "row" }}>
                <CustomTextInput
                  ref={keyboardRef}
                  inputStyle={{
                    borderRadius: 8,
                    backgroundColor: "white",
                    paddingTop: 10,
                  }}
                  style={{
                    backgroundColor: null,
                    flex: 1,
                  }}
                  onBlur={fieldOnBlur}
                  multiline={true}
                  areaHeight={20}
                  placeholder={"Add a comment"}
                  onChangeText={handleCommentChange}
                  value={comment}
                  maxLength={COMMENT_MAXLENGTH}
                />
              </View>
              {
                <View
                  style={{
                    height: 2,
                    width: `${(comment.length / COMMENT_MAXLENGTH) * 100}%`,
                    backgroundColor:
                      (comment.length / COMMENT_MAXLENGTH) * 100 > 90
                        ? "red"
                        : "#88CC00",
                    borderRadius: 50,
                  }}
                ></View>
              }
            </View>
            <Spacer position={"right"} size={"small"} />
            <Button
              mode="contained"
              labelStyle={{ color: "white" }}
              contentStyle={{}}
              style={styles.replyButton}
              uppercase={false}
              color={theme.colors.icons.active}
              disabled={!comment}
              onPress={handleCommentSend}
            >
              <Label>Reply</Label>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export class Post {
  constructor(
    id,
    order_id,
    user_id,
    date_posted,
    first_name,
    last_name,
    position,
    content,
    like,
    likeCount
  ) {
    this.id = id;
    this.order_id = order_id;
    this.user_id = user_id;
    this.date_posted = date_posted;
    this.first_name = first_name;
    this.last_name = last_name;
    this.position = position;
    this.content = content;
    this.like = like;
    this.likeCount = likeCount;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  replyButton: {
    borderRadius: 10,
    justifyContent: "center",
  },
});
