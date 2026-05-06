---
"pd-editor-core": patch
"pd-editor-react": patch
"pd-editor-vue": patch
---

Fix single-line selection visibility in the editor.

The active line highlight now uses a translucent background so it no longer hides selection backgrounds on the current line, including Markdown list lines such as `- item`.
