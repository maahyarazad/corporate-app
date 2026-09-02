import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { memo, useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { goback, navigate } from "../../navigation/navigate";
import useRequest from "../../../hooks/useRequest";
import { Label } from "../../components/typography/label.component";
import PostCard from "./post_card/postCard.component";
import PostCardMarketplace from "./post_card/postCardMarketplace.component";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { theme } from "../../infrastructure/theme";
import moment from "moment";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../utils/listPerf";

const Searchbar = ({ onSearch, setValue }) => {
  const searchRef = useRef();

  const [searchText, setSearchText] = useState("");

  //Auto focus after view is rendered
  useEffect(() => {
    searchRef?.current?.focus();
  }, []);

  const handleSearchChange = (value) => {
    setSearchText(value);
    setValue(value);
  };

  return (
    <View
      style={[
        styles.row,
        {
          paddingRight: 12,
          alignItems: "center",
          paddingBottom: 12,
          borderBottomWidth: 2,
          borderColor: "#eee",
        },
      ]}
    >
      <TouchableOpacity onPress={goback}>
        <MaterialCommunityIcons name="chevron-left" size={40} />
      </TouchableOpacity>
      <View
        style={[
          styles.row,
          {
            flex: 1,
            backgroundColor: "#eee",
            borderRadius: 50,
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={25} />
        <TextInput
          style={styles.textInput}
          ref={searchRef}
          value={searchText}
          onChangeText={handleSearchChange}
          placeholder="Posts durchsuchen"
          returnKeyType="search"
          onSubmitEditing={() => onSearch(searchText)}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
};

const MemoizedPostCard = memo(PostCard);
const MemoizedPostCardMarketplace = memo(PostCardMarketplace);

const PostSearch = () => {
  const [posts, setPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [remaining, setRemaining] = useState(null);

  const request = useRequest();

  useEffect(() => {
    return () => {
      setPosts(null);
    };
  }, []);

  const handleOnSearch = async (keyword) => {
    try {
      setIsLoading(true);
      const response = await request(
        `/v2/post/search?keyword=${keyword}`,
        "get"
      );

      if (response.success) {
        setPosts(response.data);
        setIsLoading(false);
        setIsEmpty(response.data?.length === 0 ? true : false);
        setRemaining(response.remaining);
        // console.log("remaining0", response.remaining);
      }
    } catch (error) {
      setIsLoading(false);
    //   console.log("Failed to get posts", error);
    }
  };

  const renderResults = ({ item }) => {
    const handleCommentPress = () => {
    //   console.log("POST Pressed: ", item);
      navigate("post-detail", {
        author: `${item.first_name} ${item.last_name}`,
        post: item,
        editMode: false,
        origin: "search",
      });
    };

    switch (item.post_type) {
      case 1:
        return (
          <MemoizedPostCard data={item} onCommentPress={handleCommentPress} />
        );
      case 2:
        return <MemoizedPostCardMarketplace item={item} />;
    }
  };

  const loadMore = async () => {
    try {
      // alert(keyword);
      if (!remaining) return;
      if (posts && posts?.length < 50) {
        setIsLoading(true);
        const response = await request(
          `/v2/post/search?keyword=${keyword}&prev=${moment(
            posts[posts.length - 1].date_posted
          ).unix()}`,
          "get"
        );

        if (response.success) {
          setPosts((prev) => [...prev, ...response.data]);
          setIsLoading(false);
          setIsEmpty(response.data?.length === 0 ? true : false);
          setRemaining(response.remaining);
        //   console.log("remaining", response.remaining);
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Failed to get posts", error);
    }
  };

  const LoadMoreButton = () => {
    const loadMoreManual = async () => {
      try {
        if (!remaining) return;
        setIsLoading(true);
        const response = await request(
          `/v2/post/search?keyword=${keyword}&prev=${moment(
            posts[posts.length - 1].date_posted
          ).unix()}`,
          "get"
        );

        if (response.success) {
          setPosts((prev) => [...prev, ...response.data]);
          setIsLoading(false);
          setIsEmpty(response.data?.length === 0 ? true : false);
          setRemaining(response.remaining);
        //   console.log("remaining2", response.remaining);
        }
      } catch (error) {
        setIsLoading(false);
        console.log("Failed to get posts", error);
      }
    };
    return (
      posts &&
      posts?.length >= 50 &&
      remaining && (
        <TouchableOpacity onPress={loadMoreManual}>
          <View
            style={[styles.centerBox2, { backgroundColor: theme.colors.icons.active }]}
          >
            <Label color="white" weight="bold">
              Click Here to Load More
            </Label>
          </View>
        </TouchableOpacity>
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textInput}>
        <Searchbar setValue={setKeyword} onSearch={handleOnSearch} />

        <View style={styles.textInput}>
          {isEmpty ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="emoticon-sad-outline" size={50} />
              <Label>No results found</Label>
            </View>
          ) : (
            <FlatList
              removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
              data={posts}
              renderItem={renderResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.flatListContentContainer}
              style={styles.flatList}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={LoadMoreButton}
            />
          )}
          <LoadingOverlay display={isLoading} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PostSearch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  textInput: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  flatListContentContainer: {
    gap: 8,
  },
  flatList: {
    flex: 1,
    backgroundColor: "#eee",
  },
  centerBox2: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
