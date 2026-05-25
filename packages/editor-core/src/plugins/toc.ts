import { createParser } from "pd-markdown/parser";
import type { EditorPlugin } from "../types";

/** TOC item extracted from headings */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface TocPluginOptions {
  /** Container element for TOC, auto-created if not provided */
  container?: HTMLElement;
  /** Max heading level, default 3 */
  maxLevel?: number;
}

/**
 * Extract text content from a heading AST node's children
 */
function extractHeadingText(children: { type: string; value?: string; children?: { type: string; value?: string; children?: unknown[] }[] }[]): string {
  return children
    .map((child) => {
      if (child.type === "text") return child.value ?? "";
      if (child.type === "inlineCode") return child.value ?? "";
      if (Array.isArray(child.children)) {
        return extractHeadingText(child.children as { type: string; value?: string; children?: { type: string; value?: string; children?: unknown[] }[] }[]);
      }
      return "";
    })
    .join("");
}

/**
 * Extract TOC items from markdown source using pd-markdown/parser
 */
function extractTocFromMarkdown(markdown: string, maxLevel: number): TocItem[] {
  const parser = createParser();
  const ast = parser.parse(markdown);
  const items: TocItem[] = [];

  // Walk top-level children of the root AST
  for (const node of ast.children) {
    if (node.type === "heading") {
      const heading = node as unknown as {
        depth: number;
        children: { type: string; value?: string; children?: { type: string; value?: string; children?: unknown[] }[] }[];
        data?: { id?: unknown };
      };
      if (heading.depth <= maxLevel) {
        const text = extractHeadingText(heading.children);
        if (text && typeof heading.data?.id === "string") {
          items.push({
            level: heading.depth,
            text,
            id: heading.data.id,
          });
        }
      }
    }
  }

  return items;
}

export function tocPlugin(options: TocPluginOptions = {}): EditorPlugin {
  const { maxLevel = 3 } = options;
  let tocContainer: HTMLElement | null = options.container ?? null;

  function renderToc(items: TocItem[]): void {
    if (!tocContainer) return;
    tocContainer.replaceChildren();

    const title = document.createElement("div");
    title.textContent = "目录";
    Object.assign(title.style, {
      fontWeight: "600",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#656d76",
      marginBottom: "12px",
    });
    tocContainer.appendChild(title);

    const list = document.createElement("ul");
    Object.assign(list.style, {
      listStyle: "none",
      padding: "0",
      margin: "0",
    });

    for (const item of items) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${item.id}`;
      link.dataset.id = item.id;
      link.textContent = item.text;
      Object.assign(link.style, {
        display: "block",
        padding: `4px ${8 + (item.level - 1) * 12}px`,
        color: "#656d76",
        textDecoration: "none",
        fontSize: "13px",
        borderRadius: "4px",
      });
      listItem.appendChild(link);
      list.appendChild(listItem);
    }

    tocContainer.appendChild(list);
  }

  return {
    name: "toc",

    install(editor) {
      if (!tocContainer) {
        tocContainer = document.createElement("div");
        tocContainer.className = "pd-editor-toc";
        Object.assign(tocContainer.style, { width: "200px", flexShrink: "0", padding: "16px", overflow: "auto", borderLeft: "1px solid #d1d9e0" });
      }
      // Initial render
      const toc = extractTocFromMarkdown(editor.getValue(), maxLevel);
      renderToc(toc);
    },

    onUpdate({ value }) {
      const toc = extractTocFromMarkdown(value, maxLevel);
      renderToc(toc);
    },

    destroy() {
      if (tocContainer && !options.container) {
        tocContainer.remove();
      }
      tocContainer = null;
    },
  };
}
