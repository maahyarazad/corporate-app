import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SegmentedButtons } from "react-native-paper";
import { theme } from "../../../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../../components/typography/label.component";
import DropDownPicker from "react-native-dropdown-picker";
import { employmentTypes } from "../../../../utils/marketplaceConstants";
import MediaUploader from "../../../../components/mediaUploader.js/mediaUploader.component";
import { PostAgreementCheckbox } from "./postEntryStandard.component";

const PostEntryJobs = ({ onSubmit, mode }) => {
  const MAX_CONTENT = 3000;
  const [empTypes, setEmpTypes] = useState(
    employmentTypes.map((item) => {
      return {
        label: item,
        value: item,
      };
    })
  );

  const [empTypeOpen, setEmpTypeOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [state, setState] = useState({
    jobType: "full",
    branch: null,
    field: null,
    place: null,
    experience: null,
    title: "",
    content: "",
    images: null,
  });

  const handleJobType = (jobType) => {
    setState({ ...state, jobType });
  };

  const handleBranch = (_value) => {
    setState({ ...state, branch: _value });
  };
  const handleField = (_value) => {
    setState({ ...state, field: _value });
  };
  const handlePlace = (_value) => {
    setState({ ...state, place: _value });
  };
  const handleTitle = (_value) => {
    setState({ ...state, title: _value });
  };
  const handleContent = (_value) => {
    setState({ ...state, content: _value });
  };
  const onSelectExperience = (_value) => {
    setState({ ...state, experience: _value() });
  };
  const setImages = (images) => {
    setState({ ...state, images: images });
  };

  const validationCheck = () => {
    // Check if all fields are filled
    if (
      state.branch &&
      state.field &&
      state.place &&
      state.experience &&
      state.title &&
      state.content
    ) {
      return false;
    } else {
      Alert.alert("Fehler", "Bitte füllen Sie alle Felder aus.");
      return true;
    }
  };

  const submitForm = async () => {
    try {
      const formData = new FormData();

      setIsSubmitted(true);

      if (validationCheck()) return;

      // Iterate image append into formData
      if (state.images)
        state.images.forEach((media) => {
          formData.append("media", {
            name: media.name,
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
      <SegmentedButtons
        buttons={[
          {
            label: "Full Time",
            value: "full",
            icon: "briefcase-variant",
            checkedColor: "white",
            style: {
              backgroundColor:
                state.jobType === "full"
                  ? theme.colors.icons.active
                  : "transparent",
            },
          },
          {
            label: "Part Time",
            value: "half",
            icon: "briefcase-clock",
            checkedColor: "white",
            style: {
              backgroundColor:
                state.jobType === "half"
                  ? theme.colors.icons.active
                  : "transparent",
            },
          },
        ]}
        onValueChange={handleJobType}
        value={state.jobType}
        theme={{ colors: { primary: "green" } }}
      />
      <TextInput
        placeholder="Branche"
        onChangeText={handleBranch}
        value={state.branch}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.branch ? "red" : "#bbb" },
        ]}
      />
      <TextInput
        placeholder="Berufsfeld"
        onChangeText={handleField}
        value={state.field}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.field ? "red" : "#bbb" },
        ]}
      />
      <TextInput
        placeholder="Ort, Region, Land"
        onChangeText={handlePlace}
        value={state.place}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.place ? "red" : "#bbb" },
        ]}
      />
      <DropDownPicker
        open={empTypeOpen}
        setOpen={setEmpTypeOpen}
        value={state.experience}
        items={empTypes}
        setValue={onSelectExperience}
        textStyle={{ fontSize: 18 }}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.experience ? "red" : "#bbb" },
        ]}
        listMode="SCROLLVIEW"
        placeholder="Anstellungsart"
        zIndex={10}
        placeholderStyle={styles.dropdownPlaceholder}
        dropDownContainerStyle={styles.dropdownContainer}
        searchPlaceholder="Search"
        searchPlaceholderTextColor="#bbb"
        searchContainerStyle={styles.searchContainer}
        searchTextInputStyle={styles.searchTextInput}
      />
      <TextInput
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.title ? "red" : "#bbb" },
        ]}
        placeholder="Titel"
        value={state.title}
        onChangeText={handleTitle}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[
            styles.formField,
            { flex: 1, paddingTop: 16, fontSize: 18 },
            { borderColor: isSubmitted && !state.content ? "red" : "#bbb" },
          ]}
          placeholder="Text"
          multiline={true}
          value={state.content}
          onChangeText={handleContent}
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
      <PostAgreementCheckbox />

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

export default PostEntryJobs;

const styles = StyleSheet.create({
  formField: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderColor: "#bbb",
    fontSize: 18,
  },
  dropdownPlaceholder: { color: "#bbb", fontSize: 18 },
  dropdownContainer: {
    borderColor: "#bbb",
    maxHeight: 300,
  },
  searchContainer: {
    borderBottomWidth: 0,
  },
  searchTextInput: {
    borderColor: "#bbb",
    paddingVertical: 12,
  },
});
