import { StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import React, { useEffect, useState } from "react";
import { showToast } from "../../../Toast";
import { showConfirm } from "../../../components/confirmDialog.component";
import Avatar from "../avatar/avatar.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../components/typography/label.component";
import useTime from "../../../../hooks/useTime";
import BottomSheetSelector from "../../../components/bottomSheetSelector.component";
import usePosts from "./usePosts";
import useUser from "../../../../hooks/useUser";

const PostCardHeader = ({ item }) => {
  const { timeDiffString } = useTime();
  const { removePost } = usePosts();
  const { userData } = useUser();
  const options = [
    {
      title: "Beitrag löschen",
      description: "Deinen Beitrag entfernen",
      logo: "trash-can-outline",
      onPress: () => {
        showConfirm({
          title: "Beitrag löschen",
          message: "Bist du sicher, dass du diesen Beitrag löschen möchtest?",
          confirmText: "Löschen",
          cancelText: "Abbrechen",
          destructive: true,
          onConfirm: () => {
            //Call Remove Comment API
            showToast("info", "Hinweis", "Dein Beitrag wurde gelöscht");
            removePost(item.post_id, false);
            onDrawerClose();
          },
        });
      },
    },
    // {
    //   title: "Edit Post",
    //   description: "Edit your post",
    //   logo: "pencil",
    //   onPress: () => {
    //     //Call Remove Comment API
    //     navigate("post-edit", { post: item, editMode: true });
    //     onDrawerClose();
    //   },
    // },
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
                  showToast("info", "Profile", "on Title Press");
                }}
              >
                <View>
                  <Label size="body" weight="bold">
                    {`${item.first_name} ${item.last_name}`}
                  </Label>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* position/profession */}
            {item && item.position && (
              <View style={{ flexDirection: "row" }}>
                <Label size="caption" weight="regular">
                  {item.position}
                </Label>
              </View>
            )}
            <View>
              {/* <Label size="caption">{timeDiffString(item.date_posted)}</Label> */}
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
                <Label weight="bold" size={12}>
                  Marktplatz
                </Label>
              </View>
            </View>
            {/* {true && ( */}
            {userData.old_user_id === item.user_id && (
              <View>
                <View
                  style={{
                    right: 0,
                    top: -4,
                  }}
                >
                  <TouchableOpacity onPress={onDrawerOpen}>
                    <MaterialCommunityIcons
                      name="dots-horizontal"
                      size={25}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
        {/* <Label size="caption" weight="regular">
                {data.category}
              </Label> */}
        {/* Category */}
      </View>

      <BottomSheetSelector
        data={optionsTest}
        onClose={onDrawerClose}
        windowSize="15%"
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
