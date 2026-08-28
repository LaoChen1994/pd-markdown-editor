import { ref, onMounted, onUnmounted } from "vue";
import { copyMarkdown, downloadMarkdown, MarkdownEditor } from "pd-editor-core";
import type { MarkdownEditorOptions, EditorCommand, EditorLabels, EditorMessages, EditorPlugin, Extension, MarkdownCodeLanguages } from "pd-editor-core";
import type { Ref } from "vue";

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
  messages?: EditorMessages;
}

export interface UseMarkdownEditorReturn {
  containerRef: Ref<HTMLDivElement | null>;
  editorRef: Ref<MarkdownEditor | null>;
  getValue: () => string;
  setValue: (value: string) => void;
  executeCommand: (command: EditorCommand | string) => void;
  focus: () => void;
  getCharacterCount: () => number;
  copyMarkdown: () => Promise<void>;
  downloadMarkdown: (filename?: string) => void;
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
      maxLength: options.maxLength,
      extensions: options.extensions,
      codeLanguages: options.codeLanguages,
      plugins: options.plugins,
      toolbar: options.toolbar,
      labels: options.labels,
      messages: options.messages,
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
  const focus = () => editorRef.value?.focus();
  const getCharacterCount = () => editorRef.value?.getCharacterCount() ?? 0;
  const copyCurrentMarkdown = () => copyMarkdown(editorRef.value?.getValue() ?? "");
  const downloadCurrentMarkdown = (filename?: string) => downloadMarkdown(editorRef.value?.getValue() ?? "", filename);

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
