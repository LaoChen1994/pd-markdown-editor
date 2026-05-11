import type { EditorPlugin, MarkdownEditorInstance } from "../types";
import type { MarkdownPosition } from "./ast";
import { parseMarkdown, visitMarkdownAst } from "./ast";

export interface CodeBlockInfo {
  language: string;
  value: string;
  meta?: string;
  className: string;
  position?: MarkdownPosition;
}

export interface CodeHighlightPluginOptions {
  /** CSS class prefix, default 'language-' */
  classPrefix?: string;
  /** Language used when a code block has no language, default 'text' */
  defaultLanguage?: string;
  /** Languages handled by other plugins, default ['mermaid'] */
  excludeLanguages?: string[];
  /** Called when code blocks are collected */
  onCodeBlocks?: (blocks: CodeBlockInfo[], editor: MarkdownEditorInstance) => void;
}

export const extractCodeBlocks = (
  markdown: string,
  options: Pick<CodeHighlightPluginOptions, "classPrefix" | "defaultLanguage" | "excludeLanguages"> = {}
): CodeBlockInfo[] => {
  const classPrefix = options.classPrefix ?? "language-";
  const defaultLanguage = options.defaultLanguage ?? "text";
  const excluded = new Set((options.excludeLanguages ?? ["mermaid"]).map((language) => language.toLowerCase()));
  const blocks: CodeBlockInfo[] = [];

  visitMarkdownAst(parseMarkdown(markdown), (node) => {
    if (node.type !== "code") return;

    const language = (node.lang ?? defaultLanguage).trim() || defaultLanguage;
    if (excluded.has(language.toLowerCase())) return;

    blocks.push({
      language,
      value: node.value ?? "",
      meta: node.meta ?? undefined,
      className: `${classPrefix}${language}`,
      position: node.position,
    });
  });

  return blocks;
};

export const codeHighlightPlugin = (options: CodeHighlightPluginOptions = {}): EditorPlugin => {
  const notify = (editor: MarkdownEditorInstance): void => {
    options.onCodeBlocks?.(extractCodeBlocks(editor.getValue(), options), editor);
  };

  return {
    name: "code-highlight",
    install(editor) {
      notify(editor);
    },
    onUpdate({ editor }) {
      notify(editor);
    },
  };
};
