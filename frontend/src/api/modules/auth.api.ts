import apiClient from "../axios";
import type { User, LoginPayload, RegisterPayload } from "@/types/auth.types";

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<User>("/auth/register", payload),

  login: (payload: LoginPayload) =>
    apiClient.post<User>("/auth/login", payload),

  refresh: () => apiClient.post<{ message: string }>("/auth/refresh"),

  logout: () => apiClient.post<{ message: string }>("/auth/logout"),
};
