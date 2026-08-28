import React, { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "pd-markdown/web";
import { MarkdownEditorComponent, markdownUiComponentMap } from "./MarkdownEditor";
import type { MarkdownEditorHandle } from "./MarkdownEditor";
import type { MarkdownEditorInstance } from "pd-editor-core";

const mermaidInitialize = vi.hoisted(() => vi.fn());

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidInitialize,
    render: async () => ({ svg: "<svg>diagram</svg>" }),
  },
}));

describe("React markdown UI adapter", () => {
  it("maps mdast nodes to pd-markdown-ui components", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        source={"# Hello\n\n- item\n\n| A |\n| - |\n| B |"}
        components={markdownUiComponentMap}
      />
    );

    expect(html).toContain('id="hello"');
    expect(html).toContain("pd-scroll-m-20");
    expect(html).toContain("pd-list-disc");
    expect(html).toContain("<th");
  });

  it("renders inline and block math in the markdown preview", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        source={"Inline math: $a + b = c$\n\n$$\nE = mc^2\n$$"}
        components={markdownUiComponentMap}
      />
    );

    expect(html).toContain("katex");
    expect(html).not.toContain("$a + b = c$");
    expect(html).not.toContain("$$");
  });

  it("does not render raw HTML in the markdown preview", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        source={"Before\n\n<div onclick=\"alert(1)\">raw</div>\n\nAfter"}
        components={markdownUiComponentMap}
      />
    );

    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("raw");
  });

  it("does not call onChange when a controlled value changes externally", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onChange = vi.fn();

    document.body.appendChild(container);

    await act(async () => {
      root.render(<MarkdownEditorComponent value="first" onChange={onChange} preview="split" />);
    });

    onChange.mockClear();

    await act(async () => {
      root.render(<MarkdownEditorComponent value="second" onChange={onChange} preview="split" />);
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("second");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("uses the latest onChange callback without recreating the editor", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();
    const capturedEditor: { current: MarkdownEditorInstance | null } = { current: null };

    document.body.appendChild(container);

    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          defaultValue="first"
          onChange={firstOnChange}
          plugins={[{ name: "capture", install: (instance) => { capturedEditor.current = instance; } }]}
        />
      );
    });

    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          defaultValue="first"
          onChange={secondOnChange}
          plugins={[{ name: "capture", install: (instance) => { capturedEditor.current = instance; } }]}
        />
      );
    });

    if (!capturedEditor.current) {
      throw new Error("Expected capture plugin to receive the editor instance.");
    }
    capturedEditor.current.setValue("typed");
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledWith("typed");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("preserves the editor instance and history across preview mode changes", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const capturedEditors: MarkdownEditorInstance[] = [];
    const plugin = {
      name: "capture-preview-editor",
      install: (instance: MarkdownEditorInstance) => {
        capturedEditors.push(instance);
      },
    };

    document.body.appendChild(container);

    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue="first" preview="preview" plugins={[plugin]} />);
    });

    expect(capturedEditors).toHaveLength(0);

    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue="first" preview="edit" plugins={[plugin]} />);
    });

    capturedEditors[0].setValue("changed");

    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue="first" preview="preview" plugins={[plugin]} />);
    });
    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue="first" preview="split" plugins={[plugin]} />);
    });

    expect(capturedEditors).toHaveLength(1);
    expect(container.querySelector(".cm-editor")).not.toBeNull();
    expect(container.textContent).toContain("changed");

    capturedEditors[0].executeCommand("undo");
    expect(capturedEditors[0].getValue()).toBe("first");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("updates preview-only content when a controlled value changes", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          value="# First"
          preview="preview"
        />
      );
    });

    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          value="# Second"
          preview="preview"
        />
      );
    });

    expect(container.textContent).toContain("Second");
    expect(container.textContent).not.toContain("First");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("does not render the core toolbar when toolbar is false", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue="content" toolbar={false} />);
    });

    expect(container.querySelector(".pd-editor-toolbar")).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("syncs split preview scroll with the editor", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    await act(async () => {
      root.render(<MarkdownEditorComponent defaultValue={"# Title\n\n".repeat(80)} preview="split" />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector(".cm-scroller")).not.toBeNull();
    });

    const editorScroller = container.querySelector<HTMLElement>(".cm-scroller");
    const previewPane = container.querySelector<HTMLElement>(".pd-md-preview");

    if (!editorScroller || !previewPane) {
      throw new Error("Expected split editor and preview panes.");
    }

    expect(container.querySelector(".pd-editor-react")?.getAttribute("data-preview")).toBe("split");

    Object.defineProperty(editorScroller, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(editorScroller, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(previewPane, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(previewPane, "clientHeight", { configurable: true, value: 200 });

    editorScroller.scrollTop = 400;
    editorScroller.dispatchEvent(new Event("scroll"));

    expect(previewPane.scrollTop).toBe(200);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders mermaid code blocks with the dynamic component", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          value={"```mermaid\ngraph TD\n  A --> B\n```"}
          preview="preview"
        />
      );
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(container.querySelector(".pd-rendered-mermaid svg")).not.toBeNull();
      });
    });
    expect(mermaidInitialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict" }));

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("updates maxLength and labels and exposes export actions", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const editor = createRef<MarkdownEditorHandle>();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    document.body.appendChild(container);
    await act(async () => {
      root.render(
        <MarkdownEditorComponent
          ref={editor}
          defaultValue="# Hello"
          maxLength={20}
          labels={{ bold: "加粗" }}
          preview="split"
        />
      );
    });

    expect(container.querySelector('[aria-label="加粗"]')).not.toBeNull();
    expect(editor.current?.getCharacterCount()).toBe(7);
    await editor.current?.copyMarkdown();
    await editor.current?.copyHtml();
    expect(writeText).toHaveBeenNthCalledWith(1, "# Hello");
    expect(writeText.mock.calls[1][0]).toContain("Hello");

    await act(async () => {
      root.render(<MarkdownEditorComponent ref={editor} defaultValue="# Hello" maxLength={3} preview="split" />);
    });
    expect(editor.current?.getValue()).toBe("# H");
    expect(container.querySelector(".pd-md-preview")?.textContent).toContain("H");
    expect(container.querySelector(".pd-md-preview")?.textContent).not.toContain("Hello");

    await act(async () => root.unmount());
    container.remove();
  });
});
