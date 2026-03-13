import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import BottomSheetSelector from "../../../components/bottomSheetSelector.component";
import useDialog from "../../../../hooks/useDialog";
import { Button } from "react-native-paper";

const COMMENT_MAXLENGTH = 110;

export default function Comment({
  data,
  onReply,
  degree,
  disableReply,
  replies = 0,
  onRemoveComment,
  handleViewReplies,
  handleEditSave,
}) {
  const { logTime } = useLog();
  const [like, setLike] = useState(data.liked);
  const [likeCount, setLikeCount] = useState(data.likeCount);
  const { timeDiffString } = useTime();
  const [isViewed, setIsViewed] = useState(false);

  const { userData } = useUser();
  const { likeComment, unlikeComment, editComment } = usePosts();

  const [openBottomDrawer, setOpenBottomDrawer] = useState(false);
  const [options, setOptions] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [commentContent, setCommentContent] = useState(data.content);

  const { confirmDialog } = useDialog();

  useEffect(() => {
    checkOptions();
    return () => {};
  }, []);

  const checkOptions = () => {
    let options = [];

    if (userData.old_user_id === data.user_id) {
      options.push({
        title: "Entfernen",
        description: "Diesen Kommentar entfernen",
        logo: "trash-can",
        onPress: () => {
          Alert.alert(
            "Kommentar entfernen",
            "Bist du sicher, dass du diesen Kommentar entfernen möchtest?",
            [
              { text: "Abbrechen", onPress: () => {}, isPreferred: true },
              {
                text: "Entfernen",
                style: "destructive",
                onPress: () => {
                  //Call Remove Comment API
                  onRemoveComment(data.post_id);
                  onCloseDrawer();
                },
              },
            ]
          );
        },
      });

      options.push({
        title: "Bearbeiten",
        description: "Diesen Kommentar bearbeiten",
        logo: "pencil",
        onPress: () => {
          setEditMode(true);
          onCloseDrawer();
        },
      });
      setOptions(options);
    }
  };

  const toggleLike = () => {
    setLike(!like);
    setLikeCount(like ? parseInt(likeCount) - 1 : parseInt(likeCount) + 1);

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

  const onOpenDrawer = () => {
    setOpenBottomDrawer(true);
  };

  const onCloseDrawer = () => {
    setOpenBottomDrawer(false);
  };

  const EditForm = () => {
    const [editedText, setEditedText] = useState(commentContent);

    const cancelEdit = () => {
      setEditedText(data.content);
      setTimeout(() => {
        setEditMode(false);
      }, 0);
    };

    const handleEditTextChange = (prev) => [setEditedText(prev)];

    const onEditSave = () => {
      const editedData = data;
      editedData.content = editedText;
      setCommentContent(editedText);
      setEditMode(false);

      editComment(editedData);
      // handleEditSave(editedData);
    };

    return (
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          paddingHorizontal: 0,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: "#f6f6f6",
            borderRadius: 8,
            marginTop: 8,
            padding: 4,
            height: 80,
            borderWidth: 1,
            borderColor: "#ccc",
          }}
          multiline={true}
          numberOfLines={4}
          placeholder={"Write a comment..."}
          value={editedText}
          onChangeText={handleEditTextChange}
          maxLength={COMMENT_MAXLENGTH}
        />
        <View
          style={{
            height: 2,
            marginTop: 4,
            marginBottom: 8,
            alignSelf: "flex-start",
            width: `${(editedText.length / COMMENT_MAXLENGTH) * 100}%`,
            backgroundColor:
              (editedText.length / COMMENT_MAXLENGTH) * 100 > 90
                ? "red"
                : "#88CC00",
            borderRadius: 50,
          }}
        ></View>
        <View
          style={{
            alignSelf: "flex-end",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Button
            mode="contained"
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ backgroundColor: "#aaa", minWidth: 80 }}
            style={{ borderRadius: 8 }}
            onPress={cancelEdit}
          >
            Abbrechen
          </Button>
          <Button
            mode="contained"
            labelStyle={{ fontSize: 12 }}
            contentStyle={{
              backgroundColor: theme.colors.icons.active,
              minWidth: 80,
            }}
            style={{ borderRadius: 8 }}
            onPress={onEditSave}
          >
            Speichern
          </Button>
        </View>
      </View>
    );
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
                <TouchableOpacity onPress={onOpenDrawer}>
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={25}
                    color={"#aaa"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content */}
          {editMode ? (
            <EditForm />
          ) : (
            <Label size={14} style={styles.content}>
              {commentContent}
            </Label>
          )}

          {(data.hideActions === undefined || !data.hideActions) &&
            !editMode && (
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
                    <View style={{marginRight: 8}}/>


                    {!disableReply && (
                      <TouchableOpacity onPress={() => onReply(data.id)}>
                        <View style={[styles.inline, { gap: 4 }]}>
                          <MaterialCommunityIcons
                            size={12}
                            name="message-reply-text-outline"
                          />
                          <Label size={12} weight={"bold"}>
                            Antworten
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

      <BottomSheetSelector
        data={options}
        onClose={onCloseDrawer}
        display={openBottomDrawer}
      />
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
    paddingVertical: 2,
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
