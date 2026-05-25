---
"pd-editor-core": patch
"pd-editor-react": patch
"pd-editor-vue": patch
---

Prevent controlled React and Vue value sync from emitting editor change callbacks, align Vue preview with React by omitting raw HTML nodes, and render TOC heading text through DOM text nodes instead of HTML strings.
