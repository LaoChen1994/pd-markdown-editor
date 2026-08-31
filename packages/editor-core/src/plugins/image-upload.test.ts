import { describe, expect, it } from "vitest";
import { MarkdownEditor } from "../editor";
import { imageUploadPlugin } from "./image-upload";
import { zhCN } from "../messages";

const dispatchDrop = (editor: MarkdownEditor, files: File[]): void => {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: { files },
  });

  editor.getEditorView().contentDOM.dispatchEvent(event);
};

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("imageUploadPlugin", () => {
  it("opens a file picker from the toolbar and uploads selected files", async () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      plugins: [imageUploadPlugin({ handler: async () => "https://cdn.example.com/picked.png" })],
    });
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]');
    let pickerClicks = 0;
    input?.addEventListener("click", () => {
      pickerClicks += 1;
    });

    parent.querySelector<HTMLButtonElement>('[data-command="image-upload"]')?.click();
    expect(pickerClicks).toBe(1);

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File(["content"], "picked.png", { type: "image/png" })],
    });
    input?.dispatchEvent(new Event("change"));
    await flushPromises();

    expect(editor.getValue()).toBe("![picked.png](https://cdn.example.com/picked.png)");
    editor.destroy();
    expect(document.body.contains(input)).toBe(false);
  });

  it("keeps an explicit upload button label", () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      messages: zhCN,
      plugins: [imageUploadPlugin({ label: "Add asset", handler: async () => "https://cdn.example.com/file.png" })],
    });

    expect(parent.querySelector<HTMLButtonElement>('[data-command="image-upload"]')?.ariaLabel).toBe("Add asset");
    editor.destroy();
  });

  it("replaces only the matching placeholder for concurrent files with the same name", async () => {
    const parent = document.createElement("div");
    const resolvers: ((url: string) => void)[] = [];
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          handler: () => new Promise<string>((resolve) => {
            resolvers.push(resolve);
          }),
        }),
      ],
    });

    dispatchDrop(editor, [
      new File(["first"], "same.png", { type: "image/png" }),
      new File(["second"], "same.png", { type: "image/png" }),
    ]);

    expect(resolvers).toHaveLength(2);
    expect(editor.getValue()).toContain("pd-editor-upload-1");
    expect(editor.getValue()).toContain("pd-editor-upload-2");

    resolvers[1]("https://cdn.example.com/second.png");
    await flushPromises();

    expect(editor.getValue()).toContain("pd-editor-upload-1");
    expect(editor.getValue()).toContain("![same.png](https://cdn.example.com/second.png)");

    resolvers[0]("https://cdn.example.com/first.png");
    await flushPromises();

    expect(editor.getValue()).toContain("![same.png](https://cdn.example.com/first.png)");
    expect(editor.getValue()).toContain("![same.png](https://cdn.example.com/second.png)");
    expect(editor.getValue()).not.toContain("pd-editor-upload");

    editor.destroy();
  });

  it("notifies rejected files without inserting a placeholder", () => {
    const parent = document.createElement("div");
    const rejects: string[] = [];
    let uploadCount = 0;
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          maxSize: 1,
          handler: async () => {
            uploadCount += 1;
            return "https://cdn.example.com/file.png";
          },
          onReject: (_file, reason) => {
            rejects.push(reason);
          },
        }),
      ],
    });

    dispatchDrop(editor, [new File(["too large"], "large.png", { type: "image/png" })]);

    expect(rejects).toEqual(["size"]);
    expect(uploadCount).toBe(0);
    expect(editor.getValue()).toBe("");

    editor.destroy();
  });

  it("notifies upload failures and keeps the failure marker", async () => {
    const parent = document.createElement("div");
    const errors: unknown[] = [];
    const error = new Error("Upload failed");
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          handler: async () => {
            throw error;
          },
          onError: (caughtError) => {
            errors.push(caughtError);
          },
        }),
      ],
    });

    dispatchDrop(editor, [new File(["content"], "broken.png", { type: "image/png" })]);
    await flushPromises();

    expect(errors).toEqual([error]);
    expect(editor.getValue()).toBe("![Upload failed: broken.png](pd-editor-upload-1)");

    editor.destroy();
  });

  it("uses editor messages for upload labels and markers", async () => {
    const parent = document.createElement("div");
    const editor = new MarkdownEditor({
      parent,
      messages: zhCN,
      plugins: [imageUploadPlugin({ handler: async () => { throw new Error("失败"); } })],
    });

    expect(parent.querySelector<HTMLButtonElement>('[data-command="image-upload"]')?.ariaLabel).toBe("上传图片");
    dispatchDrop(editor, [new File(["content"], "broken.png", { type: "image/png" })]);
    await flushPromises();

    expect(editor.getValue()).toBe("![上传失败：broken.png](pd-editor-upload-1)");
    editor.destroy();
  });

  it("reports progress and completion", async () => {
    const parent = document.createElement("div");
    const updates: Array<{ status: string; progress: number }> = [];
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          handler: async (_file, { reportProgress }) => {
            reportProgress(42);
            return "https://cdn.example.com/progress.png";
          },
          onStatusChange: ({ status, progress }) => updates.push({ status, progress }),
        }),
      ],
    });

    dispatchDrop(editor, [new File(["content"], "progress.png", { type: "image/png" })]);
    await flushPromises();

    expect(updates).toEqual([
      { status: "uploading", progress: 0 },
      { status: "uploading", progress: 42 },
      { status: "success", progress: 100 },
    ]);
    editor.destroy();
  });

  it("cancels an upload and ignores a late result", async () => {
    const parent = document.createElement("div");
    let resolveUpload: ((url: string) => void) | undefined;
    let cancel: (() => void) | undefined;
    let signal: AbortSignal | undefined;
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          handler: (_file, context) => new Promise<string>((resolve) => {
            signal = context.signal;
            resolveUpload = resolve;
          }),
          onStatusChange: (update) => { cancel = update.cancel ?? cancel; },
        }),
      ],
    });

    dispatchDrop(editor, [new File(["content"], "cancel.png", { type: "image/png" })]);
    cancel?.();
    expect(signal?.aborted).toBe(true);
    resolveUpload?.("https://cdn.example.com/late.png");
    await flushPromises();

    expect(editor.getValue()).toBe("![Upload cancelled: cancel.png](pd-editor-upload-1)");
    editor.destroy();
  });

  it("retries a failed upload", async () => {
    const parent = document.createElement("div");
    let attempt = 0;
    let retry: (() => void) | undefined;
    const editor = new MarkdownEditor({
      parent,
      toolbar: false,
      plugins: [
        imageUploadPlugin({
          handler: async () => {
            attempt += 1;
            if (attempt === 1) throw new Error("first attempt failed");
            return "https://cdn.example.com/retried.png";
          },
          onStatusChange: (update) => { retry = update.retry ?? retry; },
        }),
      ],
    });

    dispatchDrop(editor, [new File(["content"], "retry.png", { type: "image/png" })]);
    await flushPromises();
    retry?.();
    await flushPromises();

    expect(attempt).toBe(2);
    expect(editor.getValue()).toBe("![retry.png](https://cdn.example.com/retried.png)");
    editor.destroy();
  });
});
