import type { EditorPlugin, MarkdownEditorInstance } from "../types";
import type { MarkdownAstNode, MarkdownPosition } from "./ast";
import { getNodeText, parseMarkdown, visitMarkdownAst } from "./ast";

export type MarkdownLintRule =
  | "image-alt"
  | "empty-link"
  | "heading-increment"
  | "duplicate-heading-id";

export interface MarkdownDiagnostic {
  rule: MarkdownLintRule;
  message: string;
  severity: "warning" | "error";
  position?: MarkdownPosition;
}

export interface MarkdownLintPluginOptions {
  /** Enabled rules, default all built-in rules */
  rules?: MarkdownLintRule[];
  /** Called when diagnostics are produced */
  onDiagnostics?: (diagnostics: MarkdownDiagnostic[], editor: MarkdownEditorInstance) => void;
}

const defaultRules: MarkdownLintRule[] = [
  "image-alt",
  "empty-link",
  "heading-increment",
  "duplicate-heading-id",
];

const slugifyHeading = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const lintImageAlt = (node: MarkdownAstNode, diagnostics: MarkdownDiagnostic[]): void => {
  if (node.type !== "image" || (node.alt ?? "").trim().length > 0) return;
  diagnostics.push({
    rule: "image-alt",
    message: "Image should include alt text.",
    severity: "warning",
    position: node.position,
  });
};

const lintEmptyLink = (node: MarkdownAstNode, diagnostics: MarkdownDiagnostic[]): void => {
  if (node.type !== "link" || node.url) return;
  diagnostics.push({
    rule: "empty-link",
    message: "Link should include a URL.",
    severity: "warning",
    position: node.position,
  });
};

const lintHeadingRules = (
  root: MarkdownAstNode,
  rules: Set<MarkdownLintRule>,
  diagnostics: MarkdownDiagnostic[]
): void => {
  let previousDepth = 0;
  const headingIds = new Set<string>();

  visitMarkdownAst(root, (node) => {
    if (node.type !== "heading") return;

    const depth = node.depth ?? 0;
    if (rules.has("heading-increment") && previousDepth > 0 && depth > previousDepth + 1) {
      diagnostics.push({
        rule: "heading-increment",
        message: `Heading level should only increment by one level at a time.`,
        severity: "warning",
        position: node.position,
      });
    }
    previousDepth = depth;

    if (!rules.has("duplicate-heading-id")) return;
    const id = slugifyHeading(getNodeText(node));
    if (!id) return;
    if (headingIds.has(id)) {
      diagnostics.push({
        rule: "duplicate-heading-id",
        message: `Heading id '${id}' is duplicated.`,
        severity: "warning",
        position: node.position,
      });
    }
    headingIds.add(id);
  });
};

export const lintMarkdown = (
  markdown: string,
  options: Pick<MarkdownLintPluginOptions, "rules"> = {}
): MarkdownDiagnostic[] => {
  const rules = new Set(options.rules ?? defaultRules);
  const diagnostics: MarkdownDiagnostic[] = [];
  const root = parseMarkdown(markdown);

  visitMarkdownAst(root, (node) => {
    if (rules.has("image-alt")) lintImageAlt(node, diagnostics);
    if (rules.has("empty-link")) lintEmptyLink(node, diagnostics);
  });
  lintHeadingRules(root, rules, diagnostics);

  return diagnostics;
};

export const markdownLintPlugin = (options: MarkdownLintPluginOptions = {}): EditorPlugin => {
  const notify = (editor: MarkdownEditorInstance): void => {
    options.onDiagnostics?.(lintMarkdown(editor.getValue(), options), editor);
  };

  return {
    name: "markdown-lint",
    install(editor) {
      notify(editor);
    },
    onUpdate({ editor }) {
      notify(editor);
    },
  };
};
