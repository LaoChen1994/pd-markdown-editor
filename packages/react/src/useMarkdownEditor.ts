import { useRef, useEffect, useCallback } from "react";
import { MarkdownEditor } from "pd-editor-core";
import type { MarkdownEditorOptions, EditorCommand, EditorPlugin, Extension } from "pd-editor-core";

export interface UseMarkdownEditorOptions {
  initialValue?: string;
  theme?: "light" | "dark";
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  extensions?: Extension[];
  plugins?: EditorPlugin[];
  toolbar?: boolean | MarkdownEditorOptions["toolbar"];
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
  /** Get rendered HTML */
  getPreviewHTML: () => string;
  /** Focus the editor */
  focus: () => void;
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
      extensions: options.extensions,
      plugins: options.plugins,
      toolbar: options.toolbar,
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // Only re-create on theme/readOnly change
  }, [options.theme, options.readOnly]);

  const getValue = useCallback(() => editorRef.current?.getValue() ?? "", []);
  const setValue = useCallback((v: string) => editorRef.current?.setValue(v), []);
  const executeCommand = useCallback((cmd: EditorCommand | string) => editorRef.current?.executeCommand(cmd), []);
  const getPreviewHTML = useCallback(() => editorRef.current?.getPreviewHTML() ?? "", []);
  const focus = useCallback(() => editorRef.current?.focus(), []);

  return { containerRef, editorRef, getValue, setValue, executeCommand, getPreviewHTML, focus };
}
