import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = (env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

  const apiUrlPlugin = {
    name: "devx-api-url-rewrite",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("/src/") || !/\.(js|jsx|ts|tsx)$/.test(id)) {
        return null;
      }

      return code
        .replace(/http:\/\/localhost:5000/g, apiBaseUrl)
        .replace(/(["'`])\/api\//g, `$1${apiBaseUrl}/api/`);
    },
  };

  return {
    plugins: [apiUrlPlugin, react()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
