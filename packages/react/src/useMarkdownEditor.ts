import { useRef, useEffect, useCallback } from "react";
import { copyMarkdown, downloadMarkdown, MarkdownEditor } from "pd-editor-core";
import type { MarkdownEditorOptions, EditorCommand, EditorLabels, EditorPlugin, Extension, MarkdownCodeLanguages } from "pd-editor-core";

export interface UseMarkdownEditorOptions {
  initialValue?: string;
  theme?: "light" | "dark";
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  extensions?: Extension[];
  codeLanguages?: MarkdownCodeLanguages;
  plugins?: EditorPlugin[];
  toolbar?: boolean | MarkdownEditorOptions["toolbar"];
  labels?: EditorLabels;
}

export interface UseMarkdownEditorReturn {
  /** Ref to attach to the container div */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Editor instance (null until mounted) */
  editorRef: React.RefObject<MarkdownEditor | null>;
  /** Get current value */
  getValue: () => string;
  /** Set editor value */
  setValue: (value: string) => void;
  /** Execute a toolbar command */
  executeCommand: (command: EditorCommand | string) => void;
  /** Focus the editor */
  focus: () => void;
  /** Current document character count */
  getCharacterCount: () => number;
  /** Copy current Markdown source */
  copyMarkdown: () => Promise<void>;
  /** Download current Markdown source */
  downloadMarkdown: (filename?: string) => void;
}

/**
 * React hook for creating a MarkdownEditor instance.
 * For advanced use cases where you need full control over the DOM.
 */
export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}): UseMarkdownEditorReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MarkdownEditor | null>(null);
  const onChangeRef = useRef(options.onChange);
  const onSaveRef = useRef(options.onSave);

  // Keep callback refs current
  onChangeRef.current = options.onChange;
  onSaveRef.current = options.onSave;

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = new MarkdownEditor({
      parent: containerRef.current,
      initialValue: options.initialValue ?? "",
      theme: options.theme ?? "light",
      onChange: (v) => onChangeRef.current?.(v),
      onSave: (v) => onSaveRef.current?.(v),
      placeholder: options.placeholder,
      readOnly: options.readOnly,
      maxLength: options.maxLength,
      extensions: options.extensions,
      codeLanguages: options.codeLanguages,
      plugins: options.plugins,
      toolbar: options.toolbar,
      labels: options.labels,
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (options.theme) {
      editorRef.current?.setTheme(options.theme);
    }
  }, [options.theme]);

  useEffect(() => {
    editorRef.current?.setReadOnly(options.readOnly ?? false);
  }, [options.readOnly]);

  useEffect(() => {
    editorRef.current?.setMaxLength(options.maxLength);
  }, [options.maxLength]);

  useEffect(() => {
    editorRef.current?.setToolbar(options.toolbar ?? true, options.labels);
  }, [options.toolbar, options.labels]);

  const getValue = useCallback(() => editorRef.current?.getValue() ?? "", []);
  const setValue = useCallback((v: string) => editorRef.current?.setValue(v), []);
  const executeCommand = useCallback((cmd: EditorCommand | string) => editorRef.current?.executeCommand(cmd), []);
  const focus = useCallback(() => editorRef.current?.focus(), []);
  const getCharacterCount = useCallback(() => editorRef.current?.getCharacterCount() ?? 0, []);
  const copyCurrentMarkdown = useCallback(() => copyMarkdown(editorRef.current?.getValue() ?? ""), []);
  const downloadCurrentMarkdown = useCallback((filename?: string) => downloadMarkdown(editorRef.current?.getValue() ?? "", filename), []);

  return {
    containerRef,
    editorRef,
    getValue,
    setValue,
    executeCommand,
    focus,
    getCharacterCount,
    copyMarkdown: copyCurrentMarkdown,
    downloadMarkdown: downloadCurrentMarkdown,
  };
}
