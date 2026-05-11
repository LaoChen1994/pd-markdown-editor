import { createParser } from "pd-markdown/parser";

export interface MarkdownPosition {
  start?: {
    line?: number;
    column?: number;
    offset?: number;
  };
  end?: {
    line?: number;
    column?: number;
    offset?: number;
  };
}

export interface MarkdownAstNode {
  type: string;
  value?: string;
  lang?: string | null;
  meta?: string | null;
  depth?: number;
  url?: string;
  alt?: string | null;
  children?: MarkdownAstNode[];
  position?: MarkdownPosition;
  data?: {
    id?: unknown;
  };
}

export const parseMarkdown = (markdown: string): MarkdownAstNode =>
  createParser().parse(markdown) as unknown as MarkdownAstNode;

export const visitMarkdownAst = (
  node: MarkdownAstNode,
  visitor: (node: MarkdownAstNode) => void
): void => {
  visitor(node);
  for (const child of node.children ?? []) {
    visitMarkdownAst(child, visitor);
  }
};

export const getNodeText = (node: MarkdownAstNode): string => {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(getNodeText).join("");
};
