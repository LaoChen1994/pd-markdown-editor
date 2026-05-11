import React, { useMemo, useState } from "react";
import {
  MarkdownEditor,
  codeHighlightPlugin,
  frontmatterPlugin,
  imageUploadPlugin,
  markdownLintPlugin,
  mathPlugin,
  mermaidPlugin,
  tocPlugin,
} from "pd-editor-react";
import katex from "katex";
import type {
  CodeBlockInfo,
  FrontmatterResult,
  MarkdownDiagnostic,
  MathExpression,
  MermaidDiagram,
} from "pd-editor-react";

const INITIAL_MD = `---
title: Plugin demo
published: true
order: 1
---

# Welcome to pd-editor

This demo shows the core content plugins working through editor callbacks.

## Code Example

\`\`\`typescript
import { MarkdownEditor, markdownLintPlugin } from "pd-editor-react";
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
graph TD
  Editor --> Plugin
  Plugin --> Diagnostics
\`\`\`

## Math

Inline math: $a + b = c$

$$
E = mc^2
$$

## Lint Examples

![](missing-alt.png)
[]()

### Skipped heading level
`;

const panelStyle = (isDark: boolean): React.CSSProperties => ({
  border: `1px solid ${isDark ? "#30363d" : "#d1d9e0"}`,
  borderRadius: 8,
  padding: 16,
  backgroundColor: isDark ? "#161b22" : "#ffffff",
  color: isDark ? "#e6edf3" : "#1f2328",
});

const labelStyle = (isDark: boolean): React.CSSProperties => ({
  margin: "0 0 8px",
  fontSize: 13,
  fontWeight: 700,
  color: isDark ? "#8b949e" : "#57606a",
  textTransform: "uppercase",
});

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

function App() {
  const [content, setContent] = useState(INITIAL_MD);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [preview, setPreview] = useState<"edit" | "preview" | "split">("split");
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockInfo[]>([]);
  const [diagrams, setDiagrams] = useState<MermaidDiagram[]>([]);
  const [mathExpressions, setMathExpressions] = useState<MathExpression[]>([]);
  const [frontmatter, setFrontmatter] = useState<FrontmatterResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<MarkdownDiagnostic[]>([]);
  const isDark = theme === "dark";

  const plugins = useMemo(() => [
    tocPlugin(),
    codeHighlightPlugin({ onCodeBlocks: setCodeBlocks }),
    mermaidPlugin({ onDiagrams: setDiagrams }),
    mathPlugin({ onExpressions: setMathExpressions }),
    frontmatterPlugin({ onFrontmatter: setFrontmatter }),
    markdownLintPlugin({ onDiagnostics: setDiagnostics }),
    imageUploadPlugin({
      handler: async (file) => URL.createObjectURL(file),
    }),
  ], []);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: isDark ? "#0d1117" : "#f0f2f5",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: "background-color 0.3s ease",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: isDark ? "#e6edf3" : "#1f2328",
            margin: 0,
          }}>
            pd-editor React Demo
          </h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: `1px solid ${isDark ? "#30363d" : "#d1d9e0"}`,
                backgroundColor: isDark ? "#21262d" : "#ffffff",
                color: isDark ? "#e6edf3" : "#1f2328",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>

            {(["edit", "split", "preview"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPreview(mode)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#30363d" : "#d1d9e0"}`,
                  backgroundColor: preview === mode
                    ? (isDark ? "#58a6ff" : "#0969da")
                    : (isDark ? "#21262d" : "#ffffff"),
                  color: preview === mode
                    ? "#ffffff"
                    : (isDark ? "#e6edf3" : "#1f2328"),
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

        <MarkdownEditor
          value={content}
          onChange={setContent}
          onSave={(v) => alert("Saved! Length: " + v.length)}
          theme={theme}
          preview={preview}
          height={620}
          placeholder="Start writing Markdown..."
          plugins={plugins}
          renderComponentMap={{
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: "4px solid #0969da", paddingLeft: 16 }}>
                {children}
              </blockquote>
            ),
          }}
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}>
          <section style={panelStyle(isDark)}>
            <h2 style={labelStyle(isDark)}>Frontmatter</h2>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(frontmatter?.data ?? {}, null, 2)}</pre>
          </section>

          <section style={panelStyle(isDark)}>
            <h2 style={labelStyle(isDark)}>Code Blocks</h2>
            <p style={{ margin: 0 }}>{codeBlocks.map((block) => block.language).join(", ") || "None"}</p>
          </section>

          <section style={panelStyle(isDark)}>
            <h2 style={labelStyle(isDark)}>Mermaid</h2>
            <p style={{ margin: 0 }}>{diagrams.map((diagram) => diagram.id).join(", ") || "None"}</p>
          </section>

          <section style={panelStyle(isDark)}>
            <h2 style={labelStyle(isDark)}>Math</h2>
            {mathExpressions.length === 0 ? (
              <p style={{ margin: 0 }}>None</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {mathExpressions.map((expression, index) => (
                  <div key={`${expression.type}-${index}`}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderMath(expression.value, expression.type === "block"),
                      }}
                    />
                    <code style={{ fontSize: 12 }}>{expression.raw}</code>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={panelStyle(isDark)}>
            <h2 style={labelStyle(isDark)}>Lint Diagnostics</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.rule}-${index}`}>{diagnostic.rule}: {diagnostic.message}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
