import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";

export default function usePosts() {
  const post_template = [
    {
      id: 0,
      orderId: 0,
      user_id: 1,
      category: "Business",
      date_posted: new Date("2023/08/08"), //option 1,
      first_name: "Miguel",
      last_name: "Paday",
      position: "Developer",
      prof_image:
        "https://fastly.picsum.photos/id/449/200/200.jpg?hmac=FD7uqDWwU1CeTIaCQGi9nY0XGVRtSV7cnadWYqPt0CU",
      content: "The quick brown fox jumps over the lazy dog.",
      like: false,
      likeCount: 3,
      comments: [
        {
          id: 1,
          orderId: 0,
          user_id: 2,
          date_commented: new Date("2023/06/08"), //option 1,
          first_name: "Vince",
          last_name: "Banzon",
          position: "Developer",
          content: "First Comment",
          like: false,
          likeCount: 30,
          comments: [
            {
              id: 5,
              orderId: 1,
              user_id: 2,
              date_commented: new Date("2023/06/21"), //option 1,
              first_name: "Rhea",
              last_name: "Mosot",
              position: "Developer",
              content: "Dab",
              like: false,
              likeCount: 100,
              comments: [
                {
                  id: 6,
                  orderId: 0,
                  user_id: 2,
                  date_commented: new Date("2023/06/08"), //option 1,
                  first_name: "Vince",
                  last_name: "Banzon",
                  position: "Developer",
                  content: "Unsa man?",
                  like: false,
                  likeCount: 0,
                },
              ],
            },
          ],
        },
        {
          id: 2,
          orderId: 1,
          user_id: 2,
          date_commented: new Date("2023/06/21"), //option 1,
          first_name: "Vince",
          last_name: "Banzon",
          position: "Developer",
          content: "Second Comment",
          like: false,
          likeCount: 3,
        },
        {
          id: 3,
          orderId: 0,
          user_id: 3,
          date_commented: new Date("2023/7/02"), //option 1,
          first_name: "Vince",
          last_name: "Banzon",
          position: "Developer",
          content: "Third Comment",
          like: true,
          likeCount: 3,
        },
      ],
    },
    {
      id: 4,
      orderId: 0,
      user_id: 1,
      category: "Travel",
      date_posted: new Date("2023/08/08"), //option 1,
      first_name: "Paulyn",
      last_name: "Paday",
      position: "Operator",
      prof_image:
        "https://fastly.picsum.photos/id/1074/200/200.jpg?hmac=o1fm0jR_nE4yW-N80QpSF9JfnnRYhRraqaTaTbCGe1c",
      content: "Anyone know where to buy plane ticket here in Dubai?",
      like: true,
      likeCount: 3,
      comments: [],
    },
  ];

  const post_sample = [
    {
      id: 1,
      name: "Miguel Paday",
      position: "Programmer",
      prof_image: "https://picsum.photos/200",
      date_posted: new Date("2023/08/08"),
      content: "The quick brown fox jumps over the lazy dog.",
    },
    {
      id: 2,
      name: "Paulyn Paday",
      position: "Wife",
      prof_image: "https://picsum.photos/200",
      date_posted: new Date("2023/08/08"),
      content: "The quick brown fox jumps over the lazy cat.",
    },
  ];
  const isMounted = useRef(true);
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = () => {
    try {
      if (isMounted.current) {
        setPosts(post_template);
      }
    } catch (error) {
      console.error("Failed to get posts:", posts);
    }
  };

  const like = (postId) => {
    console.log("POST ID", postId);
    const _posts = posts.map((post) =>
      post.id === postId
        ? { ...post, like: true, likeCount: post.likeCount + 1 }
        : post
    );
    setPosts(_posts);
  };

  const unlike = (postId) => {
    const _posts = posts.map((post) =>
      post.id === postId
        ? { ...post, like: false, likeCount: post.likeCount - 1 }
        : post
    );
    setPosts(_posts);
  };

  return { posts, setPosts, like, unlike };
}

const styles = StyleSheet.create({});
