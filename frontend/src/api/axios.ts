import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types/common.types";

/**
 * The central Axios instance for the entire application.
 *
 * All API calls go through this instance — never import axios directly
 * in components or stores. This gives us one place to:
 *   - Set the base URL
 *   - Configure credentials (cookies)
 *   - Add request/response interceptors
 *   - Handle token refresh (Phase 2)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Token refresh interceptor.
 *
 * Flow:
 *   1. Any request returns 401
 *   2. Interceptor catches it
 *   3. If not already retrying → call /auth/refresh
 *   4. If refresh succeeds → retry the original request
 *   5. If refresh fails → clear local auth state → redirect to login
 *
 * _retry flag prevents infinite loops:
 *   Without it, the /auth/refresh call itself returning 401
 *   would trigger another refresh attempt → infinite loop.
 *
 * Why not use a queue for concurrent requests?
 *   For an MVP with short-lived access tokens (15min), the chance
 *   of multiple simultaneous requests all hitting 401 at the same
 *   moment is very low. A queue adds significant complexity.
 *   We can add it later if needed.
 */

// Extend AxiosRequestConfig to add our retry flag
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
        // Attempt to get new tokens using the refresh cookie
        await apiClient.post("/auth/refresh");

        // Refresh succeeded — retry the original request
        // New access_token cookie is now set by the browser automatically
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — session is dead
        // Clear local state and redirect to login
        // We import the store lazily here to avoid circular dependency
        // (axios.ts → store → axios.ts)
        const { useAuthStore } = await import("@/stores/auth.store");
        const { getActivePinia } = await import("pinia");

        const pinia = getActivePinia();
        if (pinia) {
          const authStore = useAuthStore(pinia);
          authStore.clearUser();
        }

        // Redirect to login — don't use router to avoid circular dep
        // window.location clears all in-memory state cleanly
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
