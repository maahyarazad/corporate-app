import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import BottomSheetComponent, {
  BottomSheetBackdrop,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { Label } from "./typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../infrastructure/theme";

const BottomSheetSelector = ({
  data,
  windowSize = "25%",
  onClose,
  display = true,
}) => {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => [windowSize], []);
  const handleSheetChanges = useCallback((index) => {
    console.log("handleSheetChanges", index);
  }, []);

  useEffect(() => {
    if (display && data) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }

    return () => {};
  }, [display]);

  const handleSelect = (onPress) => {
    onPress();
  };

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        style={[props.style]}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{}}
        onDismiss={onClose}
      >
        <ScrollView style={{ marginHorizontal: 12 }}>
          <View
            style={{
              borderRadius: 8,
              backgroundColor: "#eee",
            }}
          >
            {data &&
              data.map((option, index) => {
                if (!option) {
                  return null;
                }

                return (
                  <View key={index}>
                    <TouchableOpacity
                      onPress={() => {
                        handleSelect(option.onPress);
                      }}
                    >
                      <View
                        style={{
                          padding: 10,
                          flexDirection: "row",
                          gap: 12,
                          alignItems: "center",
                          borderColor: "#ddd",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: theme.colors.ui.gray,
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={option.logo}
                            size={22}
                            color={"#fff"}
                          />
                        </View>
                        <View>
                          <Label weight={"bold"}>{option.title}</Label>
                          <Label>{option.description}</Label>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < data.length - 1 && (
                      <View
                        style={{ flex: 1, height: 2, backgroundColor: "#ddd" }}
                      ></View>
                    )}
                  </View>
                );
              })}
          </View>
        </ScrollView>
      </BottomSheetModal>
    </>
  );
};

export default BottomSheetSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.48,
    shadowRadius: 11.95,

    elevation: 18,
  },
});
