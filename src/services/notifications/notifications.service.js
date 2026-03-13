import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = `notification`;

const res = (response) => response.data;

export const NotificationsService = {
  storeFcmToken(user_id, token) {
    return axiosInstance
      .post(`${API_URL}/save-push-token`, { user_id, token })
      .then(res);
  },
};
