import { defineConfig } from "tsup";

const external = ["vue", "pd-editor-core", "pd-markdown", "pd-markdown/parser", "pd-markdown-ui", "pd-markdown-ui/vue", "pd-shad-ui", "pd-shad-ui/styles.css", "katex/dist/katex.min.css"];

export default defineConfig([
  {
    entry: ["src/index.ts", "src/headless.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    external,
  },
  {
    entry: ["src/styles.css"],
    format: ["esm"],
    dts: false,
    clean: false,
    sourcemap: true,
    splitting: false,
    external,
  },
]);
