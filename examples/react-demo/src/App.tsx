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
  const [actionStatus, setActionStatus] = useState<"" | "markdownCopied" | "htmlCopied" | "clipboardDenied">("");
  const isZh = locale === "zh-CN";

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
          <h1 id="demo-title">{isZh ? "面向 React 和 Vue 的技术型 Markdown 编辑器。" : "Technical Markdown for React and Vue."}</h1>
          <p className="demo-lede">
            {isZh
              ? "使用可移植的 Markdown 构建文档、AI 写作工具和 CMS，支持 Mermaid、数学公式、Frontmatter、Lint 和图片上传。"
              : "Build docs, AI writing tools, and CMS workflows with portable Markdown, live Mermaid diagrams, math, frontmatter, linting, and image upload."}
          </p>
          <div className="demo-links" aria-label={isZh ? "项目链接" : "Project links"}>
            <a href="https://github.com/LaoChen1994/pd-markdown-editor">{isZh ? "在 GitHub 点赞" : "Star on GitHub"}</a>
            <a href="https://www.npmjs.com/package/pd-editor-react">React npm</a>
            <a href="https://www.npmjs.com/package/pd-editor-vue">Vue npm</a>
          </div>
          <div className="demo-proof" aria-label={isZh ? "编辑器亮点" : "Editor highlights"}>
            <span>React + Vue + Core</span>
            <span>{isZh ? "Mermaid 严格模式" : "Mermaid strict mode"}</span>
            <span>{isZh ? "Lint、目录、上传" : "Lint, TOC, upload"}</span>
          </div>
        </div>

        <div className="demo-controls" aria-label={isZh ? "编辑器控制" : "Editor controls"}>
          <button type="button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}>
            {theme === "light" ? (isZh ? "深色" : "Dark") : (isZh ? "浅色" : "Light")}
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
              {isZh ? ({ edit: "编辑", split: "分屏", preview: "预览" } as const)[mode] : mode}
            </button>
          ))}
        </div>
      </section>

      <section className="demo-workbench" aria-label={isZh ? "Markdown 编辑器演示" : "Markdown editor playground"}>
        <div className="demo-editor-actions" aria-label={isZh ? "文档操作" : "Document actions"}>
          <button type="button" onClick={async () => {
            try {
              await editorRef.current?.copyMarkdown();
              setActionStatus("markdownCopied");
            } catch {
              setActionStatus("clipboardDenied");
            }
          }}>{isZh ? "复制 Markdown" : "Copy Markdown"}</button>
          <button type="button" disabled={preview === "edit"} onClick={async () => {
            try {
              await editorRef.current?.copyHtml();
              setActionStatus("htmlCopied");
            } catch {
              setActionStatus("clipboardDenied");
            }
          }}>{isZh ? "复制 HTML" : "Copy HTML"}</button>
          <button type="button" onClick={() => editorRef.current?.downloadMarkdown("pd-editor-demo.md")}>{isZh ? "下载 .md" : "Download .md"}</button>
          <span className="demo-character-count">{content.length.toLocaleString(isZh ? "zh-CN" : "en-US")} / 12,000</span>
          <span className="demo-action-status" role="status">{actionStatus ? ({
            markdownCopied: isZh ? "Markdown 已复制" : "Markdown copied",
            htmlCopied: isZh ? "HTML 已复制" : "HTML copied",
            clipboardDenied: isZh ? "剪贴板权限被拒绝" : "Clipboard permission denied",
          } as const)[actionStatus] : ""}</span>
        </div>
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          onSave={(value) => window.alert((isZh ? "草稿已保存，字符数：" : "Saved draft length: ") + value.length)}
          theme={theme}
          preview={preview}
          height="clamp(520px, 62vh, 720px)"
          placeholder={isZh ? "开始编写 Markdown..." : "Start writing Markdown..."}
          maxLength={12000}
          messages={isZh ? zhCN : enUS}
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
            <strong>{isZh ? ({ uploading: "上传中", success: "成功", error: "失败", cancelled: "已取消" } as const)[upload.status] : upload.status}</strong>
            <progress max="100" value={upload.progress} />
            {upload.cancel && <button type="button" onClick={upload.cancel}>{isZh ? "取消" : "Cancel"}</button>}
            {upload.retry && <button type="button" onClick={upload.retry}>{isZh ? "重试" : "Retry"}</button>}
          </div>
        )}
      </section>

      <section className="demo-inspector" aria-label={isZh ? "插件输出" : "Plugin output"}>
        <article className="demo-panel demo-panel-wide">
          <div className="demo-panel-header">
            <h2>Frontmatter</h2>
            <span>{Object.keys(frontmatter?.data ?? {}).length} {isZh ? "个字段" : "fields"}</span>
          </div>
          <pre>{JSON.stringify(frontmatter?.data ?? {}, null, 2)}</pre>
        </article>

        <article className="demo-panel">
          <div className="demo-panel-header">
            <h2>{isZh ? "代码块" : "Code Blocks"}</h2>
            <span>{codeBlocks.length}</span>
          </div>
          <p>{codeBlocks.map((block) => block.language || (isZh ? "纯文本" : "plain")).join(", ") || (isZh ? "无" : "None")}</p>
        </article>

        <article className="demo-panel">
          <div className="demo-panel-header">
            <h2>Mermaid</h2>
            <span>{diagrams.length}</span>
          </div>
          <p>{diagrams.map((diagram) => diagram.id).join(", ") || (isZh ? "无" : "None")}</p>
        </article>

        <article className="demo-panel demo-panel-wide">
          <div className="demo-panel-header">
            <h2>{isZh ? "数学公式" : "Math"}</h2>
            <span>{mathExpressions.length}</span>
          </div>
          {mathExpressions.length === 0 ? (
            <p>{isZh ? "无" : "None"}</p>
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
            <strong>{diagnostics.length === 0
              ? (isZh ? "可以发布" : "Ready to publish")
              : (isZh ? `发现 ${diagnostics.length} 个问题` : `${diagnostics.length} issues found`)}</strong>
            <span>{isZh ? "检查替代文本、空链接、标题跳级和重复标题 ID。" : "Alt text, empty links, heading jumps, and duplicate heading ids."}</span>
          </div>
          {diagnostics.length === 0 ? (
            <p>{isZh ? "当前草稿没有 Lint 警告。" : "No lint warnings in this draft."}</p>
          ) : (
            <ul className="demo-diagnostics">
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.rule}-${index}`}>
                  <div className="demo-diagnostic-meta">
                    <strong>{diagnostic.severity}</strong>
                    <span>{diagnostic.position?.start.line
                      ? (isZh ? `第 ${diagnostic.position.start.line} 行` : `Line ${diagnostic.position.start.line}`)
                      : (isZh ? "文档" : "Document")}</span>
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
