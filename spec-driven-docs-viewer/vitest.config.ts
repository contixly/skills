import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["tests/client/**/*.test.tsx", "jsdom"],
      ["tests/server/**/*.test.ts", "node"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
