const initialState = {
  posts: [],
};

const postsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_POST":
      return {
        ...state,
        posts: [...state.posts, action.payload],
      };
    case "LOAD_OLD_POSTS":
      return {
        ...state,
        posts: [...state.posts, ...action.payload],
      };
    case "LOAD_NEW_POSTS":
      return {
        ...state,
        posts: [...action.payload, ...state.posts],
      };
    case "ADD_COMMENT":
      alert(action.payload);
      const postIndex = state.posts.findIndex(
        (post) => post.id === action.payload
      );

    //   console.log("POST INDEX FOUND", postIndex);
      //Abort when post cant be found

      if (postIndex === -1) return;

      const updatedPost = {
        ...state.posts[postIndex],
        commentCount: state.posts[postIndex].commentCount + 1,
      };

      return {
        ...state.posts.slice(0, postIndex),
        updatedPost,
        ...state.posts.slice(postIndex + 1),
      };
    case "DELETE_POST":
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload),
      };
    case "UPDATE_POST":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    default:
      return state;
  }
};

export default postsReducer;
