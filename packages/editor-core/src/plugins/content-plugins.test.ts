import { describe, expect, it } from "vitest";
import type { MarkdownEditorInstance } from "../types";
import { codeHighlightPlugin, extractCodeBlocks } from "./code-highlight";
import { frontmatterPlugin, parseFrontmatter } from "./frontmatter";
import { lintMarkdown, markdownLintPlugin } from "./markdown-lint";
import { extractMathExpressions, mathPlugin } from "./math";
import { createMermaidElement, extractMermaidDiagrams, mermaidPlugin } from "./mermaid";

const createEditor = (value: string): MarkdownEditorInstance => ({
  getValue: () => value,
  setValue: () => undefined,
  focus: () => undefined,
  canExecute: () => true,
  getCommandState: () => ({ active: false, enabled: true }),
  isActive: () => false,
  executeCommand: () => undefined,
  setReadOnly: () => undefined,
  use: () => createEditor(value),
  unuse: () => createEditor(value),
  replaceSelection: () => undefined,
  wrapSelection: () => undefined,
  getSelection: () => "",
  insertAtCursor: () => undefined,
});

describe("content plugins", () => {
  it("extracts code blocks while leaving mermaid blocks to the mermaid plugin", () => {
    const blocks = extractCodeBlocks("```mermaid\ngraph TD\n```\n\n```ts\nconst value = 1;\n```");

    expect(blocks).toEqual([
      expect.objectContaining({
        language: "ts",
        value: "const value = 1;",
        className: "language-ts",
      }),
    ]);
  });

  it("notifies code block updates through the editor plugin lifecycle", () => {
    const seen: string[][] = [];
    const plugin = codeHighlightPlugin({
      onCodeBlocks: (blocks) => {
        seen.push(blocks.map((block) => block.language));
      },
    });

    plugin.install?.(createEditor("```js\nconst value = 1;\n```"));
    plugin.onUpdate?.({ value: "```ts\nconst value = 1;\n```", editor: createEditor("```ts\nconst value = 1;\n```") });

    expect(seen).toEqual([["js"], ["ts"]]);
  });

  it("extracts mermaid diagrams and creates a safe diagram element", () => {
    const diagrams = extractMermaidDiagrams("```mermaid\ngraph TD\n  A-->B\n```", { idPrefix: "diagram" });
    const element = createMermaidElement(diagrams[0]);

    expect(diagrams).toEqual([
      expect.objectContaining({ id: "diagram-1", value: "graph TD\n  A-->B" }),
    ]);
    expect(element.id).toBe("diagram-1");
    expect(element.textContent).toBe("graph TD\n  A-->B");
  });

  it("notifies mermaid diagram updates through the editor plugin lifecycle", () => {
    const counts: number[] = [];
    const plugin = mermaidPlugin({
      onDiagrams: (diagrams) => {
        counts.push(diagrams.length);
      },
    });

    plugin.install?.(createEditor("no diagrams"));
    plugin.onUpdate?.({ value: "```mermaid\ngraph TD\n```", editor: createEditor("```mermaid\ngraph TD\n```") });

    expect(counts).toEqual([0, 1]);
  });

  it("extracts inline and block math expressions", () => {
    const expressions = extractMathExpressions("Inline $a + b$.\n\n$$\nc = d\n$$");

    expect(expressions).toEqual([
      expect.objectContaining({ type: "inline", value: "a + b", raw: "$a + b$" }),
      expect.objectContaining({ type: "block", value: "c = d" }),
    ]);
  });

  it("notifies math expression updates through the editor plugin lifecycle", () => {
    const counts: number[] = [];
    const plugin = mathPlugin({
      onExpressions: (expressions) => {
        counts.push(expressions.length);
      },
    });

    plugin.install?.(createEditor("$x$"));
    plugin.onUpdate?.({ value: "$x$ and $y$", editor: createEditor("$x$ and $y$") });

    expect(counts).toEqual([1, 2]);
  });

  it("parses frontmatter data and returns the remaining markdown body", () => {
    const result = parseFrontmatter("---\ntitle: Test\npublished: true\norder: 3\n---\n\n# Body");

    expect(result.data).toEqual({ title: "Test", published: true, order: 3 });
    expect(result.body).toBe("# Body");
    expect(result.errors).toEqual([]);
  });

  it("notifies frontmatter updates through the editor plugin lifecycle", () => {
    const titles: unknown[] = [];
    const plugin = frontmatterPlugin({
      onFrontmatter: (result) => {
        titles.push(result.data.title);
      },
    });

    plugin.install?.(createEditor("---\ntitle: First\n---"));
    plugin.onUpdate?.({ value: "---\ntitle: Second\n---", editor: createEditor("---\ntitle: Second\n---") });

    expect(titles).toEqual(["First", "Second"]);
  });

  it("reports common markdown lint diagnostics", () => {
    const diagnostics = lintMarkdown("# One\n\n### Jump\n\n# One\n\n![](image.png)\n[]()");

    expect(diagnostics.map((diagnostic) => diagnostic.rule)).toEqual([
      "image-alt",
      "empty-link",
      "heading-increment",
      "duplicate-heading-id",
    ]);
  });

  it("notifies markdown lint diagnostics through the editor plugin lifecycle", () => {
    const counts: number[] = [];
    const plugin = markdownLintPlugin({
      rules: ["empty-link"],
      onDiagnostics: (diagnostics) => {
        counts.push(diagnostics.length);
      },
    });

    plugin.install?.(createEditor("[ok](https://example.com)"));
    plugin.onUpdate?.({ value: "[]()", editor: createEditor("[]()") });

    expect(counts).toEqual([0, 1]);
  });
});
