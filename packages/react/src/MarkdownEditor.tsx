import React, { useRef, useEffect, useState } from "react";
import { MarkdownEditor as CoreEditor } from "pd-editor-core";
import { MarkdownRenderer } from "pd-markdown/web";
import { components as mdUiComponents } from "pd-markdown-ui";

import type { EditorPlugin, ToolbarItem, Extension } from "pd-editor-core";
import type { ComponentMap } from "pd-markdown/web";

export const markdownUiComponentMap: Partial<ComponentMap> = {
  heading: ({ node, children }) => {
    const tag = `h${node.depth}` as keyof typeof mdUiComponents;
    const Heading = mdUiComponents[tag] ?? tag;
    const data = node.data as { id?: unknown } | undefined;
    const id = typeof data?.id === "string" ? data.id : undefined;
    return React.createElement(Heading as React.ElementType, { id }, children);
  },
  paragraph: ({ children }) => React.createElement(mdUiComponents.p as React.ElementType, null, children),
  list: ({ node, children }) => {
    const List = node.ordered ? mdUiComponents.ol : mdUiComponents.ul;
    const start = node.ordered && node.start != null && node.start !== 1 ? node.start : undefined;
    return React.createElement(List as React.ElementType, { start }, children);
  },
  listItem: ({ node, children }) => {
    if (typeof node.checked === "boolean") {
      return React.createElement(mdUiComponents.li as React.ElementType, { className: "task-list-item" }, [
        React.createElement("input", { key: "checkbox", type: "checkbox", checked: node.checked, readOnly: true }),
        React.createElement("span", { key: "content" }, children),
      ]);
    }
    return React.createElement(mdUiComponents.li as React.ElementType, null, children);
  },
  table: ({ children }) => React.createElement(mdUiComponents.table as React.ElementType, null, children),
  tableRow: ({ isHeader, children }) => {
    const row = React.createElement(mdUiComponents.tr as React.ElementType, null, children);
    return isHeader ? React.createElement(mdUiComponents.thead as React.ElementType, null, row) : row;
  },
  tableCell: ({ node, children }) => {
    const Cell = node.data?.isHeader ? mdUiComponents.th : mdUiComponents.td;
    const align = node.data?.align ?? undefined;
    return React.createElement(Cell as React.ElementType, { align }, children);
  },
  code: ({ node }) => {
    const className = node.lang ? `language-${node.lang}` : undefined;
    return React.createElement(
      mdUiComponents.pre as React.ElementType,
      null,
      React.createElement(mdUiComponents.code as React.ElementType, { className }, node.value)
    );
  },
  inlineCode: ({ node }) => React.createElement(mdUiComponents.code as React.ElementType, null, node.value),
  blockquote: ({ children }) => React.createElement(mdUiComponents.blockquote as React.ElementType, null, children),
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
  /** Height of the editor */
  height?: string | number;
  /** View mode: edit only, preview only, or split */
  preview?: "edit" | "preview" | "split";
  /** Toolbar config */
  toolbar?: boolean | ToolbarItem[];
  /** Editor plugins */
  plugins?: EditorPlugin[];
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Custom CM6 extensions */
  extensions?: Extension[];
  /** Custom component overrides for Markdown rendering */
  renderComponentMap?: Partial<ComponentMap>;
}

/**
 * MarkdownEditor React component
 *
 * Supports controlled (value+onChange) and uncontrolled (defaultValue) modes,
 * with optional split-view preview powered by pd-markdown + pd-markdown-ui.
 */
export const MarkdownEditorComponent: React.FC<MarkdownEditorProps> = ({
  value,
  defaultValue = "",
  onChange,
  onSave,
  theme = "light",
  placeholder,
  readOnly = false,
  height = "500px",
  preview = "edit",
  toolbar = true,
  plugins = [],
  className = "",
  style = {},
  extensions = [],
  renderComponentMap,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CoreEditor | null>(null);

  const isControlled = value !== undefined;
  const [previewContent, setPreviewContent] = useState("");

  // Merge pd-markdown-ui components with user overrides
  const mergedComponents = React.useMemo(
    () => ({ ...markdownUiComponentMap, ...renderComponentMap }),
    [renderComponentMap]
  );

  // Initialize editor
  useEffect(() => {
    if (!editorContainerRef.current) return;
    if (preview === "preview") return; // No editor in preview-only mode

    const editor = new CoreEditor({
      parent: editorContainerRef.current,
      initialValue: isControlled ? value : defaultValue,
      theme,
      onChange: (v) => {
        onChange?.(v);
        if (preview === "split") {
          setPreviewContent(v);
        }
      },
      onSave,
      placeholder,
      readOnly,
      extensions,
      plugins,
      toolbar,
    });

    editorRef.current = editor;

    // Initial preview
    if (preview === "split") {
      const initVal = isControlled ? (value ?? "") : defaultValue;
      setPreviewContent(initVal);
    }

    return () => {
      editor.destroy();
      editorRef.current = null;
    };

  }, [theme, readOnly, preview]);

  // Sync controlled value
  useEffect(() => {
    if (isControlled && editorRef.current) {
      const current = editorRef.current.getValue();
      if (current !== value) {
        editorRef.current.setValue(value ?? "");
      }
    }
  }, [value, isControlled]);

  // Preview-only mode
  useEffect(() => {
    if (preview === "preview") {
      const content = isControlled ? (value ?? "") : defaultValue;
      setPreviewContent(content);
    }
  }, [preview, value, defaultValue, isControlled]);

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
    <div className={`pd-editor-react ${className}`} style={containerStyle}>
      {preview !== "preview" && (
        <div
          ref={editorContainerRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        />
      )}
      {(preview === "split" || preview === "preview") && (
        <div
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
};
