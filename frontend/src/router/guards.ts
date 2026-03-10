import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isAuthRoute = to.path.startsWith("/auth");

  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "login", query: { redirect: to.fullPath } });
  }

  if (isAuthRoute && authStore.isAuthenticated) {
    return next({ name: "projects" });
  }

  return next();
}
