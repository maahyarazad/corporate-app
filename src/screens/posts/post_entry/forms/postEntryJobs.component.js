import {
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

const PostEntryJobs = () => {
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

  const [state, setState] = useState({
    jobType: "full",
    branch: null,
    field: null,
    place: null,
    employmentType: null,
    title: "",
    content: "",
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
  const onSelectEmpType = (_value) => {
    setState({ ...state, employmentType: _value() });
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
        style={styles.formField}
      />
      <TextInput
        placeholder="Berufsfeld"
        onChangeText={handleField}
        value={state.field}
        style={styles.formField}
      />
      <TextInput
        placeholder="Ort, Region, Land"
        onChangeText={handlePlace}
        value={state.place}
        style={styles.formField}
      />
      <DropDownPicker
        open={empTypeOpen}
        setOpen={setEmpTypeOpen}
        value={state.employmentType}
        items={empTypes}
        setValue={onSelectEmpType}
        textStyle={{ fontSize: 18 }}
        style={styles.formField}
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
        style={styles.formField}
        placeholder="Titel"
        value={state.title}
        onChangeText={handleTitle}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[styles.formField, { flex: 1, paddingTop: 16, fontSize: 18 }]}
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
      <View
        style={{
          height: 100,
          width: 100,
          borderRadius: 20,
          borderColor: "#ccc",
          borderStyle: "dashed",
          borderWidth: 3,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialCommunityIcons name="image-plus" size={30} color={"#ccc"} />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={() => {
          console.log(state);
        }}
      >
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
            size={16}
            weight={"bold"}
            style={{ color: "white", letterSpacing: 1 }}
          >
            Submit
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
