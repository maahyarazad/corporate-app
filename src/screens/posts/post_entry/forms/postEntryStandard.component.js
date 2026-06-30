import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showToast } from "../../../../Toast";
import React, { useEffect, useState } from "react";
import { theme } from "../../../../infrastructure/theme";
import { Label } from "../../../../components/typography/label.component";
import MediaUploader from "../../../../components/mediaUploader.js/mediaUploader.component";
import { Checkbox } from "react-native-paper";
import useUser from "../../../../../hooks/useUser";

const PostEntryStandard = ({ onSubmit, mode }) => {
  const MAX_CONTENT = 3000;
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  // const toggleAgreement = () => {
  //   setIsAgreed(!isAgreed);
  // };

  const isAnyEmpty = () => {
    if (state.title && state.content) {
      return false;
    } else {
      showToast("error", "Fehler", "Bitte füllen Sie alle Felder aus.");
      return true;
    }
  };

  const submitForm = async () => {
    try {
      setIsSubmitted(true);
      if (isAnyEmpty()) {
        return;
      }

      const formData = new FormData();

      // Iterate image append into formData
      if (state.images)
        state.images.forEach((media) => {
          formData.append("media", {
            name: "kapoya",
            type: media.type,
            uri: media.type === "video" ? media.videoURI : media.uri,
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
        style={[
          styles.formField,
          {
            borderColor:
              isSubmitted && state.title.trim() === "" ? "red" : "#bbb",
          },
        ]}
        placeholder="Titel *"
        value={state.title}
        onChangeText={handleTitleChange}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[
            styles.formField,
            {
              flex: 1,
              paddingTop: 16,
              fontSize: 18,
              borderColor:
                isSubmitted && state.content.trim() === "" ? "red" : "#bbb",
            },
          ]}
          placeholder="Text *"
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
      />

      {/* Acknowledgement Checkbox */}
      {mode > 0 && <PostAgreementCheckbox />}

      {/* Submit Button */}
      <TouchableOpacity onPress={submitForm}>
        <View
          style={{
            backgroundColor: theme.colors.icons.active,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 16,
            borderRadius: 6,
          }}
        >
          <Label
            size="subtitle"
            weight="bold"
            style={{ color: "white", letterSpacing: 1 }}
          >
            Absenden
          </Label>
        </View>
      </TouchableOpacity>
    </>
  );
};

export const PostAgreementCheckbox = () => {
  const { userData } = useUser();
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
        paddingHorizontal: 12,
        gap: 8,
      }}
    >
      {/* <Checkbox.Android
        status={isAgreed ? "checked" : "unchecked"
        color={theme.colors.icons.active}
        onPress={toggleAgreement}
      /> */}
      <View>
        <Label
          style={{
            fontStyle: "italic",
          }}
        >
          {
            "Anfragen auf Ihr Angebot erhalten Sie telefonisch!\n\nIhre registrierte Mobiltelefonnummer lautet:\n"
          }
          <Label
            weight="bold"
          >{`+${userData?.area_code} ${userData?.phone_number}`}</Label>
        </Label>
      </View>
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
