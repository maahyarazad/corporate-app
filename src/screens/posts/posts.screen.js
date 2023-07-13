import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import usePosts from "./post_card/usePosts";
import PostCard from "./post_card/postCard.component";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";

export default function PostsScreen() {
  const navigation = useNavigation();
  const { posts, like, unlike } = usePosts();

  // useEffect(() => {
  //   console.log("============= POSTS ==============\n", posts);
  //   console.log("\n============ END POST =============");

  //   return () => {};
  // }, [posts]);

  const handleTitlePress = () => {
    alert("Go to profile");
  };

  const handleLikePress = (id, likeValue) => {
    if (likeValue) {
      unlike(id);
    } else {
      like(id);
    }
  };

  const handleCommentPress = (post) => [
    navigation.navigate("post-detail", {
      author: `${post.first_name} ${post.last_name}`,
      id: post.id,
    }),
  ];

  const handleSharePress = () => {
    alert("???");
  };

  const renderRowPost = ({ item, index }) => {
    return (
      <PostCard
        key={index + item.id}
        data={item}
        onCommentPress={() => handleCommentPress(item)}
        onLikePress={() => handleLikePress(item.id, item.like)}
        onSharePress={handleSharePress}
        onTitlePress={handleTitlePress}
      />
    );
  };

  return (
    <>
      {posts && (
        <KeyboardAwareFlatList
          ItemSeparatorComponent={() => <View style={styles.separator}></View>}
          style={styles.container}
          data={posts}
          ListFooterComponent={() => (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#aaa" }}>-- End of Feed --</Text>
            </View>
          )}
          renderItem={renderRowPost}
        ></KeyboardAwareFlatList>
      )}
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
});
