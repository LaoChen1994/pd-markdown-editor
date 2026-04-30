import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "pd-markdown/web";
import { markdownUiComponentMap } from "./MarkdownEditor";

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
});

