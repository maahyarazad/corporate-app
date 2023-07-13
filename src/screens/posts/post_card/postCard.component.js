import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React from "react";
import { Button, Chip } from "react-native-paper";
import { CustomTextInput } from "../../../components/customTextInput";
import { CacheImage } from "../../../components/cacheImage";
import { Label } from "../../../components/typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommentSection from "../comments/commentSection.component";
import Avatar from "../avatar/avatar.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";

export default function PostCard({
  data,
  comment = false,
  onTitlePress,
  onLikePress,
  onCommentPress,
  onSharePress,
}) {
  return (
    <View
      style={[
        styles.post,
        {
          backgroundColor: "#fff",
          margin: 0,
          padding: 0,
        },
      ]}
    >
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
                <View style={{ flexDirection: "row" }}>
                  <Label size={"caption"} weight={"regular"}>
                    {data.position}
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
                <Spacer position={"left"} size={"small"} />
                <TouchableOpacity>
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={22}
                    color={"#aaa"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* <Label size={"caption"} weight={"regular"}>
                {data.category}
              </Label> */}
            {/* Category */}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Content */}
      <View style={[styles.container, styles.content]}>
        <Text>{data.content}</Text>
      </View>

      <View
        style={[
          styles.container,
          styles.row,
          { justifyContent: "space-between" },
        ]}
      >
        <Label style={styles.counter}>{`${data.likeCount} Likes`} </Label>
        <Label
          style={styles.counter}
        >{`${data.comments.length} Comments`}</Label>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          style={styles.actionButton}
          color={data.like ? theme.colors.icons.active : "#444"}
          icon={data.like ? "thumb-up" : "thumb-up-outline"}
          onPress={onLikePress}
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

      {/* Comments */}
      {comment && data.comments && (
        <View style={styles.comment}>
          <CommentSection data={data.comments} />
        </View>
      )}
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
    elevation: 12,
    shadowOpacity: 0.1,
    shadowColor: "black",
    shadowRadius: 4,
    shadowOffset: {
      height: 5,
      width: 0,
    },
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
});
