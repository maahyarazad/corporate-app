import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import Comment from "./comment.component";

export default function CommentSection({ data }) {
  const handleReply = (id) => {
    console.log("POST ID:", id);
  };

  return (
    <View>
      {data.map((comment, index) => {
        return (
          <Comment
            key={index}
            data={comment}
            last={data === data.length - 1}
            onReply={handleReply}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({});
