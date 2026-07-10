import { axiosInstance } from "../interceptor/axiosInstance";
import * as Location from "expo-location";
import { config } from "../../utils/constants";
import { isCancel } from "../../utils/cancellation";

/* =======================
   Location Helpers
======================= */

export const getUserLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });

    return location;
  } catch (error) {
    console.log("Failed to get user location:", error);
    throw error;
  }
};

export const getCoords = async (limit) => {
  try {
    const response = await axiosInstance.get(`location/coordinates/${limit}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getLocations = async (data) => {
  try {
    const response = await axiosInstance.post(`location`, data);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getOneLocation = async (id, lang) => {
  try {
    const response = await axiosInstance.get(
      `location/${id}?app=${config.APP_ID}&lang=${lang}`
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* =======================
   Partner Service
======================= */

const API_URL = "partner";

export const PartnerService = {
  async getAvailableCategories(data) {
    try {
      const response = await axiosInstance.post(
        `${API_URL}/category-available2`,
        {
          ...data,
          app_id: config.APP_ID,
        }
      );
      return response.data.result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  async getAvailableTags(lang) {
    try {
      const response = await axiosInstance.get(
        `${API_URL}/tags-available?app_id=${config.APP_ID}&lang=${lang}`
      );
      return response.data.result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  async getAllSpecialtags() {
    try {
      const response = await axiosInstance.get(
        `${API_URL}/specialtags`
      );
      return response.data.result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  async getTopPerCategories(data) {
    try {
      const response = await axiosInstance.post(
        `location/top-per-category`,
        {
          ...data,
          app_id: config.APP_ID,
        }
      );
      return response.data.result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  async getPartners(signal) {
    try {
      const response = await axiosInstance.get(`${API_URL}/active-partners`, {
        signal,
      });
      return response.data;
    } catch (error) {
      if (!isCancel(error)) console.log(error);
      throw error;
    }
  },
};