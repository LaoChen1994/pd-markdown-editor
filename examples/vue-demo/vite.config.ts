import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "pd-editor-core": path.resolve(__dirname, "../../packages/editor-core/src/index.ts"),
      "pd-editor-vue": path.resolve(__dirname, "../../packages/vue/src/index.ts")
    }
  }
});
