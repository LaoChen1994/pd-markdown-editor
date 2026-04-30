import type { Extension } from "@codemirror/state";

/** Editor command identifiers */
export type EditorCommand =
  | "bold" | "italic" | "strikethrough"
  | "heading1" | "heading2" | "heading3"
  | "link" | "image"
  | "unorderedList" | "orderedList" | "taskList"
  | "quote" | "code" | "codeBlock"
  | "horizontalRule" | "table"
  | "undo" | "redo";

/** Toolbar item definition */
export interface ToolbarItem {
  /** Command identifier or custom key */
  command: EditorCommand | string;
  /** Display label */
  label: string;
  /** SVG icon HTML string */
  icon: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether this is a divider */
  divider?: boolean;
}

/** Editor plugin interface */
export interface EditorPlugin {
  /** Unique plugin name */
  name: string;
  /** Called on install, may return CM6 extensions */
  install?(editor: MarkdownEditorInstance): Extension | Extension[] | void;
  /** Inject toolbar items */
  toolbar?(ctx: ToolbarContext): ToolbarItem | ToolbarItem[] | void;
  /** Called on content update */
  onUpdate?(update: { value: string; editor: MarkdownEditorInstance }): void;
  /** Cleanup on destroy */
  destroy?(): void;
}

/** Toolbar context passed to plugins */
export interface ToolbarContext {
  executeCommand: (command: EditorCommand | string) => void;
  editor: MarkdownEditorInstance;
}

/** Minimal editor instance interface for plugins */
export interface MarkdownEditorInstance {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  executeCommand(command: EditorCommand | string): void;
  replaceSelection(text: string): void;
  wrapSelection(before: string, after: string): void;
  getSelection(): string;
  insertAtCursor(text: string): void;
}

/** Options for creating a MarkdownEditor */
export interface MarkdownEditorOptions {
  /** DOM element to mount the editor into */
  parent: HTMLElement;
  /** Initial markdown content */
  initialValue?: string;
  /** Theme variant */
  theme?: "light" | "dark";
  /** Called when content changes */
  onChange?: (value: string) => void;
  /** Called on Ctrl/Cmd+S */
  onSave?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** Custom CodeMirror 6 extensions */
  extensions?: Extension[];
  /** Editor plugins */
  plugins?: EditorPlugin[];
  /** Toolbar config: true for default, false to hide, or custom items */
  toolbar?: boolean | ToolbarItem[];
}

export type { Extension };
