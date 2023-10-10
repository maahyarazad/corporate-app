import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { memo, useState } from "react";
import { Button } from "react-native-paper";
import { Label } from "../../../../components/typography/label.component";
import DropDownPicker from "react-native-dropdown-picker";
import {
  realEstateOffers,
  realEstateTypes,
} from "../../../../utils/marketplaceConstants";
import { Slider } from "@miblanchard/react-native-slider";
import { theme } from "../../../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PostEntryRealEstate = () => {
  const MAX_CONTENT = 3000;

  const [offerTypes, setOfferTypes] = useState(
    realEstateOffers.map((item) => {
      return {
        label: item.label,
        value: item.value,
      };
    })
  );

  const [types, setTypes] = useState(
    realEstateTypes.map((item) => {
      return {
        label: item,
        value: item,
      };
    })
  );

  const [state, setState] = useState({
    offer: null,
    place: null,
    street: null,
    art: null,
    space: null,
    bedrooms: 1,
    price: null,
    title: "",
    content: "",
  });

  const [offerTypeOpen, setOfferTypeOpen] = useState(false);
  const [realEstateTypeOpen, setRealEstateTypeOpen] = useState(false);

  const closeAllDropdown = () => {
    setOfferTypeOpen(false);
    setRealEstateTypeOpen(false);
  };

  const onSelectOffer = (_value) => {
    setState({ ...state, offer: _value() });
  };

  const onSelectType = (_value) => {
    setState({ ...state, art: _value() });
  };

  const handleChangePlace = (_value) => {
    setState({ ...state, place: _value });
  };

  const handleChangeStreet = (_value) => {
    setState({ ...state, street: _value });
  };

  const handleChangeSpace = (_value) => {
    setState({ ...state, space: _value });
  };

  const handleChangePrice = (_value) => {
    setState({ ...state, price: _value });
  };

  const handleChangeBedrooms = (_value) => {
    setState({ ...state, bedrooms: _value });
  };

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

  return (
    <>
      <DropDownPicker
        open={offerTypeOpen}
        setOpen={() => {
          closeAllDropdown();
          setOfferTypeOpen(offerTypeOpen ? false : true);
        }}
        value={state.offer}
        items={offerTypes}
        setValue={onSelectOffer}
        textStyle={{ fontSize: 18 }}
        style={styles.formField}
        listMode="SCROLLVIEW"
        placeholder="Bitte Wahlen Zweck"
        zIndex={10}
        placeholderStyle={styles.dropdownPlaceholder}
        dropDownContainerStyle={styles.dropdownContainer}
        searchPlaceholder="Search"
        searchPlaceholderTextColor="#bbb"
        searchContainerStyle={styles.searchContainer}
        searchTextInputStyle={styles.searchTextInput}
      />
      <TextInput
        placeholder="Place"
        onChangeText={handleChangePlace}
        value={state.place}
        style={styles.formField}
      />
      <TextInput
        placeholder="Street"
        onChangeText={handleChangeStreet}
        value={state.street}
        style={styles.formField}
      />
      <DropDownPicker
        open={realEstateTypeOpen}
        setOpen={() => {
          closeAllDropdown();
          setRealEstateTypeOpen(realEstateTypeOpen ? false : true);
        }}
        value={state.art}
        items={types}
        setValue={onSelectType}
        textStyle={{ fontSize: 18 }}
        style={styles.formField}
        listMode="SCROLLVIEW"
        placeholder="Bitte Wahlen Art"
        zIndex={10}
        placeholderStyle={styles.dropdownPlaceholder}
        dropDownContainerStyle={styles.dropdownContainer}
        searchPlaceholder="Search"
        searchPlaceholderTextColor="#bbb"
        searchContainerStyle={styles.searchContainer}
        searchTextInputStyle={styles.searchTextInput}
      />
      <TextInput
        placeholder="Wohnfläche"
        onChangeText={handleChangeSpace}
        value={state.space}
        style={styles.formField}
        keyboardType="numeric"
      />
      <View style={[styles.formField, { gap: 10, paddingBottom: 30 }]}>
        <Label size={"title"}>Number of Bedrooms</Label>
        <View>
          <Slider
            value={state.bedrooms}
            minimumValue={1}
            maximumValue={5}
            onValueChange={handleChangeBedrooms}
            step={1}
            containerStyle={{ zIndex: 2 }}
            renderThumbComponent={() => (
              <View style={styles.sliderThumb}>
                <MaterialCommunityIcons
                  name="arrow-left-right"
                  size={20}
                  color="white"
                />
              </View>
            )}
            trackClickable={true}
            animateTransitions={true}
            renderBelowThumbComponent={() => {
              return (
                <View
                  style={{
                    marginLeft: -5,
                    alignSelf: "center",
                    //   marginTop: -10,
                  }}
                >
                  <Label size={16}>{state.bedrooms}</Label>
                </View>
              );
            }}
          ></Slider>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              position: "absolute",
              width: "100%",
            }}
          >
            <Label>1</Label>
            <Label>5</Label>
          </View>
        </View>
      </View>
      <TextInput
        placeholder="Preis"
        onChangeText={handleChangePrice}
        value={state.space}
        style={styles.formField}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.formField}
        placeholder="Titel"
        value={state.title}
        onChangeText={handleTitleChange}
      />

      <View style={{ height: 400 }}>
        <TextInput
          style={[styles.formField, { flex: 1, paddingTop: 16, fontSize: 18 }]}
          placeholder="Text"
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

export default PostEntryRealEstate;

const styles = StyleSheet.create({
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
  formField: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderColor: "#bbb",
    fontSize: 18,
  },
  sliderThumb: {
    backgroundColor: theme.colors.icons.active,
    width: 35,
    height: 25,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
});
