import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { manifestPlugin } from "./manifest-plugin.ts";

export default defineConfig(({ mode }) => ({
  base: "./",
  oxc: { jsx: { runtime: "automatic" } },
  plugins: [tailwindcss(), manifestPlugin(mode)],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: { popup: path.resolve(import.meta.dirname, "popup.html") } },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: { VITE_API_BASE: "https://guestbook.test" },
  },
}));
