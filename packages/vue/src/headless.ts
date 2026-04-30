export { MarkdownEditor } from "./MarkdownEditor";
export { useMarkdownEditor } from "./useMarkdownEditor";
export type { UseMarkdownEditorOptions, UseMarkdownEditorReturn } from "./useMarkdownEditor";
export { Toolbar } from "./Toolbar";

// Re-export useful types from core
export type { EditorCommand, EditorPlugin, ToolbarItem } from "pd-editor-core";
export { imageUploadPlugin, tocPlugin } from "pd-editor-core";

// Re-export pd-markdown-ui/vue components for custom rendering
export { components as markdownUiComponents } from "pd-markdown-ui/vue";

