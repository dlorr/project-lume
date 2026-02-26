import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";
import router from "./router";
import "./style.css";

/**
 * QueryClient configuration.
 *
 * staleTime: 1 minute — data is considered fresh for 60s.
 *   Vue Query won't refetch if you navigate back to a page within this window.
 *   Prevents unnecessary API calls on tab switches.
 *
 * retry: 1 — on failure, retry once before showing an error.
 *   Don't retry on 401/403 — those are auth errors, not transient failures.
 *   The Axios interceptor handles 401 separately.
 *
 * refetchOnWindowFocus: false — don't refetch every time the user
 *   switches browser tabs. Annoying UX and unnecessary load on the backend.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin, { queryClient });

app.mount("#app");
