import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types/common.types";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as RetryableRequest;

    const is401 = error.response?.status === 401;
    const isNotRetry = !originalRequest._retry;
    const isNotRefreshEndpoint =
      !originalRequest.url?.includes("/auth/refresh");
    const isNotLoginEndpoint = !originalRequest.url?.includes("/auth/login");

    if (is401 && isNotRetry && isNotRefreshEndpoint && isNotLoginEndpoint) {
      originalRequest._retry = true;

      try {
        await apiClient.post("/auth/refresh");

        return apiClient(originalRequest);
      } catch (error) {
        localStorage.removeItem("auth_user");
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }
    }

    const status = error.response?.status;
    if (status && status >= 500) {
      const { useToast } = await import("@/composables/useToast");
      const toast = useToast();
      toast.error("Server error", "Something went wrong. Please try again.");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
