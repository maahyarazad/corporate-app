import { StyleSheet, Text, View } from "react-native";
import React, { createContext, useEffect, useRef, useState } from "react";
import useLog from "../../../hooks/useLog";
import useRequest from "../../../hooks/useRequest";
import useAuth from "../../../hooks/useAuth";
import { debounce } from "lodash";

export const PostContext = createContext(null);

export default function PostProvider({ children }) {
  // const isMounted = useRef(true);

  // const [rootPosts, setRootPosts] = useState(null);
  // const [replyTo, setReplyTo] = useState(null);
  // const request = useRequest();

  // useEffect(() => {
  //   isMounted.current = true;
  //   // if (accessToken) fetchData();
  //   return () => {
  //     isMounted.current = false;
  //     setReplyTo(null);
  //     setRootPosts(null);
  //     clearRootPosts(null);
  //   };
  // }, []);

  // const fetchPosts = async (page = 0) => {
  //   try {
  //     console.log(page);
  //     if (isMounted.current) {
  //       const response = await request(
  //         `/v2/post/latest?page=${page}`,
  //         "get"
  //       );

  //       if (page !== 0 || rootPosts != undefined) {
  //         setRootPosts([...rootPosts, ...response.data]);
  //       } else {
  //         setRootPosts(response.data);
  //       }

  //       return response.data;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.error("Failed to get posts:", error);
  //   }
  // };

  // const clearRootPosts = () => {
  //   setRootPosts(null);
  // };

  // const fetchComments = async (postId, mode = 0, prev = 0) => {
  //   try {
  //     const response = await request(
  //       `/v2/post/comments?id=${postId}&prev=${prev}&mode=${mode}`,
  //       "get"
  //     );

  //     // const _comments = posts.filter((comment) => comment.orderId === postId);
  //     // setTestComment(response.data);
  //     return response;
  //   } catch (error) {
  //     console.error("Failed to get comments:", error);
  //   }
  // };

  // const fetchPost = async (postId) => {
  //   try {
  //     const response = await request(`/v2/post/${postId}`, "get");
  //     // const _comments = posts.filter((comment) => comment.orderId === postId);
  //     return response;
  //   } catch (error) {
  //     console.error("Failed to get post:", error);
  //   }
  // };

  // const addPost = async (data) => {
  //   try {
  //     const response = await request(`/v2/post/new`, "post", data);

  //     if (response.success) {
  //       setRootPosts([data, ...rootPosts]);
  //     }

  //     return response;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const addComment = async (postId, newComment) => {
  //   try {
  //     //Add Comment API
  //     // setPosts([...posts, newComment]);

  //     const response = await request(
  //       `/v2/post/comment`,
  //       "post",
  //       newComment
  //     );

  //     if (response.success) {
  //       const postIndex = rootPosts.findIndex((post) => post.id === postId);

  //       console.log("POST INDEX FOUND", postIndex);
  //       //Abort when post cant be found

  //       if (postIndex === -1) return;

  //       const updatedPost = {
  //         ...rootPosts[postIndex],
  //         commentCount: rootPosts[postIndex].commentCount + 1,
  //         likeCount: 20,
  //       };

  //       setRootPosts([
  //         ...rootPosts.slice(0, postIndex),
  //         updatedPost,
  //         ...rootPosts.slice(postIndex + 1),
  //       ]);
  //       return response;
  //     }
  //     return response;
  //   } catch (error) {
  // //     console.error("Failed to add comment:", error);
  // //   }
  // };

  // /**
  //  *
  //  * @param {number} postId
  //  *
  //  * @description Unliking a post
  //  *
  //  *
  //  */
  // const unlike = async (post_id) => {
  //   // const _posts = posts.map((post) =>
  //   //   post.id === postId
  //   //     ? { ...post, like: false, likeCount: post.likeCount - 1 }
  //   //     : post
  //   // );
  //   // setPosts(_posts);
  //   console.log("UNLIKE");
  //   const postIndex = rootPosts.findIndex((post) => post.post_id === post_id);

  //   //Abort when post cant be found
  //   if (postIndex === -1) return;

  //   const updatedPost = {
  //     ...rootPosts[postIndex],
  //     liked: false,
  //     likeCount: rootPosts[postIndex].likeCount - 1,
  //   };

  //   //Unike API Call to Server
  //   const response = await request(`/v2/post/unlike`, "post", {
  //     post_id,
  //   });

  //   console.log(response);

  //   //if like is success, return true
  //   setRootPosts([
  //     ...rootPosts.slice(0, postIndex),
  //     updatedPost,
  //     ...rootPosts.slice(postIndex + 1),
  //   ]);

  //   return true;

  //   //else, return false
  //   return false;
  // };

  // const reply = (post, isTopLevel) => {
  //   setReplyTo({
  //     id: isTopLevel ? post.id : post.order_id,
  //     name: `${post.first_name} ${post.last_name}`,
  //   });
  // };

  // const resetReply = () => {
  //   setReplyTo(null);
  // };

  // const values = {
  //   rootPosts,
  //   like,
  //   unlike,
  //   fetchComments,
  //   fetchPosts,
  //   fetchPost,
  //   addComment,
  //   reply,
  //   replyTo,
  //   resetReply,
  //   clearRootPosts,
  //   addPost,
  // };

  const [rootPosts, setRootPosts] = useState([]);
  const [updateCount, setUpdateCount] = useState(0);

  const [replyTo, setReplyTo] = useState(null);
  const request = useRequest();

  const loadOldPosts = async (post_id) => {
    try {
      // alert(`Page ${page}`);
      // alert("load old");
      const last_post_id = post_id ?? rootPosts[rootPosts.length - 1].post_id;
      const limit = 20;
      const status = 1;
      const start = performance.now();

      const testing = debounce(async () => {
        const response = await request(
          `/v2/post/old?post_id=${last_post_id}&limit=${limit}&status=${status}`,
          "get"
        );

        // const response = await request(`/v2/post/latest?page=${_page}`, "get");
        // if (response.success) {
        //   setRootPosts((prev) => {
        //     return [...prev, ...response.data];
        //   });

        //   if (rootPosts.length > 20) {
        //     setRootPosts((prev) => {
        //       return [...prev.slice(10)];
        //     });
        //   }

        setRootPosts([...rootPosts, ...response.data]);
        const end = performance.now();
        console.log("PERFORMANCE", end - start);
        // }
        // return response.data;
        // setTestPosts([...response.data]);

        //Updates List
        setUpdateCount(updateCount + 1);
      }, 1000);
      testing();
    } catch (error) {
      console.error("Failed to get posts:", error);
    }
  };

  const clearRootPosts = () => {
    setRootPosts([]);
  };

  const fetchComments = async (postId, mode = 0, prev = 0) => {
    try {
      const response = await request(
        `/v2/post/comments?id=${postId}&prev=${prev}&mode=${mode}`,
        "get"
      );

      // const _comments = posts.filter((comment) => comment.orderId === postId);
      // setTestComment(response.data);
      return response;
    } catch (error) {
      console.error("Failed to get comments:", error);
    }
  };

  const testFunction = (post_id) => {
    try {
      setRootPosts((prev) => prev.slice(3));

      setUpdateCount(updateCount + 1);
    } catch (error) {
      console.log("Failed to like post:", error);
    }
  };

  /**
   *
   * @param {number} postId
   *
   * @description Liking a post
   *
   *
   */
  const likePost = async (post_id) => {
    try {
      //Like API Call to Server
      const response = await request(`/v2/post/like`, "post", {
        post_id,
      });

      if (response.success) {
        const postIndex = rootPosts.findIndex(
          (post) => post.post_id === post_id
        );

        //Abort when post cant be found
        if (postIndex === -1) return;

        const updatedPost = {
          ...rootPosts[postIndex],
          liked: 1,
          likeCount: rootPosts[postIndex].likeCount + 1,
        };

        //if like is success, return true
        setRootPosts((prevState) => [
          ...prevState.slice(0, postIndex),
          updatedPost,
          ...prevState.slice(postIndex + 1),
        ]);
      }

      //else, return false
      // return response;
    } catch (error) {
      console.log("Failed to like post:", error);
    }
  };

  const unlikePost = async (post_id) => {
    try {
      //Like API Call to Server
      const response = await request(`/v2/post/unlike`, "post", {
        post_id,
      });

      if (response.success) {
        const postIndex = rootPosts.findIndex(
          (post) => post.post_id === post_id
        );

        //Abort when post cant be found
        if (postIndex === -1) return;

        const updatedPost = {
          ...rootPosts[postIndex],
          liked: 0,
          likeCount: rootPosts[postIndex].likeCount - 1,
        };

        //if like is success, return true
        setRootPosts((prevState) => [
          ...prevState.slice(0, postIndex),
          updatedPost,
          ...prevState.slice(postIndex + 1),
        ]);
      }

      //else, return false
      // return response;
    } catch (error) {
      console.log("Failed to like post:", error);
    }
  };

  const likeComment = async (post_id) => {
    try {
      const response = await request(`/v2/post/like`, "post", {
        post_id,
      });
    } catch (error) {
      console.log("Failed to like comment:", error);
    }
  };

  const removeComment = async (post_id) => {
    try {
      const response = await request(`/v2/post/comment/remove`, "delete", {
        post_id,
      });

      //Adjust comment count
      if (response.success) {
        const postIndex = rootPosts.findIndex(
          (post) => post.post_id === post_id
        );

        console.log("POST INDEX FOUND", postIndex);
        //Abort when post cant be found

        if (postIndex === -1) return;

        const updatedPost = {
          ...rootPosts[postIndex],
          commentCount: rootPosts[postIndex].commentCount - 1,
        };

        setRootPosts((prevState) => [
          ...prevState.slice(0, postIndex),
          updatedPost,
          ...prevState.slice(postIndex + 1),
        ]);
        return response;
      }
    } catch (error) {
      console.log("Failed to remove comment:", error);
    }
  };

  const removePost = async (post_id) => {
    try {
      const response = await request(`/v2/post/remove`, "delete", {
        post_id,
      });

      if (response.success) {
        const _rootPosts = rootPosts.filter((post) => post.post_id !== post_id);
        setRootPosts(_rootPosts);
      }
    } catch (error) {
      console.log("Failed to remove post: ", error);
    }
  };

  const editPost = async (data) => {
    try {
      const response = await request(`/v2/post/edit`, "put", {
        data,
      });
      if (response.success) {
        const postIndex = rootPosts.findIndex(
          (post) => post.post_id === data.post_id
        );

        //if like is success, return true
        setRootPosts((prevState) => [
          ...prevState.slice(0, postIndex),
          data,
          ...prevState.slice(postIndex + 1),
        ]);
      }
    } catch (error) {
      console.log("Failed to edit post: ", error);
    }
  };

  const editComment = async (data) => {
    try {
      const response = await request(`/v2/post/comment/edit`, "put", {
        data,
      });
    } catch (error) {
      console.log("Failed to edit comment:", error);
    }
  };

  const unlikeComment = async (post_id) => {
    try {
      const response = await request(`/v2/post/unlike`, "post", {
        post_id,
      });
    } catch (error) {
      console.log("Failed to unlike comment:", error);
    }
  };

  const resetUpdateCount = () => {
    setUpdateCount(0);
  };

  const addPost = async (data) => {
    try {
      const response = await request(`/v2/post/new`, "post", data);

      return response;
    } catch (error) {
      console.log(error);
    }
  };

  const addComment = async (postId, newComment) => {
    try {
      //Add Comment API
      // setPosts([...posts, newComment]);

      const response = await request(`/v2/post/comment`, "post", newComment);

      if (response.success) {
        const postIndex = rootPosts.findIndex((post) => post.id === postId);

        console.log("POST INDEX FOUND", postIndex);
        //Abort when post cant be found

        if (postIndex === -1) return;

        const updatedPost = {
          ...rootPosts[postIndex],
          // commentCount: rootPosts[postIndex].commentCount + 1,
        };

        setRootPosts((prevState) => [
          ...prevState.slice(0, postIndex),
          updatedPost,
          ...prevState.slice(postIndex + 1),
        ]);
        return response;
      }
      return response;
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const refreshPosts = async () => {
    try {
      const response = await fetchPosts(null);
      setRootPosts(response);
    } catch (error) {
      console.log("Failed to refresh posts:", error);
    }
  };

  const reply = (post, isTopLevel) => {
    setReplyTo({
      id: isTopLevel ? post.id : post.order_id,
      name: `${post.first_name} ${post.last_name}`,
    });
  };

  const resetReply = () => {
    setReplyTo(null);
  };

  const getMoreRecentPosts = async (post_id) => {
    try {
      const limit = 20;
      const status = 1;
      const response = await request(
        `/v2/post/latest/more?limit=${limit}&status=${status}&post_id=${post_id}`,
        "get"
      );

      if (response.success) {
        setRootPosts((prev) => {
          // if (prev.length > 20) {
          //   return [...response.data, ...prev.slice(0, 10)];
          // } else {
          return [...response.data, ...prev];
          // }
        });
      }

      return false;
    } catch (error) {
      console.log("Failed to get more recent posts: ", error);
    }
  };

  const values = {
    rootPosts,
    loadOldPosts,
    clearRootPosts,
    fetchComments,
    testFunction,
    updateCount,
    resetUpdateCount,
    likeComment,
    likePost,
    unlikePost,
    unlikeComment,
    addPost,
    addComment,
    refreshPosts,
    reply,
    resetReply,
    replyTo,
    removeComment,
    editComment,
    removePost,
    editPost,
    getMoreRecentPosts,
  };

  return <PostContext.Provider value={values}>{children}</PostContext.Provider>;
}
