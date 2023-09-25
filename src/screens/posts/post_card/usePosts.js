import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { PostContext } from "../../../services/post/post.context";

export default function usePosts() {
  return useContext(PostContext);
}

const styles = StyleSheet.create({});
