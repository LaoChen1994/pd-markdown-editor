import { describe, expect, it } from "vitest";
import { tocPlugin } from "./toc";
import type { MarkdownEditorInstance } from "../types";
import { MarkdownEditor } from "../editor";

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
  it("mounts and removes the default TOC inside the editor", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "# First",
      plugins: [tocPlugin()],
    });

    const toc = parent.querySelector(".pd-editor-content > .pd-editor-toc");
    expect(toc?.querySelector("a")?.textContent).toBe("First");

    editor.destroy();
    expect(parent.querySelector(".pd-editor-toc")).toBeNull();
  });

  it("uses parser-generated unique heading ids", () => {
    const container = document.createElement("div");
    const plugin = tocPlugin({ container, maxLevel: 2 });

    plugin.install?.(createEditor("# Same\n\n# Same\n\n### Hidden"));

    const links = [...container.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(links).toEqual(["#same", "#same-1"]);
  });

  it("renders heading text as text content instead of HTML", () => {
    const container = document.createElement("div");
    const plugin = tocPlugin({ container });

    plugin.install?.(createEditor("# \\<img src=x onerror=alert(1)\\>"));

    const link = container.querySelector("a");
    expect(link?.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(link?.querySelector("img")).toBeNull();
  });

  it("replaces old links when editor content updates", () => {
    const container = document.createElement("div");
    const plugin = tocPlugin({ container });

    plugin.install?.(createEditor("# First"));
    plugin.onUpdate?.({ value: "# Second", editor: createEditor("# Second") });

    const links = [...container.querySelectorAll("a")].map((link) => link.textContent);
    expect(links).toEqual(["Second"]);
  });

  it("respects maxLevel while extracting nested inline heading text", () => {
    const container = document.createElement("div");
    const plugin = tocPlugin({ container, maxLevel: 2 });

    plugin.install?.(createEditor("# Top `code`\n\n## **Nested** text\n\n### Hidden"));

    const links = [...container.querySelectorAll("a")].map((link) => link.textContent);
    expect(links).toEqual(["Top code", "Nested text"]);
  });
});
