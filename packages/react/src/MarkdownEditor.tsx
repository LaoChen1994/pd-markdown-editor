import React, { useRef, useEffect, useImperativeHandle, useState } from "react";
import {
  copyHtml as copyHtmlToClipboard,
  copyMarkdown as copyMarkdownToClipboard,
  downloadMarkdown as downloadMarkdownFile,
  MarkdownEditor as CoreEditor,
} from "pd-editor-core";
import { MarkdownRenderer } from "pd-markdown/web";
import katex from "katex";

import type { EditorLabels, EditorPlugin, ToolbarItem, Extension, MarkdownCodeLanguages } from "pd-editor-core";
import type { ComponentMap } from "pd-markdown/web";

const styledTag = (tag: React.ElementType, baseClass: string): React.FC<React.HTMLAttributes<HTMLElement>> =>
  ({ className = "", ...props }) => React.createElement(tag, { ...props, className: `${baseClass} ${className}` });

export const markdownUiComponents = {
  h1: styledTag("h1", "pd-scroll-m-20 pd-text-4xl pd-font-extrabold pd-tracking-tight lg:pd-text-5xl pd-mb-6"),
  h2: styledTag("h2", "pd-scroll-m-20 pd-border-b pd-pb-2 pd-text-3xl pd-font-semibold pd-tracking-tight pd-first:mt-0 pd-mt-10 pd-mb-4"),
  h3: styledTag("h3", "pd-scroll-m-20 pd-text-2xl pd-font-semibold pd-tracking-tight pd-mt-8 pd-mb-4"),
  h4: styledTag("h4", "pd-scroll-m-20 pd-text-xl pd-font-semibold pd-tracking-tight pd-mt-6 pd-mb-2"),
  h5: styledTag("h5", "pd-scroll-m-20 pd-text-lg pd-font-semibold pd-tracking-tight pd-mt-4 pd-mb-2"),
  h6: styledTag("h6", "pd-scroll-m-20 pd-text-base pd-font-semibold pd-tracking-tight pd-mt-4 pd-mb-2"),
  p: styledTag("p", "pd-leading-7 [&:not(:first-child)]:pd-mt-6 pd-mb-4"),
  blockquote: styledTag("blockquote", "pd-mt-6 pd-border-l-2 pd-pl-6 pd-italic"),
  ul: styledTag("ul", "pd-my-6 pd-ml-6 pd-list-disc [&>li]:pd-mt-2"),
  ol: styledTag("ol", "pd-my-6 pd-ml-6 pd-list-decimal [&>li]:pd-mt-2"),
  li: styledTag("li", "pd-leading-7"),
  table: styledTag("table", "pd-my-6 pd-w-full pd-overflow-hidden pd-rounded-md"),
  thead: styledTag("thead", "pd-bg-muted"),
  tbody: styledTag("tbody", "pd-divide-y pd-divide-border"),
  tfoot: styledTag("tfoot", "pd-bg-muted pd-font-medium"),
  tr: styledTag("tr", "pd-m-0 pd-border-t pd-p-0 even:pd-bg-muted/50"),
  th: styledTag("th", "pd-border pd-px-4 pd-py-2 pd-text-left pd-font-bold [&[align=center]]:pd-text-center [&[align=right]]:pd-text-right"),
  td: styledTag("td", "pd-border pd-px-4 pd-py-2 pd-text-left [&[align=center]]:pd-text-center [&[align=right]]:pd-text-right"),
  pre: styledTag("pre", "pd-pre-wrapper"),
  code: styledTag("code", "pd-relative pd-rounded pd-bg-muted pd-px-[0.3rem] pd-py-[0.2rem] pd-font-mono pd-text-sm pd-font-semibold"),
};

const renderMath = (value: string, displayMode: boolean): string => {
  try {
    return katex.renderToString(value, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return value;
  }
};

const renderTextWithMath = (value: string, keyPrefix: string): React.ReactNode[] => {
  const blockMatch = value.match(/^\s*\$\$([\s\S]+?)\$\$\s*$/);
  if (blockMatch) {
    return [
      React.createElement("span", {
        key: `${keyPrefix}-block`,
        dangerouslySetInnerHTML: { __html: renderMath(blockMatch[1].trim(), true) },
      }),
    ];
  }

  const parts: React.ReactNode[] = [];
  const mathPattern = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    parts.push(
      React.createElement("span", {
        key: `${keyPrefix}-inline-${index}`,
        dangerouslySetInnerHTML: { __html: renderMath(match[1].trim(), false) },
      })
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [value];
};

const renderChildrenWithMath = (children: React.ReactNode): React.ReactNode[] =>
  React.Children.toArray(children).flatMap((child, index) => (
    typeof child === "string" ? renderTextWithMath(child, `math-${index}`) : [child]
  ));

export const markdownUiComponentMap: Partial<ComponentMap> = {
  heading: ({ node, children }) => {
    const tag = `h${node.depth}` as keyof typeof markdownUiComponents;
    const Heading = markdownUiComponents[tag] ?? tag;
    const data = node.data as { id?: unknown } | undefined;
    const id = typeof data?.id === "string" ? data.id : undefined;
    return React.createElement(Heading as React.ElementType, { id }, children);
  },
  paragraph: ({ children }) => (
    React.createElement(markdownUiComponents.p, null, renderChildrenWithMath(children))
  ),
  list: ({ node, children }) => {
    const List = node.ordered ? markdownUiComponents.ol : markdownUiComponents.ul;
    const start = node.ordered && node.start != null && node.start !== 1 ? node.start : undefined;
    return React.createElement(List as React.ElementType, { start }, children);
  },
  listItem: ({ node, children }) => {
    if (typeof node.checked === "boolean") {
      return React.createElement(markdownUiComponents.li, { className: "task-list-item" }, [
        React.createElement("input", { key: "checkbox", type: "checkbox", checked: node.checked, readOnly: true }),
        React.createElement("span", { key: "content" }, children),
      ]);
    }
    return React.createElement(markdownUiComponents.li, null, children);
  },
  table: ({ children }) => React.createElement(markdownUiComponents.table, null, children),
  tableRow: ({ isHeader, children }) => {
    const row = React.createElement(markdownUiComponents.tr, null, children);
    return isHeader ? React.createElement(markdownUiComponents.thead, null, row) : row;
  },
  tableCell: ({ node, children }) => {
    const Cell = node.data?.isHeader ? markdownUiComponents.th : markdownUiComponents.td;
    const align = node.data?.align ?? undefined;
    return React.createElement(Cell as React.ElementType, { align }, children);
  },
  code: ({ node }) => {
    const className = node.lang ? `language-${node.lang}` : undefined;
    return React.createElement(
      markdownUiComponents.pre,
      null,
      React.createElement(markdownUiComponents.code, { className }, node.value)
    );
  },
  inlineCode: ({ node }) => React.createElement(markdownUiComponents.code, null, node.value),
  blockquote: ({ children }) => React.createElement(markdownUiComponents.blockquote, null, children),
};

let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "strict",
      });
      return m.default;
    });
  }
  return mermaidPromise;
};

export const MermaidRenderer: React.FC<{ value: string; theme?: "light" | "dark" }> = ({ value, theme }) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const renderDiagram = async () => {
      try {
        const m = await loadMermaid();
        if (!active) return;
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const isDark = theme === "dark";
        m.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "base",
          securityLevel: "strict",
          fontFamily: "Inter, system-ui, sans-serif",
          themeVariables: isDark ? {
            background: "#0d1117",
            primaryColor: "#21262d",
            primaryTextColor: "#c9d1d9",
            primaryBorderColor: "#30363d",
            lineColor: "#8b949e",
            secondaryColor: "#161b22",
            tertiaryColor: "#0d1117",
            nodeBorder: "#30363d",
            mainBkg: "#21262d",
            textColor: "#c9d1d9",
          } : {
            background: "#ffffff",
            primaryColor: "#f6f8fa",
            primaryTextColor: "#24292f",
            primaryBorderColor: "#d0d7de",
            lineColor: "#57606a",
            secondaryColor: "#f6f8fa",
            tertiaryColor: "#ffffff",
            nodeBorder: "#d0d7de",
            mainBkg: "#f6f8fa",
            textColor: "#24292f",
          },
          flowchart: {
            htmlLabels: true,
            useWidth: true,
            curve: "basis",
          },
        });

        const { svg } = await m.render(id, value);
        if (active) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to render Mermaid diagram");
        }
      }
    };

    renderDiagram();
    return () => {
      active = false;
    };
  }, [value, theme]);

  if (error) {
    return (
      <div className="mermaid-error" style={{ color: "#f85149", padding: "12px", border: "1px solid #f85149", borderRadius: "6px", margin: "12px 0", background: "rgba(248, 81, 73, 0.1)" }}>
        <p style={{ margin: "0 0 6px 0" }}><strong>Mermaid rendering error:</strong></p>
        <pre style={{ whiteSpace: "pre-wrap", margin: "0" }}>{error}</pre>
      </div>
    );
  }

  if (!svgContent) {
    return <div className="mermaid-loading" style={{ padding: "12px", fontStyle: "italic", opacity: 0.7 }}>Rendering diagram...</div>;
  }

  return <div className="pd-rendered-mermaid" dangerouslySetInnerHTML={{ __html: svgContent }} style={{ display: "flex", justifyContent: "center", margin: "16px 0" }} />;
};


export interface MarkdownEditorProps {
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Change callback */
  onChange?: (value: string) => void;
  /** Save callback (Ctrl/Cmd+S) */
  onSave?: (value: string) => void;
  /** Theme */
  theme?: "light" | "dark";
  /** Placeholder text */
  placeholder?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** Maximum document length */
  maxLength?: number;
  /** Height of the editor */
  height?: string | number;
  /** View mode: edit only, preview only, or split */
  preview?: "edit" | "preview" | "split";
  /** Toolbar config */
  toolbar?: boolean | ToolbarItem[];
  /** Toolbar labels keyed by command */
  labels?: EditorLabels;
  /** Editor plugins. Read during editor initialization. */
  plugins?: EditorPlugin[];
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Custom CM6 extensions. Read during editor initialization. */
  extensions?: Extension[];
  /** Optional fenced code language resolver. Read during editor initialization. */
  codeLanguages?: MarkdownCodeLanguages;
  /** Custom component overrides for Markdown rendering */
  renderComponentMap?: Partial<ComponentMap>;
}

export interface MarkdownEditorHandle {
  getValue: () => string;
  getCharacterCount: () => number;
  focus: () => void;
  copyMarkdown: () => Promise<void>;
  /** Copies the currently mounted preview HTML. */
  copyHtml: () => Promise<void>;
  downloadMarkdown: (filename?: string) => void;
}

/**
 * MarkdownEditor React component
 *
 * Supports controlled (value+onChange) and uncontrolled (defaultValue) modes,
 * with optional split-view preview powered by pd-markdown + pd-markdown-ui.
 */
export const MarkdownEditorComponent = React.forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({
  value,
  defaultValue = "",
  onChange,
  onSave,
  theme = "light",
  placeholder,
  readOnly = false,
  maxLength,
  height = "500px",
  preview = "edit",
  toolbar = true,
  labels,
  plugins = [],
  className = "",
  style = {},
  extensions = [],
  codeLanguages,
  renderComponentMap,
}, ref) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CoreEditor | null>(null);
  const syncingScrollRef = useRef(false);
  const isControlled = value !== undefined;
  const latestValueRef = useRef(isControlled ? (value ?? "") : defaultValue);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const previewModeRef = useRef(preview);
  const [previewContent, setPreviewContent] = useState("");

  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  previewModeRef.current = preview;

  // Merge pd-markdown-ui components with user overrides
  const mergedComponents = React.useMemo(
    () => ({
      ...markdownUiComponentMap,
      code: ({ node }: { node: any }) => {
        if (node.lang?.toLowerCase() === "mermaid") {
          return <MermaidRenderer value={node.value ?? ""} theme={theme} />;
        }
        if (renderComponentMap?.code) {
          return renderComponentMap.code({ node });
        }
        const className = node.lang ? `language-${node.lang}` : undefined;
        return React.createElement(
          markdownUiComponents.pre,
          null,
          React.createElement(markdownUiComponents.code, { className }, node.value)
        );
      },
      ...renderComponentMap,
    }),
    [renderComponentMap, theme]
  );

  // Initialize editor
  useEffect(() => {
    if (!editorContainerRef.current) return;
    if (editorRef.current) return;
    if (preview === "preview") return; // No editor in preview-only mode

    const editor = new CoreEditor({
      parent: editorContainerRef.current,
      initialValue: isControlled ? value : latestValueRef.current,
      theme,
      onChange: (v) => {
        latestValueRef.current = v;
        onChangeRef.current?.(v);
        if (previewModeRef.current === "split") {
          setPreviewContent(v);
        }
      },
      onSave: (v) => onSaveRef.current?.(v),
      placeholder,
      readOnly,
      maxLength,
      extensions,
      codeLanguages,
      plugins,
      toolbar,
      labels,
    });

    editorRef.current = editor;
  }, [preview]);

  useEffect(() => {
    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    editorRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    editorRef.current?.setReadOnly(readOnly);
  }, [readOnly]);

  useEffect(() => {
    editorRef.current?.setMaxLength(maxLength);
  }, [maxLength]);

  useEffect(() => {
    editorRef.current?.setToolbar(toolbar, labels);
  }, [toolbar, labels]);

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() ?? latestValueRef.current,
    getCharacterCount: () => editorRef.current?.getCharacterCount() ?? latestValueRef.current.length,
    focus: () => editorRef.current?.focus(),
    copyMarkdown: () => copyMarkdownToClipboard(editorRef.current?.getValue() ?? latestValueRef.current),
    copyHtml: () => copyHtmlToClipboard(previewRef.current?.innerHTML ?? ""),
    downloadMarkdown: (filename) => downloadMarkdownFile(editorRef.current?.getValue() ?? latestValueRef.current, filename),
  }), []);

  // Sync controlled value
  useEffect(() => {
    if (isControlled && editorRef.current) {
      const current = editorRef.current.getValue();
      if (current !== value) {
        editorRef.current.setValue(value ?? "", { emitChange: false });
      }
      latestValueRef.current = editorRef.current.getValue();
      if (preview === "split") {
        setPreviewContent(editorRef.current.getValue());
      }
    }
  }, [value, isControlled, preview, maxLength]);

  // Keep preview content current when entering preview or split mode
  useEffect(() => {
    if (preview !== "edit") {
      const source = isControlled ? (value ?? "") : latestValueRef.current;
      const content = editorRef.current?.getValue()
        ?? (maxLength === undefined ? source : source.slice(0, Math.max(0, maxLength)));
      setPreviewContent(content);
    }
  }, [preview, value, isControlled, maxLength]);

  useEffect(() => {
    if (preview !== "split") return;
    const editorScroller = editorContainerRef.current?.querySelector<HTMLElement>(".cm-scroller");
    const previewPane = previewRef.current;
    if (!editorScroller || !previewPane) return;

    const syncPreview = () => {
      if (syncingScrollRef.current) return;
      syncingScrollRef.current = true;
      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      const previewMax = previewPane.scrollHeight - previewPane.clientHeight;
      previewPane.scrollTop = editorMax > 0 && previewMax > 0 ? (editorScroller.scrollTop / editorMax) * previewMax : 0;
      syncingScrollRef.current = false;
    };
    const syncEditor = () => {
      if (syncingScrollRef.current) return;
      syncingScrollRef.current = true;
      const previewMax = previewPane.scrollHeight - previewPane.clientHeight;
      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      editorScroller.scrollTop = previewMax > 0 && editorMax > 0 ? (previewPane.scrollTop / previewMax) * editorMax : 0;
      syncingScrollRef.current = false;
    };

    editorScroller.addEventListener("scroll", syncPreview);
    previewPane.addEventListener("scroll", syncEditor);
    return () => {
      editorScroller.removeEventListener("scroll", syncPreview);
      previewPane.removeEventListener("scroll", syncEditor);
    };
  }, [preview]);

  const computedHeight = typeof height === "number" ? `${height}px` : height;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    height: computedHeight,
    borderRadius: "8px",
    overflow: "hidden",
    border: `1px solid ${theme === "dark" ? "#30363d" : "#d1d9e0"}`,
    backgroundColor: theme === "dark" ? "#0d1117" : "#ffffff",
    ...style,
  };

  return (
    <div className={`pd-editor-react ${className}`} data-preview={preview} style={containerStyle}>
      <div
        ref={editorContainerRef}
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: preview === "preview" ? "none" : "flex",
          flexDirection: "column",
        }}
      />
      {(preview === "split" || preview === "preview") && (
        <div
          ref={previewRef}
          className={`pd-md-preview pd-md-theme-${theme}`}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "24px",
            borderLeft: preview === "split" ? `1px solid ${theme === "dark" ? "#30363d" : "#d1d9e0"}` : "none",
          }}
        >
          <MarkdownRenderer
            source={previewContent}
            components={mergedComponents}
          />
        </div>
      )}
    </div>
  );
});

MarkdownEditorComponent.displayName = "MarkdownEditor";
