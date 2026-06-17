import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 중 /api 와 /media 는 백엔드(4000)로 프록시
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/media": "http://localhost:4000",
    },
  },
});
