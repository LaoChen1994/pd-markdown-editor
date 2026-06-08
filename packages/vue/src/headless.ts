export { MarkdownEditor } from "./MarkdownEditor";
export { markdownUiComponents } from "./MarkdownEditor";
export { useMarkdownEditor } from "./useMarkdownEditor";
export type { UseMarkdownEditorOptions, UseMarkdownEditorReturn } from "./useMarkdownEditor";
export { Toolbar } from "./Toolbar";

// Re-export useful types from core
export type {
  CodeBlockInfo,
  CodeHighlightPluginOptions,
  EditorCommand,
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
} from "pd-editor-core";
export {
  codeHighlightPlugin,
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
} from "pd-editor-core";
