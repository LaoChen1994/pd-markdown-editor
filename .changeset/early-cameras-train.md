---
"pd-editor-core": minor
"pd-editor-react": minor
"pd-editor-vue": minor
---

Improve Markdown editing ergonomics and expose command state for toolbar integrations.

Core now supports Markdown-aware `Enter`, `Tab`, and `Shift+Tab` behavior for list, task, ordered, and quote blocks. Runtime plugins can install and remove CodeMirror extensions after mount, plugin toolbar items refresh automatically, and consumers can query `isActive`, `canExecute`, and `getCommandState` for framework toolbar states.
