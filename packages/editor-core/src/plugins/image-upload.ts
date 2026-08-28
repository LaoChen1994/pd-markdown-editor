import { EditorView } from "@codemirror/view";
import type { EditorPlugin, ToolbarItem, MarkdownEditorInstance } from "../types";

export interface ImageUploadPluginOptions {
  /** Upload handler returning the image URL */
  handler: (file: File, context: ImageUploadContext) => Promise<string>;
  /** Accepted file types, default ['image/*'] */
  accept?: string[];
  /** Max file size in bytes */
  maxSize?: number;
  /** Enable paste upload, default true */
  pasteUpload?: boolean;
  /** Enable drag-and-drop upload, default true */
  dragUpload?: boolean;
  /** Called when a file is rejected before upload */
  onReject?: (file: File, reason: "type" | "size") => void;
  /** Called when the upload handler throws */
  onError?: (error: unknown, file: File) => void;
  /** Called when upload status or progress changes */
  onStatusChange?: (update: ImageUploadUpdate) => void;
  /** Toolbar button label */
  label?: string;
}

export interface ImageUploadContext {
  /** Abort signal for cancelling the current upload attempt */
  signal: AbortSignal;
  /** Report upload progress from 0 to 100 */
  reportProgress: (progress: number) => void;
}

export type ImageUploadStatus = "uploading" | "success" | "error" | "cancelled";

export interface ImageUploadUpdate {
  id: number;
  file: File;
  status: ImageUploadStatus;
  progress: number;
  url?: string;
  error?: unknown;
  cancel?: () => void;
  retry?: () => void;
}

interface ImageUploadTask {
  id: number;
  file: File;
  marker: string;
  controller: AbortController;
  attempt: number;
  status: ImageUploadStatus;
}

export function imageUploadPlugin(options: ImageUploadPluginOptions): EditorPlugin {
  const {
    handler,
    accept = ["image/*"],
    maxSize,
    pasteUpload = true,
    dragUpload = true,
    onReject,
    onError,
    onStatusChange,
    label,
  } = options;
  let uploadId = 0;
  let fileInput: HTMLInputElement | null = null;
  let destroyed = false;
  const uploads = new Map<number, ImageUploadTask>();

  const isAccepted = (file: File): boolean => {
    return accept.some(a => {
      if (a === "image/*") return file.type.startsWith("image/");
      return file.type === a;
    });
  };

  const replaceMarker = (editor: MarkdownEditorInstance, current: string, replacement: string): void => {
    const value = editor.getValue();
    editor.setValue(value.replace(current, replacement));
  };

  const runUpload = async (
    upload: ImageUploadTask,
    editor: MarkdownEditorInstance
  ): Promise<void> => {
    if (destroyed) return;
    upload.attempt += 1;
    const attempt = upload.attempt;
    upload.controller = new AbortController();
    upload.status = "uploading";
    const uploadingMarker = `![${editor.getMessage?.("uploadingImage", { file: upload.file.name }) ?? `Uploading ${upload.file.name}...`}](pd-editor-upload-${upload.id})`;
    if (upload.marker !== uploadingMarker) {
      replaceMarker(editor, upload.marker, uploadingMarker);
      upload.marker = uploadingMarker;
    }

    const cancel = (): void => {
      if (upload.status !== "uploading" || upload.attempt !== attempt) return;
      upload.controller.abort();
      upload.status = "cancelled";
      const cancelledMarker = `![${editor.getMessage?.("uploadCancelled", { file: upload.file.name }) ?? `Upload cancelled: ${upload.file.name}`}](pd-editor-upload-${upload.id})`;
      replaceMarker(editor, upload.marker, cancelledMarker);
      upload.marker = cancelledMarker;
      onStatusChange?.({
        id: upload.id,
        file: upload.file,
        status: "cancelled",
        progress: 0,
        retry: () => { void runUpload(upload, editor); },
      });
    };

    onStatusChange?.({ id: upload.id, file: upload.file, status: "uploading", progress: 0, cancel });

    try {
      const url = await handler(upload.file, {
        signal: upload.controller.signal,
        reportProgress: (progress) => {
          if (destroyed || upload.status !== "uploading" || upload.attempt !== attempt) return;
          onStatusChange?.({
            id: upload.id,
            file: upload.file,
            status: "uploading",
            progress: Math.min(100, Math.max(0, progress)),
            cancel,
          });
        },
      });
      if (destroyed || upload.status !== "uploading" || upload.attempt !== attempt) return;
      upload.status = "success";
      replaceMarker(editor, upload.marker, `![${upload.file.name}](${url})`);
      uploads.delete(upload.id);
      onStatusChange?.({ id: upload.id, file: upload.file, status: "success", progress: 100, url });
    } catch (error) {
      if (destroyed || upload.status !== "uploading" || upload.attempt !== attempt) return;
      upload.status = "error";
      onError?.(error, upload.file);
      const failedMarker = `![${editor.getMessage?.("uploadFailed", { file: upload.file.name }) ?? `Upload failed: ${upload.file.name}`}](pd-editor-upload-${upload.id})`;
      replaceMarker(editor, upload.marker, failedMarker);
      upload.marker = failedMarker;
      onStatusChange?.({
        id: upload.id,
        file: upload.file,
        status: "error",
        progress: 0,
        error,
        retry: () => { void runUpload(upload, editor); },
      });
    }
  };

  const uploadFile = async (file: File, editor: MarkdownEditorInstance): Promise<void> => {
    if (!isAccepted(file)) {
      onReject?.(file, "type");
      return;
    }
    if (maxSize && file.size > maxSize) {
      onReject?.(file, "size");
      return;
    }

    uploadId += 1;
    const marker = `![${editor.getMessage?.("uploadingImage", { file: file.name }) ?? `Uploading ${file.name}...`}](pd-editor-upload-${uploadId})`;
    const upload: ImageUploadTask = {
      id: uploadId,
      file,
      marker,
      controller: new AbortController(),
      attempt: 0,
      status: "uploading",
    };
    uploads.set(upload.id, upload);
    editor.insertAtCursor(marker);
    await runUpload(upload, editor);
  };

  let editorRef: MarkdownEditorInstance | null = null;

  return {
    name: "image-upload",

    install(editor) {
      destroyed = false;
      editorRef = editor;
      const extensions = [];
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = accept.join(",");
      fileInput.multiple = true;
      fileInput.hidden = true;
      fileInput.addEventListener("change", () => {
        if (!editorRef || !fileInput) return;
        for (const file of Array.from(fileInput.files ?? [])) {
          uploadFile(file, editorRef);
        }
        fileInput.value = "";
      });
      document.body.appendChild(fileInput);

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

    toolbar({ editor }): ToolbarItem {
      return {
        command: "image-upload",
        label: label ?? editor.getMessage?.("image-upload") ?? "Upload Image",
        icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 10H3l3-4 1.5 2L10 7l3 5zM5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
        onClick: () => fileInput?.click(),
      };
    },

    destroy() {
      destroyed = true;
      for (const upload of uploads.values()) upload.controller.abort();
      uploads.clear();
      editorRef = null;
      fileInput?.remove();
      fileInput = null;
    },
  };
}
