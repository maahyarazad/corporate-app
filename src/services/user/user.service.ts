import { AxiosResponse } from "axios";
import { IUser, UserServiceType } from "../../@types/user";
import { config } from "../../utils/constants";
import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = "user";

const success = (response: AxiosResponse) => response.data.success;
const result = (response: AxiosResponse) => response.data.result;
const responseData = (response: AxiosResponse) => response.data;
const resData = (response: AxiosResponse) => response.data.data;

export const UserService: UserServiceType = {
  async createUser(user): Promise<boolean> {
    const response = await axiosInstance.post<boolean>(
      `${API_URL}/register`,
      user
    );
    return success(response);
  },

  async updateUser(user): Promise<boolean> {
    const response = await axiosInstance.put<boolean>(
      `${API_URL}/update`,
      user
    );
    return success(response);
  },

  async getUserInfo(userId): Promise<IUser> {
    const response = await axiosInstance.get<IUser>(
      `${API_URL}/getInfo/${userId}`
    );
    return result(response);
  },

  async validateDetails(data): Promise<boolean> {
    const response = await axiosInstance.post(
      `${API_URL}/validate-details`,
      data
    );
    return responseData(response);
  },

  async getRedemptionHistory(userId): Promise<any> {
    const response = await axiosInstance.get(
      `${API_URL}/history/${userId}`
    );
    return resData(response);
  },

  async requestForgetPass(data): Promise<any> {
    const response = await axiosInstance.post(
      `${API_URL}/request-forget-pass/`,
      data
    );
    return responseData(response);
  },

  async verifyForgetPass(data): Promise<any> {
    const response = await axiosInstance.post(
      `${API_URL}/verify-forget-pass/`,
      data
    );
    return responseData(response);
  },

  async changePassword(data): Promise<any> {
    const response = await axiosInstance.put(
      `${API_URL}/change-password/`,
      data
    );
    return responseData(response);
  },

  async resendEmailVerification(userId): Promise<boolean> {
    const response = await axiosInstance.post(
      `${API_URL}/resend-confirmation/`,
      { userId, app_id: config.APP_ID }
    );
    return success(response);
  },

  async removeUser(userId): Promise<boolean> {
    const response = await axiosInstance.delete(
      `${API_URL}/delete-user/${userId}`
    );
    return responseData(response);
  },

  async getMemberInfo(user_id): Promise<any> {
    const response = await axiosInstance.get(
      `${API_URL}/getMemberInfo/${user_id}`
    );
    return responseData(response);
  },

  async addMember(data): Promise<boolean> {
    const response = await axiosInstance.post(
      `${API_URL}/add-app-member/`,
      data
    );
    return responseData(response);
  },
};