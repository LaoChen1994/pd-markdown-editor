import { describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createParser } from "pd-markdown/parser";
import { MarkdownEditor, markdownUiComponents, renderAstNode } from "./MarkdownEditor";

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
});
