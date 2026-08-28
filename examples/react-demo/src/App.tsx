import React, { useMemo, useRef, useState } from "react";
import {
  MarkdownEditor,
  codeHighlightPlugin,
  frontmatterPlugin,
  imageUploadPlugin,
  markdownLintPlugin,
  mathPlugin,
  mermaidPlugin,
  tocPlugin,
  enUS,
  zhCN,
} from "pd-editor-react";
import katex from "katex";
import type {
  CodeBlockInfo,
  FrontmatterResult,
  ImageUploadUpdate,
  MarkdownDiagnostic,
  MarkdownEditorHandle,
  MathExpression,
  MermaidDiagram,
} from "pd-editor-react";
import "./App.css";

const INITIAL_MD = `---
title: pd-editor launch note
published: true
adapter: React
version: 1.2
---

# Technical Markdown that stays portable

Build technical docs, AI writing tools, and CMS workflows without locking content into a proprietary format. The same Markdown renders diagrams, math, code, and structured metadata.

## Editing flow

- Continue list, quote, and task blocks with Enter.
- Switch between edit, split, and preview modes.
- Use plugins to inspect the document while people write.

## Code example

\`\`\`tsx
import { MarkdownEditor, markdownLintPlugin } from "pd-editor-react";

<MarkdownEditor
  value={content}
  onChange={setContent}
  preview="split"
  plugins={[markdownLintPlugin({ onDiagnostics: setDiagnostics })]}
/>;
\`\`\`

## Mermaid diagram

\`\`\`mermaid
graph TD
  Writer --> Editor
  Editor --> Plugins
  Plugins --> Preview
  Plugins --> Diagnostics
\`\`\`

## Math

Inline math: $a + b = c$

$$
E = mc^2
$$

## Lint examples

![](missing-alt.png)
[]()

### Skipped heading level
`;

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

const App = () => {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [content, setContent] = useState(INITIAL_MD);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [preview, setPreview] = useState<"edit" | "preview" | "split">("split");
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockInfo[]>([]);
  const [diagrams, setDiagrams] = useState<MermaidDiagram[]>([]);
  const [mathExpressions, setMathExpressions] = useState<MathExpression[]>([]);
  const [frontmatter, setFrontmatter] = useState<FrontmatterResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<MarkdownDiagnostic[]>([]);
  const [locale, setLocale] = useState<"en-US" | "zh-CN">("en-US");
  const [upload, setUpload] = useState<ImageUploadUpdate | null>(null);
  const [actionStatus, setActionStatus] = useState("");

  const plugins = useMemo(() => [
    tocPlugin(),
    codeHighlightPlugin({ onCodeBlocks: setCodeBlocks }),
    mermaidPlugin({ onDiagrams: setDiagrams }),
    mathPlugin({ onExpressions: setMathExpressions }),
    frontmatterPlugin({ onFrontmatter: setFrontmatter }),
    markdownLintPlugin({ onDiagnostics: setDiagnostics }),
    imageUploadPlugin({
      handler: async (file, { reportProgress }) => {
        reportProgress(100);
        return URL.createObjectURL(file);
      },
      onStatusChange: setUpload,
    }),
  ], []);

  return (
    <main className="demo-shell" data-theme={theme}>
      <section className="demo-hero" aria-labelledby="demo-title">
        <div className="demo-hero-copy">
          <p className="demo-kicker">pd-markdown-editor</p>
          <h1 id="demo-title">Technical Markdown for React and Vue.</h1>
          <p className="demo-lede">
            Build docs, AI writing tools, and CMS workflows with portable Markdown, live Mermaid diagrams, math, frontmatter, linting, and image upload.
          </p>
          <div className="demo-links" aria-label="Project links">
            <a href="https://github.com/LaoChen1994/pd-markdown-editor">Star on GitHub</a>
            <a href="https://www.npmjs.com/package/pd-editor-react">React npm</a>
            <a href="https://www.npmjs.com/package/pd-editor-vue">Vue npm</a>
          </div>
          <div className="demo-proof" aria-label="Editor highlights">
            <span>React + Vue + Core</span>
            <span>Mermaid strict mode</span>
            <span>Lint, TOC, upload</span>
          </div>
        </div>

        <div className="demo-controls" aria-label="Editor controls">
          <button type="button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}>
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button type="button" onClick={() => setLocale((value) => value === "en-US" ? "zh-CN" : "en-US")}>
            {locale === "en-US" ? "中文" : "English"}
          </button>
          {(["edit", "split", "preview"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={preview === mode}
              onClick={() => setPreview(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section className="demo-workbench" aria-label="Markdown editor playground">
        <div className="demo-editor-actions" aria-label="Document actions">
          <button type="button" onClick={async () => {
            try {
              await editorRef.current?.copyMarkdown();
              setActionStatus("Markdown copied");
            } catch {
              setActionStatus("Clipboard permission denied");
            }
          }}>Copy Markdown</button>
          <button type="button" disabled={preview === "edit"} onClick={async () => {
            try {
              await editorRef.current?.copyHtml();
              setActionStatus("HTML copied");
            } catch {
              setActionStatus("Clipboard permission denied");
            }
          }}>Copy HTML</button>
          <button type="button" onClick={() => editorRef.current?.downloadMarkdown("pd-editor-demo.md")}>Download .md</button>
          <span className="demo-character-count">{content.length.toLocaleString()} / 12,000</span>
          <span className="demo-action-status" role="status">{actionStatus}</span>
        </div>
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          onSave={(value) => window.alert("Saved draft length: " + value.length)}
          theme={theme}
          preview={preview}
          height="clamp(520px, 62vh, 720px)"
          placeholder="Start writing Markdown..."
          maxLength={12000}
          messages={locale === "zh-CN" ? zhCN : enUS}
          plugins={plugins}
          renderComponentMap={{
            blockquote: ({ children }) => (
              <blockquote className="demo-blockquote">
                {children}
              </blockquote>
            ),
          }}
        />
        {upload && (
          <div className="demo-upload-status" role="status">
            <span>{upload.file.name}</span>
            <strong>{upload.status}</strong>
            <progress max="100" value={upload.progress} />
            {upload.cancel && <button type="button" onClick={upload.cancel}>Cancel</button>}
            {upload.retry && <button type="button" onClick={upload.retry}>Retry</button>}
          </div>
        )}
      </section>

      <section className="demo-inspector" aria-label="Plugin output">
        <article className="demo-panel demo-panel-wide">
          <div className="demo-panel-header">
            <h2>Frontmatter</h2>
            <span>{Object.keys(frontmatter?.data ?? {}).length} fields</span>
          </div>
          <pre>{JSON.stringify(frontmatter?.data ?? {}, null, 2)}</pre>
        </article>

        <article className="demo-panel">
          <div className="demo-panel-header">
            <h2>Code Blocks</h2>
            <span>{codeBlocks.length}</span>
          </div>
          <p>{codeBlocks.map((block) => block.language || "plain").join(", ") || "None"}</p>
        </article>

        <article className="demo-panel">
          <div className="demo-panel-header">
            <h2>Mermaid</h2>
            <span>{diagrams.length}</span>
          </div>
          <p>{diagrams.map((diagram) => diagram.id).join(", ") || "None"}</p>
        </article>

        <article className="demo-panel demo-panel-wide">
          <div className="demo-panel-header">
            <h2>Math</h2>
            <span>{mathExpressions.length}</span>
          </div>
          {mathExpressions.length === 0 ? (
            <p>None</p>
          ) : (
            <div className="demo-math-list">
              {mathExpressions.map((expression, index) => (
                <div key={`${expression.type}-${index}`} className="demo-math-item">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMath(expression.value, expression.type === "block"),
                    }}
                  />
                  <code>{expression.raw}</code>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="demo-panel demo-panel-lint demo-panel-wide">
          <div className="demo-panel-header">
            <h2>Markdown Lint</h2>
            <span>{diagnostics.length}</span>
          </div>
          <div className="demo-lint-summary">
            <strong>{diagnostics.length === 0 ? "Ready to publish" : `${diagnostics.length} issues found`}</strong>
            <span>Alt text, empty links, heading jumps, and duplicate heading ids.</span>
          </div>
          {diagnostics.length === 0 ? (
            <p>No lint warnings in this draft.</p>
          ) : (
            <ul className="demo-diagnostics">
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.rule}-${index}`}>
                  <div className="demo-diagnostic-meta">
                    <strong>{diagnostic.severity}</strong>
                    <span>{diagnostic.position?.start.line ? `Line ${diagnostic.position.start.line}` : "Document"}</span>
                    <code>{diagnostic.rule}</code>
                  </div>
                  <p>{diagnostic.message}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
};

export default App;
