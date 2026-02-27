import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/api/modules/auth.api";
import type { LoginPayload, RegisterPayload } from "@/types/auth.types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types/common.types";

/**
 * useAuth composable — owns all authentication actions.
 *
 * Separation of concerns:
 *   authStore  → holds WHO is logged in (state)
 *   useAuth    → handles HOW you log in/out (actions + side effects)
 *   authApi    → makes the HTTP calls (transport)
 *
 * Each page/component that needs auth actions imports this composable.
 * It creates a fresh instance per call — the shared state lives in the
 * Pinia store, not inside this composable.
 */
export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  // Local loading + error state — scoped to this composable instance
  // so LoginPage and RegisterPage each have their own independent state
  const isLoading = ref(false);
  const serverError = ref<string | null>(null);

  /**
   * Extract a readable error message from an Axios error.
   * Backend returns either a string or string[] in message field.
   */
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

      // Redirect to the originally requested page if guard sent us here,
      // otherwise go to projects
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
    } finally {
      authStore.clearUser();
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
