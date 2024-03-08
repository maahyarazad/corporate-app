import { FlatList, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import Comment from "./comment.component";
import usePosts from "../post_card/usePosts";
import { Label } from "../../../components/typography/label.component";

export default function CommentSection({
  id,
  comments,
  handleViewReplies,
  degree = 1,
  replies = 0,
}) {
  const MAX_REPLY = 1;
  const { reply, removeComment } = usePosts();

  const [_comments, setComments] = useState(null);

  const pressReply = (comment_id) => {
    const _comment = comments.find((post) => post.id === comment_id);
    reply(_comment, degree === 1);
  };

  useEffect(() => {
    if (comments) {
      setComments([...comments]);
      // set_comments(JSON.parse(JSON.stringify(comments)));
    }
    return () => {};
  }, [comments]);

  const _handleViewReplies = (commentId) => {
    handleViewReplies(commentId);
  };

  const handleRemoveComment = (post_id) => {
    setComments(_comments.filter((post) => post.post_id !== post_id));

    removeComment(post_id);
    return;
  };

  return (
    <View style>
      {_comments &&
        _comments.map((comment, index) => {
          {
            /* const subcomments = _comments.filter(
            (sub) => sub.order_id === comment.id
          );
          if (subcomments.length > 0) comment.comments = subcomments; */
          }

          if (comment.order_id === id) {
            return (
              <View
                key={comment.id}
                style={{
                  marginTop: degree > 1 && index != 0 ? 5 : 0,
                  borderTopWidth: degree === 1 ? (index === 0 ? 0 : 2) : 0,
                  borderColor: "#ddd",
                }}
              >
                <Comment
                  key={comment.id}
                  data={comment}
                  onReply={pressReply}
                  degree={degree}
                  replies={replies}
                  handleViewReplies={_handleViewReplies}
                  onRemoveComment={handleRemoveComment}
                  // disableReply={degree > MAX_REPLY}
                />
              </View>
            );
          }
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    justifyContent: "space-between",
    height: 100,
  },
});
