import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = "offer";

const result = (response) => response.data.result;
const success = (response) => response.data.success;
const resData = (response) => response.data;

export const OfferService = {
  generateOfferCode(data) {
    return axiosInstance.post(`${API_URL}/generate`, data).then(result);
  },

  consumeOfferCode(data) {
    return axiosInstance.post(`${API_URL}/consume`, data).then(resData);
  },
  getHotpicks(data) {
    return axiosInstance.post(`${API_URL}/hotpicks2`, data).then(resData);
  },
};
