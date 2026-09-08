import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeArea } from "../../../components/safearea.component";
import { showToast } from "../../../Toast";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Label } from "../../../components/typography/label.component";
import usePosts from "../post_card/usePosts";
import { goback } from "../../../navigation/navigate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PostEntryStandard from "./forms/postEntryStandard.component";
import PostEntryMobil from "./forms/postEntryMobil.component";
import PostEntryRealEstate from "./forms/postEntryRealEstate.component";
import PostEntryJobs from "./forms/postEntryJobs.component";
import useRequest from "../../../../hooks/useRequest";
import { StatusBar } from "react-native";

const PostEntryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { editPost } = usePosts();
  const { post, type, category, editMode } = route.params;
  const [localPost, setLocalPost] = useState({
    id: null,
    post_id: null,
    title: "",
    content: "",
    user_id: null,
    category_id: null,
  });

  const request = useRequest();

  const handleEditPost = () => {
    // navigate("feed");
    // navigation.navigate({
    //   routeName: "post-edit",
    //   params: {
    //     post: { title: "", content: "", user_id: 0 },
    //     editMode: editMode,
    //   },
    //   key: "post-edit-2",
    // })
    // Alert.alert("Edit Post", "Are you sure you want to edit this post?", [
    //   { text: "Cancel", onPress: () => {} },
    //   {
    //     text: "Edit",
    //     isPreferred: true,
    //     onPress: () => {
    //       const _editPost = new Post();
    //       _editPost.id = post.id;
    //       _editPost.post_id = post.post_id;
    //       _editPost.title = value.current.title;
    //       _editPost.content = value.current.content;
    //       _editPost.user_id = post.user_id;
    //       _editPost.category_id = 1;
    //       _editPost.category = post.category;
    //       _editPost.first_name = post.first_name;
    //       _editPost.last_name = post.last_name;
    //       _editPost.position = post.position;
    //       _editPost.date_posted = post.date_posted;
    //       _editPost.prof_image = post.prof_image;
    //       _editPost.commentCount = post.commentCount;
    //       _editPost.comments = post.comments;
    //       _editPost.likeCount = post.likeCount;
    //       _editPost.liked = post.liked;
    //       editPost(_editPost);
    //       navigation.goBack();
    //     },
    //   },
    // ]);
  };

  const onReturn = () => {
    goback();
  };

  const onSubmit = async (formData) => {
    try {
      formData.append("type", JSON.stringify(type));
      formData.append("category", JSON.stringify(category));

      console.log("FORMDATA", JSON.stringify(formData));
      const response = await request("/v2/post/new/v2", "POST", formData, {
        "Content-Type": "multipart/form-data",
      });

      if (response && response.success) {
        // alert("success!");
        navigation.pop(3);
        showToast(
          "success",
          "Beitrag erstellt!",
          "Bitte geben Sie uns einen Moment, und Ihr Beitrag wird bald veröffentlicht. Wir werden Sie informieren."
        );
      }
    } catch (error) {
      console.log("Failed to create post", error);
    }
  };

  const RenderForm = () => {
    if (type.label.toLowerCase() === "forum") {
      return <PostEntryStandard onSubmit={onSubmit} />;
    } else {
      switch (category.art) {
        case "standard":
          return <PostEntryStandard onSubmit={onSubmit} mode={type.id - 1} />;
        case "mobil":
          return <PostEntryMobil onSubmit={onSubmit} mode={type.id - 1} />;
        case "immo":
          return <PostEntryRealEstate onSubmit={onSubmit} mode={type.id - 1} />;
        case "job":
          return <PostEntryJobs onSubmit={onSubmit} mode={type.id - 1} />;
      }
    }

    // return render(type, category);
  };

  const BackButton = () => {
    return (
      <TouchableOpacity onPress={onReturn}>
        <View style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          <Label>Zurück</Label>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea style={[styles.container]}>
      <StatusBar barStyle="light-content " />
      <View style={[styles.container, { marginBottom: -35 }]}>
        <BackButton />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.fill}
          keyboardVerticalOffset={48}
        >
          <ScrollView
            nestedScrollEnabled={true}
            keyboardDismissMode="interactive"
            style={styles.box}
            contentContainerStyle={styles.contentContainerPad}
            fadingEdgeLength={0}
          >
            <View style={styles.body}>
              {/* Title */}
              <View style={styles.centerBox}>
                <Label size={25} weight="bold">
                  Sie sind fast am Ziel!
                </Label>
                <Label size="subtitle" weight="medium" style={styles.label}>
                  Vervollständigen Sie die Details und schon kann es losgehen!
                </Label>
              </View>
              <View style={styles.spacer}/>
              <View style={styles.flexBox}>
                <View>
                  <Label
                    size={16}
                    weight="bold"
                  >{`${type.label}  ➤  ${category.category}`}</Label>
                </View>
                {/* <TextInput
      value={type.label}
      style={[styles.formField, styles.textDisabled]}
      editable={false}
    />
    <TextInput
      value={category.category}
      style={[styles.formField, styles.textDisabled]}
      editable={false}
    /> */}
                <RenderForm />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeArea>
  );
};
export default PostEntryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  buttonSelector: {
    minWidth: "30%",
    backgroundColor: "#ddd",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#bbb",
  },
  leftSelector: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0.5,
  },
  rightSelector: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0.5,
  },
  selectorContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignSelf: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  formField: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderColor: "#bbb",
    fontSize: 18,
  },
  textDisabled: {
    color: "#aaa",
    backgroundColor: "#eee",
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  fill: {
    flex: 1,
  },
  box: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: -20,
  },
  contentContainerPad: {
    paddingBottom: 40,
  },
  centerBox: {
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  label: {
    textAlign: "center",
  },
  spacer: {
    marginTop: 10,
  },
  flexBox: {
    alignSelf: "stretch",
    gap: 10,
    flex: 1,
  },
});
