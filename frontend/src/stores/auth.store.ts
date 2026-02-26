import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types/auth.types";

/**
 * Auth store — owns the client-side auth state.
 *
 * What lives here:
 *   - The current authenticated user object
 *   - isAuthenticated computed flag
 *
 * What does NOT live here:
 *   - Tokens — those are httpOnly cookies managed by the browser
 *   - API calls — those are in authApi and called from useAuth composable
 *
 * Persistence strategy:
 *   We store the user object in localStorage as a cache.
 *   On app load, we read from localStorage and then verify with the backend.
 *   If verification fails (token expired), we clear the store.
 *   This prevents the flash of "logged out" state on page refresh.
 */
export const useAuthStore = defineStore("auth", () => {
  // Hydrate from localStorage on store initialization
  const storedUser = localStorage.getItem("auth_user");
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null);

  const isAuthenticated = computed(() => user.value !== null);

  function setUser(newUser: User) {
    user.value = newUser;
    // Persist to localStorage — NOT the token, just the public user data
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  }

  function clearUser() {
    user.value = null;
    localStorage.removeItem("auth_user");
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
  };
});
