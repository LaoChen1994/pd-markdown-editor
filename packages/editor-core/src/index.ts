// Core
export { MarkdownEditor } from "./editor";

// Types
export type {
  EditorCommand,
  EditorCommandState,
  ToolbarItem,
  EditorPlugin,
  ToolbarContext,
  MarkdownEditorInstance,
  MarkdownEditorOptions,
  Extension,
} from "./types";

// Commands
export {
  canExecuteEditorCommand,
  continueMarkdownBlock,
  executeEditorCommand,
  getEditorCommandState,
  getSelection,
  indentMarkdownBlock,
  insertAtCursor,
  isEditorCommandActive,
  outdentMarkdownBlock,
  replaceSelection,
  wrapSelection,
} from "./commands";

// Toolbar
export { getDefaultToolbarItems, createToolbarElement } from "./toolbar";

// Themes
export { createLightTheme, createDarkTheme } from "./themes";

// Extensions
export { createDefaultExtensions } from "./extensions/default";

// Plugins
export { PluginManager } from "./plugins";
export { imageUploadPlugin } from "./plugins/image-upload";
export type { ImageUploadPluginOptions } from "./plugins/image-upload";
export { tocPlugin } from "./plugins/toc";
export type { TocPluginOptions, TocItem } from "./plugins/toc";
