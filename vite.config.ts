import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "site"),
  base: "/products/flow/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(projectRoot, "products/flow"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
