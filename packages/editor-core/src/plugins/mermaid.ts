import type { EditorPlugin, MarkdownEditorInstance } from "../types";
import type { MarkdownPosition } from "./ast";
import { parseMarkdown, visitMarkdownAst } from "./ast";

export interface MermaidDiagram {
  id: string;
  value: string;
  position?: MarkdownPosition;
}

export interface MermaidPluginOptions {
  /** Stable id prefix for rendered diagram containers */
  idPrefix?: string;
  /** Called when mermaid code blocks are collected */
  onDiagrams?: (diagrams: MermaidDiagram[], editor: MarkdownEditorInstance) => void;
}

export const extractMermaidDiagrams = (
  markdown: string,
  options: Pick<MermaidPluginOptions, "idPrefix"> = {}
): MermaidDiagram[] => {
  const idPrefix = options.idPrefix ?? "pd-mermaid";
  const diagrams: MermaidDiagram[] = [];

  visitMarkdownAst(parseMarkdown(markdown), (node) => {
    if (node.type !== "code" || node.lang?.toLowerCase() !== "mermaid") return;

    diagrams.push({
      id: `${idPrefix}-${diagrams.length + 1}`,
      value: node.value ?? "",
      position: node.position,
    });
  });

  return diagrams;
};

export const createMermaidElement = (diagram: MermaidDiagram): HTMLElement => {
  const element = document.createElement("div");
  element.className = "pd-editor-mermaid";
  element.id = diagram.id;
  element.textContent = diagram.value;
  return element;
};

export const mermaidPlugin = (options: MermaidPluginOptions = {}): EditorPlugin => {
  const notify = (editor: MarkdownEditorInstance): void => {
    options.onDiagrams?.(extractMermaidDiagrams(editor.getValue(), options), editor);
  };

  return {
    name: "mermaid",
    install(editor) {
      notify(editor);
    },
    onUpdate({ editor }) {
      notify(editor);
    },
  };
};
