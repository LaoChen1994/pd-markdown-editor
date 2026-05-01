import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView, runScopeHandlers } from "@codemirror/view";
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

  it("updates read-only mode without recreating the editor view", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "locked",
      toolbar: false,
    });
    const view = editor.getEditorView();

    editor.setReadOnly(true);

    expect(editor.getEditorView()).toBe(view);
    expect(view.state.facet(EditorState.readOnly)).toBe(true);

    editor.setReadOnly(false);

    expect(editor.getEditorView()).toBe(view);
    expect(view.state.facet(EditorState.readOnly)).toBe(false);

    editor.destroy();
  });

  it("exposes command state for toolbar integrations", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "**hello**",
      toolbar: false,
    });
    const view = editor.getEditorView();

    view.dispatch({ selection: { anchor: 2, head: 7 } });

    expect(editor.isActive("bold")).toBe(true);
    expect(editor.canExecute("bold")).toBe(true);
    expect(editor.getCommandState("bold")).toEqual({ active: true, enabled: true });

    editor.setReadOnly(true);

    expect(editor.getCommandState("bold")).toEqual({ active: true, enabled: false });

    editor.destroy();
  });

  it("does not execute markdown commands while read-only", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "hello",
      readOnly: true,
      toolbar: false,
    });
    const view = editor.getEditorView();

    view.dispatch({ selection: { anchor: 0, head: 5 } });
    editor.executeCommand("bold");

    expect(editor.getValue()).toBe("hello");
    expect(runScopeHandlers(
      view,
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
      "editor"
    )).toBe(false);
    expect(editor.getValue()).toBe("hello");

    editor.destroy();
  });

  it("handles common markdown keyboard shortcuts", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "hello",
      toolbar: false,
    });
    const view = editor.getEditorView();

    view.dispatch({ selection: { anchor: 0, head: 5 } });
    const handled = runScopeHandlers(
      view,
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
      "editor"
    );

    expect(handled).toBe(true);
    expect(editor.getValue()).toBe("**hello**");

    editor.destroy();
  });

  it("handles markdown typing flow shortcuts", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      initialValue: "- one",
      toolbar: false,
    });
    const view = editor.getEditorView();

    view.dispatch({ selection: { anchor: 5 } });
    expect(runScopeHandlers(
      view,
      new KeyboardEvent("keydown", { key: "Enter" }),
      "editor"
    )).toBe(true);
    expect(editor.getValue()).toBe("- one\n- ");

    expect(runScopeHandlers(
      view,
      new KeyboardEvent("keydown", { key: "Tab" }),
      "editor"
    )).toBe(true);
    expect(editor.getValue()).toBe("- one\n  - ");

    expect(runScopeHandlers(
      view,
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }),
      "editor"
    )).toBe(true);
    expect(editor.getValue()).toBe("- one\n- ");

    editor.destroy();
  });

  it("installs and removes runtime plugin extensions", () => {
    const parent = document.createElement("div");
    let extensionUpdates = 0;
    let destroyed = false;
    const plugin: EditorPlugin = {
      name: "runtime-extension",
      install: () => EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          extensionUpdates += 1;
        }
      }),
      destroy: () => {
        destroyed = true;
      },
    };
    const editor = new MarkdownEditor({
      parent,
      initialValue: "start",
      toolbar: false,
    });

    editor.use(plugin);
    editor.setValue("installed");

    expect(extensionUpdates).toBe(1);

    editor.unuse("runtime-extension");
    editor.setValue("removed");

    expect(extensionUpdates).toBe(1);
    expect(destroyed).toBe(true);

    editor.destroy();
  });

  it("refreshes toolbar items when runtime plugins change", () => {
    const parent = document.createElement("div");
    const plugin: EditorPlugin = {
      name: "toolbar-extension",
      toolbar: () => ({
        command: "custom-command",
        label: "Custom command",
        icon: "<span>C</span>",
      }),
    };
    const editor = new MarkdownEditor({
      parent,
      initialValue: "start",
    });

    expect(parent.querySelector('[title="Custom command"]')).toBeNull();

    editor.use(plugin);

    expect(parent.querySelector('[title="Custom command"]')).not.toBeNull();

    editor.unuse("toolbar-extension");

    expect(parent.querySelector('[title="Custom command"]')).toBeNull();

    editor.destroy();
  });
});
