import type { Extension } from "@codemirror/state";
import type { Language, LanguageDescription } from "@codemirror/language";

/** Code language resolver for fenced Markdown code blocks in the editor */
export type MarkdownCodeLanguages = readonly LanguageDescription[] | ((info: string) => Language | LanguageDescription | null);

/** Editor command identifiers */
export type EditorCommand =
  | "bold" | "italic" | "strikethrough"
  | "heading1" | "heading2" | "heading3"
  | "link" | "image"
  | "unorderedList" | "orderedList" | "taskList"
  | "quote" | "code" | "codeBlock"
  | "horizontalRule" | "table"
  | "undo" | "redo" | "search";

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
  /** Optional custom action instead of command dispatch */
  onClick?: () => void;
}

/** Current state for a command in the editor selection */
export interface EditorCommandState {
  /** Whether the command applies to the current selection or line */
  active: boolean;
  /** Whether the command can be executed in the current editor state */
  enabled: boolean;
}

/** Display labels keyed by toolbar command */
export interface EditorLabels {
  [command: string]: string | undefined;
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
  setValue(value: string, options?: { emitChange?: boolean }): void;
  focus(): void;
  executeCommand(command: EditorCommand | string): void;
  canExecute(command: EditorCommand | string): boolean;
  getCommandState(command: EditorCommand | string): EditorCommandState;
  isActive(command: EditorCommand | string): boolean;
  setReadOnly(readOnly: boolean): void;
  setMaxLength?(maxLength?: number): void;
  getCharacterCount?(): number;
  setToolbar?(toolbar: boolean | ToolbarItem[], labels?: EditorLabels): void;
  use(plugin: EditorPlugin): MarkdownEditorInstance;
  unuse(name: string): MarkdownEditorInstance;
  replaceSelection(text: string): void;
  wrapSelection(before: string, after: string): void;
  getSelection(): string;
  insertAtCursor(text: string): void;
  getContentElement?(): HTMLElement;
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
  /** Maximum document length. Longer input is blocked and programmatic values are truncated. */
  maxLength?: number;
  /** Custom CodeMirror 6 extensions */
  extensions?: Extension[];
  /** Optional fenced code language resolver for the Markdown editor */
  codeLanguages?: MarkdownCodeLanguages;
  /** Editor plugins */
  plugins?: EditorPlugin[];
  /** Toolbar config: true for default, false to hide, or custom items */
  toolbar?: boolean | ToolbarItem[];
  /** Toolbar labels keyed by command */
  labels?: EditorLabels;
}

export type { Extension };
