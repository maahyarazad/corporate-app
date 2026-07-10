import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = "offer";

const result = (response) => response.data.result;
const success = (response) => response.data.success;
const resData = (response) => response.data;

export const OfferService = {
  generateOfferCode(data, signal) {
    return axiosInstance
      .post(`${API_URL}/generate`, data, { signal })
      .then(result);
  },

  consumeOfferCode(data, signal) {
    return axiosInstance
      .post(`${API_URL}/consume`, data, { signal })
      .then(resData);
  },
  getHotpicks(data, signal) {
    return axiosInstance
      .post(`${API_URL}/hotpicks2`, data, { signal })
      .then(resData);
  },
};
