import axios from "axios";
import { config } from "../src/utils/constants";

const refreshAccessToken = async (user) => {
  try {
    const response = await axios.get("/api/v2/auth/refresh_token", {
      baseURL: config.SERVER_HOST,
      headers: {
        Authorization: `Bearer ${user}`,
      },
    });
    return response.data.accessToken;
  } catch (error) {
    console.log("Failed to refresh token: ", error);
    throw error.response.data.signout;
  }
};

export default refreshAccessToken;
