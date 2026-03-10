import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types/auth.types";

export const useAuthStore = defineStore("auth", () => {
  const storedUser = localStorage.getItem("auth_user");
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null);

  const isAuthenticated = computed(() => user.value !== null);

  function setUser(newUser: User) {
    user.value = newUser;
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
