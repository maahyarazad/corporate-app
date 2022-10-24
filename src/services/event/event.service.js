import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = `event`;

const res = (response) => response.data;

export const EventService = {
  getEvents(data) {
    return axiosInstance.post(`${API_URL}/get`, data).then(res);
  },
  getOneEvent(id) {
    return axiosInstance
      .post(`${API_URL}/detail`, { id, lang: "en" })
      .then(res);
  },
  attendEvent(data) {
    return axiosInstance.post(`${API_URL}/attend`, data).then(res);
  },
  cancelAttend(data) {
    return axiosInstance.post(`${API_URL}/cancel`, data).then(res);
  },
};
