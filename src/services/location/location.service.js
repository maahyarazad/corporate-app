import { axiosInstance } from "../interceptor/axiosInstance";
import * as Location from "expo-location";
import { config, typeEnum, typeEnumString } from "../../utils/constants";

export const getUserLocation = async () => {
  try {
    return new Promise(async (resolve, reject) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        reject("Permission to access location was denied");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
      resolve(location);
    });
  } catch (error) {
    console.error("Failed to get user location:", error);
  }
};

export const getCoords = (limit) => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`location/coordinates/${limit}`)
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};
// `location?type=${data.type}&search=${data.value}&page=${data.page}&limit=${data.limit}`

export const getLocations = (data) => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`location`, data)
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

export const getOneLocation = (id, lang) => {
  alert("peste");
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`location/${id}?app=${config.APP_ID}&lang=${lang}`)
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

const API_URL = "partner";
const result = (response) => response.data.result;
const res = (response) => response.data;

export const PartnerService = {
  getAvailableCategories(data) {
    return axiosInstance
      .post(`${API_URL}/category-available2`, {
        ...data,
        app_id: config.APP_ID,
      })
      .then(result);
  },

  getAvailableTags(data) {
    return axiosInstance
      .get(`${API_URL}/tags-available?app_id=${config.APP_ID}&lang=${data}`)
      .then(result);
  },

  getAllSpecialtags() {
    return axiosInstance.get(`${API_URL}/specialtags`).then(result);
  },

  getTopPerCategories(data) {
    return axiosInstance
      .post(`location/top-per-category`, { ...data, app_id: config.APP_ID })
      .then(result);
  },

  getPartners() {
    return axiosInstance.get(`${API_URL}/active-partners`).then(res);
  },
};
