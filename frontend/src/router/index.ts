import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "./guards";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
        },
        {
          path: "projects/:projectId/board",
          name: "board",
          component: () => import("@/features/board/pages/BoardPage.vue"),
        },
        {
          path: "projects/:projectId/settings",
          name: "project-settings",
          component: () =>
            import("@/features/projects/pages/ProjectSettingsPage.vue"),
        },
        {
          path: "projects/:projectId/members",
          name: "project-members",
          component: () => import("@/features/members/pages/MembersPage.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/NotFoundPage.vue"),
    },
  ],
});

router.beforeEach(authGuard);

export default router;
