import { describe, expect, it } from "vitest";
import { tocPlugin } from "./toc";
import type { MarkdownEditorInstance } from "../types";

function createEditor(value: string): MarkdownEditorInstance {
  return {
    getValue: () => value,
    setValue: () => undefined,
    focus: () => undefined,
    canExecute: () => true,
    getCommandState: () => ({ active: false, enabled: true }),
    isActive: () => false,
    executeCommand: () => undefined,
    setReadOnly: () => undefined,
    use: () => createEditor(value),
    unuse: () => createEditor(value),
    replaceSelection: () => undefined,
    wrapSelection: () => undefined,
    getSelection: () => "",
    insertAtCursor: () => undefined,
  };
}

describe("tocPlugin", () => {
  it("uses parser-generated unique heading ids", () => {
    const container = document.createElement("div");
    const plugin = tocPlugin({ container, maxLevel: 2 });

    plugin.install?.(createEditor("# Same\n\n# Same\n\n### Hidden"));

    const links = [...container.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(links).toEqual(["#same", "#same-1"]);
  });
});
