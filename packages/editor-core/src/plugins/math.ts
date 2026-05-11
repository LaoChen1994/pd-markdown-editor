import type { EditorPlugin, MarkdownEditorInstance } from "../types";

export interface MathExpression {
  type: "inline" | "block";
  value: string;
  raw: string;
  from: number;
  to: number;
}

export interface MathPluginOptions {
  /** Enable inline $...$ scanning, default true */
  inline?: boolean;
  /** Enable block $$...$$ scanning, default true */
  block?: boolean;
  /** Called when math expressions are collected */
  onExpressions?: (expressions: MathExpression[], editor: MarkdownEditorInstance) => void;
}

const isEscaped = (source: string, index: number): boolean => {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
};

const collectBlockMath = (markdown: string): MathExpression[] => {
  const expressions: MathExpression[] = [];
  const blockPattern = /(^|\n)(\$\$)(?:\n)?([\s\S]*?)(?:\n)?\$\$(?=\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(markdown))) {
    const from = match.index + match[1].length;
    const raw = markdown.slice(from, blockPattern.lastIndex);
    expressions.push({
      type: "block",
      value: match[3].trim(),
      raw,
      from,
      to: blockPattern.lastIndex,
    });
  }

  return expressions;
};

const collectInlineMath = (markdown: string, blockExpressions: MathExpression[]): MathExpression[] => {
  const expressions: MathExpression[] = [];
  const isInsideBlock = (index: number): boolean =>
    blockExpressions.some((expression) => index >= expression.from && index < expression.to);

  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown[index] !== "$" || markdown[index + 1] === "$" || isEscaped(markdown, index) || isInsideBlock(index)) {
      continue;
    }

    for (let end = index + 1; end < markdown.length; end += 1) {
      if (markdown[end] !== "$" || markdown[end + 1] === "$" || isEscaped(markdown, end)) {
        continue;
      }

      const value = markdown.slice(index + 1, end);
      if (value.trim().length > 0 && !value.includes("\n")) {
        expressions.push({
          type: "inline",
          value: value.trim(),
          raw: markdown.slice(index, end + 1),
          from: index,
          to: end + 1,
        });
      }
      index = end;
      break;
    }
  }

  return expressions;
};

export const extractMathExpressions = (
  markdown: string,
  options: Pick<MathPluginOptions, "inline" | "block"> = {}
): MathExpression[] => {
  const blockExpressions = options.block === false ? [] : collectBlockMath(markdown);
  const inlineExpressions = options.inline === false ? [] : collectInlineMath(markdown, blockExpressions);
  return [...blockExpressions, ...inlineExpressions].sort((a, b) => a.from - b.from);
};

export const mathPlugin = (options: MathPluginOptions = {}): EditorPlugin => {
  const notify = (editor: MarkdownEditorInstance): void => {
    options.onExpressions?.(extractMathExpressions(editor.getValue(), options), editor);
  };

  return {
    name: "math",
    install(editor) {
      notify(editor);
    },
    onUpdate({ editor }) {
      notify(editor);
    },
  };
};
