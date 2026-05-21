import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/pd-markdown-editor/",
  plugins: [react()],
});
