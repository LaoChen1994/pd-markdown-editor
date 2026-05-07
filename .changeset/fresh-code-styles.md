---
"pd-editor-react": patch
"pd-editor-vue": patch
---

Use the compiled pd-markdown-ui stylesheet entry.

React and Vue adapters now import `pd-markdown-ui/styles.css` so preview components receive the bundled Markdown UI styles without requiring consumers to compile pd-shad-ui Tailwind source styles.
