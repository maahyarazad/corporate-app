import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Avatar from "../avatar/avatar.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../components/typography/label.component";
import useTime from "../../../../hooks/useTime";
import { Spacer } from "../../../components/spacer/spacer.component";
import BottomSheetSelector from "../../../components/bottomSheetSelector.component";
import { goback, navigate } from "../../../navigation/navigate";
import usePosts from "./usePosts";

const PostCardHeader = ({ item }) => {
  const { timeDiffString } = useTime();
  const { removePost } = usePosts();
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
                removePost(item.post_id, 2);
                onDrawerClose();
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
        navigate("post-edit", { post: item, editMode: true });
        onDrawerClose();
      },
    },
  ];

  const [optionsTest, setOptionsTest] = useState([{}]);

  const [showDrawer, setShowDrawer] = useState(false);
  useEffect(() => {
    setOptionsTest(options);

    return () => {};
  }, []);

  const onDrawerClose = () => {
    setShowDrawer(false);
  };
  const onDrawerOpen = () => {
    setShowDrawer(true);
  };

  return (
    <View style={[styles.container, styles.title]}>
      {/* avatar */}
      <Avatar image={item.prof_image} />
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
              <TouchableWithoutFeedback
                onPress={() => {
                  alert("on Title Press");
                }}
              >
                <View>
                  <Label size={"body"} weight={"bold"}>
                    {`${item.first_name} ${item.last_name}`}
                  </Label>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* position/profession */}
            {item && item.position && (
              <View style={{ flexDirection: "row" }}>
                <Label size={"caption"} weight={"regular"}>
                  {item.position}
                </Label>
              </View>
            )}
            <View>
              <Label size={"caption"}>{timeDiffString(item.date_posted)}</Label>
            </View>
          </View>
          <View style={styles.optionsContainer}>
            {/* category */}
            <View style={[styles.row]}>
              <View style={[styles.row, styles.chip]}>
                <Label weight={"bold"} size={12}>
                  Marketplatz
                </Label>
              </View>
            </View>
            <Spacer position={"right"} size={"large"} />
            {/* {userData.old_user_id === data.user_id && ( */}
            {true && (
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  top: -4,
                }}
              >
                <TouchableOpacity onPress={onDrawerOpen}>
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

      <BottomSheetSelector
        data={optionsTest}
        onClose={onDrawerClose}
        windowSize="25%"
        display={showDrawer}
      />
    </View>
  );
};

export default PostCardHeader;

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
  },
  authorContainer: {
    justifyContent: "center",
    flex: 1,
  },
  title: {
    // backgroundColor: "red",
    flexDirection: "row",
    paddingBottom: 0,
  },
  chip: {
    backgroundColor: "#ddd",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 50,
    opacity: 0.6,
  },
});
