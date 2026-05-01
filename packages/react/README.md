# pd-editor-react

[![npm](https://img.shields.io/npm/v/pd-editor-react?color=06b6d4&label=npm)](https://www.npmjs.com/package/pd-editor-react)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/LaoChen1994/pd-markdown-editor)

A polished React Markdown editor with **CodeMirror 6**, live preview, `pd-markdown-ui` typography, image upload, TOC, toolbar commands, and TypeScript-first APIs.

Designed for product docs, CMS editors, AI writing tools, admin dashboards, developer portals, note-taking apps, and any React interface that needs a serious Markdown editing experience without building the editor stack from scratch.

## Highlights

- ⚛️ **React-first adapter** - controlled/uncontrolled component plus `useMarkdownEditor` for custom shells.
- 🚀 **Powered by CodeMirror 6** - fast editing, history, search, folding, completions, Markdown syntax support.
- 👀 **Three preview modes** - `edit`, `split`, and `preview`.
- 🎨 **Beautiful Markdown preview** - rendered through `pd-markdown` + `pd-markdown-ui`.
- 🧠 **Markdown-aware typing** - continue lists/tasks/quotes on `Enter`, indent/outdent with `Tab`.
- ⌨️ **Rich shortcuts** - formatting, headings, links, lists, quote, save, and typing flow.
- 🧰 **Toolbar included** - default toolbar, custom toolbar, plugin toolbar items.
- 🖼️ **Image upload plugin** - paste and drag image upload through `pd-editor-core`.
- 🧭 **TOC plugin** - live heading navigation with stable parser-generated ids.
- 🧩 **Composable extension model** - custom CodeMirror extensions, custom preview renderers, runtime plugins.
- 🧱 **Headless entry** - opt out of automatic styles and import CSS manually.
- 🌓 **Light/dark themes** - consistent editor and preview appearance.

## Install

```bash
pnpm add pd-editor-react pd-editor-core react react-dom tailwindcss
# npm install pd-editor-react pd-editor-core react react-dom tailwindcss
# yarn add pd-editor-react pd-editor-core react react-dom tailwindcss
```

`react`, `react-dom`, and `tailwindcss` are peer dependencies so your application owns framework and Tailwind versions.

## Zero-Cost Quick Start

```tsx
import { useState } from "react";
import { MarkdownEditor } from "pd-editor-react";

export const App = () => {
  const [value, setValue] = useState("# Hello pd-editor-react");

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      theme="light"
      preview="split"
      height={640}
      placeholder="Write Markdown..."
    />
  );
};
```

The default entry imports the editor preview styles for you:

```tsx
import { MarkdownEditor } from "pd-editor-react";
```

For full CSS control, use the headless entry:

```tsx
import { MarkdownEditor } from "pd-editor-react/headless";
import "pd-editor-react/styles.css";
```

When using Tailwind, make sure your content config can see `pd-shad-ui` / `pd-markdown-ui` classes:

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/pd-shad-ui/**/*.{js,ts,jsx,tsx}",
    "./node_modules/pd-markdown-ui/**/*.{js,ts,jsx,tsx}",
  ],
};
```

## Feature Matrix

| Area | Support |
| --- | --- |
| Component mode | Controlled `value`, uncontrolled `defaultValue` |
| Preview | `edit`, `split`, `preview` |
| Styling | Styled root entry, headless entry, explicit `styles.css` |
| Markdown UI | Headings, paragraphs, lists, task lists, code, table, blockquote, heading ids |
| Toolbar | Built-in toolbar, custom toolbar items, plugin toolbar items |
| Plugins | `imageUploadPlugin`, `tocPlugin`, custom plugins |
| Commands | Formatting, headings, lists, quote, code, link, image, table, horizontal rule |
| Runtime controls | `theme`, `readOnly`, controlled value sync |
| Advanced | CodeMirror extensions, custom preview component map |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | - | Controlled Markdown value |
| `defaultValue` | `string` | `""` | Initial value for uncontrolled usage |
| `onChange` | `(value: string) => void` | - | Called after content changes |
| `onSave` | `(value: string) => void` | - | Called by `Ctrl/Cmd+S` |
| `theme` | `"light" \| "dark"` | `"light"` | Editor and preview theme |
| `placeholder` | `string` | - | CodeMirror placeholder |
| `readOnly` | `boolean` | `false` | Prevent user and command edits |
| `height` | `string \| number` | `"500px"` | Editor container height |
| `preview` | `"edit" \| "preview" \| "split"` | `"edit"` | View mode |
| `toolbar` | `boolean \| ToolbarItem[]` | `true` | Built-in toolbar, hidden toolbar, or custom items |
| `plugins` | `EditorPlugin[]` | `[]` | Core plugins |
| `extensions` | `Extension[]` | `[]` | CodeMirror 6 extensions |
| `renderComponentMap` | `Partial<ComponentMap>` | - | Override Markdown preview components |
| `className` | `string` | `""` | Outer container class |
| `style` | `React.CSSProperties` | `{}` | Outer container style |

## Preview Modes

```tsx
<MarkdownEditor preview="edit" />
<MarkdownEditor preview="split" />
<MarkdownEditor preview="preview" value={markdown} />
```

`split` mode keeps the editor and preview side-by-side. `preview` mode renders Markdown without mounting the editor.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd+B` | Bold |
| `Ctrl/Cmd+I` | Italic |
| `Ctrl/Cmd+K` | Link |
| `Ctrl/Cmd+Shift+X` | Strikethrough |
| `Ctrl/Cmd+Alt+1` | Heading 1 |
| `Ctrl/Cmd+Alt+2` | Heading 2 |
| `Ctrl/Cmd+Alt+3` | Heading 3 |
| `Ctrl/Cmd+Shift+7` | Ordered list |
| `Ctrl/Cmd+Shift+8` | Bullet list |
| `Ctrl/Cmd+Shift+9` | Quote |
| `Ctrl/Cmd+S` | `onSave` |
| `Enter` | Continue list/task/ordered/quote block |
| `Tab` | Indent Markdown block |
| `Shift+Tab` | Outdent Markdown block |

## Toolbar Commands

The default toolbar includes:

`bold`, `italic`, `strikethrough`, `heading1`, `heading2`, `heading3`, `unorderedList`, `orderedList`, `taskList`, `link`, `image`, `quote`, `code`, `codeBlock`, `table`, `horizontalRule`.

Disable it:

```tsx
<MarkdownEditor toolbar={false} />
```

Custom toolbar:

```tsx
import type { ToolbarItem } from "pd-editor-core";

const toolbar: ToolbarItem[] = [
  { command: "bold", label: "Bold", icon: "<strong>B</strong>", shortcut: "Ctrl+B" },
  { command: "heading2", label: "H2", icon: "<span>H2</span>" },
  { command: "divider", label: "", icon: "", divider: true },
  { command: "link", label: "Link", icon: "<span>🔗</span>", shortcut: "Ctrl+K" },
];

<MarkdownEditor toolbar={toolbar} />;
```

Custom toolbar `icon` values are trusted HTML from your application code. Do not pass untrusted user content into `icon`.

## Plugins

### Image Upload

```tsx
import { useMemo, useState } from "react";
import { MarkdownEditor } from "pd-editor-react";
import { imageUploadPlugin } from "pd-editor-core";

export const EditorWithUpload = () => {
  const [value, setValue] = useState("");

  const plugins = useMemo(() => [
    imageUploadPlugin({
      maxSize: 5 * 1024 * 1024,
      handler: async (file) => {
        const form = new FormData();
        form.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });

        const data = await response.json() as { url: string };
        return data.url;
      },
    }),
  ], []);

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      plugins={plugins}
      preview="split"
    />
  );
};
```

### Table Of Contents

```tsx
import { useEffect, useRef, useState } from "react";
import { MarkdownEditor } from "pd-editor-react";
import { tocPlugin, type EditorPlugin } from "pd-editor-core";

export const EditorWithToc = () => {
  const tocRef = useRef<HTMLDivElement>(null);
  const [plugins, setPlugins] = useState<EditorPlugin[]>([]);

  useEffect(() => {
    if (tocRef.current) {
      setPlugins([tocPlugin({ container: tocRef.current, maxLevel: 3 })]);
    }
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16 }}>
      <MarkdownEditor defaultValue="# Intro" preview="split" height={640} plugins={plugins} />
      <div ref={tocRef} />
    </div>
  );
};
```

## Custom Preview Rendering

React preview uses `pd-markdown/web` mdast component keys. Override only what you need:

```tsx
import type { ComponentMap } from "pd-markdown/web";

const renderComponentMap: Partial<ComponentMap> = {
  heading: ({ node, children }) => {
    const Tag = `h${node.depth}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const id = typeof node.data?.id === "string" ? node.data.id : undefined;
    return <Tag id={id} data-heading>{children}</Tag>;
  },
  blockquote: ({ children }) => (
    <blockquote className="my-callout">{children}</blockquote>
  ),
};

<MarkdownEditor renderComponentMap={renderComponentMap} preview="split" />;
```

Common keys include `heading`, `paragraph`, `list`, `listItem`, `table`, `tableRow`, `tableCell`, `code`, `inlineCode`, and `blockquote`.

## Hook API

Use `useMarkdownEditor` when you want to build a completely custom shell around the core editor:

```tsx
import { useMarkdownEditor } from "pd-editor-react";

export const CustomShell = () => {
  const { containerRef, getValue, executeCommand } = useMarkdownEditor({
    initialValue: "# Custom shell",
    onChange: (value) => console.log(value),
  });

  const logValue = () => {
    console.log(getValue());
  };

  return (
    <>
      <button type="button" onClick={() => executeCommand("bold")}>Bold</button>
      <button type="button" onClick={logValue}>Log</button>
      <div ref={containerRef} style={{ height: 500 }} />
    </>
  );
};
```

Initialization options are read when the editor mounts. Recreate the hook owner if you need to change structural options such as plugins or extensions.

## SSR / Next.js

The editor requires a browser DOM. In SSR frameworks, render it from a client boundary.

```tsx
"use client";

import { MarkdownEditor } from "pd-editor-react";

export const ClientMarkdownEditor = () => (
  <MarkdownEditor defaultValue="# Client only" preview="split" />
);
```

## FAQ

### Do I need to import CSS?

If you import `pd-editor-react`, base preview styles are included automatically. If you import `pd-editor-react/headless`, import `pd-editor-react/styles.css` yourself.

### Why do some `pd-*` classes look unstyled?

Make sure Tailwind scans `pd-shad-ui` and `pd-markdown-ui` in `node_modules`, because the preview UI uses Tailwind-powered `pd-*` utilities.

### Can I use it as a controlled component?

Yes. Pass `value` and `onChange`. For one-time initial content, use `defaultValue`.

### Can I hide preview or toolbar?

Yes. Use `preview="edit"` and `toolbar={false}`.

### Can I customize Markdown preview components?

Yes. Use `renderComponentMap` with `pd-markdown/web` mdast keys.

### Can I access the underlying editor?

Use `useMarkdownEditor` for direct access to the core editor ref. The component API is intentionally higher-level.

### Is this only for docs sites?

No. It works well for CMS fields, support dashboards, AI writing surfaces, changelog editors, internal tools, product docs, and note apps.

## Related Packages

- `pd-editor-core` - Framework-agnostic CodeMirror editor core.
- `pd-editor-vue` - Vue 3 adapter.
- `pd-markdown` - Markdown parser/renderer.
- `pd-markdown-ui` - Styled Markdown preview primitives.

## License

MIT
