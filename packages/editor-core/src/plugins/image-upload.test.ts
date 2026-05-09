import { describe, expect, it } from "vitest";
import { MarkdownEditor } from "../editor";
import { imageUploadPlugin } from "./image-upload";

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
    expect(editor.getValue()).toBe("![Upload failed: broken.png]()");

    editor.destroy();
  });
});
