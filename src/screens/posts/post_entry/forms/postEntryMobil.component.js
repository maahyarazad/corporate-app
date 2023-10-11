import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import {
  carInclusions,
  colorList,
  makerList,
  monthList,
  motorcycleInclusions,
} from "../../../../utils/marketplaceConstants";
import { Label } from "../../../../components/typography/label.component";
import DateTimePicker from "@react-native-community/datetimepicker";
import { width } from "../../../../components/styles";
import { Checkbox, SegmentedButtons } from "react-native-paper";
import { theme } from "../../../../infrastructure/theme";
import { Spacer } from "../../../../components/spacer/spacer.component";
import { Touchable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const MAX_CONTENT = 3000;

const RenderTickView = ({ item, state, setValue }) => {
  const [checked, setChecked] = useState(state[item.value] ?? false);

  useEffect(() => {
    setValue((prev) => ({ ...prev, [item.value]: false }));
    return () => {};
  }, []);

  const toggle = () => {
    setChecked(!checked);
    setValue((prev) => ({ ...prev, [item.value]: !checked }));
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
          <Label numberOfLines={2} size={"subtitle"}>
            {item.label}
          </Label>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const MemoizedRenderTick = React.memo(RenderTickView);

const PostEntryMobil = () => {
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

  const [colorOpen, setColorOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [makerOpen, setMakerOpen] = useState(false);
  const [state, setState] = useState({
    type: "auto",
    maker: null,
    model: null,
    title: "",
    content: "",
    month: null,
    year: null,
    color: null,
    kilometer: null,
    price: null,
  });
  const [isMotorcycle, setIsMotorcycle] = useState(false);

  const onSelectMaker = (_maker) => {
    setState({ ...state, maker: _maker() });
  };

  const onSelectMonth = (_month) => {
    setState({ ...state, month: _month() });
  };
  const onSelectYear = (_year) => {
    setState({ ...state, year: _year() });
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

  const onKilometerChange = (_value) => {
    setState({
      ...state,
      kilometer: _value.replace(/[^0-9]/g, ""),
    });
  };
  const onPriceChange = (_value) => {
    setState({
      ...state,
      price: _value.replace(/[^0-9]/g, ""),
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
    setYearOpen(false);
    setMonthOpen(false);
    setColorOpen(false);
    setMakerOpen(false);
  };

  const handleSelectorChange = (_value) => {
    setState({ ...state, type: _value });

    switch (_value) {
      case "auto":
        setInclusions(
          carInclusions.map((item) => {
            return {
              label: item.label,
              value: item.value,
            };
          })
        );
        break;
      case "bike":
        setInclusions(
          motorcycleInclusions.map((item) => {
            return {
              label: item.label,
              value: item.value,
            };
          })
        );
        break;
    }
  };

  return (
    <>
      {/* <View style={styles.typeSelector}>
        {MOBIL_TYPES.map((type) => {
          return (
            <TouchableWithoutFeedback
              key={type.value}
              onPress={() => {
                handleSelectorChange(type.value);
              }}
            >
              <View
                style={[
                  styles.selectorButton,
                  isMotorcycle === type.value && {
                    backgroundColor: theme.colors.icons.active,
                  },
                ]}
              >
                <Label
                  style={
                    isMotorcycle === type.value && {
                      color: "white",
                    }
                  }
                  weight={"bold"}
                >
                  {type.label}
                </Label>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View> */}
      <SegmentedButtons
        buttons={[
          {
            label: "Auto",
            value: "auto",
            icon: "car",
            checkedColor: "white",
            labelStyle: { fontWeight: "bold" },
            style: {
              backgroundColor:
                state.type === "auto"
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
                state.type === "bike"
                  ? theme.colors.icons.active
                  : "transparent",
            },
          },
        ]}
        onValueChange={handleSelectorChange}
        value={state.type}
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
        style={styles.formField}
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
        style={styles.formField}
      />
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
            open={yearOpen}
            setOpen={() => {
              closeAllDropdown();
              setYearOpen(yearOpen ? false : true);
            }}
            value={state.year}
            items={years}
            setValue={onSelectYear}
            textStyle={{ fontSize: 18 }}
            style={[styles.formField]}
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
      <DropDownPicker
        open={colorOpen}
        setOpen={setColorOpen}
        value={state.color}
        items={colors}
        setValue={onSelectColor}
        textStyle={{ fontSize: 18 }}
        style={[styles.formField]}
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
      <TextInput
        placeholder="Kilometer"
        value={
          state.kilometer
            ? Intl.NumberFormat("de-DE").format(state.kilometer)
            : ""
        }
        onChangeText={onKilometerChange}
        style={styles.formField}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Preis"
        value={
          state.price ? Intl.NumberFormat("de-DE").format(state.price) : ""
        }
        onChangeText={onPriceChange}
        style={styles.formField}
        keyboardType="numeric"
      />
      <View style={{ gap: 6, marginTop: 10 }}>
        <Label size={"subtitle"} weight={"bold"}>
          Ausstattung
        </Label>
        <FlatList
          data={inclusions}
          keyExtractor={(item) => item.value}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <MemoizedRenderTick item={item} state={state} setValue={setState} />
          )}
          horizontal={false}
          numColumns={2}
          initialNumToRender={35}
          columnWrapperStyle={{
            gap: 10,
          }}
          ItemSeparatorComponent={() => {
            return <Spacer position={"top"} size={"small"} />;
          }}
        />
      </View>
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
});
