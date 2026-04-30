import { describe, expect, it } from "vitest";
import { MarkdownEditor } from "./editor";
import type { EditorPlugin } from "./types";

function waitForUpdate(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 80));
}

describe("MarkdownEditor", () => {
  it("keeps callbacks and plugins after theme changes", async () => {
    const parent = document.createElement("div");
    const updates: string[] = [];
    let pluginUpdates = 0;
    const plugin: EditorPlugin = {
      name: "counter",
      onUpdate: () => {
        pluginUpdates += 1;
      },
    };

    const editor = new MarkdownEditor({
      parent,
      initialValue: "hello",
      onChange: (value) => updates.push(value),
      plugins: [plugin],
      toolbar: false,
    });

    editor.setTheme("dark");
    editor.setValue("changed");
    await waitForUpdate();

    expect(editor.getValue()).toBe("changed");
    expect(updates).toEqual(["changed"]);
    expect(pluginUpdates).toBe(1);

    editor.destroy();
  });

  it("lets plugins read the initial value during install", () => {
    const parent = document.createElement("div");
    let installedValue = "";
    const plugin: EditorPlugin = {
      name: "initial-reader",
      install: (editor) => {
        installedValue = editor.getValue();
      },
    };

    const editor = new MarkdownEditor({
      parent,
      initialValue: "# Initial",
      plugins: [plugin],
      toolbar: false,
    });

    expect(installedValue).toBe("# Initial");
    expect(editor.getValue()).toBe("# Initial");

    editor.destroy();
  });
});
