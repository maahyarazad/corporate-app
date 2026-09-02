import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
  const snapPoints = useMemo(() => [windowSize], [windowSize]);

  useEffect(() => {
    if (display && data) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }

    return () => {};
  }, [display, data]);

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
        backdropComponent={renderBackdrop}
        backgroundStyle={{}}
        onDismiss={onClose}
      >
        {/* BottomSheetScrollView, not react-native's ScrollView: it wires the
            scroll gesture into the sheet's own handler, so dragging at
            scroll-top moves the sheet instead of the two fighting over the
            same pan. */}
        <BottomSheetScrollView style={styles.bottomSheetScrollView}>
          <View style={styles.tint}>
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
                      <View style={styles.rowCenter}>
                        <View
                          style={[
                            styles.centerBox,
                            {
                              backgroundColor: theme.colors.ui.gray,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={option.logo}
                            size={22}
                            color="#fff"
                          />
                        </View>
                        <View>
                          <Label weight="bold">{option.title}</Label>
                          <Label>{option.description}</Label>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < data.length - 1 && (
                      <View style={styles.flexBox}></View>
                    )}
                  </View>
                );
              })}
          </View>
        </BottomSheetScrollView>
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
  bottomSheetScrollView: {
    marginHorizontal: 12,
  },
  tint: {
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  rowCenter: {
    padding: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderColor: "#ddd",
  },
  flexBox: {
    flex: 1,
    height: 2,
    backgroundColor: "#ddd",
  },
  centerBox: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
