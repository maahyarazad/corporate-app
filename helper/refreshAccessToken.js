import axios from "axios";

const refreshAccessToken = async (user) => {
  try {
    const response = await axios.get("/api/v1/auth/refresh_token", {
      baseURL: "http://172.20.10.4:3011",
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
