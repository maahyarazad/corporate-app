import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = `notification`;

const res = (response) => response.data;

export const NotificationsService = {
  storePushToken(user_id, userPushToken) {
    return axiosInstance
      .post(`${API_URL}/save-push-token`, { user_id, userPushToken })
      .then(res);
  },
};
