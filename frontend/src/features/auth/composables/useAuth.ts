import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/api/modules/auth.api";
import type { LoginPayload, RegisterPayload } from "@/types/auth.types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types/common.types";
import { useToast } from "@/composables/useToast";

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const isLoading = ref(false);
  const serverError = ref<string | null>(null);

  function extractError(error: unknown): string {
    const axiosError = error as AxiosError<ApiError>;
    const message = axiosError.response?.data?.message;

    if (!message) return "Something went wrong. Please try again.";
    if (Array.isArray(message))
      return message[0] ?? "Something went wrong. Please try again.";
    return message;
  }

  async function login(payload: LoginPayload) {
    isLoading.value = true;
    serverError.value = null;

    try {
      const { data } = await authApi.login(payload);
      authStore.setUser(data);
      toast.success(`Welcome back, ${data.firstName}!`);

      const redirect = router.currentRoute.value.query.redirect as string;
      await router.push(redirect ?? { name: "projects" });
    } catch (error) {
      serverError.value = extractError(error);
    } finally {
      isLoading.value = false;
    }
  }

  async function register(payload: RegisterPayload) {
    isLoading.value = true;
    serverError.value = null;

    try {
      const { data } = await authApi.register(payload);
      authStore.setUser(data);
      toast.success(
        `Account created!`,
        `Welcome to Project Lume, ${data.firstName}.`,
      );
      await router.push({ name: "projects" });
    } catch (error) {
      serverError.value = extractError(error);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
      toast.success("Signed out successfully");
    } finally {
      authStore.clearUser();
      queryClient.clear();
      await router.push({ name: "login" });
    }
  }

  return {
    isLoading,
    serverError,
    login,
    register,
    logout,
  };
}
