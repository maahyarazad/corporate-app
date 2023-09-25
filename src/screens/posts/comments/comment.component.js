import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Avatar from "../avatar/avatar.component";
import { Label } from "../../../components/typography/label.component";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";
import useLog from "../../../../hooks/useLog";
import CommentSection from "./commentSection.component";
import useTime from "../../../../hooks/useTime";
import usePosts from "../post_card/usePosts";
import useUser from "../../../../hooks/useUser";
import useBottomDrawer from "../../../../hooks/useBottomDrawer";

export default function Comment({
  data,
  onReply,
  degree,
  disableReply,
  replies = 0,
  handleViewReplies,
}) {
  const { logTime } = useLog();
  const [like, setLike] = useState(data.liked);
  const [likeCount, setLikeCount] = useState(data.likeCount);
  const { timeDiffString } = useTime();
  const [isViewed, setIsViewed] = useState(false);

  const { userData } = useUser();
  const { likeComment, unlikeComment } = usePosts();
  const { drawerOpen, drawerClose, setDrawerContent } = useBottomDrawer();
  const toggleLike = () => {
    setLike(!like);
    setLikeCount(like ? likeCount - 1 : likeCount + 1);

    if (like) {
      unlikeComment(data.post_id);
    } else {
      likeComment(data.post_id);
    }
    // alert(`Like ${data.post_id}`);
    logTime(data);
  };

  const viewReply = () => {
    setIsViewed(true);
    handleViewReplies(data.order_id);
  };

  const onOptionsPress = () => {
    let options = [];

    if (userData.old_user_id === data.user_id) {
      options.push({
        title: "Remove",
        description: "Remove this comment",
        logo: "trash-can",
        onPress: () => {
          drawerClose();
        },
      });

      options.push({
        title: "Edit",
        description: "Edit this comment",
        logo: "pencil",
        onPress: () => {
          drawerClose();
        },
      });
    }

    setDrawerContent(
      options.length > 0 ? (
        <>
          <ScrollView style={{ marginHorizontal: 12 }}>
            <View
              style={{
                borderRadius: 8,
                backgroundColor: "#eee",
              }}
            >
              {options.map((option, index) => {
                if (!option) {
                  return null;
                }

                return (
                  <View key={index}>
                    <TouchableOpacity
                      onPress={() => {
                        option.onPress();
                      }}
                    >
                      <View
                        style={{
                          padding: 10,
                          flexDirection: "row",
                          gap: 12,
                          alignItems: "center",
                          borderColor: "#ddd",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: theme.colors.ui.gray,
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={option.logo}
                            size={22}
                            color={"#fff"}
                          />
                        </View>
                        <View>
                          <Label weight={"bold"}>{option.title}</Label>
                          <Label>{option.description}</Label>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < options.length - 1 && (
                      <View
                        style={{ flex: 1, height: 2, backgroundColor: "#ddd" }}
                      ></View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </>
      ) : null
    );
    drawerOpen();
  };

  return (
    <View>
      <View
        style={[
          styles.header,
          {
            opacity:
              data.hideActions === undefined || !data.hideActions ? 1 : 0.3,
            paddingBottom: degree > 1 ? 8 : 8,
            paddingVertical: degree > 1 ? 14 : 8,
            // paddingLeft: degree > 1 ? 60 : 8,
            backgroundColor: degree > 1 ? "#eee" : "white",
            borderRadius: degree > 1 ? 12 : 0,
          },
        ]}
      >
        {/* Profile Picture */}
        <View>
          <Avatar image={data.prof_image} size={degree > 1 ? 30 : 45} />
        </View>
        {/* Details */}
        <View style={{ flex: 1 }}>
          <View style={styles.replyDetails}>
            <View
              style={{
                flexDirection: "row",
              }}
            >
              <Label
                size={"caption"}
                weight={"bold"}
              >{`${data.first_name} ${data.last_name}`}</Label>
              <Label size={"caption"} weight={"regular"}>
                {` • ${timeDiffString(data.date_posted * 1000)}`}
              </Label>
            </View>

            {/* <Label
            size={"caption"}
            weight={"regular"}
          >{`${data.position}`}</Label> */}

            {/* Show only if user is the one created it */}
            {userData.old_user_id === data.user_id && (
              <View style={{ position: "absolute", right: 0, top: -4 }}>
                <TouchableOpacity onPress={onOptionsPress}>
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={22}
                    color={"#aaa"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Label size={14} style={styles.content}>
            {data.content}
          </Label>

          {(data.hideActions === undefined || !data.hideActions) && (
            <View styles={styles.actionContainer}>
              <View style={styles.actions}>
                <View style={[styles.inline]}>
                  <TouchableWithoutFeedback onPress={toggleLike}>
                    <View style={[styles.inline]}>
                      {likeCount > 0 && (
                        <Label
                          style={{
                            color: like ? theme.colors.icons.active : "black",
                          }}
                          weight={"bold"}
                          size={12}
                        >{`${likeCount} `}</Label>
                      )}
                      <MaterialCommunityIcons
                        size={12}
                        name={like ? "thumb-up" : "thumb-up-outline"}
                        color={like ? theme.colors.icons.active : "black"}
                      />
                      <Label
                        size={12}
                        style={{
                          color: like ? theme.colors.icons.active : "black",
                        }}
                        weight={"bold"}
                      >
                        {` Like`}
                      </Label>
                    </View>
                  </TouchableWithoutFeedback>
                  <Spacer size={"medium"} position={"right"} />
                  {!disableReply && (
                    <TouchableOpacity onPress={() => onReply(data.id)}>
                      <View style={styles.inline}>
                        <MaterialCommunityIcons
                          size={12}
                          name="message-reply-text-outline"
                        />
                        <Label size={12} weight={"bold"}>
                          {` Reply`}
                        </Label>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Subcomments (Recursion) */}
      {data.comments.length > 0 && (
        <View
          style={[
            styles.subcomment,
            {
              marginBottom: degree > 1 ? 0 : 10,
            },
          ]}
        >
          <CommentSection
            id={data.id}
            comments={data.comments}
            degree={degree + 1}
            replies={data.commentCount}
            handleViewReplies={handleViewReplies}
          />
        </View>
      )}
      {degree > 1 && replies > 0 && !isViewed && (
        <View style={styles.viewMore}>
          <TouchableOpacity onPress={viewReply}>
            <Label weight={"bold"} size={12}>
              {`View ${replies} more ${replies > 1 ? "replies" : "reply"}`}
            </Label>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
  },
  replyDetails: {
    justifyContent: "flex-start",
  },
  actionContainer: {},
  actions: {
    alignSelf: "flex-start",
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
  },
  subcomment: {
    marginLeft: 50,
    paddingRight: 14,
    // paddingTop: 10,
    borderLeftWidth: 0,
    borderLeftColor: "#ddd",
    marginBottom: 10,
  },
  chip: {
    backgroundColor: theme.colors.icons.active + "42",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
    minWidth: 55,
    justifyContent: "center",
  },
  content: {
    paddingVertical: 8,
  },
  viewMore: {
    paddingLeft: 0,
    paddingTop: 12,
  },
});
