import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Global navigation guard.
 *
 * Logic:
 *   - If route requires auth AND user is not authenticated → redirect to login
 *   - If user is authenticated AND navigating to /auth/* → redirect to projects
 *     (prevent logged-in users from seeing login page)
 *   - Otherwise → allow navigation
 *
 * Note: This checks the STORE state (cached user object), not the actual token.
 * The Axios interceptor handles actual 401 responses from the API (Phase 2).
 * Both layers work together — the guard gives immediate feedback,
 * the interceptor handles token expiry.
 */
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
