import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { MarkdownRenderer } from "pd-markdown";
import type { MarkdownEditorOptions, EditorCommand, MarkdownEditorInstance, EditorPlugin } from "./types";
import { createDefaultExtensions } from "./extensions/default";
import { createLightTheme, createDarkTheme } from "./themes";
import { executeEditorCommand, wrapSelection, replaceSelection, insertAtCursor, getSelection } from "./commands";
import { getDefaultToolbarItems, createToolbarElement } from "./toolbar";
import { PluginManager } from "./plugins";

/**
 * MarkdownEditor — Core editor engine powered by CodeMirror 6
 *
 * Framework-agnostic. Use directly or through pd-editor-react / pd-editor-vue.
 *
 * @example
 * ```ts
 * import { MarkdownEditor } from 'pd-editor-core';
 *
 * const editor = new MarkdownEditor({
 *   parent: document.getElementById('editor')!,
 *   initialValue: '# Hello',
 *   theme: 'light',
 *   onChange: (value) => console.log(value),
 * });
 * ```
 */
export class MarkdownEditor implements MarkdownEditorInstance {
  private view: EditorView;
  private renderer: MarkdownRenderer;
  private pluginManager: PluginManager;
  private wrapperEl: HTMLElement;
  private toolbarEl: HTMLElement | null = null;
  private currentTheme: "light" | "dark";
  private themeCompartment: { extension: Extension; reconfigure: (ext: Extension) => void } | null = null;
  private onChange?: (value: string) => void;
  private updateTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: MarkdownEditorOptions) {
    const {
      parent,
      initialValue = "",
      theme = "light",
      onChange,
      onSave,
      placeholder,
      readOnly = false,
      extensions: userExtensions = [],
      plugins = [],
      toolbar = true,
      preview,
    } = options;

    this.currentTheme = theme;
    this.onChange = onChange;
    this.renderer = preview && typeof preview === "object" && preview.renderer
      ? preview.renderer
      : new MarkdownRenderer();

    // Plugin manager
    this.pluginManager = new PluginManager();
    for (const p of plugins) {
      this.pluginManager.register(p);
    }

    // Build wrapper
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.className = "pd-editor-wrapper";
    Object.assign(this.wrapperEl.style, {
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--pd-editor-border, #d1d9e0)",
      borderRadius: "8px",
      overflow: "hidden",
      height: "100%",
      backgroundColor: theme === "dark" ? "#0d1117" : "#ffffff",
    });

    // Toolbar
    if (toolbar !== false) {
      const items = toolbar === true ? getDefaultToolbarItems() : toolbar;
      const pluginItems = this.pluginManager.getToolbarItems({
        executeCommand: (cmd) => this.executeCommand(cmd),
        editor: this,
      });
      this.toolbarEl = createToolbarElement([...items, ...pluginItems], (cmd) => this.executeCommand(cmd));
      this.wrapperEl.appendChild(this.toolbarEl);
    }

    // Editor container
    const editorContainer = document.createElement("div");
    editorContainer.className = "pd-editor-cm-container";
    Object.assign(editorContainer.style, { flex: "1", overflow: "auto" });
    this.wrapperEl.appendChild(editorContainer);

    parent.appendChild(this.wrapperEl);

    // Build extensions
    const defaultExts = createDefaultExtensions({ placeholder, readOnly });
    const themeExt = theme === "dark" ? createDarkTheme() : createLightTheme();
    const pluginExts = this.pluginManager.installAll(this);

    // Save keybinding
    const saveKeymap = onSave
      ? keymap.of([{ key: "Mod-s", run: () => { onSave(this.getValue()); return true; } }])
      : [];

    // Update listener
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
          this.onChange?.(value);
          this.pluginManager.notifyUpdate(value, this);
        }, 50);
      }
    });

    // Create CM6 view
    this.view = new EditorView({
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          ...defaultExts,
          themeExt,
          ...pluginExts,
          saveKeymap,
          updateListener,
          ...userExtensions,
        ],
      }),
      parent: editorContainer,
    });
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  focus(): void {
    this.view.focus();
  }

  executeCommand(command: EditorCommand | string): void {
    executeEditorCommand(this.view, command as EditorCommand);
  }

  getPreviewHTML(): string {
    return this.renderer.render(this.getValue());
  }

  setTheme(theme: "light" | "dark"): void {
    if (theme === this.currentTheme) return;
    this.currentTheme = theme;
    this.wrapperEl.style.backgroundColor = theme === "dark" ? "#0d1117" : "#ffffff";
    // Reconfigure requires recreating — dispatch a full reconfiguration
    const newTheme = theme === "dark" ? createDarkTheme() : createLightTheme();
    this.view.dispatch({ effects: [] }); // trigger update
    // For full theme swap, we recreate the editor state
    const doc = this.getValue();
    const parent = this.view.dom.parentElement;
    if (!parent) return;
    this.view.destroy();
    const defaultExts = createDefaultExtensions({});
    this.view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [
          ...defaultExts,
          newTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString();
              this.onChange?.(value);
              this.pluginManager.notifyUpdate(value, this);
            }
          }),
        ],
      }),
      parent,
    });
  }

  replaceSelection(text: string): void {
    replaceSelection(this.view, text);
  }

  wrapSelection(before: string, after: string): void {
    wrapSelection(this.view, before, after);
  }

  getSelection(): string {
    return getSelection(this.view);
  }

  insertAtCursor(text: string): void {
    insertAtCursor(this.view, text);
  }

  /** Register a plugin at runtime */
  use(plugin: EditorPlugin): this {
    this.pluginManager.register(plugin);
    plugin.install?.(this);
    // Runtime plugin extensions can't be added easily to CM6 without compartments.
    // For now, plugins registered at construction time get full CM6 extension support.
    return this;
  }

  /** Get the underlying CodeMirror EditorView */
  getEditorView(): EditorView {
    return this.view;
  }

  /** Destroy the editor and clean up */
  destroy(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.pluginManager.destroyAll();
    this.view.destroy();
    this.wrapperEl.remove();
  }
}
