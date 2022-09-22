import { axiosInstance } from "../interceptor/axiosInstance";

const API_URL = `transaction`;

const response = (response) => response.data;
export const TransactionService = {
  getTransaction(id) {
    return axiosInstance.get(`${API_URL}/${id}`).then(response);
  },
};
