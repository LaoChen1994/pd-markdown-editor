import { describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createParser } from "pd-markdown/parser";
import { MarkdownEditor, markdownUiComponents, renderAstNode } from "./MarkdownEditor";
import type { MarkdownEditorInstance } from "pd-editor-core";

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
    preview.value = "preview";
    await nextTick();
    preview.value = "split";
    await nextTick();

    expect(capturedEditors).toHaveLength(1);
    expect(container.querySelector(".cm-editor")).not.toBeNull();

    capturedEditors[0].executeCommand("undo");
    expect(capturedEditors[0].getValue()).toBe("first");

    app.unmount();
    container.remove();
  });

  it("syncs split preview scroll with the editor", async () => {
    const container = document.createElement("div");
    const app = createApp({
      setup: () => () => h(MarkdownEditor, {
        defaultValue: "# Title\n\n".repeat(80),
        preview: "split",
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
