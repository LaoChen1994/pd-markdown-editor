import type { EditorView } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import type { EditorCommand } from "./types";

/** Map of editor commands to their markdown syntax transformations */
const WRAP_COMMANDS: Record<string, { before: string; after: string }> = {
  bold: { before: "**", after: "**" },
  italic: { before: "_", after: "_" },
  strikethrough: { before: "~~", after: "~~" },
  code: { before: "`", after: "`" },
};

const PREFIX_COMMANDS: Record<string, string> = {
  heading1: "# ",
  heading2: "## ",
  heading3: "### ",
  unorderedList: "- ",
  orderedList: "1. ",
  taskList: "- [ ] ",
  quote: "> ",
};

const INSERT_COMMANDS: Record<string, string> = {
  horizontalRule: "\n---\n",
  link: "[link text](url)",
  image: "![alt text](url)",
  codeBlock: "\n```\n\n```\n",
  table: "\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n",
};

/**
 * Execute a markdown editing command on the editor view
 */
export function executeEditorCommand(view: EditorView, command: EditorCommand | string): boolean {
  // Undo/redo
  if (command === "undo") return undo(view);
  if (command === "redo") return redo(view);

  const state = view.state;
  const { from, to } = state.selection.main;
  const selectedText = state.sliceDoc(from, to);

  // Wrap commands (bold, italic, etc.)
  if (command in WRAP_COMMANDS) {
    const { before, after } = WRAP_COMMANDS[command];
    const replacement = selectedText ? `${before}${selectedText}${after}` : `${before}text${after}`;
    view.dispatch({ changes: { from, to, insert: replacement }, selection: { anchor: selectedText ? from + replacement.length : from + before.length, head: selectedText ? from + replacement.length : from + before.length + 4 } });
    view.focus();
    return true;
  }

  // Prefix commands (headings, lists, quotes)
  if (command in PREFIX_COMMANDS) {
    const prefix = PREFIX_COMMANDS[command];
    const line = state.doc.lineAt(from);
    view.dispatch({ changes: { from: line.from, to: line.from, insert: prefix } });
    view.focus();
    return true;
  }

  // Insert commands (hr, link, image, code block, table)
  if (command in INSERT_COMMANDS) {
    const text = INSERT_COMMANDS[command];
    view.dispatch({ changes: { from, to, insert: text } });
    view.focus();
    return true;
  }

  return false;
}

/**
 * Helper: wrap current selection with before/after text
 */
export function wrapSelection(view: EditorView, before: string, after: string): void {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const replacement = `${before}${selectedText || "text"}${after}`;
  view.dispatch({ changes: { from, to, insert: replacement } });
  view.focus();
}

/**
 * Helper: replace current selection
 */
export function replaceSelection(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({ changes: { from, to, insert: text } });
  view.focus();
}

/**
 * Helper: insert text at cursor position
 */
export function insertAtCursor(view: EditorView, text: string): void {
  const pos = view.state.selection.main.head;
  view.dispatch({ changes: { from: pos, insert: text } });
  view.focus();
}

/**
 * Helper: get current selection text
 */
export function getSelection(view: EditorView): string {
  const { from, to } = view.state.selection.main;
  return view.state.sliceDoc(from, to);
}
