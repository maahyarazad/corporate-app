import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Label } from "../../../components/typography/label.component";

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
              style={styles.textInput}
              value={title}
              onChangeText={handleTitleChange}
            />
            <View style={styles.spacer}/>
            <TextInput
              placeholder="Content"
              placeholderTextColor="#ccc"
              style={styles.textInput2}
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
              style={styles.textInput}
              value={title}
              onChangeText={handleTitleChange}
            />
            <View style={styles.spacer}/>
            <TextInput
              placeholder="Price"
              placeholderTextColor="#ccc"
              style={styles.textInput2}
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
      style={styles.container}
      keyboardVerticalOffset={130}
    >
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.container}
      >
        <RenderForm />
        <View style={styles.box}>
          <Label style={styles.label} weight="bold">
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
  textInput: {
    backgroundColor: "white",
    fontSize: 20,
    fontWeight: "bold",
    padding: 8,
    paddingHorizontal: 0,
  },
  spacer: {
    marginTop: 6,
  },
  textInput2: {
    fontSize: 18,
    fontWeight: "normal",
    padding: 8,
    paddingHorizontal: 0,
    flex: 1,
  },
  box: {
    alignSelf: "flex-end",
    bottom: 10,
  },
  label: {
    color: "#bbb",
  },
});
