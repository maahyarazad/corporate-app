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

const POST_MAXLENGTH = 100;

const PostEntryForm = ({ setValue, value, category_id = 1 }) => {
  const [content, setContent] = useState(value.content);
  const [title, setTitle] = useState(value.title);

  useEffect(() => {
    setValue({ ...value, content, title });
    return () => {};
  }, [content, title]);

  const handleTitleChange = (text) => {
    setTitle(text);
  };

  const handleContentChange = (text) => {
    setContent(text);
  };

  const RenderForm = () => {
    switch (category_id) {
      case 0:
        return (
          <>
            <TextInput
              placeholder="Title"
              placeholderTextColor="#ccc"
              style={{
                backgroundColor: "white",
                fontSize: 20,
                fontWeight: "bold",
                padding: 8,
                paddingHorizontal: 0,
                //   borderBottomWidth: 1,
              }}
              value={title}
              onChangeText={handleTitleChange}
            />
            <View style={{marginTop: 6}}/>
            <TextInput
              placeholder="Content"
              placeholderTextColor="#ccc"
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
              value={content}
              onChangeText={handleContentChange}
              maxLength={POST_MAXLENGTH}
            />
          </>
        );

      case 1:
        return (
          <>
            <TextInput
              placeholder="Product Name"
              placeholderTextColor="#ccc"
              style={{
                backgroundColor: "white",
                fontSize: 20,
                fontWeight: "bold",
                padding: 8,
                paddingHorizontal: 0,
                //   borderBottomWidth: 1,
              }}
              value={title}
              onChangeText={handleTitleChange}
            />
            <View style={{marginTop: 6}}/>
            <TextInput
              placeholder="Price"
              placeholderTextColor="#ccc"
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
              value={content}
              onChangeText={handleContentChange}
              maxLength={POST_MAXLENGTH}
            />
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
      }}
      keyboardVerticalOffset={130}
    >
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flex: 1 }}
      >
        <RenderForm />
        <View style={{ alignSelf: "flex-end", bottom: 10 }}>
          <Label style={{ color: "#bbb" }} weight="bold">
            {content.length}/{POST_MAXLENGTH}
          </Label>
        </View>
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
