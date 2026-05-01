import type { EditorView } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
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
  table: "\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n",
};

const getSelectedLineRange = (view: EditorView) => {
  const { from, to } = view.state.selection.main;
  const end = to > from ? to - 1 : to;
  return {
    from,
    to,
    startLine: view.state.doc.lineAt(from),
    endLine: view.state.doc.lineAt(end),
  };
};

const splitLines = (text: string): string[] => text.split("\n");

const lineHasText = (line: string): boolean => line.trim().length > 0;

const activePrefixPattern = (command: EditorCommand | string): RegExp | null => {
  if (command === "heading1") return /^(\s*)#\s+/;
  if (command === "heading2") return /^(\s*)##\s+/;
  if (command === "heading3") return /^(\s*)###\s+/;
  if (command === "unorderedList") return /^(\s*)[-*+]\s+/;
  if (command === "orderedList") return /^(\s*)\d+\.\s+/;
  if (command === "taskList") return /^(\s*)[-*+]\s+\[[ xX]\]\s+/;
  if (command === "quote") return /^(\s*)>\s?/;
  return null;
};

const cleanupPrefixPattern = (command: EditorCommand | string): RegExp | null => {
  if (command === "heading1" || command === "heading2" || command === "heading3") return /^(\s*)#{1,6}\s+/;
  if (command === "unorderedList" || command === "orderedList" || command === "taskList") {
    return /^(\s*)(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/;
  }
  if (command === "quote") return /^(\s*)>\s?/;
  return null;
};

const withPrefix = (line: string, prefix: string, command: EditorCommand | string): string => {
  if (!lineHasText(line)) return line;
  const existingPrefix = cleanupPrefixPattern(command);
  const withoutExisting = existingPrefix ? line.replace(existingPrefix, "$1") : line;
  return withoutExisting.replace(/^(\s*)/, `$1${prefix}`);
};

const withoutPrefix = (line: string, command: EditorCommand | string): string => {
  const existingPrefix = activePrefixPattern(command);
  return existingPrefix ? line.replace(existingPrefix, "$1") : line;
};

const toggleLinePrefix = (view: EditorView, command: EditorCommand | string, prefix: string): boolean => {
  const { startLine, endLine } = getSelectedLineRange(view);
  const selectedText = view.state.sliceDoc(startLine.from, endLine.to);
  const lines = splitLines(selectedText);
  const contentLines = lines.filter(lineHasText);
  const existingPrefix = activePrefixPattern(command);
  const shouldRemove = !!existingPrefix && contentLines.length > 0 && contentLines.every((line) => existingPrefix.test(line));
  const updated = lines
    .map((line) => shouldRemove ? withoutPrefix(line, command) : withPrefix(line, prefix, command))
    .join("\n");

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: updated },
    selection: { anchor: startLine.from, head: startLine.from + updated.length },
  });
  view.focus();
  return true;
};

const toggleWrap = (view: EditorView, before: string, after: string): boolean => {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const beforeFrom = Math.max(0, from - before.length);
  const afterTo = Math.min(view.state.doc.length, to + after.length);
  const hasWrapper =
    selectedText.length > 0 &&
    view.state.sliceDoc(beforeFrom, from) === before &&
    view.state.sliceDoc(to, afterTo) === after;

  if (hasWrapper) {
    view.dispatch({
      changes: [
        { from: to, to: afterTo, insert: "" },
        { from: beforeFrom, to: from, insert: "" },
      ],
      selection: { anchor: beforeFrom, head: to - before.length },
    });
    view.focus();
    return true;
  }

  const placeholder = "text";
  const replacement = selectedText ? `${before}${selectedText}${after}` : `${before}${placeholder}${after}`;
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: selectedText
      ? { anchor: from + before.length, head: from + before.length + selectedText.length }
      : { anchor: from + before.length, head: from + before.length + placeholder.length },
  });
  view.focus();
  return true;
};

const insertLink = (view: EditorView, image = false): boolean => {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const label = selectedText || (image ? "alt text" : "link text");
  const replacement = image ? `![${label}](url)` : `[${label}](url)`;
  const urlStart = from + replacement.length - 4;

  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: urlStart, head: urlStart + 3 },
  });
  view.focus();
  return true;
};

const insertCodeBlock = (view: EditorView): boolean => {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const body = selectedText || "";
  const replacement = selectedText ? `\n\`\`\`\n${body}\n\`\`\`\n` : "\n```\n\n```\n";
  const cursor = selectedText ? from + replacement.length : from + 5;

  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: cursor },
  });
  view.focus();
  return true;
};

const lineSupportsMarkdownIndent = (text: string): boolean =>
  /^(\s*)(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+|>\s?)/.test(text);

const canChangeDocument = (view: EditorView): boolean => !view.state.facet(EditorState.readOnly);

export const continueMarkdownBlock = (view: EditorView): boolean => {
  if (!canChangeDocument(view)) return false;

  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const line = view.state.doc.lineAt(selection.from);
  const beforeCursor = view.state.sliceDoc(line.from, selection.from);
  const task = beforeCursor.match(/^(\s*)([-*+])\s+\[[ xX]\]\s+(.*)$/);
  const ordered = beforeCursor.match(/^(\s*)(\d+)\.\s+(.*)$/);
  const bullet = beforeCursor.match(/^(\s*)([-*+])\s+(.*)$/);
  const quote = beforeCursor.match(/^(\s*)>\s?(.*)$/);
  const marker = task
    ? { indent: task[1], marker: `${task[2]} [ ] `, content: task[3] }
    : ordered
      ? { indent: ordered[1], marker: `${Number.parseInt(ordered[2], 10) + 1}. `, content: ordered[3] }
      : bullet
        ? { indent: bullet[1], marker: `${bullet[2]} `, content: bullet[3] }
        : quote
          ? { indent: quote[1], marker: "> ", content: quote[2] }
          : null;
  if (!marker || selection.from !== line.to) return false;

  if (marker.content.trim().length === 0) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: marker.indent },
      selection: { anchor: line.from + marker.indent.length },
    });
    return true;
  }

  view.dispatch({
    changes: { from: selection.from, insert: `\n${marker.indent}${marker.marker}` },
  });
  return true;
};

export const indentMarkdownBlock = (view: EditorView): boolean => {
  if (!canChangeDocument(view)) return false;

  const { startLine, endLine } = getSelectedLineRange(view);
  const selectedText = view.state.sliceDoc(startLine.from, endLine.to);
  const lines = splitLines(selectedText);
  if (!lines.some(lineSupportsMarkdownIndent)) return false;

  const updated = lines
    .map((line) => lineSupportsMarkdownIndent(line) ? `  ${line}` : line)
    .join("\n");

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: updated },
    selection: { anchor: startLine.from, head: startLine.from + updated.length },
  });
  return true;
};

export const outdentMarkdownBlock = (view: EditorView): boolean => {
  if (!canChangeDocument(view)) return false;

  const { startLine, endLine } = getSelectedLineRange(view);
  const selectedText = view.state.sliceDoc(startLine.from, endLine.to);
  const lines = splitLines(selectedText);
  if (!lines.some((line) => /^\s{1,2}(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+|>\s?)/.test(line))) {
    return false;
  }

  const updated = lines
    .map((line) => line.replace(/^ {1,2}(?=(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+|>\s?))/, ""))
    .join("\n");

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: updated },
    selection: { anchor: startLine.from, head: startLine.from + updated.length },
  });
  return true;
};

export const canExecuteEditorCommand = (view: EditorView, command: EditorCommand | string): boolean => {
  void command;
  return canChangeDocument(view);
};

export const isEditorCommandActive = (view: EditorView, command: EditorCommand | string): boolean => {
  const { from, to } = view.state.selection.main;

  if (command in WRAP_COMMANDS) {
    const { before, after } = WRAP_COMMANDS[command];
    const beforeFrom = Math.max(0, from - before.length);
    const afterTo = Math.min(view.state.doc.length, to + after.length);
    return view.state.sliceDoc(beforeFrom, from) === before && view.state.sliceDoc(to, afterTo) === after;
  }

  const prefixPattern = activePrefixPattern(command);
  if (!prefixPattern) return false;

  const line = view.state.doc.lineAt(from);
  return prefixPattern.test(line.text);
};

export const getEditorCommandState = (view: EditorView, command: EditorCommand | string) => ({
  active: isEditorCommandActive(view, command),
  enabled: canExecuteEditorCommand(view, command),
});

/**
 * Execute a markdown editing command on the editor view
 */
export function executeEditorCommand(view: EditorView, command: EditorCommand | string): boolean {
  if (!canChangeDocument(view)) return false;

  // Undo/redo
  if (command === "undo") return undo(view);
  if (command === "redo") return redo(view);

  const state = view.state;
  const { from, to } = state.selection.main;
  // Wrap commands (bold, italic, etc.)
  if (command in WRAP_COMMANDS) {
    const { before, after } = WRAP_COMMANDS[command];
    return toggleWrap(view, before, after);
  }

  // Prefix commands (headings, lists, quotes)
  if (command in PREFIX_COMMANDS) {
    return toggleLinePrefix(view, command, PREFIX_COMMANDS[command]);
  }

  if (command === "link") {
    return insertLink(view);
  }

  if (command === "image") {
    return insertLink(view, true);
  }

  if (command === "codeBlock") {
    return insertCodeBlock(view);
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
  if (!canChangeDocument(view)) return;

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
  if (!canChangeDocument(view)) return;

  const { from, to } = view.state.selection.main;
  view.dispatch({ changes: { from, to, insert: text } });
  view.focus();
}

/**
 * Helper: insert text at cursor position
 */
export function insertAtCursor(view: EditorView, text: string): void {
  if (!canChangeDocument(view)) return;

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
