import { describe, expect, it } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { components } from "pd-markdown-ui/vue";
import { createParser } from "pd-markdown/parser";
import { MarkdownEditor, renderAstNode } from "./MarkdownEditor";

describe("Vue markdown UI renderer", () => {
  it("preserves table header, alignment, heading id, and task item semantics", async () => {
    const ast = createParser().parse("# Hello\n\n- [x] done\n\n| A | B |\n| :- | -: |\n| C | D |");
    const rendered = renderAstNode(ast as unknown as Parameters<typeof renderAstNode>[0], components, "root");
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

  it("remounts the editor when switching from preview back to edit mode", async () => {
    const container = document.createElement("div");
    const preview = ref<"edit" | "preview">("edit");
    const app = createApp({
      render: () => h(MarkdownEditor, {
        modelValue: "# Hello",
        preview: preview.value,
        toolbar: false,
      }),
    });

    app.mount(container);
    await nextTick();

    expect(container.querySelector(".cm-editor")).not.toBeNull();

    preview.value = "preview";
    await nextTick();
    await nextTick();

    expect(container.querySelector(".cm-editor")).toBeNull();

    preview.value = "edit";
    await nextTick();
    await nextTick();

    expect(container.querySelector(".cm-editor")).not.toBeNull();

    app.unmount();
  });
});
