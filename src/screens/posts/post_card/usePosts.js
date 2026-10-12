import { StyleSheet } from "react-native";
import { useContext } from "react";
import { PostContext } from "../../../services/post/post.context";

export default function usePosts() {
  return useContext(PostContext);
}

const styles = StyleSheet.create({});
