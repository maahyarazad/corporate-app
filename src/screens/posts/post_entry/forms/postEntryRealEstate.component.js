import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { showToast } from "../../../../Toast";
import { Label } from "../../../../components/typography/label.component";
import DropDownPicker from "react-native-dropdown-picker";
import {
  realEstateOffers,
  realEstateTypes,
} from "../../../../utils/marketplaceConstants";
import { Slider } from "@miblanchard/react-native-slider";
import { theme } from "../../../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MediaUploader from "../../../../components/mediaUploader.js/mediaUploader.component";
import { PostAgreementCheckbox } from "./postEntryStandard.component";

const PostEntryRealEstate = ({ onSubmit, mode }) => {
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
    living_space_start: 0,
    living_space_end: 0,
    sleep_rooms_start: 1,
    sleep_rooms_end: 2,
    price_from: 0,
    price_to: 0,
    title: "",
    content: "",
    images: null,
  });

  const [offerTypeOpen, setOfferTypeOpen] = useState(false);
  const [realEstateTypeOpen, setRealEstateTypeOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const onLivingSpaceStartChange = (_value) => {
    setState({
      ...state,
      living_space_start: parseFloat(_value.replace(/[^0-9]/g, "")),
    });
  };
  const onLivingSpaceEndChange = (_value) => {
    setState({
      ...state,
      living_space_end: parseFloat(_value.replace(/[^0-9]/g, "")),
    });
  };

  const onPriceFromChange = (_value) => {
    setState({
      ...state,
      price_from: parseFloat(_value.replace(/[^0-9]/g, "")),
    });
  };
  const onPriceToChange = (_value) => {
    setState({
      ...state,
      price_to: parseFloat(_value.replace(/[^0-9]/g, "")),
    });
  };
  const handleChangeBedrooms = (_value) => {
    if (mode === 1) {
      setState({ ...state, sleep_rooms_start: _value });
    } else {
      setState({
        ...state,
        sleep_rooms_start: _value[0],
        sleep_rooms_end: _value[1],
      });
    }
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

  const setImages = (images) => {
    setState({
      ...state,
      images: images,
    });
  };

  const validationCheck = () => {
    if (
      state.art &&
      state.content &&
      state.living_space_start &&
      (mode === 1 ? true : state.living_space_end) &&
      state.offer &&
      state.place &&
      state.street &&
      state.title &&
      state.price_from &&
      (mode === 1 ? true : state.price_to)
    ) {
      //price from should be greater than 0
      if (state.price_from <= 0) {
        showToast("error", "Fehler", "Preis muss größer als 0 sein.");
        return true;
      }

      //Price to is less than price from
      if (mode === 2 && state.price_to <= state.price_from) {
        showToast("error", "Fehler", "Bitte geben Sie eine gültige Preisspanne an.");
        return true;
      }

      //Kilometer to is less than kilometer from
      if (mode === 2 && state.living_space_end <= state.living_space_start) {
        showToast(
          "error",
          "Fehler",
          "Bitte geben Sie eine gültige Wohnflächenbereich ein."
        );
        return true;
      }

      showToast("success", "Success");
      return false;
    } else {
      showToast("error", "Fehler", "Bitte füllen Sie alle Felder aus.");
      return true;
    }
  };

  const submitForm = async () => {
    try {
      setIsSubmitted(true);
      if (validationCheck()) {
        return;
      }
      const formData = new FormData();

      // Iterate image append into formData
      if (state.images) {
        state.images.forEach((media) => {
          formData.append("media", {
            name: media.name,
            type: media.type,
            uri: media.type === "video" ? media.videoURI : media.uri,
          });
        });
      }
      console.log("test");
      Object.keys(state).forEach((key) => {
        if (key !== "images") formData.append(key, state[key]);
      });
      console.log("test2");

      onSubmit(formData);
    } catch (error) {
      console.log("Failed to create standard post:", error);
    }
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
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.offer ? "red" : "#bbb" },
        ]}
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
        placeholder="Ort, Region, Land"
        onChangeText={handleChangePlace}
        value={state.place}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.place ? "red" : "#bbb" },
        ]}
      />
      <TextInput
        placeholder="Stadtteil, Straße"
        onChangeText={handleChangeStreet}
        value={state.street}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.street ? "red" : "#bbb" },
        ]}
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
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.art ? "red" : "#bbb" },
        ]}
        listMode="SCROLLVIEW"
        placeholder="Art der Immobilie"
        zIndex={10}
        placeholderStyle={styles.dropdownPlaceholder}
        dropDownContainerStyle={styles.dropdownContainer}
        searchPlaceholder="Search"
        searchPlaceholderTextColor="#bbb"
        searchContainerStyle={styles.searchContainer}
        searchTextInputStyle={styles.searchTextInput}
      />

      {mode === 1 ? (
        <TextInput
          placeholder="Wohnfläche"
          onChangeText={onLivingSpaceStartChange}
          value={
            state.living_space_start
              ? Intl.NumberFormat("de-DE").format(state.living_space_start)
              : ""
          }
          style={[
            styles.formField,
            {
              borderColor:
                isSubmitted && !state.living_space_start ? "red" : "#bbb",
            },
          ]}
          keyboardType="numeric"
        />
      ) : (
        <>
          <Label size="subtitle" weight="bold">
            Wohnfläche
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="von"
              value={
                state.living_space_start
                  ? Intl.NumberFormat("de-DE").format(state.living_space_start)
                  : ""
              }
              onChangeText={onLivingSpaceStartChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.living_space_start ||
                      state.living_space_end <= state.living_space_start)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="bis"
              value={
                state.living_space_end
                  ? Intl.NumberFormat("de-DE").format(state.living_space_end)
                  : ""
              }
              onChangeText={onLivingSpaceEndChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.living_space_end ||
                      state.living_space_end <= state.living_space_start)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      <View style={[styles.formField, { gap: 10, paddingBottom: 30 }]}>
        <Label size="title">Schlafräume</Label>
        <View>
          <Slider
            // value={state.bedrooms}
            value={
              mode === 1
                ? state.sleep_rooms_start
                : [state.sleep_rooms_start, state.sleep_rooms_end]
            }
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
            renderBelowThumbComponent={(e) => {
              return (
                <View
                  style={{
                    marginLeft: -5,
                    alignSelf: "center",
                    //   marginTop: -10,
                  }}
                >
                  <Label size={16} weight="bold">
                    {!!e ? state.sleep_rooms_end : state.sleep_rooms_start}
                  </Label>
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
      {mode === 1 ? (
        <TextInput
          placeholder="Preis"
          onChangeText={onPriceFromChange}
          value={
            state.price_from
              ? Intl.NumberFormat("de-DE").format(state.price_from)
              : ""
          }
          style={[
            styles.formField,
            { borderColor: isSubmitted && !state.price_from ? "red" : "#bbb" },
          ]}
          keyboardType="numeric"
        />
      ) : (
        <>
          <Label size="subtitle" weight="bold">
            Preis
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="von"
              value={
                state.price_from
                  ? Intl.NumberFormat("de-DE").format(state.price_from)
                  : ""
              }
              onChangeText={onPriceFromChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.price_from || state.price_to <= state.price_from)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="bis"
              value={
                state.price_to
                  ? Intl.NumberFormat("de-DE").format(state.price_to)
                  : ""
              }
              onChangeText={onPriceToChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.price_to || state.price_to <= state.price_from)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
          </View>
        </>
      )}
      <TextInput
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.title ? "red" : "#bbb" },
        ]}
        placeholder="Titel"
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
              borderColor: isSubmitted && !state.content ? "red" : "#bbb",
            },
          ]}
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
