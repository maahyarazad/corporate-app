import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = "app";

const resData = (response) => response.data;

export const AppServices = {
  getBanners(data) {
    return axiosInstance.post(`${API_URL}/get-banners`, data).then(resData);
  },
  getLatestVersion(data, signal) {
    return axiosInstance
      .get(
        `${API_URL}/version?app_id=${data.app_id}&platform=${data.platform}`,
        { signal }
      )
      .then(resData);
  },
};
