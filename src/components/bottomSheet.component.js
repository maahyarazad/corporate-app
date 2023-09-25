import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import BottomSheetComponent, {
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Label } from "./typography/label.component";
import useBottomDrawer from "../../hooks/useBottomDrawer";

const BottomSheet = ({ display, children }) => {
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ["25%", "50%"], []);

  const handleSheetChanges = useCallback((index) => {
    console.log("handleSheetChanges", index);
  }, []);

  const { showBottomDrawer, drawerClose, drawerContent } = useBottomDrawer();

  useEffect(() => {
    if (display) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }

    return () => {};
  }, [display]);

  useEffect(() => {
    if (!showBottomDrawer) {
      bottomSheetRef.current?.close();
    }

    return () => {};
  }, [showBottomDrawer]);

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

  const onClose = () => {
    drawerClose();
  };

  return (
    <>
      {showBottomDrawer && drawerContent && (
        <View style={{ flex: 1 }}>
          <BottomSheetComponent
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            style={[styles.sheetShadow]}
            backgroundStyle={{}}
            backdropComponent={renderBackdrop}
            onClose={onClose}
          >
            {drawerContent}
          </BottomSheetComponent>
        </View>
      )}
    </>
  );
};

export default BottomSheet;

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
