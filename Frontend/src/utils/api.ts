import axios from "axios";
import { Toast } from "../Components/Toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;

    if (
      error.response?.status === 403 &&
      message === "Access denied: Your IP is not allowed."
    ) {
      Toast.fire({
        icon: "error",
        title: message || "Access denied: Your IP is not allowed.",
      });
    } else if (error.response?.status >= 400) {
      Toast.fire({
        icon: "error",
        title: message || "Something went wrong",
      });
    }

    return Promise.reject(error);
  }
);

export default api;
