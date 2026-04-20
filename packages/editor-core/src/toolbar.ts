import type { ToolbarItem, EditorCommand } from "./types";

/** Default toolbar icon SVGs */
const ICONS: Record<string, string> = {
  bold: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h4.5C10.43 2 12 3.57 12 5.5c0 .87-.32 1.66-.85 2.27A3.49 3.49 0 0 1 12.5 10.5c0 1.93-1.57 3.5-3.5 3.5H4V2zm2 2v3h2.5C9.33 7 10 6.33 10 5.5S9.33 4 8.5 4H6zm0 5v3h3c.83 0 1.5-.67 1.5-1.5S9.83 9 9 9H6z"/></svg>',
  italic: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h6v2h-2.2l-2.6 8H9v2H3v-2h2.2l2.6-8H6V2z"/></svg>',
  strikethrough: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8h12v1H2V8zm3.5-4.5C6.1 2.6 7.2 2 8.5 2 10.4 2 12 3.1 12 4.7c0 .5-.1.9-.4 1.3H9.9c.1-.2.1-.4.1-.6 0-.7-.7-1.4-1.5-1.4-.6 0-1.1.3-1.4.7L5.5 3.5zM6.1 12c.3.4.8.7 1.4.7.8 0 1.5-.6 1.5-1.4 0-.2 0-.4-.1-.6h1.7c.2.4.4.8.4 1.3 0 1.6-1.6 2.7-3.5 2.7-1.3 0-2.4-.6-3-1.5L6.1 12z"/></svg>',
  heading1: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h2v5h4V2h2v12H8V9H4v5H2V2zm10 0h2l2 3v1h-2v8h-2V2z"/></svg>',
  heading2: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h2v5h4V2h2v12H7V9H3v5H1V2zm9 8c0-1.7 1.3-3 3-3s3 1.3 3 3h-2c0-.6-.4-1-1-1s-1 .4-1 1 .4 1 1 1h1v2h-1c-.6 0-1 .4-1 1h4v2h-6v-2c0-1.1.6-2 1.4-2.5-.8-.5-1.4-1.4-1.4-2.5z"/></svg>',
  heading3: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h2v5h3V2h2v12H6V9H3v5H1V2zm9 2h4v2h-2l2 2v1c0 1.1-.9 2-2 2h-2v-2h2l-2-2V4z"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.354 5.354l-.708-.708L7.293 3a3 3 0 1 1 4.243 4.243l-1.647 1.646-.707-.707 1.646-1.647A2 2 0 1 0 7.999 3.71L6.354 5.354zm3.292 5.292l.708.708L8.707 13a3 3 0 1 1-4.243-4.243l1.647-1.646.707.707-1.646 1.647A2 2 0 1 0 8.001 12.29l1.645-1.644zm-1.318-4.975l.707.708-3.682 3.682-.707-.708 3.682-3.682z"/></svg>',
  image: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 10H3l3-4 1.5 2L10 7l3 5zM5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
  unorderedList: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3-1.5h9v1H5v-1zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3-1.5h9v1H5v-1zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3-1.5h9v1H5v-1z"/></svg>',
  orderedList: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3V1h1v3H2V3zm0 5V6h2v1H3v1H2zm0 4v-1h2v-1H2V9h3v3H2v1zm4-9.5h9v1H6v-1zm0 4h9v1H6v-1zm0 4h9v1H6v-1z"/></svg>',
  taskList: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h3v3H2V2zm1 1v1h1V3H3zm4 0h7v1H7V3zM2 7h3v3H2V7zm1 1v1h1V8H3zm4 0h7v1H7V8zM2 12h3v3H2v-3zm1 1v1h1v-1H3zm4 0h7v1H7v-1z"/></svg>',
  quote: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h4v4l-2 4H3l2-4H3V3zm6 0h4v4l-2 4H9l2-4H9V3z"/></svg>',
  code: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.854 4.146L2 8l3.854 3.854.708-.708L3.414 8l3.148-3.146-.708-.708zm4.292 0l-.708.708L12.586 8l-3.148 3.146.708.708L14 8l-3.854-3.854z"/></svg>',
  codeBlock: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.854 3.146L2.707 8.293l3.147 3.147.708-.708L3.828 8l2.734-2.732-.708-.708zM10.146 5.146l-.708.708L12.172 8l-2.734 2.732.708.708L13.293 8.293 10.146 5.146z"/></svg>',
  horizontalRule: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7.5h12v1H2z"/></svg>',
  table: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm1 2v2h4V4H1zm5 0v2h4V4H6zm5 0v2h4V4h-4zM1 7v2h4V7H1zm5 0v2h4V7H6zm5 0v2h4V7h-4zM1 10v3a1 1 0 0 0 1 1h3v-4H1zm5 0v4h4v-4H6zm5 0v4h3a1 1 0 0 0 1-1v-3h-4z"/></svg>',
  undo: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 1-5.2 3H1.05A7 7 0 1 0 8 1v1zM3 6V2H2v5h5V6H3z"/></svg>',
  redo: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 0 5.2 3h1.75A7 7 0 1 1 8 1v1zm5 4V2h1v5H9V6h4z"/></svg>',
};

/** Default toolbar items configuration */
export function getDefaultToolbarItems(): ToolbarItem[] {
  return [
    { command: "bold", label: "Bold", icon: ICONS.bold, shortcut: "Ctrl+B" },
    { command: "italic", label: "Italic", icon: ICONS.italic, shortcut: "Ctrl+I" },
    { command: "strikethrough", label: "Strikethrough", icon: ICONS.strikethrough },
    { command: "divider", label: "", icon: "", divider: true },
    { command: "heading1", label: "Heading 1", icon: ICONS.heading1 },
    { command: "heading2", label: "Heading 2", icon: ICONS.heading2 },
    { command: "heading3", label: "Heading 3", icon: ICONS.heading3 },
    { command: "divider", label: "", icon: "", divider: true },
    { command: "unorderedList", label: "Bullet List", icon: ICONS.unorderedList },
    { command: "orderedList", label: "Numbered List", icon: ICONS.orderedList },
    { command: "taskList", label: "Task List", icon: ICONS.taskList },
    { command: "divider", label: "", icon: "", divider: true },
    { command: "link", label: "Link", icon: ICONS.link, shortcut: "Ctrl+K" },
    { command: "image", label: "Image", icon: ICONS.image },
    { command: "quote", label: "Quote", icon: ICONS.quote },
    { command: "code", label: "Inline Code", icon: ICONS.code },
    { command: "codeBlock", label: "Code Block", icon: ICONS.codeBlock },
    { command: "table", label: "Table", icon: ICONS.table },
    { command: "horizontalRule", label: "Horizontal Rule", icon: ICONS.horizontalRule },
  ];
}

/** Render toolbar DOM element */
export function createToolbarElement(
  items: ToolbarItem[],
  onCommand: (command: EditorCommand | string) => void
): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "pd-editor-toolbar";
  Object.assign(toolbar.style, {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px 8px",
    borderBottom: "1px solid var(--pd-editor-border, #d1d9e0)",
    backgroundColor: "var(--pd-editor-toolbar-bg, #f6f8fa)",
    flexWrap: "wrap",
  });

  for (const item of items) {
    if (item.divider) {
      const divider = document.createElement("div");
      Object.assign(divider.style, { width: "1px", height: "20px", backgroundColor: "var(--pd-editor-border, #d1d9e0)", margin: "0 4px" });
      toolbar.appendChild(divider);
      continue;
    }

    const btn = document.createElement("button");
    btn.className = "pd-editor-toolbar-btn";
    btn.type = "button";
    btn.title = item.shortcut ? `${item.label} (${item.shortcut})` : item.label;
    btn.innerHTML = item.icon;
    Object.assign(btn.style, {
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "28px", height: "28px", border: "none", borderRadius: "4px",
      backgroundColor: "transparent", color: "var(--pd-editor-icon, #636c76)",
      cursor: "pointer", padding: "0", transition: "all 0.15s ease",
    });

    btn.addEventListener("mouseenter", () => { btn.style.backgroundColor = "var(--pd-editor-btn-hover, rgba(0,0,0,0.08))"; });
    btn.addEventListener("mouseleave", () => { btn.style.backgroundColor = "transparent"; });
    btn.addEventListener("click", (e) => { e.preventDefault(); onCommand(item.command); });

    toolbar.appendChild(btn);
  }

  return toolbar;
}
