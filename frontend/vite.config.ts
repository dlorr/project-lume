import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
    },
  };
});
