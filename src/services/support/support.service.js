import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = "support";

const resData = (response) => response.data;

export const SupportService = {
  sendFeedbackMsg(data) {
    return axiosInstance.post(`${API_URL}/message`, data).then(resData);
  },
};
