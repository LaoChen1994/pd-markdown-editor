export { MarkdownEditorComponent as MarkdownEditor } from "./MarkdownEditor";
export { markdownUiComponents } from "./MarkdownEditor";
export type { MarkdownEditorHandle, MarkdownEditorProps } from "./MarkdownEditor";
export { useMarkdownEditor } from "./useMarkdownEditor";
export type { UseMarkdownEditorOptions, UseMarkdownEditorReturn } from "./useMarkdownEditor";
export { Toolbar } from "./Toolbar";
export type { ToolbarProps } from "./Toolbar";

// Re-export useful types from core
export type {
  CodeBlockInfo,
  CodeHighlightPluginOptions,
  EditorCommand,
  EditorLabels,
  EditorPlugin,
  FrontmatterPluginOptions,
  FrontmatterResult,
  MarkdownDiagnostic,
  MarkdownLintPluginOptions,
  MarkdownLintRule,
  MathExpression,
  MathPluginOptions,
  MermaidDiagram,
  MermaidPluginOptions,
  ToolbarItem,
  ImageUploadContext,
  ImageUploadPluginOptions,
  ImageUploadStatus,
  ImageUploadUpdate,
} from "pd-editor-core";
export {
  codeHighlightPlugin,
  copyHtml,
  copyMarkdown,
  createMermaidElement,
  extractCodeBlocks,
  extractMathExpressions,
  extractMermaidDiagrams,
  frontmatterPlugin,
  imageUploadPlugin,
  lintMarkdown,
  markdownLintPlugin,
  mathPlugin,
  mermaidPlugin,
  parseFrontmatter,
  tocPlugin,
  downloadMarkdown,
} from "pd-editor-core";
