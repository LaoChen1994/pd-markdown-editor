import React, { useRef, useEffect, useState } from "react";
import { MarkdownEditor as CoreEditor } from "pd-editor-core";
import { MarkdownRenderer } from "pd-markdown";

import type { EditorPlugin, ToolbarItem, Extension } from "pd-editor-core";

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
}

/**
 * MarkdownEditor React component
 *
 * Supports controlled (value+onChange) and uncontrolled (defaultValue) modes,
 * with optional split-view preview.
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
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CoreEditor | null>(null);

  const rendererRef = useRef<MarkdownRenderer>(new MarkdownRenderer());
  const isControlled = value !== undefined;
  const [previewHtml, setPreviewHtml] = useState("");

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
          setPreviewHtml(rendererRef.current.render(v));
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
      setPreviewHtml(rendererRef.current.render(initVal));
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
      setPreviewHtml(rendererRef.current.render(content));
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
          ref={previewContainerRef}
          className={`pd-md-preview pd-md-theme-${theme}`}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "24px",
            borderLeft: preview === "split" ? `1px solid ${theme === "dark" ? "#30363d" : "#d1d9e0"}` : "none",
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
};
