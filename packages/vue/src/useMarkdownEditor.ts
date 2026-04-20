import { ref, onMounted, onUnmounted } from "vue";
import { MarkdownEditor } from "pd-editor-core";
import type { MarkdownEditorOptions, EditorCommand, EditorPlugin, Extension } from "pd-editor-core";
import type { Ref } from "vue";

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
  containerRef: Ref<HTMLDivElement | null>;
  editorRef: Ref<MarkdownEditor | null>;
  getValue: () => string;
  setValue: (value: string) => void;
  executeCommand: (command: EditorCommand | string) => void;
  getPreviewHTML: () => string;
  focus: () => void;
}

/**
 * Vue 3 composable for creating a MarkdownEditor instance.
 */
export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}): UseMarkdownEditorReturn {
  const containerRef = ref<HTMLDivElement | null>(null);
  const editorRef = ref<MarkdownEditor | null>(null) as Ref<MarkdownEditor | null>;

  onMounted(() => {
    if (!containerRef.value) return;

    const editor = new MarkdownEditor({
      parent: containerRef.value,
      initialValue: options.initialValue ?? "",
      theme: options.theme ?? "light",
      onChange: options.onChange,
      onSave: options.onSave,
      placeholder: options.placeholder,
      readOnly: options.readOnly,
      extensions: options.extensions,
      plugins: options.plugins,
      toolbar: options.toolbar,
    });

    editorRef.value = editor;
  });

  onUnmounted(() => {
    editorRef.value?.destroy();
    editorRef.value = null;
  });

  const getValue = () => editorRef.value?.getValue() ?? "";
  const setValue = (v: string) => editorRef.value?.setValue(v);
  const executeCommand = (cmd: EditorCommand | string) => editorRef.value?.executeCommand(cmd);
  const getPreviewHTML = () => editorRef.value?.getPreviewHTML() ?? "";
  const focus = () => editorRef.value?.focus();

  return { containerRef, editorRef, getValue, setValue, executeCommand, getPreviewHTML, focus };
}
