import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Dev-only convenience: proxy /api/* to your ESP32 so the app can run from Vite/Lovable preview.
    // Set VITE_ESP32_PROXY_TARGET to your device base URL, e.g. http://192.168.4.1
    proxy: {
      "/api": {
        target: process.env.VITE_ESP32_PROXY_TARGET || "http://192.168.4.1",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
