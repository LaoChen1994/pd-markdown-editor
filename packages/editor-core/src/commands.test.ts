import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { executeEditorCommand, wrapSelection } from "./commands";

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
});

