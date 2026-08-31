// Core
export { MarkdownEditor } from "./editor";

// Types
export type {
  EditorCommand,
  EditorCommandState,
  EditorLabels,
  EditorMessageKey,
  EditorMessages,
  ToolbarItem,
  EditorPlugin,
  ToolbarContext,
  MarkdownEditorInstance,
  MarkdownEditorOptions,
  MarkdownCodeLanguages,
  Extension,
} from "./types";

export { enUS, zhCN } from "./messages";

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

// Export
export { copyHtml, copyMarkdown, downloadMarkdown } from "./export";

// Themes
export { createLightTheme, createDarkTheme } from "./themes";

// Extensions
export { createDefaultExtensions } from "./extensions/default";

// Plugins
export { PluginManager } from "./plugins";
export { codeHighlightPlugin, extractCodeBlocks } from "./plugins/code-highlight";
export type { CodeBlockInfo, CodeHighlightPluginOptions } from "./plugins/code-highlight";
export { frontmatterPlugin, parseFrontmatter } from "./plugins/frontmatter";
export type { FrontmatterPluginOptions, FrontmatterResult, FrontmatterValue } from "./plugins/frontmatter";
export { imageUploadPlugin } from "./plugins/image-upload";
export type {
  ImageUploadContext,
  ImageUploadPluginOptions,
  ImageUploadStatus,
  ImageUploadUpdate,
} from "./plugins/image-upload";
export { markdownLintPlugin, lintMarkdown } from "./plugins/markdown-lint";
export type { MarkdownDiagnostic, MarkdownLintPluginOptions, MarkdownLintRule } from "./plugins/markdown-lint";
export { mathPlugin, extractMathExpressions } from "./plugins/math";
export type { MathExpression, MathPluginOptions } from "./plugins/math";
export { mermaidPlugin, extractMermaidDiagrams, createMermaidElement } from "./plugins/mermaid";
export type { MermaidDiagram, MermaidPluginOptions } from "./plugins/mermaid";
export { tocPlugin } from "./plugins/toc";
export type { TocPluginOptions, TocItem } from "./plugins/toc";
