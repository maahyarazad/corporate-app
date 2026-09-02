import React from "react";
import { View, Image, StyleSheet } from "react-native";

const LoginHeader = ({ companyLogo }) => {

  return (
  <View style={styles.flexBox}>
  <Image style={styles.image} source={companyLogo} />

 
</View>
  );
};

export default LoginHeader;

const styles = StyleSheet.create({
  flexBox: {
    flex: 1,
    maxHeight: "20%",
  },
  image: {
    width: 100,
    height: 50,
    resizeMode: "contain",
    marginLeft: 16,
  },
});
