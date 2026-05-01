import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  canExecuteEditorCommand,
  continueMarkdownBlock,
  executeEditorCommand,
  getEditorCommandState,
  indentMarkdownBlock,
  isEditorCommandActive,
  outdentMarkdownBlock,
  wrapSelection,
} from "./commands";

function createView(doc: string, from = 0, to = from): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor: from, head: to },
    }),
    parent,
  });
}

describe("editor commands", () => {
  it("wraps selected text with markdown syntax", () => {
    const view = createView("hello", 0, 5);

    executeEditorCommand(view, "bold");

    expect(view.state.doc.toString()).toBe("**hello**");
    view.destroy();
  });

  it("inserts default wrapped text when selection is empty", () => {
    const view = createView("", 0);

    wrapSelection(view, "`", "`");

    expect(view.state.doc.toString()).toBe("`text`");
    view.destroy();
  });

  it("prefixes the current line", () => {
    const view = createView("title", 0);

    executeEditorCommand(view, "heading2");

    expect(view.state.doc.toString()).toBe("## title");
    view.destroy();
  });

  it("toggles an existing heading prefix", () => {
    const view = createView("## title", 3, 8);

    executeEditorCommand(view, "heading2");

    expect(view.state.doc.toString()).toBe("title");
    view.destroy();
  });

  it("switches heading levels instead of removing different heading levels", () => {
    const view = createView("# title", 0);

    executeEditorCommand(view, "heading2");

    expect(view.state.doc.toString()).toBe("## title");
    view.destroy();
  });

  it("prefixes and toggles multiple selected lines", () => {
    const view = createView("one\ntwo", 0, 7);

    executeEditorCommand(view, "unorderedList");
    expect(view.state.doc.toString()).toBe("- one\n- two");

    executeEditorCommand(view, "unorderedList");
    expect(view.state.doc.toString()).toBe("one\ntwo");
    view.destroy();
  });

  it("converts existing list markers when applying task lists", () => {
    const view = createView("- one\n- two", 0, 11);

    executeEditorCommand(view, "taskList");

    expect(view.state.doc.toString()).toBe("- [ ] one\n- [ ] two");
    view.destroy();
  });

  it("uses selected text as link label and selects the URL placeholder", () => {
    const view = createView("docs", 0, 4);

    executeEditorCommand(view, "link");

    expect(view.state.doc.toString()).toBe("[docs](url)");
    expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toBe("url");
    view.destroy();
  });

  it("wraps selected text in a fenced code block", () => {
    const view = createView("const value = 1;", 0, 16);

    executeEditorCommand(view, "codeBlock");

    expect(view.state.doc.toString()).toBe("\n```\nconst value = 1;\n```\n");
    view.destroy();
  });

  it("continues unordered list items on enter", () => {
    const view = createView("- one", 5);

    expect(continueMarkdownBlock(view)).toBe(true);

    expect(view.state.doc.toString()).toBe("- one\n- ");
    view.destroy();
  });

  it("continues ordered lists with the next number", () => {
    const view = createView("3. one", 6);

    expect(continueMarkdownBlock(view)).toBe(true);

    expect(view.state.doc.toString()).toBe("3. one\n4. ");
    view.destroy();
  });

  it("removes an empty list marker on enter", () => {
    const view = createView("- ", 2);

    expect(continueMarkdownBlock(view)).toBe(true);

    expect(view.state.doc.toString()).toBe("");
    expect(view.state.selection.main.from).toBe(0);
    view.destroy();
  });

  it("indents and outdents selected markdown block lines", () => {
    const view = createView("- one\n- two", 0, 11);

    expect(indentMarkdownBlock(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("  - one\n  - two");

    expect(outdentMarkdownBlock(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("- one\n- two");
    view.destroy();
  });

  it("reports active command state for selected markdown", () => {
    const view = createView("**hello**", 2, 7);

    expect(isEditorCommandActive(view, "bold")).toBe(true);
    expect(getEditorCommandState(view, "bold")).toEqual({ active: true, enabled: true });

    view.destroy();
  });

  it("disables command execution in read-only editors", () => {
    const parent = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc: "hello",
        selection: { anchor: 0, head: 5 },
        extensions: [EditorState.readOnly.of(true)],
      }),
      parent,
    });

    expect(canExecuteEditorCommand(view, "bold")).toBe(false);
    expect(executeEditorCommand(view, "bold")).toBe(false);
    expect(view.state.doc.toString()).toBe("hello");

    view.destroy();
  });

  it("does not continue or indent markdown blocks in read-only editors", () => {
    const parent = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc: "- one",
        selection: { anchor: 5 },
        extensions: [EditorState.readOnly.of(true)],
      }),
      parent,
    });

    expect(continueMarkdownBlock(view)).toBe(false);
    expect(indentMarkdownBlock(view)).toBe(false);
    expect(outdentMarkdownBlock(view)).toBe(false);
    expect(view.state.doc.toString()).toBe("- one");

    view.destroy();
  });
});
