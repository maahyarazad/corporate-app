export const addPost = (post) => ({
  type: "ADD_POST",
  payload: post,
});

export const loadOldPosts = (posts) => ({
  type: "LOAD_OLD_POSTS",
  payload: posts,
});

export const loadNewPosts = (posts) => ({
  type: "LOAD_NEW_POSTS",
  payload: posts,
});

export const addNewComment = (post_id) => ({
  type: "ADD_COMMENT",
  payload: post_id,
});
