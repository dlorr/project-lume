import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "./guards";

/**
 * Route structure:
 *
 * /auth/*          → AuthLayout (centered card, no sidebar)
 * /                → AppLayout (sidebar + topbar)
 *   /projects      → project list
 *   /projects/:id/board → kanban board
 *
 * meta.requiresAuth: true → protected by authGuard
 *
 * Lazy loading with import() means each route's component is only
 * downloaded when the user navigates to it — faster initial load.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth routes — no sidebar
    {
      path: "/auth",
      component: () => import("@/layouts/AuthLayout.vue"),
      children: [
        {
          path: "login",
          name: "login",
          component: () => import("@/features/auth/pages/LoginPage.vue"),
        },
        {
          path: "register",
          name: "register",
          component: () => import("@/features/auth/pages/RegisterPage.vue"),
        },
      ],
    },

    // App routes — with sidebar + topbar
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          redirect: "/projects",
        },
        {
          path: "projects",
          name: "projects",
          component: () => import("@/features/projects/pages/ProjectsPage.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "projects/:projectId/board",
          name: "board",
          component: () => import("@/features/board/pages/BoardPage.vue"),
          meta: { requiresAuth: true },
        },
      ],
    },

    // Catch-all — redirect to projects
    {
      path: "/:pathMatch(.*)*",
      redirect: "/projects",
    },
  ],
});

router.beforeEach(authGuard);

export default router;
