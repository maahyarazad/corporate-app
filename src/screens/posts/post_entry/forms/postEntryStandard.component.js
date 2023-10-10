import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../../../infrastructure/theme";
import { Label } from "../../../../components/typography/label.component";

const PostEntryStandard = () => {
  const MAX_CONTENT = 3000;

  const [value, setValue] = useState({
    title: "",
    content: "",
  });

  const handleTitleChange = (_value) => {
    setValue({
      ...value,
      title: _value,
    });
  };

  const handleContentChange = (_value) => {
    setValue({
      ...value,
      content: _value,
    });
  };

  return (
    <>
      <TextInput
        style={styles.formField}
        placeholder="Title"
        value={value.title}
        onChangeText={handleTitleChange}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[styles.formField, { flex: 1, paddingTop: 16, fontSize: 18 }]}
          placeholder="Content"
          multiline={true}
          value={value.content}
          onChangeText={handleContentChange}
          maxLength={MAX_CONTENT}
        />

        {/* Character Limit */}
        <View
          style={{
            marginTop: 2,
            backgroundColor:
              value.content.length / MAX_CONTENT > 0.8 ? "red" : "green",
            height: 5,
            width: `${(value.content.length / MAX_CONTENT) * 100}%`,
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
      <TouchableOpacity>
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
            size={"subtitle"}
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
