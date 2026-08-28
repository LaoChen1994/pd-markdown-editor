import { EditorView, keymap } from "@codemirror/view";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import type {
  EditorCommand,
  EditorCommandState,
  EditorLabels,
  EditorPlugin,
  MarkdownEditorInstance,
  MarkdownEditorOptions,
  ToolbarItem,
} from "./types";
import { createDefaultExtensions } from "./extensions/default";
import { createLightTheme, createDarkTheme } from "./themes";
import {
  continueMarkdownBlock,
  canExecuteEditorCommand,
  executeEditorCommand,
  getEditorCommandState,
  getSelection,
  indentMarkdownBlock,
  insertAtCursor,
  isEditorCommandActive,
  outdentMarkdownBlock,
  replaceSelection,
  wrapSelection,
} from "./commands";
import { getDefaultToolbarItems, createToolbarElement, updateToolbarElementState } from "./toolbar";
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
  private view?: EditorView;
  private pluginManager: PluginManager;
  private wrapperEl: HTMLElement;
  private contentEl: HTMLElement;
  private toolbarEl: HTMLElement | null = null;
  private themeCompartment = new Compartment();
  private readOnlyCompartment = new Compartment();
  private pluginCompartment = new Compartment();
  private pluginExtensions = new Map<string, Extension[]>();
  private baseToolbarItems: ToolbarItem[] | null;
  private currentTheme: "light" | "dark";
  private currentReadOnly: boolean;
  private currentMaxLength?: number;
  private currentLabels: EditorLabels;
  private onChange?: (value: string) => void;
  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  private initialValue: string;
  private suppressNextChange = false;

  constructor(options: MarkdownEditorOptions) {
    const {
      parent,
      initialValue = "",
      theme = "light",
      onChange,
      onSave,
      placeholder,
      readOnly = false,
      maxLength,
      extensions: userExtensions = [],
      codeLanguages,
      plugins = [],
      toolbar = true,
      labels = {},
    } = options;

    this.currentTheme = theme;
    this.currentReadOnly = readOnly;
    this.currentMaxLength = maxLength === undefined ? undefined : Math.max(0, maxLength);
    this.currentLabels = labels;
    this.onChange = onChange;
    this.initialValue = this.currentMaxLength === undefined ? initialValue : initialValue.slice(0, this.currentMaxLength);
    this.baseToolbarItems = toolbar === false ? null : toolbar === true ? getDefaultToolbarItems(labels) : toolbar;

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

    this.refreshToolbar();

    this.contentEl = document.createElement("div");
    this.contentEl.className = "pd-editor-content";
    Object.assign(this.contentEl.style, { display: "flex", flex: "1", minHeight: "0", overflow: "hidden" });

    // Editor container
    const editorContainer = document.createElement("div");
    editorContainer.className = "pd-editor-cm-container";
    Object.assign(editorContainer.style, { flex: "1", overflow: "auto" });
    this.contentEl.appendChild(editorContainer);
    this.wrapperEl.appendChild(this.contentEl);

    parent.appendChild(this.wrapperEl);

    // Build extensions
    const defaultExts = createDefaultExtensions({ placeholder, codeLanguages });
    const themeExt = theme === "dark" ? createDarkTheme() : createLightTheme();
    const pluginExts = plugins.flatMap((plugin) => this.installPluginExtension(plugin));

    // Save keybinding
    const saveKeymap = onSave
      ? keymap.of([{ key: "Mod-s", run: () => { onSave(this.getValue()); return true; } }])
      : [];

    // Update listener
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        if (this.suppressNextChange) {
          this.suppressNextChange = false;
        } else {
          if (this.updateTimer) clearTimeout(this.updateTimer);
          this.updateTimer = setTimeout(() => {
            this.onChange?.(value);
            this.pluginManager.notifyUpdate(value, this);
          }, 50);
        }
      }
      if (update.docChanged || update.selectionSet) {
        this.updateToolbarState();
      }
    });

    // Create CM6 view
    this.view = new EditorView({
      state: EditorState.create({
        doc: this.initialValue,
        extensions: [
          ...defaultExts,
          this.createMarkdownKeymap(),
          this.themeCompartment.of(themeExt),
          this.readOnlyCompartment.of(this.createReadOnlyExtension(readOnly)),
          this.pluginCompartment.of(pluginExts),
          saveKeymap,
          updateListener,
          EditorState.transactionFilter.of((transaction) => {
            if (!transaction.docChanged || this.currentMaxLength === undefined || transaction.newDoc.length <= this.currentMaxLength) {
              return transaction;
            }
            return [];
          }),
          ...userExtensions,
        ],
      }),
      parent: editorContainer,
    });
    this.updateToolbarState();
  }

  getValue(): string {
    return this.view?.state.doc.toString() ?? this.initialValue;
  }

  setValue(value: string, options?: { emitChange?: boolean }): void {
    if (!this.view) return;
    if (this.currentMaxLength !== undefined) value = value.slice(0, this.currentMaxLength);
    if (this.view.state.doc.toString() === value) return;
    this.suppressNextChange = options?.emitChange === false;
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  focus(): void {
    this.view?.focus();
  }

  executeCommand(command: EditorCommand | string): void {
    if (!this.view) return;
    executeEditorCommand(this.view, command as EditorCommand);
  }

  canExecute(command: EditorCommand | string): boolean {
    if (!this.view) return false;
    return canExecuteEditorCommand(this.view, command);
  }

  getCommandState(command: EditorCommand | string): EditorCommandState {
    if (!this.view) return { active: false, enabled: false };
    return getEditorCommandState(this.view, command);
  }

  isActive(command: EditorCommand | string): boolean {
    if (!this.view) return false;
    return isEditorCommandActive(this.view, command);
  }

  setTheme(theme: "light" | "dark"): void {
    if (theme === this.currentTheme) return;
    this.currentTheme = theme;
    this.wrapperEl.style.backgroundColor = theme === "dark" ? "#0d1117" : "#ffffff";
    if (!this.view) return;
    this.view.dispatch({
      effects: this.themeCompartment.reconfigure(theme === "dark" ? createDarkTheme() : createLightTheme()),
    });
  }

  setReadOnly(readOnly: boolean): void {
    if (readOnly === this.currentReadOnly) return;
    this.currentReadOnly = readOnly;
    if (!this.view) return;
    this.view.dispatch({
      effects: this.readOnlyCompartment.reconfigure(this.createReadOnlyExtension(readOnly)),
    });
    this.updateToolbarState();
  }

  setMaxLength(maxLength?: number): void {
    this.currentMaxLength = maxLength === undefined ? undefined : Math.max(0, maxLength);
    if (this.currentMaxLength !== undefined && this.getCharacterCount() > this.currentMaxLength) {
      this.setValue(this.getValue().slice(0, this.currentMaxLength));
    }
  }

  getCharacterCount(): number {
    return this.getValue().length;
  }

  setToolbar(toolbar: boolean | ToolbarItem[], labels: EditorLabels = this.currentLabels): void {
    this.currentLabels = labels;
    this.baseToolbarItems = toolbar === false ? null : toolbar === true ? getDefaultToolbarItems(labels) : toolbar;
    if (!this.baseToolbarItems) {
      this.toolbarEl?.remove();
      this.toolbarEl = null;
      return;
    }
    this.refreshToolbar();
  }

  replaceSelection(text: string): void {
    if (!this.view) return;
    replaceSelection(this.view, text);
  }

  wrapSelection(before: string, after: string): void {
    if (!this.view) return;
    wrapSelection(this.view, before, after);
  }

  getSelection(): string {
    if (!this.view) return "";
    return getSelection(this.view);
  }

  getContentElement(): HTMLElement {
    return this.contentEl;
  }

  insertAtCursor(text: string): void {
    if (!this.view) return;
    insertAtCursor(this.view, text);
  }

  /** Register a plugin at runtime */
  use(plugin: EditorPlugin): this {
    this.pluginManager.register(plugin);
    const extensions = this.installPluginExtension(plugin);
    this.reconfigurePlugins();
    this.refreshToolbar();
    if (extensions.length === 0) {
      plugin.onUpdate?.({ value: this.getValue(), editor: this });
    }
    return this;
  }

  /** Remove a plugin by name at runtime */
  unuse(name: string): this {
    this.pluginExtensions.delete(name);
    if (this.pluginManager.unregister(name)) {
      this.reconfigurePlugins();
      this.refreshToolbar();
    }
    return this;
  }

  /** Get the underlying CodeMirror EditorView */
  getEditorView(): EditorView {
    if (!this.view) {
      throw new Error("EditorView is not ready yet.");
    }
    return this.view;
  }

  /** Destroy the editor and clean up */
  destroy(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.pluginManager.destroyAll();
    this.view?.destroy();
    this.wrapperEl.remove();
  }

  private createReadOnlyExtension(readOnly: boolean): Extension[] {
    return [
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ];
  }

  private installPluginExtension(plugin: EditorPlugin): Extension[] {
    const extensions = this.pluginManager.install(plugin, this);
    this.pluginExtensions.set(plugin.name, extensions);
    return extensions;
  }

  private reconfigurePlugins(): void {
    if (!this.view) return;
    this.view.dispatch({
      effects: this.pluginCompartment.reconfigure([...this.pluginExtensions.values()].flat()),
    });
  }

  private refreshToolbar(): void {
    if (!this.baseToolbarItems) return;
    const pluginItems = this.pluginManager.getToolbarItems({
      executeCommand: (cmd) => this.executeCommand(cmd),
      editor: this,
    });
    const nextToolbar = createToolbarElement(
      [...this.baseToolbarItems, ...pluginItems].map((item) => ({
        ...item,
        label: this.currentLabels[item.command] ?? item.label,
      })),
      (cmd) => this.executeCommand(cmd),
      (cmd) => this.getCommandState(cmd)
    );

    if (this.toolbarEl) {
      this.toolbarEl.replaceWith(nextToolbar);
    } else {
      this.wrapperEl.insertBefore(nextToolbar, this.wrapperEl.firstChild);
    }
    this.toolbarEl = nextToolbar;
  }

  private updateToolbarState(): void {
    if (!this.toolbarEl) return;
    updateToolbarElementState(this.toolbarEl, (cmd) => this.getCommandState(cmd));
  }

  private createMarkdownKeymap(): Extension {
    return Prec.high(keymap.of([
      { key: "Enter", run: continueMarkdownBlock },
      { key: "Tab", run: indentMarkdownBlock },
      { key: "Shift-Tab", run: outdentMarkdownBlock },
      { key: "Mod-b", run: (view) => executeEditorCommand(view, "bold") },
      { key: "Mod-i", run: (view) => executeEditorCommand(view, "italic") },
      { key: "Mod-k", run: (view) => executeEditorCommand(view, "link") },
      { key: "Mod-Shift-x", run: (view) => executeEditorCommand(view, "strikethrough") },
      { key: "Mod-Alt-1", run: (view) => executeEditorCommand(view, "heading1") },
      { key: "Mod-Alt-2", run: (view) => executeEditorCommand(view, "heading2") },
      { key: "Mod-Alt-3", run: (view) => executeEditorCommand(view, "heading3") },
      { key: "Mod-Shift-7", run: (view) => executeEditorCommand(view, "orderedList") },
      { key: "Mod-Shift-8", run: (view) => executeEditorCommand(view, "unorderedList") },
      { key: "Mod-Shift-9", run: (view) => executeEditorCommand(view, "quote") },
    ]));
  }
}
