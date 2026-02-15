import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    allowedHosts: [
      "calculate-sum-baking-adopted.trycloudflare.com",
      ".trycloudflare.com" // 모든 Cloudflare Tunnel 도메인 허용
    ],
    // 또는 모든 호스트 허용 (개발 환경에서만)
    // allowedHosts: "all"
  },
});