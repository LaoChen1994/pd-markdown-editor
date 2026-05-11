import type { EditorPlugin, MarkdownEditorInstance } from "../types";
import type { MarkdownPosition } from "./ast";
import { parseMarkdown } from "./ast";

export type FrontmatterValue = string | number | boolean | null;

export interface FrontmatterResult {
  data: Record<string, FrontmatterValue>;
  raw: string;
  body: string;
  position?: MarkdownPosition;
  errors: string[];
}

export interface FrontmatterPluginOptions {
  /** Called when frontmatter is parsed */
  onFrontmatter?: (result: FrontmatterResult, editor: MarkdownEditorInstance) => void;
}

const parseScalar = (value: string): FrontmatterValue => {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
};

export const parseFrontmatter = (markdown: string): FrontmatterResult => {
  const ast = parseMarkdown(markdown);
  const yaml = ast.children?.[0]?.type === "yaml" ? ast.children[0] : null;
  if (!yaml) {
    return { data: {}, raw: "", body: markdown, errors: [] };
  }

  const raw = yaml.value ?? "";
  const data: Record<string, FrontmatterValue> = {};
  const errors: string[] = [];

  for (const [index, line] of raw.split("\n").entries()) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) {
      errors.push(`Invalid frontmatter line ${index + 1}`);
      continue;
    }
    data[match[1]] = parseScalar(match[2] ?? "");
  }

  return {
    data,
    raw,
    body: markdown.slice(yaml.position?.end?.offset ?? 0).replace(/^\n+/, ""),
    position: yaml.position,
    errors,
  };
};

export const frontmatterPlugin = (options: FrontmatterPluginOptions = {}): EditorPlugin => {
  const notify = (editor: MarkdownEditorInstance): void => {
    options.onFrontmatter?.(parseFrontmatter(editor.getValue()), editor);
  };

  return {
    name: "frontmatter",
    install(editor) {
      notify(editor);
    },
    onUpdate({ editor }) {
      notify(editor);
    },
  };
};
