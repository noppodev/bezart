import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "site"),
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(__dirname, "."),
    emptyOutDir: false,
    assetsDir: "assets/flow",
  },
});
