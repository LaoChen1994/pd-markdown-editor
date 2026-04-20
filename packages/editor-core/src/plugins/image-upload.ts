import { EditorView } from "@codemirror/view";
import type { EditorPlugin, ToolbarItem, MarkdownEditorInstance } from "../types";

export interface ImageUploadPluginOptions {
  /** Upload handler returning the image URL */
  handler: (file: File) => Promise<string>;
  /** Accepted file types, default ['image/*'] */
  accept?: string[];
  /** Max file size in bytes */
  maxSize?: number;
  /** Enable paste upload, default true */
  pasteUpload?: boolean;
  /** Enable drag-and-drop upload, default true */
  dragUpload?: boolean;
}

export function imageUploadPlugin(options: ImageUploadPluginOptions): EditorPlugin {
  const { handler, accept = ["image/*"], maxSize, pasteUpload = true, dragUpload = true } = options;

  function isAccepted(file: File): boolean {
    return accept.some(a => {
      if (a === "image/*") return file.type.startsWith("image/");
      return file.type === a;
    });
  }

  async function uploadFile(file: File, editor: MarkdownEditorInstance): Promise<void> {
    if (!isAccepted(file)) return;
    if (maxSize && file.size > maxSize) return;

    const placeholder = `![Uploading ${file.name}...]()`;
    editor.insertAtCursor(placeholder);

    try {
      const url = await handler(file);
      const current = editor.getValue();
      const updated = current.replace(placeholder, `![${file.name}](${url})`);
      editor.setValue(updated);
    } catch {
      const current = editor.getValue();
      const updated = current.replace(placeholder, `![Upload failed: ${file.name}]()`);
      editor.setValue(updated);
    }
  }

  let editorRef: MarkdownEditorInstance | null = null;

  return {
    name: "image-upload",

    install(editor) {
      editorRef = editor;
      const extensions = [];

      if (pasteUpload) {
        extensions.push(EditorView.domEventHandlers({
          paste(event) {
            const items = event.clipboardData?.items;
            if (!items) return false;
            for (const item of Array.from(items)) {
              if (item.kind === "file") {
                const file = item.getAsFile();
                if (file && editorRef) { uploadFile(file, editorRef); return true; }
              }
            }
            return false;
          }
        }));
      }

      if (dragUpload) {
        extensions.push(EditorView.domEventHandlers({
          drop(event) {
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;
            event.preventDefault();
            for (const file of Array.from(files)) {
              if (editorRef) uploadFile(file, editorRef);
            }
            return true;
          },
          dragover(event) { event.preventDefault(); return true; }
        }));
      }

      return extensions;
    },

    toolbar(): ToolbarItem {
      return {
        command: "image-upload",
        label: "Upload Image",
        icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 10H3l3-4 1.5 2L10 7l3 5zM5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
      };
    },

    destroy() { editorRef = null; },
  };
}
