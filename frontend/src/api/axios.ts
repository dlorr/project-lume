import axios, { type AxiosError } from "axios";
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

  // withCredentials: true is CRITICAL for httpOnly cookies.
  // Without this, the browser won't send the access_token or
  // refresh_token cookies with cross-origin requests.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Response interceptor — runs on every response before it reaches calling code.
 *
 * Success path: pass through unchanged.
 * Error path: normalize the error so all callers get the same shape.
 *
 * Phase 2 will add: 401 detection → token refresh → request retry.
 * We scaffold that logic here with a TODO so the interceptor structure
 * is already in place when we need it.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // TODO: Phase 2 — add token refresh logic here
    // if (error.response?.status === 401) { ... }
    return Promise.reject(error);
  },
);

export default apiClient;
