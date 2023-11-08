import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { theme } from "../../../../infrastructure/theme";
import { Label } from "../../../../components/typography/label.component";
import MediaUploader from "../../../../components/mediaUploader.js/mediaUploader.component";
import { Checkbox } from "react-native-paper";

const PostEntryStandard = ({ onSubmit, mode }) => {
  const MAX_CONTENT = 3000;

  const [isAgreed, setIsAgreed] = useState(false);

  const [state, setState] = useState({
    title: "",
    content: "",
    images: null,
  });

  const handleTitleChange = (_value) => {
    setState({
      ...state,
      title: _value,
    });
  };

  const handleContentChange = (_value) => {
    setState({
      ...state,
      content: _value,
    });
  };

  const setImages = (images) => {
    setState({
      ...state,
      images: images,
    });
  };

  const toggleAgreement = () => {
    setIsAgreed(!isAgreed);
  };

  const submitForm = async () => {
    try {
      const formData = new FormData();

      // Iterate image append into formData
      if (state.images)
        state.images.forEach((image) => {
          formData.append("images", {
            name: image.name,
            type: image.type,
            uri: image.uri,
          });
        });

      Object.keys(state).forEach((key) => {
        if (key !== "images") formData.append(key, state[key]);
      });

      onSubmit(formData);
    } catch (error) {
      console.log("Failed to create standard post:", error);
    }
  };

  return (
    <>
      <TextInput
        style={styles.formField}
        placeholder="Title"
        value={state.title}
        onChangeText={handleTitleChange}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[styles.formField, { flex: 1, paddingTop: 16, fontSize: 18 }]}
          placeholder="Content"
          multiline={true}
          value={state.content}
          onChangeText={handleContentChange}
          maxLength={MAX_CONTENT}
        />

        {/* Character Limit */}
        <View
          style={{
            marginTop: 2,
            backgroundColor:
              state.content.length / MAX_CONTENT > 0.8 ? "red" : "green",
            height: 5,
            width: `${(state.content.length / MAX_CONTENT) * 100}%`,
            borderRadius: 20,
          }}
        ></View>
      </View>

      {/* Browser Media */}

      <MediaUploader
        images={state.images}
        setImages={setImages}
        header={true}
        show={mode === 1}
      />

      {/* Acknowledgement Checkbox */}
      <PostAgreementCheckbox
        toggleAgreement={toggleAgreement}
        isAgreed={isAgreed}
      />

      {/* Submit Button */}
      <TouchableOpacity onPress={submitForm} disabled={!isAgreed}>
        <View
          style={{
            backgroundColor: isAgreed ? theme.colors.icons.active : "#ccc",
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 16,
            borderRadius: 6,
          }}
        >
          <Label
            size={"subtitle"}
            weight={"bold"}
            style={{ color: "white", letterSpacing: 1 }}
          >
            Absenden
          </Label>
        </View>
      </TouchableOpacity>
    </>
  );
};

export const PostAgreementCheckbox = ({ toggleAgreement, isAgreed }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eee",
        borderWidth: 1,
        borderColor: "#bbb",
        paddingRight: 50,
        borderRadius: 8,
        paddingVertical: 10,
        paddingLeft: 8,
        gap: 8,
      }}
    >
      <Checkbox.Android
        status={isAgreed ? "checked" : "unchecked"}
        color={theme.colors.icons.active}
        onPress={toggleAgreement}
      />
      <TouchableOpacity onPress={toggleAgreement}>
        <View>
          <Label>
            Ich erkläre mich unwiderruflich damit einverstanden, dass meine
            Handynummer für eine Person sichtbar ist, die auf meinen Beitrag
            antworten möchte!
          </Label>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PostEntryStandard;

const styles = StyleSheet.create({
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
});
