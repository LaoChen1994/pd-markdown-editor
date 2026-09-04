import { describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createParser } from "pd-markdown/parser";
import { MarkdownEditor, markdownUiComponents, renderAstNode } from "./MarkdownEditor";
import type { MarkdownEditorInstance } from "pd-editor-core";
import type { MarkdownEditorHandle } from "./MarkdownEditor";

describe("Vue markdown UI renderer", () => {
  it("preserves table header, alignment, heading id, and task item semantics", async () => {
    const ast = createParser().parse("# Hello\n\n- [x] done\n\n| A | B |\n| :- | -: |\n| C | D |");
    const rendered = renderAstNode(ast as unknown as Parameters<typeof renderAstNode>[0], markdownUiComponents, "root");
    const app = createSSRApp({
      render: () => h("div", Array.isArray(rendered) ? rendered : [rendered]),
    });

    const html = await renderToString(app);

    expect(html).toContain('id="hello"');
    expect(html).toContain("<thead");
    expect(html).toContain("<th");
    expect(html).toContain('align="left"');
    expect(html).toContain('align="right"');
    expect(html).toContain("task-list-item");
  });

  it("renders inline and block math in the markdown preview", async () => {
    const ast = createParser().parse("Inline math: $a + b = c$\n\n$$\nE = mc^2\n$$");
    const rendered = renderAstNode(ast as unknown as Parameters<typeof renderAstNode>[0], markdownUiComponents, "root");
    const app = createSSRApp({
      render: () => h("div", Array.isArray(rendered) ? rendered : [rendered]),
    });

    const html = await renderToString(app);

    expect(html).toContain("katex");
    expect(html).not.toContain("$a + b = c$");
    expect(html).not.toContain("$$");
  });

  it("does not render raw HTML in the markdown preview", async () => {
    const ast = createParser().parse("Before\n\n<div onclick=\"alert(1)\">raw</div>\n\nAfter");
    const rendered = renderAstNode(ast as unknown as Parameters<typeof renderAstNode>[0], markdownUiComponents, "root");
    const app = createSSRApp({
      render: () => h("div", Array.isArray(rendered) ? rendered : [rendered]),
    });

    const html = await renderToString(app);

    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("raw");
  });

  it("does not emit update:modelValue when a controlled value changes externally", async () => {
    const container = document.createElement("div");
    const model = ref("first");
    const onUpdate = vi.fn();
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        modelValue: model.value,
        "onUpdate:modelValue": onUpdate,
        preview: "split",
      }),
    });

    document.body.appendChild(container);
    app.mount(container);

    onUpdate.mockClear();
    model.value = "second";
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(container.textContent).toContain("second");

    app.unmount();
    container.remove();
  });

  it("does not render raw HTML through the component preview", async () => {
    const container = document.createElement("div");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        modelValue: "Before\n\n<img src=x onerror=alert(1)>\n\nAfter",
        preview: "preview",
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    expect(container.textContent).toContain("Before");
    expect(container.textContent).toContain("After");
    expect(container.querySelector("img")).toBeNull();

    app.unmount();
    container.remove();
  });

  it("does not render the core toolbar when toolbar is false", async () => {
    const container = document.createElement("div");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        defaultValue: "content",
        toolbar: false,
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    expect(container.querySelector(".pd-editor-toolbar")).toBeNull();

    app.unmount();
    container.remove();
  });

  it("preserves the editor instance and history across preview mode changes", async () => {
    const container = document.createElement("div");
    const preview = ref<"edit" | "preview" | "split">("edit");
    const capturedEditors: MarkdownEditorInstance[] = [];
    const plugin = {
      name: "capture-preview-editor",
      install: (instance: MarkdownEditorInstance) => {
        capturedEditors.push(instance);
      },
    };
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        defaultValue: "first",
        preview: preview.value,
        plugins: [plugin],
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    capturedEditors[0].setValue("changed");
    const editorNode = container.querySelector(".cm-editor");
    preview.value = "preview";
    await nextTick();
    await nextTick();
    expect(container.querySelector(".cm-editor")).toBe(editorNode);
    await vi.waitFor(() => {
      expect(container.querySelector(".pd-md-preview")?.textContent).toBe("changed");
    });
    preview.value = "split";
    await nextTick();
    await nextTick();

    expect(capturedEditors).toHaveLength(1);
    expect(container.querySelector(".cm-editor")).toBe(editorNode);

    capturedEditors[0].executeCommand("undo");
    expect(capturedEditors[0].getValue()).toBe("first");

    app.unmount();
    container.remove();
  });

  it("keeps maxLength applied when switching preview modes", async () => {
    const container = document.createElement("div");
    const preview = ref<"edit" | "preview" | "split">("preview");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        modelValue: "# Hello",
        maxLength: 3,
        preview: preview.value,
      }),
    });
    document.body.appendChild(container);
    app.mount(container);
    try {
      for (const mode of ["preview", "edit", "split", "preview"] as const) {
        preview.value = mode;
        await nextTick();
        await nextTick();
        if (mode === "edit") {
          expect(container.querySelector(".cm-content")?.textContent).toBe("# H");
        } else {
          expect(container.querySelector(".pd-md-preview")?.textContent).toBe("H");
        }
      }
    } finally {
      app.unmount();
      container.remove();
    }
  });

  it("syncs split preview scroll with the editor", async () => {
    const container = document.createElement("div");
    const preview = ref<"preview" | "split">("split");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        defaultValue: "# Title\n\n".repeat(80),
        preview: preview.value,
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    await vi.waitFor(() => {
      expect(container.querySelector(".cm-scroller")).not.toBeNull();
    });

    const editorScroller = container.querySelector<HTMLElement>(".cm-scroller");
    const previewPane = container.querySelector<HTMLElement>(".pd-md-preview");

    if (!editorScroller || !previewPane) {
      throw new Error("Expected split editor and preview panes.");
    }

    expect(container.querySelector(".pd-editor-vue")?.getAttribute("data-preview")).toBe("split");

    Object.defineProperty(editorScroller, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(editorScroller, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(previewPane, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(previewPane, "clientHeight", { configurable: true, value: 200 });

    editorScroller.scrollTop = 400;
    editorScroller.dispatchEvent(new Event("scroll"));

    expect(previewPane.scrollTop).toBe(200);

    preview.value = "preview";
    await nextTick();
    await nextTick();
    previewPane.scrollTop = 100;
    previewPane.dispatchEvent(new Event("scroll"));
    expect(editorScroller.scrollTop).toBe(400);

    preview.value = "split";
    await nextTick();
    await nextTick();
    previewPane.scrollTop = 100;
    previewPane.dispatchEvent(new Event("scroll"));
    expect(editorScroller.scrollTop).toBe(200);

    app.unmount();
    container.remove();
  });

  it("renders loading placeholder or MermaidRenderer inside Vue markdown preview component", async () => {
    const container = document.createElement("div");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        modelValue: "```mermaid\ngraph TD\n  A --> B\n```",
        preview: "preview",
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    expect(container.querySelector(".mermaid-loading")).not.toBeNull();

    app.unmount();
    container.remove();
  });

  it.each([true, false])("keeps preview-only exports in sync (controlled: %s)", async (controlled) => {
    const container = document.createElement("div");
    const writeText = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:preview");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const actions = ref<MarkdownEditorHandle | null>(null);
    const model = ref("first content");
    const limit = ref<number | undefined>(5);
    const preview = ref<"preview" | "split">("preview");
    const onUpdate = vi.fn();
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        ref: actions,
        modelValue: controlled ? model.value : undefined,
        defaultValue: model.value,
        maxLength: limit.value,
        preview: preview.value,
        "onUpdate:modelValue": onUpdate,
      }),
    });
    document.body.appendChild(container);
    app.mount(container);
    try {
      for (const [value, maxLength, expected] of [
        ["first content", 5, "first"],
        ["second content", 5, controlled ? "secon" : "first"],
        ["second content", 3, controlled ? "sec" : "fir"],
        ["second content", undefined, controlled ? "second content" : "fir"],
        ["", undefined, controlled ? "" : "fir"],
        ["last content", 0, ""],
        ["tail content", 4, controlled ? "tail" : ""],
      ] as const) {
        model.value = value;
        limit.value = maxLength;
        await nextTick();
        expect(container.querySelector(".cm-editor")).toBeNull();
        expect(container.querySelector(".pd-md-preview")?.textContent).toBe(expected);
        expect(actions.value?.getValue()).toBe(expected);
        expect(actions.value?.getCharacterCount()).toBe(expected.length);
        await actions.value?.copyMarkdown();
        expect(writeText).toHaveBeenLastCalledWith(expected);
        actions.value?.downloadMarkdown("preview.md");
        const blob = createObjectURL.mock.calls.at(-1)?.[0];
        if (!blob) throw new Error("Expected a Markdown download.");
        expect(blob.type).toBe("text/markdown;charset=utf-8");
        const downloaded = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(blob);
        });
        expect(downloaded).toBe(expected);
      }
      expect(onUpdate).not.toHaveBeenCalled();
      preview.value = "split";
      await nextTick();
      await nextTick();
      await vi.waitFor(() => {
        expect(container.querySelector(".cm-editor")).not.toBeNull();
        expect(actions.value?.getValue()).toBe(controlled ? "tail" : "");
        expect(container.querySelector(".pd-md-preview")?.textContent).toBe(controlled ? "tail" : "");
      });
    } finally {
      app.unmount();
      container.remove();
      click.mockRestore();
    }
  });

  it("updates maxLength and labels and exposes export actions", async () => {
    const container = document.createElement("div");
    const maxLength = ref(20);
    const actions = ref<{
      getValue: () => string;
      getCharacterCount: () => number;
      copyMarkdown: () => Promise<void>;
      copyHtml: () => Promise<void>;
    } | null>(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        ref: actions,
        defaultValue: "# Hello",
        maxLength: maxLength.value,
        labels: { bold: "加粗" },
        preview: "split",
      }),
    });

    document.body.appendChild(container);
    app.mount(container);
    await nextTick();

    expect(container.querySelector('[aria-label="加粗"]')).not.toBeNull();
    expect(actions.value?.getCharacterCount()).toBe(7);
    await actions.value?.copyMarkdown();
    await actions.value?.copyHtml();
    expect(writeText).toHaveBeenNthCalledWith(1, "# Hello");
    expect(writeText.mock.calls[1][0]).toContain("Hello");

    maxLength.value = 3;
    await nextTick();
    expect(actions.value?.getValue()).toBe("# H");
    expect(container.querySelector(".pd-md-preview")?.textContent).toContain("H");
    expect(container.querySelector(".pd-md-preview")?.textContent).not.toContain("Hello");

    app.unmount();
    container.remove();
  });
});
