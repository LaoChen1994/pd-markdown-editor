import type { EditorPlugin } from "../types";

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

function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\u4e00-\u9fff-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    toc.push({ level, text, id });
  }
  return toc;
}

export function tocPlugin(options: TocPluginOptions = {}): EditorPlugin {
  const { maxLevel = 3 } = options;
  let tocContainer: HTMLElement | null = options.container ?? null;

  function renderToc(items: TocItem[]): void {
    if (!tocContainer) return;
    const filtered = items.filter(i => i.level <= maxLevel);
    tocContainer.innerHTML = `
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#656d76;margin-bottom:12px;">目录</div>
      <ul style="list-style:none;padding:0;margin:0;">
        ${filtered.map(item => `
          <li><a href="#${item.id}" data-id="${item.id}" style="display:block;padding:4px ${8 + (item.level - 1) * 12}px;color:#656d76;text-decoration:none;font-size:13px;border-radius:4px;">${item.text}</a></li>
        `).join("")}
      </ul>
    `;
  }

  return {
    name: "toc",

    install(editor) {
      if (!tocContainer) {
        tocContainer = document.createElement("div");
        tocContainer.className = "pd-editor-toc";
        Object.assign(tocContainer.style, { width: "200px", flexShrink: "0", padding: "16px", overflow: "auto", borderLeft: "1px solid #d1d9e0" });
      }
      const toc = extractToc(editor.getValue());
      renderToc(toc);
    },

    onUpdate({ value }) {
      const toc = extractToc(value);
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
