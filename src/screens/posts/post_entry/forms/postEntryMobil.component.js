import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { showToast } from "../../../../Toast";
import DropDownPicker from "react-native-dropdown-picker";
import {
  carInclusions,
  colorList,
  makerList,
  monthList,
  motorcycleInclusions,
} from "../../../../utils/marketplaceConstants";
import { Label } from "../../../../components/typography/label.component";
import { width } from "../../../../components/styles";
import { Checkbox, SegmentedButtons } from "react-native-paper";
import { theme } from "../../../../infrastructure/theme";
import MediaUploader from "../../../../components/mediaUploader.js/mediaUploader.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PostAgreementCheckbox } from "./postEntryStandard.component";
import { useNavigation } from "@react-navigation/native";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../../utils/listPerf";

const MAX_CONTENT = 3000;

const RenderTickView = ({ item, state, setValue, mode }) => {
  const [checked, setChecked] = useState(0);

  useEffect(() => {
    setChecked(state[item.value] ?? 0);
    return () => {};
  }, [state[item.value]]);

  const toggle = () => {
    setChecked(!checked);
    setValue((prev) => ({ ...prev, [item.value]: checked ? 0 : 1 }));
  };

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <View
        style={{
          flex: 1,
          borderRadius: 10,
          width: width / 2 - 24,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#eee",
          paddingVertical: 6,
          borderWidth: 2,
          borderColor: checked ? theme.colors.icons.active : "#eee",
        }}
      >
         <Checkbox.Android
          style={{ width: 100 }}
          status={checked ? "checked" : "unchecked"}
          color={theme.colors.icons.active}
        />
        <View style={{ flex: 1 }}>
          <Label numberOfLines={2} size="subtitle">
            {item.label}
          </Label>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const MemoizedRenderTick = React.memo(RenderTickView);

const PostEntryMobil = ({ onSubmit, mode }) => {
  const [items, setItems] = useState(
    makerList.map((item) => {
      return {
        label: item,
        value: item,
      };
    })
  );
  const [colors, setColor] = useState(
    colorList.map((item) => {
      return {
        label: item,
        value: item,
      };
    })
  );
  const [months, setMonths] = useState(
    monthList.map((item, index) => {
      return {
        label: item,
        value: index + 1,
      };
    })
  );

  const [years, setYears] = useState(
    Array.from(
      new Array(new Date().getFullYear() - 1900 + 2),
      (x, i) => new Date().getFullYear() + 1 - i
    ).map((year) => {
      return {
        label: year,
        value: year,
      };
    })
  );

  const [inclusions, setInclusions] = useState(
    carInclusions.map((item) => {
      return {
        label: item.label,
        value: item.value,
      };
    })
  );

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearFromOpen, setYearFromOpen] = useState(false);
  const [yearToOpen, setYearToOpen] = useState(false);
  const [makerOpen, setMakerOpen] = useState(false);
  const [state, setState] = useState({
    vehicleType: "car",
    maker: null,
    model: null,
    title: "",
    content: "",
    month: 1,
    year_from: 0,
    year_to: 0,
    color: null,
    kilometer_from: 0,
    kilometer_to: 0,
    price_from: 0,
    price_to: 0,
    images: null,
  });

  const inclusionKeyExtractor = useCallback((item) => String(item.value), []);

  const renderInclusion = useCallback(
    ({ item }) => (
      <MemoizedRenderTick item={item} state={state} setValue={setState} />
    ),
    [state]
  );

  const validationCheck = () => {
    if (
      state.maker &&
      state.model &&
      state.title &&
      state.content &&
      state.month &&
      state.year_from &&
      (mode === 1 ? true : state.year_to) &&
      state.color &&
      state.kilometer_from &&
      (mode === 1 ? true : state.kilometer_to) &&
      state.price_from &&
      (mode === 1 ? true : state.price_to)
    ) {
      //price from should greater than 0
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
      if (mode === 2 && state.kilometer_to <= state.kilometer_from) {
        showToast(
          "error",
          "Fehler",
          "Bitte geben Sie eine gültige Kilometerreichweite ein."
        );
        return true;
      }

      //Year to is less than year from
      if (mode === 2 && state.year_to <= state.year_from) {
        showToast(
          "error",
          "Fehler",
          "Bitte geben Sie eine gültige Jahresbereich ein."
        );
        return true;
      }

      return false;
    } else {
      console.log("mode", state.price_to);
      showToast("error", "Fehler", "Bitte füllen Sie alle Felder aus.");
      return true;
    }
  };

  useEffect(() => {
    

    return () => {};
  }, [state]);

  const onSelectMaker = (_maker) => {
    setState({ ...state, maker: _maker() });
  };

  const onSelectMonth = (_month) => {
    setState({ ...state, month: _month() });
  };
  const onSelectYearFrom = (_year) => {
    setState({ ...state, year_from: parseInt(_year()) });
  };
  const onSelectYearTo = (_year) => {
    setState({ ...state, year_to: parseInt(_year()) });
  };

  const onModelChange = (_value) => {
    setState({
      ...state,
      model: _value,
    });
  };

  const onSelectColor = (_color) => {
    setState({
      ...state,
      color: _color(),
    });
  };

  const onKilometerFromChange = (_value) => {
    setState({
      ...state,
      kilometer_from: parseFloat(_value.replace(/[^0-9]/g, "")),
    });
  };
  const onKilometerToChange = (_value) => {
    setState({
      ...state,
      kilometer_to: parseFloat(_value.replace(/[^0-9]/g, "")),
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

  const closeAllDropdown = () => {
    setYearFromOpen(false);
    setYearToOpen(false);
    setMonthOpen(false);
    setColorOpen(false);
    setMakerOpen(false);
  };

  const handleSelectorChange = (_value) => {
    setState({ ...state, vehicleType: _value });

    switch (_value) {
      case "car":
        {
          setInclusions(
            carInclusions.map((item) => {
              return {
                label: item.label,
                value: item.value,
              };
            })
          );

          //Reset motor inclusions
          const _val = motorcycleInclusions.reduce((acc, curval) => {
            acc[curval.value] = 0;
            return acc;
          }, {});

          setState((prev) => ({ ...prev, ..._val }));
        }
        break;
      case "bike":
        {
          setInclusions(
            motorcycleInclusions.map((item) => {
              return {
                label: item.label,
                value: item.value,
              };
            })
          );

          //Reset car inclusions
          const _val = carInclusions.reduce((acc, curval) => {
            acc[curval.value] = 0;
            return acc;
          }, {});

          setState((prev) => ({ ...prev, ..._val }));
        }
        break;
    }
  };

  const clearAllInclusions = () => {
    //Reset motor inclusions

    const phase1 = motorcycleInclusions.reduce((acc, curval) => {
      acc[curval.value] = 0;
      return acc;
    }, {});

    //Reset car inclusions
    const phase2 = carInclusions.reduce((acc, curval) => {
      acc[curval.value] = 0;
      return acc;
    }, phase1);

    setState((prev) => ({ ...prev, ...phase2 }));
    
  };

  const selectAllInclusions = () => {
    switch (state.vehicleType) {
      case "car":
        {
          const _select = carInclusions.reduce((acc, curval) => {
            acc[curval.value] = 1;
            return acc;
          }, {});
          setState((prev) => ({ ...prev, ..._select }));
          
        }
        break;
      case "bike":
        {
          const _select = motorcycleInclusions.reduce((acc, curval) => {
            acc[curval.value] = 1;
            return acc;
          }, {});

          setState((prev) => ({ ...prev, ..._select }));
          
        }
        break;
    }
  };

  const setImages = (images) => {
    setState({ ...state, images: images });
  };

  const navigation = useNavigation();

  const submitForm = async () => {
    setIsSubmitted(true);
    if (validationCheck()) {
      return;
    }

    try {
      const formData = new FormData();

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

  const ButtonText = ({ onPress, label, icon, color }) => {
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.buttonText}>
          {icon && (
            <MaterialCommunityIcons name={icon} size={16} color={color} />
          )}
          <Label size={12} weight="bold" style={{ color }}>
            {label}
          </Label>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SegmentedButtons
        buttons={[
          {
            label: "Auto",
            value: "car",
            icon: "car",
            checkedColor: "white",
            labelStyle: { fontWeight: "bold" },
            style: {
              backgroundColor:
                state.vehicleType === "car"
                  ? theme.colors.icons.active
                  : "transparent",
            },
          },
          {
            label: "Motorrad",
            value: "bike",
            icon: "motorbike",
            labelStyle: { fontWeight: "bold" },
            checkedColor: "white",
            style: {
              backgroundColor:
                state.vehicleType === "bike"
                  ? theme.colors.icons.active
                  : "transparent",
            },
          },
        ]}
        onValueChange={handleSelectorChange}
        value={state.vehicleType}
        theme={{ colors: { primary: "green" } }}
      />
      <DropDownPicker
        open={makerOpen}
        setOpen={() => {
          closeAllDropdown();
          setMakerOpen(makerOpen ? false : true);
        }}
        value={state.maker}
        items={items}
        setValue={onSelectMaker}
        textStyle={{ fontSize: 18 }}
        style={[
          styles.formField,
          { borderColor: isSubmitted && !state.maker ? "red" : "#bbb" },
        ]}
        listMode="SCROLLVIEW"
        placeholder="Select Maker"
        zIndex={10}
        placeholderStyle={{ color: "#bbb", fontSize: 18 }}
        dropDownContainerStyle={{
          borderColor: "#bbb",
          maxHeight: 300,
        }}
        searchable={true}
        searchPlaceholder="Search"
        searchPlaceholderTextColor="#bbb"
        searchContainerStyle={{
          borderBottomWidth: 0,
        }}
        searchTextInputStyle={{
          borderColor: "#bbb",
          paddingVertical: 12,
        }}
      />
      <TextInput
        placeholder="Modell"
        onChangeText={onModelChange}
        value={state.model}
        style={[
          styles.formField,
          {
            borderColor: isSubmitted && !state.model ? "red" : "#bbb",
          },
        ]}
      />

      {mode === 1 ? (
        <View style={{ flex: 1, flexDirection: "row", gap: 8, zIndex: 9 }}>
          <View style={{ flex: 1 }}>
            <DropDownPicker
              open={monthOpen}
              setOpen={() => {
                closeAllDropdown();
                setMonthOpen(monthOpen ? false : true);
              }}
              value={state.month}
              items={months}
              setValue={onSelectMonth}
              textStyle={{ fontSize: 18 }}
              style={[styles.formField]}
              placeholder="Baumonat"
              listMode="SCROLLVIEW"
              placeholderStyle={{ color: "#bbb", fontSize: 18 }}
              dropDownContainerStyle={{ borderColor: "#bbb" }}
              zIndex={9}
              flatListProps={{
                style: {
                  borderColor: "red",
                },

                //   scrollEnabled: false,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropDownPicker
              open={yearFromOpen}
              setOpen={() => {
                closeAllDropdown();
                setYearFromOpen(yearFromOpen ? false : true);
              }}
              value={state.year_from}
              items={years}
              setValue={onSelectYearFrom}
              textStyle={{ fontSize: 18 }}
              style={[
                styles.formField,
                {
                  borderColor: isSubmitted && !state.year_from ? "red" : "#bbb",
                },
              ]}
              placeholder="Baujahr"
              listMode="SCROLLVIEW"
              placeholderStyle={{ color: "#bbb", fontSize: 18 }}
              dropDownContainerStyle={{ borderColor: "#bbb" }}
              zIndex={9}
              flatListProps={{
                style: {
                  borderColor: "red",
                },

                //   scrollEnabled: false,
              }}
            />
          </View>
        </View>
      ) : (
        <>
          <Label size="subtitle" weight="bold">
            Baujahr
          </Label>
          <View style={{ flex: 1, flexDirection: "row", gap: 8, zIndex: 9 }}>
            <View style={{ flex: 1 }}>
              <DropDownPicker
                open={yearFromOpen}
                setOpen={() => {
                  closeAllDropdown();
                  setYearFromOpen(yearFromOpen ? false : true);
                }}
                value={state.year_from}
                items={years}
                setValue={onSelectYearFrom}
                textStyle={{ fontSize: 18 }}
                style={[
                  styles.formField,
                  {
                    borderColor:
                      isSubmitted &&
                      (!state.year_from || state.year_to <= state.year_from)
                        ? "red"
                        : "#bbb",
                  },
                ]}
                placeholder="von"
                listMode="SCROLLVIEW"
                placeholderStyle={{ color: "#bbb", fontSize: 18 }}
                dropDownContainerStyle={{ borderColor: "#bbb" }}
                zIndex={9}
                flatListProps={{
                  style: {
                    borderColor: "red",
                  },

                  //   scrollEnabled: false,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DropDownPicker
                open={yearToOpen}
                setOpen={() => {
                  closeAllDropdown();
                  setYearToOpen(yearToOpen ? false : true);
                }}
                value={state.year_to}
                items={years}
                setValue={onSelectYearTo}
                textStyle={{ fontSize: 18 }}
                style={[
                  styles.formField,
                  {
                    borderColor:
                      isSubmitted &&
                      (!state.year_to || state.year_to <= state.year_from)
                        ? "red"
                        : "#bbb",
                  },
                ]}
                placeholder="bis"
                listMode="SCROLLVIEW"
                placeholderStyle={{ color: "#bbb", fontSize: 18 }}
                dropDownContainerStyle={{ borderColor: "#bbb" }}
                zIndex={9}
                flatListProps={{
                  style: {
                    borderColor: "red",
                  },

                  //   scrollEnabled: false,
                }}
              />
            </View>
          </View>
        </>
      )}
      <DropDownPicker
        open={colorOpen}
        setOpen={setColorOpen}
        value={state.color}
        items={colors}
        setValue={onSelectColor}
        textStyle={{ fontSize: 18 }}
        style={[
          styles.formField,
          {
            borderColor: isSubmitted && !state.color ? "red" : "#bbb",
          },
        ]}
        placeholder="Farbe"
        listMode="SCROLLVIEW"
        placeholderStyle={{ color: "#bbb", fontSize: 18 }}
        dropDownContainerStyle={{ borderColor: "#bbb" }}
        zIndex={8}
        flatListProps={{
          style: {
            borderColor: "red",
          },

          //   scrollEnabled: false,
        }}
      />
      {mode === 1 ? (
        <TextInput
          placeholder="Kilometer"
          value={
            state.kilometer_from
              ? Intl.NumberFormat("de-DE").format(state.kilometer_from)
              : ""
          }
          onChangeText={onKilometerFromChange}
          style={[
            styles.formField,
            {
              borderColor:
                isSubmitted && !state.kilometer_from ? "red" : "#bbb",
            },
          ]}
          keyboardType="numeric"
        />
      ) : (
        <>
          <Label size="subtitle" weight="bold">
            Kilometer
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="von"
              value={
                state.kilometer_from
                  ? Intl.NumberFormat("de-DE").format(state.kilometer_from)
                  : ""
              }
              onChangeText={onKilometerFromChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.kilometer_from ||
                      state.kilometer_to <= state.kilometer_from)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="bis"
              value={
                state.kilometer_to
                  ? Intl.NumberFormat("de-DE").format(state.kilometer_to)
                  : ""
              }
              onChangeText={onKilometerToChange}
              style={[
                styles.formField,
                {
                  flex: 1,
                  borderColor:
                    isSubmitted &&
                    (!state.kilometer_to ||
                      state.kilometer_to <= state.kilometer_from)
                      ? "red"
                      : "#bbb",
                },
              ]}
              keyboardType="numeric"
            />
          </View>
        </>
      )}
      {mode === 1 ? (
        <TextInput
          placeholder="Preis"
          value={
            state.price_from
              ? Intl.NumberFormat("de-DE").format(state.price_from)
              : ""
          }
          onChangeText={onPriceFromChange}
          style={[
            styles.formField,
            {
              borderColor: isSubmitted && !state.price_from ? "red" : "#bbb",
            },
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
                    isSubmitted && state.price_to <= state.price_from
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

      <View style={{ gap: 6, marginTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label size="subtitle" weight="bold">
            Ausstattung
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ButtonText
              label="Select All"
              icon="check-bold"
              color="#009432"
              onPress={selectAllInclusions}
            />
            <ButtonText
              label="Clear"
              icon="close-thick"
              color="#b71540"
              onPress={clearAllInclusions}
            />
          </View>
        </View>
        <FlatList
          removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
          data={inclusions}
          keyExtractor={inclusionKeyExtractor}
          scrollEnabled={false}
          renderItem={renderInclusion}
          horizontal={false}
          numColumns={2}
          initialNumToRender={35}
          columnWrapperStyle={{
            gap: 10,
          }}
          ItemSeparatorComponent={() => {
            return <View style={{marginTop: 6}}/>;
          }}
        />
      </View>
      <TextInput
        style={[
          styles.formField,
          {
            borderColor: isSubmitted && !state.title ? "red" : "#bbb",
          },
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
              borderColor: isSubmitted && !state.title ? "red" : "#bbb",
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

export default PostEntryMobil;

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
  typeSelector: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  selectorButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    flex: 1,
  },
  buttonText: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaeaea",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
});
