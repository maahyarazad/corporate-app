import {
  SafeAreaView,
  FlatList,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "../../Toast";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useUser from "../../../hooks/useUser";
import { Post } from "./postDetail.screen";
import { debounce } from "lodash";
// import { FlatList } from "react-native-bidirectional-infinite-scroll";
import { navigate } from "../../navigation/navigate";
import * as SecureStore from "expo-secure-store";
import PostCardMarketplace from "./post_card/postCardMarketplace.component";
import useAuth from "../../../hooks/useAuth";
import moment from "moment";
import { useTranslation } from "../../../hooks/useTranslation";
import PostCardMagazine from "./post_card/postCardMagazine.component";
import useRequest from "../../../hooks/useRequest";
import { Skeleton } from "../../components/skeleton";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../utils/listPerf";

const MAX_MAGAZINE = 20;

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
          <View style={{marginTop: 8}}/>
        </>
      )} */}
      <PostCard data={item} {...props} />
    </View>
  );
};

const RenderRowPostCard = ({ item, index, magazines }) => {
  const handleTitlePress = () => {
    showToast("info", "Profile", "Go to profile page");
  };

  const handleCommentPress = () => {
    // console.log("POST Pressed: ", item);
    navigate("post-detail", {
      author: `${item.first_name} ${item.last_name}`,
      post: item,
      editMode: false,
    });
  };

  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message: `https://www.german-emirates-club.com/Forum/${item.category_id}/${item.id}`,
        title: "Awesome content",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        //   console.log("shared with activity type of ", result.activityType);
        } else {
        //   console.log("shared");
        }
      }
    } catch (error) {
      console.log("Failed to share post:", error);
    }
  };

  const renderMagazines = () => {
    if (magazines) {
      if (index % 5 === 0 && index !== 0) {
        const magazineIndex = (Math.floor(index / 5) - 1) % magazines.length;
        return (
          <View style={styles.spacer}>
            <MemoizedPostCardMagazine item={magazines[magazineIndex]} />
          </View>
        );
      }
    }
    return null;
  };

  const renderCard = () => {
    switch (item.post_type) {
      case 1:
        return (
          <MemoizedPostComponent
            key={item.id}
            item={item}
            onCommentPress={handleCommentPress}
            onSharePress={handleSharePress}
            onTitlePress={handleTitlePress}
          />
        );

      case 2:
        return <MemoizedPostCardMarketplace key={item.id} item={item} />;
    }
  };

  return (
    <View key={item.id}>
      {renderMagazines()}
      {renderCard()}
    </View>
  );
};

const MemoizedRowPostCard = React.memo(RenderRowPostCard);
const MemoizedPostCardMagazine = React.memo(PostCardMagazine);
const MemoizedPostComponent = React.memo(PostCardModified);
const MemoizedPostCardMarketplace = React.memo(PostCardMarketplace);

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
    getLatestMagazines,
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
  const { signout } = useAuth();
  const { i18n } = useTranslation();
  const [magazines, setMagazines] = useState(null);
  const request = useRequest();

  const flatListRef = useRef();

  useEffect(() => {
    const retrieveLastViewed = async () => {
      try {
        const last_post_viewed = await SecureStore.getItemAsync(
          "last_post_viewed"
        );

        if (last_post_viewed) {
          setLastViewed(parseInt(last_post_viewed));
          loadOldPosts(moment().unix());
        } else {
          console.log("test2");
          setLastViewed(parseInt(99999));
          loadOldPosts(moment().unix());
        }
      } catch (error) {
        showToast("error", "Error", "Failed to retrieve last viewed post");
        console.log(error);
      }
    };

    const fetchMagazines = async () => {
      const response = await request(
        `/v2/post/magazine/latest?limit=${MAX_MAGAZINE}`,
        "get"
      );
      if (response.success) {
        setMagazines(response.data);
      }
    };

    fetchMagazines();
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

  const onSearchFocus = () => {
    navigate("post-search");
  };

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
  //     console.log("Failed to get initial posts:", error);
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
  //     console.log("Failed to get posts:", error);
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
  //     console.log("Failed to get posts:", error);
  //   }
  // };

  const loadNextPage = async () => {
    try {
      setIsLoading(true);
      await loadOldPosts(
        moment(rootPosts[rootPosts.length - 1].date_posted).unix()
      );
      setIsLoading(false);
      // }
    } catch (error) {
      console.log("wat", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPost = () => {
    // setShowNewPostModal(true);
    navigate("post-select");
    // signout();
  };

  const refreshPage = async () => {
    try {
    //   console.log("last date:", rootPosts[0].date_posted);
      await getMoreRecentPosts(rootPosts[0].date_posted);
      // alert("damn");
      // fetchNewPosts(posts[0].post_id);
    } catch (error) {
      console.log("Failed to refresh the page: ", error);
    } finally {
    }
  };

  const debounceRefreshPage = debounce(refreshPage, 300);
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
    showToast("info", "Post Pending", "Your post will be reviewed by an admin.");
  };

  const insertSeparator = () => {
    return <View style={styles.separator}></View>;
  };

  const LoadingScreen = () => {
    const SkeletonCard = () => {
      return (
        <View style={styles.box}>
          <View style={styles.rowCenter}>
            <Skeleton
              width={50}
              height={50}
              opacityMax={0.2}
              variant="circle"
            />
            <View style={styles.flexBox}>
              <Skeleton
                width="50%"
                height={20}
                opacityMax={0.2}
                variant="circle"
              />
              <Skeleton
                width="30%"
                height={20}
                opacityMax={0.2}
                variant="circle"
              />
            </View>
          </View>
          <View style={styles.box2}>
            <Skeleton
              width="100%"
              height={22}
              opacityMax={0.2}
              variant="circle"
            />
            <Skeleton
              width="100%"
              height={22}
              opacityMax={0.2}
              variant="circle"
            />
            <Skeleton
              width="100%"
              height={22}
              opacityMax={0.2}
              variant="circle"
            />
            <Skeleton
              width="40%"
              height={22}
              opacityMax={0.2}
              variant="circle"
            />
          </View>
        </View>
      );
    };

    return (
      <View style={styles.box3}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  };

  const renderRow = ({ item, index }) => (
    <MemoizedRowPostCard item={item} index={index} magazines={magazines} />
  );

  return (
    <>
      <SafeAreaView
        style={[styles.container, { gap: 0, backgroundColor: "white" }]}
      >
        {/* Header */}
        {rootPosts?.length > 0 ? (
          <>
            <FlatList
              removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
              // ListHeaderComponent={() => (
              //   <View
              //     style={{
              //       flex: 1,
              //       backgroundColor: "white",
              //       alignItems: "center",
              //       paddingHorizontal: 8,
              //     }}
              //   >
              //     <TouchableWithoutFeedback onPress={onSearchFocus}>
              //       <View
              //         style={{
              //           paddingVertical: 10,
              //           paddingHorizontal: 10,
              //           marginVertical: 4,
              //           flexDirection: "row",
              //           gap: 10,
              //           backgroundColor: "#eee",
              //           borderRadius: 50,
              //           width: "100%",
              //         }}
              //       >
              //         <MaterialCommunityIcons
              //           name="magnify"
              //           size={20}
              //           color="black"
              //         />
              //         <Label size="subtitle">Posts durchsuchen</Label>
              //       </View>
              //     </TouchableWithoutFeedback>
              //   </View>
              // )}
              showDefaultLoadingIndicators={false}
              ref={flatListRef}
              // scrollEnabled={false}
              ItemSeparatorComponent={insertSeparator}
              style={[styles.container, { backgroundColor: "#eee" }]}
              // refreshing={refreshing}
              keyExtractor={(item) => item?.post_id?.toString()}
              // onRefresh={refreshPage}
              data={rootPosts}
              // extraData={updateCount}
              onEndReached={loadNextPage}
              onEndReachedThreshold={0.5}
              // onStartReachedThreshold={0.5}
              onStartReached={debounceRefreshPage}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
              viewabilityConfigCallbackPairs={
                viewabilityConfigCallbackPairs.current
              }
              viewabilityConfig={{
                viewareaCoveragePercentThreshold: 30,
              }}
              initialNumToRender={10}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={200}
              scrollEventThrottle={1000}
              windowSize={15}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={() => (
                <View style={styles.centered}></View>
              )}
              renderItem={renderRow}
            ></FlatList>
          </>
        ) : (
          <LoadingScreen />
        )}
        <View style={styles.floatButton}>
          <TouchableOpacity onPress={handleNewPost}>
            <View
              style={[styles.centerBox, { backgroundColor: theme.colors.icons.active }]}
            >
              <MaterialCommunityIcons name="plus" color="white" size={40} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    height: 4,
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
  spacer: {
    marginBottom: 4,
  },
  box: {
    gap: 12,
    paddingVertical: 8,
  },
  rowCenter: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  flexBox: {
    flex: 1,
    gap: 6,
  },
  box2: {
    gap: 6,
  },
  box3: {
    padding: 8,
    gap: 16,
  },
  centered: {
    alignItems: "center",
    paddingVertical: 12,
  },
  centerBox: {
    justifyContent: "center",
    alignItems: "center",
    height: 70,
    width: 70,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 12,
  },
});
