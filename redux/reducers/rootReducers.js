import { combineReducers } from "redux";
import postsReducer from "./postReducers";

const rootReducer = combineReducers({
  postsReducer,
});

export default rootReducer;
