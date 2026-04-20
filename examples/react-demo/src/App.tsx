import React, { useState } from "react";
import { MarkdownEditor } from "pd-editor-react";

const INITIAL_MD = `# Welcome to pd-editor

This is a **Markdown editor** built with [CodeMirror 6](https://codemirror.net/).

## Features

- ✅ Rich toolbar with keyboard shortcuts
- ✅ Syntax highlighting
- ✅ Split-view preview
- ✅ Dark / Light themes
- ✅ Plugin system (image upload, TOC)

## Code Example

\`\`\`typescript
import { MarkdownEditor } from "pd-editor-react";

function App() {
  return <MarkdownEditor theme="light" preview="split" />;
}
\`\`\`

## Task List

- [x] Core editor engine
- [x] React adapter
- [x] Vue adapter
- [ ] More plugins

> Enjoy writing Markdown! 🎉
`;

function App() {
  const [content, setContent] = useState(INITIAL_MD);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [preview, setPreview] = useState<"edit" | "preview" | "split">("split");

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: theme === "dark" ? "#0d1117" : "#f0f2f5",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: "background-color 0.3s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: theme === "dark" ? "#e6edf3" : "#1f2328",
            margin: 0,
          }}>
            📝 pd-editor React Demo
          </h1>

          <div style={{ display: "flex", gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: `1px solid ${theme === "dark" ? "#30363d" : "#d1d9e0"}`,
                backgroundColor: theme === "dark" ? "#21262d" : "#ffffff",
                color: theme === "dark" ? "#e6edf3" : "#1f2328",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>

            {/* Preview mode */}
            {(["edit", "split", "preview"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPreview(mode)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: `1px solid ${theme === "dark" ? "#30363d" : "#d1d9e0"}`,
                  backgroundColor: preview === mode
                    ? (theme === "dark" ? "#58a6ff" : "#0969da")
                    : (theme === "dark" ? "#21262d" : "#ffffff"),
                  color: preview === mode
                    ? "#ffffff"
                    : (theme === "dark" ? "#e6edf3" : "#1f2328"),
                  cursor: "pointer",
                  fontSize: 14,
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <MarkdownEditor
          value={content}
          onChange={setContent}
          onSave={(v) => alert("Saved! Length: " + v.length)}
          theme={theme}
          preview={preview}
          height={600}
          placeholder="Start writing Markdown..."
        />
      </div>
    </div>
  );
}

export default App;
