import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { CustomTextInput } from "../../../components/customTextInput";
import { Label } from "../../../components/typography/label.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ReactNativeModal from "react-native-modal";
import useUser from "../../../../hooks/useUser";
import usePosts from "../post_card/usePosts";

const PostEntryForm = ({ setValue, value }) => {
  const handleTitleChange = (text) => {
    setValue({ ...value, title: text });
  };

  const handleContentChange = (text) => {
    setValue({ ...value, content: text });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
      }}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flex: 1 }}
      >
        <TextInput
          placeholder="Title"
          placeholderTextColor={"#ccc"}
          style={{
            backgroundColor: "white",
            fontSize: 20,
            fontWeight: "bold",
            padding: 8,
            paddingHorizontal: 0,
            //   borderBottomWidth: 1,
          }}
          value={value.title}
          onChangeText={handleTitleChange}
        />
        <Spacer size={"small"} position={"top"} />
        {/* <View style={{ flex: 1 }}> */}
        <TextInput
          placeholder="Content"
          placeholderTextColor={"#ccc"}
          style={{
            fontSize: 18,
            fontWeight: "normal",
            padding: 8,
            paddingHorizontal: 0,
            flex: 1,
            //   borderBottomWidth: 1,
          }}
          //   scrollEnabled={false}
          multiline={true}
          value={value.content}
          onChangeText={handleContentChange}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostEntryForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
