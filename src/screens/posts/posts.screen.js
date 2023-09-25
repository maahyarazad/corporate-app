import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PostEntryForm from "./post_entry/postEntry.component";
import { Label } from "../../components/typography/label.component";
import useUser from "../../../hooks/useUser";
import { Post } from "./postDetail.screen";
import useRequest from "../../../hooks/useRequest";
import { Button } from "react-native-paper";

export default function PostsScreen() {
  const navigation = useNavigation();
  const newPostDefault = {
    title: "",
    content: "",
    user_id: null,
  };
  // const { rootPosts, like, unlike, fetchPosts, addPost, clearRootPosts } =
  //   usePosts();
  const {
    addPost,
    clearRootPosts,
    rootPosts,
    fetchPosts,
    updateCount,
    refreshPosts,
  } = usePosts();
  const [page, setPage] = useState(0);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const { userData } = useUser();
  const [newPostState, setNewPostState] = useState(newPostDefault);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    return () => {
      setShowNewPostModal(false);
      clearRootPosts();
      setPage(0);
    };
  }, []);

  useEffect(() => {
    if (changeCount !== updateCount) {
      setChangeCount(updateCount);
    }
    return () => {};
  }, [updateCount]);

  const handleTitlePress = () => {
    alert("Go to profile page");
  };

  const handleCommentPress = (post) => {
    console.log("POST Pressed: ", post);
    navigation.navigate("post-detail", {
      author: `${post.first_name} ${post.last_name}`,
      post,
    });
  };

  const handleSharePress = () => {
    alert("???");
  };

  const renderRowPost = ({ item, index }) => {
    return (
      <PostCard
        key={item.id}
        data={item}
        onCommentPress={() => handleCommentPress(item)}
        onSharePress={handleSharePress}
        onTitlePress={handleTitlePress}
      />
    );
  };

  const loadNextPage = async () => {
    try {
      setRefreshing(true);
      setIsLoading(true);
      console.log(`[${page}] Fetching additional posts...`);
      await fetchPosts(page);
      setRefreshing(false);
      setIsLoading(false);
      setPage(page + 1);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleNewPost = () => {
    setShowNewPostModal(true);
  };

  const handleCloseModal = () => {
    if (isNewPostEmpty()) {
      setShowNewPostModal(false);
    } else {
      confirmModalClose();
    }
  };

  const isNewPostEmpty = () => {
    if (
      newPostState.title.trim() === "" &&
      newPostState.content.trim() === ""
    ) {
      return true;
    } else {
      return false;
    }
  };

  const confirmModalClose = () => {
    Alert.alert(
      "Discard Post?",
      "Are you sure you want to discard this post? ",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Discard",
          onPress: () => {
            setShowNewPostModal(false);
            setNewPostState(newPostDefault);
          },
        },
      ]
    );
  };

  const refreshPage = async () => {
    try {
      setRefreshing(true);
      setIsLoading(true);
      await refreshPosts();
      // alert("Test");
      setIsLoading(false);
      setRefreshing(false);
      setPage(1);
    } catch (error) {
      console.log("Failed to refresh the page: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddPost = async () => {
    const newPost = new Post();

    newPost.title = newPostState.title;
    newPost.content = newPostState.content;
    newPost.user_id = userData.old_user_id;
    newPost.category_id = 1;
    newPost.first_name = userData.first_name;
    newPost.last_name = userData.last_name;
    newPost.prof_image = userData.member_image;
    newPost.like = false;
    newPost.likeCount = 0;
    newPost.comments = 0;

    const response = await addPost(newPost);
    setShowNewPostModal(false);
    setNewPostState(newPostDefault);
    Alert.alert("Post Pending", "Your post will be reviewed by an admin.");
  };

  return (
    <>
      <View style={styles.container}>
        {rootPosts || !isLoading ? (
          <KeyboardAwareFlatList
            ItemSeparatorComponent={() => (
              <View style={styles.separator}></View>
            )}
            style={styles.container}
            refreshing={refreshing}
            keyExtractor={(item) => item?.post_id?.toString()}
            onRefresh={refreshPage}
            data={rootPosts}
            extraData={updateCount}
            onEndReached={loadNextPage}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                {/* <Text style={{ color: "#aaa" }}>-- End of Feed --</Text> */}
              </View>
            )}
            renderItem={renderRowPost}
          ></KeyboardAwareFlatList>
        ) : (
          <>
            <Label>Test</Label>
          </>
        )}
        <View style={styles.floatButton}>
          <TouchableOpacity onPress={handleNewPost}>
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: 70,
                width: 70,
                borderRadius: 35,
                backgroundColor: theme.colors.icons.active,
              }}
            >
              <MaterialCommunityIcons name="plus" color={"white"} size={40} />
            </View>
          </TouchableOpacity>
        </View>
        <Modal
          visible={showNewPostModal}
          style={{ marginTop: 100, backgroundColor: "red", height: 200 }}
          presentationStyle="formSheet"
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          {/* Pill */}
          {/* <View
            style={{
              flexGrow: 0,
              flexDirection: "row",
              justifyContent: "center",
              paddingVertical: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#ddd",
                width: 40,
                height: 6,
                borderRadius: 20,
              }}
            ></View>
          </View> */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingTop: 12,
            }}
          >
            <MaterialCommunityIcons
              suppressHighlighting={true}
              onPress={handleCloseModal}
              name="close"
              size={30}
            />

            <Label weight={"bold"} size={"title"}>
              New Post
            </Label>
            <TouchableOpacity onPress={handleAddPost}>
              <View
                style={{
                  backgroundColor: theme.colors.icons.active,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Label
                  style={{ color: "white" }}
                  weight={"medium"}
                  size={"body"}
                >
                  Post
                </Label>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.modalInner}>
            <PostEntryForm setValue={setNewPostState} value={newPostState} />
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: 8,
    gap: 10,
    // backgroundColor: "#ddd",
    flex: 1,
  },
  separator: {
    // backgroundColor: "#ddd",
    height: 20,
  },
  floatButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  modalInner: {
    padding: 16,
    flex: 1,
  },
});
