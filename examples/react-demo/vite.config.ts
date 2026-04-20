import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "pd-editor-core": path.resolve(__dirname, "../../packages/editor-core/src/index.ts"),
      "pd-editor-react": path.resolve(__dirname, "../../packages/react/src/index.ts")
    }
  }
});
