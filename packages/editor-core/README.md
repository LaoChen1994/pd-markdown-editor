# pd-editor-core

[![npm](https://img.shields.io/npm/v/pd-editor-core?color=0ea5e9&label=npm)](https://www.npmjs.com/package/pd-editor-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![CodeMirror 6](https://img.shields.io/badge/CodeMirror-6-111827)](https://codemirror.net/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/LaoChen1994/pd-markdown-editor)

Framework-agnostic Markdown editor engine powered by **CodeMirror 6**.  
Use it directly in vanilla JavaScript, or as the foundation for `pd-editor-react` and `pd-editor-vue`.

`pd-editor-core` focuses on the hard editor work: selection-safe Markdown commands, polished typing flow, plugin lifecycle, image upload, TOC, themes, toolbar state, and CodeMirror extension interop.

## Why It Feels Good

- 🚀 **High-performance editor core** - CodeMirror 6 editor state, transactions, history, search, folding, completion, and Markdown language support.
- 🧠 **Markdown-aware typing** - `Enter`, `Tab`, and `Shift+Tab` understand lists, tasks, ordered lists, and quotes.
- 🧩 **Plugin system** - install plugins at creation time or dynamically with `editor.use()` / `editor.unuse()`.
- 🖼️ **Image upload plugin** - paste and drag images, insert upload placeholders, replace with final URLs.
- 🧭 **TOC plugin** - live heading extraction using parser-generated stable heading ids.
- 🛠️ **Built-in toolbar** - formatting, lists, links, image, quote, code, table, and horizontal rule.
- 🌓 **Light/dark themes** - GitHub-inspired defaults with CSS variable hooks.
- 🎯 **Command state API** - power active/disabled toolbar states with `isActive`, `canExecute`, and `getCommandState`.
- 🔌 **CodeMirror-native extension escape hatch** - pass your own CM6 extensions when you need low-level control.
- 🧱 **Framework independent** - no React/Vue dependency in core.

## Install

```bash
pnpm add pd-editor-core
# npm install pd-editor-core
# yarn add pd-editor-core
```

## 30-Second Usage

```ts
import { MarkdownEditor } from "pd-editor-core";

const editor = new MarkdownEditor({
  parent: document.querySelector("#editor")!,
  initialValue: "# Hello pd-editor-core",
  theme: "light",
  placeholder: "Start writing...",
  onChange: (value) => {
    console.log(value);
  },
  onSave: (value) => {
    console.log("save", value);
  },
});
```

```html
<div id="editor" style="height: 600px"></div>
```

## Feature Matrix

| Area | Included |
| --- | --- |
| Editing | Markdown language mode, history, search, folding, bracket matching, autocomplete |
| Commands | Bold, italic, strikethrough, heading 1-3, link, image, unordered/ordered/task list, quote, inline code, code block, table, horizontal rule, undo, redo |
| Typing flow | Continue list/task/ordered/quote on `Enter`; exit empty markers; indent/outdent block lines with `Tab` / `Shift+Tab` |
| Toolbar | Default toolbar, custom toolbar items, plugin-provided toolbar items |
| Plugins | Image upload, TOC, custom CM6 extensions, runtime install/remove |
| State | `getValue`, `setValue`, `getSelection`, `isActive`, `canExecute`, `getCommandState`, `setReadOnly`, `setTheme` |
| Packaging | ESM + CJS, TypeScript declarations, tree-shakeable JS |

## Keyboard Shortcuts

| Shortcut | Command |
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
| `Ctrl/Cmd+S` | `onSave` callback |
| `Enter` | Continue Markdown list/task/ordered/quote block |
| `Tab` | Indent Markdown block line |
| `Shift+Tab` | Outdent Markdown block line |

## Built-In Toolbar

The default toolbar includes:

`bold`, `italic`, `strikethrough`, `heading1`, `heading2`, `heading3`, `unorderedList`, `orderedList`, `taskList`, `link`, `image`, `quote`, `code`, `codeBlock`, `table`, `horizontalRule`.

Disable it:

```ts
const editor = new MarkdownEditor({
  parent,
  toolbar: false,
});
```

Provide your own:

```ts
import type { ToolbarItem } from "pd-editor-core";

const toolbar: ToolbarItem[] = [
  { command: "bold", label: "Bold", icon: "<strong>B</strong>", shortcut: "Ctrl+B" },
  { command: "quote", label: "Quote", icon: "<span>&gt;</span>" },
];

const editor = new MarkdownEditor({
  parent,
  toolbar,
});
```

Custom `icon` values are treated as trusted application HTML. Keep them internal to your app.

## Command API

```ts
editor.executeCommand("bold");
editor.executeCommand("heading2");
editor.executeCommand("table");

editor.isActive("bold"); // true/false
editor.canExecute("link"); // false when readOnly
editor.getCommandState("heading2"); // { active: boolean, enabled: boolean }
```

## Editor Instance API

```ts
editor.getValue();
editor.setValue("# Updated");
editor.focus();
editor.setTheme("dark");
editor.setReadOnly(true);
editor.replaceSelection("new text");
editor.wrapSelection("**", "**");
editor.getSelection();
editor.insertAtCursor("<!-- note -->");
editor.getEditorView(); // underlying CodeMirror EditorView
editor.destroy();
```

## Plugins

### Image Upload

Paste or drag image files into the editor. The plugin inserts a temporary Markdown image and replaces it when your upload handler resolves.

```ts
import { MarkdownEditor, imageUploadPlugin } from "pd-editor-core";

const editor = new MarkdownEditor({
  parent,
  plugins: [
    imageUploadPlugin({
      maxSize: 5 * 1024 * 1024,
      accept: ["image/png", "image/jpeg", "image/webp"],
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
  ],
});
```

Options:

| Option | Type | Default |
| --- | --- | --- |
| `handler` | `(file: File) => Promise<string>` | required |
| `accept` | `string[]` | `["image/*"]` |
| `maxSize` | `number` | unlimited |
| `pasteUpload` | `boolean` | `true` |
| `dragUpload` | `boolean` | `true` |

### Table Of Contents

Render a live TOC from Markdown headings. Heading ids come from `pd-markdown/parser`, so duplicate headings stay stable (`intro`, `intro-1`, ...).

```ts
import { MarkdownEditor, tocPlugin } from "pd-editor-core";

const toc = document.querySelector("#toc")!;

const editor = new MarkdownEditor({
  parent,
  plugins: [
    tocPlugin({
      container: toc,
      maxLevel: 3,
    }),
  ],
});
```

```html
<div id="toc"></div>
<div id="editor"></div>
```

### Write Your Own Plugin

Plugins can add CodeMirror extensions, toolbar items, and update hooks.

```ts
import { EditorView } from "@codemirror/view";
import type { EditorPlugin } from "pd-editor-core";

export const wordCountPlugin = (container: HTMLElement): EditorPlugin => ({
  name: "word-count",

  install: (editor) => {
    container.textContent = `${editor.getValue().length} chars`;

    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        container.textContent = `${update.state.doc.length} chars`;
      }
    });
  },

  toolbar: () => ({
    command: "horizontalRule",
    label: "Divider",
    icon: "<span>—</span>",
    divider: false,
  }),

  onUpdate: ({ value }) => {
    console.log("updated", value.length);
  },

  destroy: () => {
    container.textContent = "";
  },
});
```

Runtime lifecycle:

```ts
editor.use(wordCountPlugin(document.querySelector("#meta")!));
editor.unuse("word-count");
```

## CodeMirror Extensions

Use native CodeMirror extensions when you need deep customization:

```ts
import { EditorView } from "@codemirror/view";
import { MarkdownEditor } from "pd-editor-core";

const editor = new MarkdownEditor({
  parent,
  extensions: [
    EditorView.lineWrapping,
    EditorView.theme({
      "&": { fontSize: "14px" },
    }),
  ],
});
```

## Options

| Option | Type | Default |
| --- | --- | --- |
| `parent` | `HTMLElement` | required |
| `initialValue` | `string` | `""` |
| `theme` | `"light" \| "dark"` | `"light"` |
| `onChange` | `(value: string) => void` | - |
| `onSave` | `(value: string) => void` | - |
| `placeholder` | `string` | - |
| `readOnly` | `boolean` | `false` |
| `extensions` | `Extension[]` | `[]` |
| `plugins` | `EditorPlugin[]` | `[]` |
| `toolbar` | `boolean \| ToolbarItem[]` | `true` |

## FAQ

### Can I use this without React or Vue?

Yes. This package is the DOM-only core. Use `pd-editor-react` or `pd-editor-vue` only if you want framework adapters.

### Does read-only mode block toolbar and programmatic commands?

Yes. `canExecute()` returns `false`, and command helpers avoid document changes while read-only.

### Can I add plugins after the editor is mounted?

Yes. Use `editor.use(plugin)` and `editor.unuse(pluginName)`. Runtime plugins can return CodeMirror extensions and toolbar items.

### How do I customize the toolbar active state?

Use `editor.getCommandState(command)`. Framework adapters can use this to render active/disabled buttons.

### Does the core render Markdown preview?

No. Core is focused on editing. Preview rendering lives in `pd-editor-react` and `pd-editor-vue`, powered by `pd-markdown` and `pd-markdown-ui`.

### Is it SSR safe?

The editor needs a browser DOM. In SSR apps, instantiate it in a client-only boundary.

## Related Packages

- `pd-editor-react` - React component and hook.
- `pd-editor-vue` - Vue 3 component and composable.
- `pd-markdown` - Markdown parser/renderer used by preview adapters.
- `pd-markdown-ui` - Styled Markdown preview primitives.

## License

MIT
