import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import {
  KeyboardAwareScrollView,
  KeyboardAwareSectionList,
} from "react-native-keyboard-aware-scroll-view";
import { Label } from "../../components/typography/label.component";
import { CustomTextInput } from "../../components/customTextInput";
import { theme } from "../../infrastructure/theme";
import { Button } from "react-native-paper";
import { Spacer } from "../../components/spacer/spacer.component";
import useLog from "../../../hooks/useLog";

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const router = useRoute();
  const isMounted = useRef(true);
  const [post, setPost] = useState(null);
  const { posts, setPosts, like, unlike } = usePosts();
  const [comment, setComment] = useState(null);
  const scrollRef = useRef(null);
  const { logTime } = useLog();

  useEffect(() => {
    isMounted.current = true;

    changeHeader(`${router.params.author}'s post`);
    if (posts) {
      const response = fetchPost();
      if (response && isMounted.current) {
        setPost(response);
      } else {
        // navigation.goBack();
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [posts]);

  const changeHeader = (label) => {
    navigation.setOptions({
      headerTitle: label,
    });
  };

  const handleCommentSend = () => {
    const newComment = {
      id: post.comments[post.comments.length - 1] + 1,
      orderId: post.id,
      user_id: 3,
      date_commented: new Date("2023/06/21"), //option 1,
      first_name: "Rhea",
      last_name: "Mosot",
      position: "Developer",
      content: comment,
      like: false,
      likeCount: 0,
      comments: [],
    };

    const _post = { ...post, comments: [...post.comments, newComment] };

    setPost(_post);

    setComment(null);
    logTime("Added Comment");

    //Wait for the comment to be added in the array before scrolling to end
    setTimeout(() => {
      scrollRef.current.scrollToEnd();
    }, 0);
  };

  const handleCommentChange = (value) => {
    setComment(value);
  };

  const fetchPost = () => {
    return posts.find((_post) => _post.id === router.params.id);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={135}
      >
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          {post && (
            <PostCard
              data={post}
              comment={true}
              onLikePress={() => {
                post.like ? unlike(post.id) : like(post.id);
              }}
            />
          )}
        </ScrollView>

        {/* Comment Field */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: theme.colors.icons.active + "55",
            flexDirection: "row",
          }}
        >
          <CustomTextInput
            inputStyle={{
              borderRadius: 20,
              backgroundColor: "white",
              paddingTop: 10,
            }}
            style={{
              backgroundColor: null,
              flex: 1,
            }}
            multiline={true}
            areaHeight={20}
            placeholder={"Add a comment"}
            onChangeText={handleCommentChange}
            value={comment}
          />
          <Spacer position={"right"} size={"small"} />
          <Button
            mode="contained"
            labelStyle={{ color: "white" }}
            style={{ borderRadius: 50 }}
            uppercase={false}
            color={theme.colors.icons.active}
            onPress={handleCommentSend}
          >
            Reply
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
});
