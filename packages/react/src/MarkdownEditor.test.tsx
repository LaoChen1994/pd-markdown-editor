import React from "react";
import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "pd-markdown/web";
import { MarkdownEditorComponent, markdownUiComponentMap } from "./MarkdownEditor";

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

  it("keeps split preview synced with controlled value changes", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<MarkdownEditorComponent value="# First" preview="split" toolbar={false} />);
    });

    expect(container.querySelector(".pd-md-preview")?.textContent).toContain("First");

    await act(async () => {
      root.render(<MarkdownEditorComponent value="# Second" preview="split" toolbar={false} />);
    });

    expect(container.querySelector(".pd-md-preview")?.textContent).toContain("Second");

    await act(async () => {
      root.unmount();
    });
  });
});
