import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { baseURL } from "./src/config/url";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: env.VITE_BASE_PATH,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 8080,
      open: true,
      proxy: {
        "/api": {
          target: baseURL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      outDir: "docs",
      rollupOptions: {
        output: {
          entryFileNames: "js/[name].js",
          chunkFileNames: "js/[name]-[hash].js",
          assetFileNames: ({ names }) => {
            for (let itm of names) {
              if (/\.css$/.test(itm)) {
                return "css/[name]-[hash][extname]";
              }
              if (/\.(jpg|jpeg|webp|png|svg|gif|ico)$/.test(itm)) {
                return "images/[name]-[hash][extname]";
              }
              if (/\.(ttf|otf|woff|woff2|eot)$/.test(itm)) {
                return "fonts/[name]-[hash][extname]";
              }
              return "[name]-[hash][extname]";
            }
          },
        },
      },
    },
  };
});
