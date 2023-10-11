import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PostEntryForm from "./post_entry/postEntryForm.component";
import { Label } from "../../components/typography/label.component";
import useUser from "../../../hooks/useUser";
import { Post } from "./postDetail.screen";
import { Button } from "react-native-paper";
import { debounce } from "lodash";
import { FlatList } from "react-native-bidirectional-infinite-scroll";
import { navigate } from "../../navigation/navigate";
import * as SecureStore from "expo-secure-store";
import { Spacer } from "../../components/spacer/spacer.component";

const PostCardModified = ({ item, ...props }) => {
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <View>
      {/* {lastViewed === item.post_id && (
        <>
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              backgroundColor: "#d1ccc0",
              padding: 12,
              flexDirection: "row",
              gap: 20,
            }}
          >
            <MaterialCommunityIcons name="arrow-up" size={24} color="black" />
            <Label>21 UNREAD POSTS</Label>
            <MaterialCommunityIcons name="arrow-up" size={24} color="black" />
          </View>
          <Spacer size={"medium"} position={"top"} />
        </>
      )} */}
      <PostCard data={item} {...props} />
    </View>
  );
};

const MemoizedPostComponent = React.memo(PostCardModified);

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
    loadOldPosts,
    updateCount,
    getMoreRecentPosts,
    testFunction,
  } = usePosts();
  const [page, setPage] = useState(0);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const { userData } = useUser();
  const [newPostState, setNewPostState] = useState(newPostDefault);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [lastViewed, setLastViewed] = useState(null);

  const flatListRef = useRef();

  useEffect(() => {
    const retrieveLastViewed = async () => {
      try {
        const last_post_viewed = await SecureStore.getItemAsync(
          "last_post_viewed"
        );
        if (last_post_viewed) {
          setLastViewed(parseInt(last_post_viewed));
          loadOldPosts(parseInt(last_post_viewed));
        } else {
          console.log("test2");
          setLastViewed(parseInt(11650));
          loadOldPosts(11650);
        }
      } catch (error) {
        alert("Failed to retrieve last viewed post");
        console.log(error);
      }
    };

    retrieveLastViewed();

    return () => {
      setShowNewPostModal(false);
      clearRootPosts();
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
      editMode: false,
    });
  };

  const handleSharePress = () => {
    alert("???");
  };

  const onViewableItemsChanged = useCallback(
    async ({ viewableItems, changed }) => {
      // console.log(`User: ${viewableItems[0]?.item?.post_id} is visible`);
      try {
        // await SecureStore.setItemAsync(
        //   "last_post_viewed",
        //   viewableItems[0]?.item?.post_id.toString()
        // );
      } catch (error) {
        console.log("Failed to save last viewed post");
      }
    }
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 100,
    waitForInteraction: true,
    minimumViewTime: 5,
  });

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: viewabilityConfig.current,
      onViewableItemsChanged,
    },
  ]);

  // const loadInitialPosts = async () => {
  //   try {
  //     const last_post_id = 11650;
  //     const limit = 50;
  //     const status = 1;

  //     const response = await request(
  //       `/v2/post/old?post_id=${last_post_id}&limit=${limit}&status=${status}`,
  //       "get"
  //     );

  //     if (response.success) {
  //       dispatch(loadOldPosts(response.data));
  //     }
  //   } catch (error) {
  //     console.error("Failed to get initial posts:", error);
  //   }
  // };

  // const fetchOldPosts = async (post_id) => {
  //   try {
  //     // alert(`Page ${page}`);
  //     // alert("load old");
  //     const last_post_id = post_id ?? 16444;
  //     const limit = 50;
  //     const status = 1;

  //     const response = await request(
  //       `/v2/post/old?post_id=${last_post_id}&limit=${limit}&status=${status}`,
  //       "get"
  //     );

  //     if (response.success) {
  //       dispatch(loadOldPosts(response.data));
  //     }
  //   } catch (error) {
  //     console.error("Failed to get posts:", error);
  //   }
  // };

  // const fetchNewPosts = async (post_id) => {
  //   try {
  //     // alert(`Page ${page}`);
  //     // alert("load old");
  //     const last_post_id = post_id ?? 16444;
  //     const limit = 50;
  //     const status = 1;
  //     const response = await request(
  //       `/v2/post/latest/more?post_id=${last_post_id}&limit=${limit}&status=${status}`,
  //       "get"
  //     );

  //     if (response.success) {
  //       dispatch(loadNewPosts(response.data));
  //     }
  //   } catch (error) {
  //     console.error("Failed to get posts:", error);
  //   }
  // };

  const loadNextPage = async () => {
    try {
      setIsLoading(true);
      await loadOldPosts();
      setIsLoading(false);
      // }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPost = () => {
    // setShowNewPostModal(true);
    navigate("post-select");
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
      await getMoreRecentPosts(rootPosts[0].post_id);
      // alert("damn");
      // fetchNewPosts(posts[0].post_id);
    } catch (error) {
      console.log("Failed to refresh the page: ", error);
    } finally {
    }
  };
  // const refreshPage = useCallback(
  //   debounce(async () => {
  //     try {
  //       await getMoreRecentPosts(rootPosts[0].post_id);
  //     } catch (error) {
  //       console.log("Failed to refresh the page: ", error);
  //     } finally {
  //     }
  //   }, 3000),
  //   [rootPosts]
  // );

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
    Alert.alert("Post Pending", "Your post will be reviewed by an admin. ");
  };

  const insertSeparator = () => {
    return <View style={styles.separator}></View>;
  };

  const renderRowPostCard = ({ item }) => {
    const handlePress = () => {
      handleCommentPress(item);
    };

    return (
      <MemoizedPostComponent
        key={item.id}
        item={item}
        onCommentPress={handlePress}
        onSharePress={handleSharePress}
        onTitlePress={handleTitlePress}
      />
    );
  };

  return (
    <>
      <View style={styles.container}>
        {rootPosts?.length > 0 && (
          /* <KeyboardAwareFlatList
            ref={flatListRef}
            ItemSeparatorComponent={() => (
              <View style={styles.separator}></View>
            )}
            style={styles.container}
            // refreshing={refreshing}
            keyExtractor={(item) => item?.post_id?.toString()}
            // onRefresh={refreshPage}
            data={rootPosts}
            extraData={updateCount}
            onEndReached={loadNextPage}
            onEndReachedThreshold={0.5}
            // onStartReachedThreshold={0.5}
            onStartReached={() => {
              refreshPage();
            }}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            ListFooterComponent={() => (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
              </View>
            )}
            renderItem={renderRowPost}
          ></KeyboardAwareFlatList> */

          <FlatList
            ref={flatListRef}
            // scrollEnabled={false}
            ItemSeparatorComponent={insertSeparator}
            style={styles.container}
            // refreshing={refreshing}
            keyExtractor={(item) => item?.post_id?.toString()}
            // onRefresh={refreshPage}
            data={rootPosts}
            // extraData={updateCount}
            onEndReached={loadNextPage}
            onEndReachedThreshold={10}
            // onStartReachedThreshold={1}
            onStartReached={refreshPage}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            viewabilityConfigCallbackPairs={
              viewabilityConfigCallbackPairs.current
            }
            viewabilityConfig={{
              viewareaCoveragePercentThreshold: 30,
            }}
            initialNumToRender={4}
            maxToRenderPerBatch={15}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={200}
            scrollEventThrottle={1000}
            windowSize={15}
            showsVerticalScrollIndicator={false}
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
            renderItem={renderRowPostCard}
          ></FlatList>
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
