import { AxiosResponse } from "axios";
import { IUser, UserServiceType } from "../../@types/user";
import { config } from "../../utils/constants";
import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = 'user'
const success = (response: AxiosResponse) => {
    return response.data.success}
const result = (response: AxiosResponse) => {
    return response.data.result}
const response = (response: AxiosResponse) => {
    return response.data}
const resData = (response: AxiosResponse) => {
    return response.data.data}

export const UserService: UserServiceType = {
    createUser(user): Promise<boolean> {
        return axiosInstance.post<boolean>(`${API_URL}/register`, user).then(success);
    },
    updateUser(user): Promise<boolean> {
        return axiosInstance.put<boolean>(`${API_URL}/update`, user).then(success);
    },
    getUserInfo(userId): Promise<IUser> {
        return axiosInstance.get<IUser>(`${API_URL}/getInfo/${userId}`).then(result)
    },
    // getUserInfo(userId): Promise<IUser> {
    //     return axiosInstance.post<IUser>(`${API_URL}/getInfo`, {userId, app_id: config.APP_ID}).then(result)
    // },
    validateDetails(data): Promise<boolean> {
        return axiosInstance.post(`${API_URL}/validate-details`, data).then(response)
    },
    getRedemptionHistory(userId): Promise<any> {
        return axiosInstance.get(`${API_URL}/history/${userId}`).then(resData)
    },
    requestForgetPass(data): Promise<any> {
        return axiosInstance.post(`${API_URL}/request-forget-pass/`, data).then(response)
    },
    verifyForgetPass(data): Promise<any> {
        return axiosInstance.post(`${API_URL}/verify-forget-pass/`, data).then(response)
    },
    changePassword(data): Promise<any>  {
        return axiosInstance.put(`${API_URL}/change-password/`, data).then(response)
    },
    resendEmailVerification(userId): Promise<boolean> {
        return axiosInstance.post(`${API_URL}/resend-confirmation/`, {userId, app_id: config.APP_ID}).then(success)
    },
    removeUser(userId): Promise<boolean>  {
        return axiosInstance.delete(`${API_URL}/delete-user/${userId}`).then(response)
    },
    getMemberInfo(user_id): Promise<any> {
        return axiosInstance.get(`${API_URL}/getMemberInfo/${user_id}`).then(response)
    },
    addMember(data): Promise<boolean> {
        return axiosInstance.post(`${API_URL}/add-app-member/`, data).then(response)
    }, 
}

