import React, { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "pd-markdown/web";
import { MarkdownEditorComponent, markdownUiComponentMap } from "./MarkdownEditor";
import type { MarkdownEditorInstance } from "pd-editor-core";

vi.mock("mermaid", () => ({
  default: {
    initialize: () => undefined,
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

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
