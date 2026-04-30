import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    css: false,
  },
});
