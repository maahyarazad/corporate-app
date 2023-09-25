import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import moment from "moment";
import useRequest from "./useRequest";

export default function useLike() {
  const request = useRequest();

  /**
   *
   * @param {number} post_id
   *
   * @description Liking a post
   *
   *
   */
  const likePost = async (post_id) => {
    try {
      //Like API Call to Server
      const response = await request(`/v2//post/like`, "post", {
        post_id,
      });

      return response.success;
    } catch (error) {
      console.log("Failed to like post:", error);
    }
  };

  /**
   *
   * @param {number} post_id
   *
   * @description unLiking a post
   *
   *
   */
  const unlikePost = async (post_id) => {
    try {
      //Like API Call to Server
      const response = await request(`/v2//post/unlike`, "post", {
        post_id,
      });

      return response.success;
    } catch (error) {
      console.log("Failed to unlike post:", error);
    }
  };

  return { likePost, unlikePost };
}

const styles = StyleSheet.create({});
