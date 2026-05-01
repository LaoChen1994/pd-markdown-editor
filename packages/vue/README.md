# pd-editor-vue

[![npm](https://img.shields.io/npm/v/pd-editor-vue?color=42b883&label=npm)](https://www.npmjs.com/package/pd-editor-vue)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/LaoChen1994/pd-markdown-editor)

A Vue 3 Markdown editor built on **CodeMirror 6**, with live preview, `pd-markdown-ui` typography, image upload, TOC, toolbar commands, and a composable API for custom editor shells.

Use it when you need a production-ready Markdown field without hand-assembling parser, preview, styling, shortcuts, plugins, and CodeMirror integration yourself.

## Highlights

- 💚 **Vue 3 component** - `v-model` friendly, typed props, `save` event.
- 🚀 **CodeMirror 6 core** - fast editing, Markdown language support, history, search, folding, autocomplete.
- 👀 **Preview modes** - `edit`, `split`, and `preview`.
- 🎨 **Styled Markdown preview** - powered by `pd-markdown` + `pd-markdown-ui/vue`.
- 🧠 **Markdown-aware typing** - smart `Enter`, `Tab`, and `Shift+Tab` behavior for common Markdown blocks.
- 🧰 **Toolbar included** - default toolbar, custom toolbar, plugin toolbar items.
- 🖼️ **Image upload plugin** - paste/drag images and replace upload placeholders with final URLs.
- 🧭 **TOC plugin** - live heading navigation with stable parser-generated ids.
- 🧩 **Composable escape hatch** - `useMarkdownEditor` for fully custom Vue layouts.
- 🧱 **Headless entry** - manual CSS control for design systems.
- 🌓 **Light/dark themes** - editor and preview stay visually aligned.

## Install

```bash
pnpm add pd-editor-vue pd-editor-core vue tailwindcss
# npm install pd-editor-vue pd-editor-core vue tailwindcss
# yarn add pd-editor-vue pd-editor-core vue tailwindcss
```

`vue` and `tailwindcss` are peer dependencies so your app owns framework and styling versions.

## Zero-Cost Quick Start

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MarkdownEditor } from "pd-editor-vue";

const content = ref("# Hello pd-editor-vue");
</script>

<template>
  <MarkdownEditor
    v-model="content"
    theme="light"
    preview="split"
    :height="640"
    placeholder="Write Markdown..."
  />
</template>
```

The default entry imports base preview styles automatically:

```ts
import { MarkdownEditor } from "pd-editor-vue";
```

For full CSS control, use the headless entry:

```ts
import { MarkdownEditor } from "pd-editor-vue/headless";
import "pd-editor-vue/styles.css";
```

When using Tailwind, make sure your content config can see `pd-shad-ui` / `pd-markdown-ui` classes:

```ts
export default {
  content: [
    "./src/**/*.{vue,ts,tsx}",
    "./node_modules/pd-shad-ui/**/*.{js,ts,jsx,tsx}",
    "./node_modules/pd-markdown-ui/**/*.{js,ts,jsx,tsx}",
  ],
};
```

## Feature Matrix

| Area | Support |
| --- | --- |
| Component mode | `v-model`, `defaultValue` |
| Preview | `edit`, `split`, `preview` |
| Styling | Styled root entry, headless entry, explicit `styles.css` |
| Markdown UI | Headings, paragraphs, lists, task lists, code, table, blockquote, heading ids |
| Toolbar | Built-in toolbar, custom toolbar items, plugin toolbar items |
| Plugins | `imageUploadPlugin`, `tocPlugin`, custom plugins |
| Commands | Formatting, headings, lists, quote, code, link, image, table, horizontal rule |
| Runtime controls | Reactive `theme`, `readOnly`, `modelValue` sync |
| Advanced | CodeMirror extensions, custom preview component map |

## Props & Events

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | - | Controlled Markdown value via `v-model` |
| `defaultValue` | `string` | `""` | Initial value for uncontrolled usage |
| `theme` | `"light" \| "dark"` | `"light"` | Editor and preview theme |
| `placeholder` | `string` | - | CodeMirror placeholder |
| `readOnly` | `boolean` | `false` | Prevent user and command edits |
| `height` | `string \| number` | `"500px"` | Editor container height |
| `preview` | `"edit" \| "preview" \| "split"` | `"edit"` | View mode |
| `toolbar` | `boolean \| ToolbarItem[]` | `true` | Built-in toolbar, hidden toolbar, or custom items |
| `plugins` | `EditorPlugin[]` | `[]` | Core plugins |
| `extensions` | `Extension[]` | `[]` | CodeMirror 6 extensions |
| `renderComponentMap` | `Record<string, unknown>` | - | Override Markdown preview components |

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Emitted when content changes |
| `save` | `string` | Emitted by `Ctrl/Cmd+S` |

## Preview Modes

```vue
<MarkdownEditor v-model="content" preview="edit" />
<MarkdownEditor v-model="content" preview="split" />
<MarkdownEditor :model-value="content" preview="preview" />
```

`split` mode keeps editor and preview side-by-side. `preview` mode renders Markdown without mounting the editor.

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
| `Ctrl/Cmd+S` | `save` event |
| `Enter` | Continue list/task/ordered/quote block |
| `Tab` | Indent Markdown block |
| `Shift+Tab` | Outdent Markdown block |

## Toolbar Commands

The default toolbar includes:

`bold`, `italic`, `strikethrough`, `heading1`, `heading2`, `heading3`, `unorderedList`, `orderedList`, `taskList`, `link`, `image`, `quote`, `code`, `codeBlock`, `table`, `horizontalRule`.

Disable it:

```vue
<MarkdownEditor v-model="content" :toolbar="false" />
```

Custom toolbar:

```vue
<script setup lang="ts">
import type { ToolbarItem } from "pd-editor-core";

const toolbar: ToolbarItem[] = [
  { command: "bold", label: "Bold", icon: "<strong>B</strong>", shortcut: "Ctrl+B" },
  { command: "heading2", label: "H2", icon: "<span>H2</span>" },
  { command: "divider", label: "", icon: "", divider: true },
  { command: "link", label: "Link", icon: "<span>🔗</span>", shortcut: "Ctrl+K" },
];
</script>

<template>
  <MarkdownEditor v-model="content" :toolbar="toolbar" />
</template>
```

Custom toolbar `icon` values are trusted HTML from your application code. Do not pass untrusted user content into `icon`.

## Plugins

### Image Upload

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { MarkdownEditor } from "pd-editor-vue";
import { imageUploadPlugin } from "pd-editor-core";

const content = ref("");

const plugins = computed(() => [
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
]);
</script>

<template>
  <MarkdownEditor
    v-model="content"
    :plugins="plugins"
    preview="split"
  />
</template>
```

### Table Of Contents

```vue
<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { MarkdownEditor } from "pd-editor-vue";
import { tocPlugin, type EditorPlugin } from "pd-editor-core";

const content = ref("# Intro");
const tocRef = ref<HTMLElement | null>(null);
const plugins = ref<EditorPlugin[]>([]);

onMounted(async () => {
  await nextTick();
  if (tocRef.value) {
    plugins.value = [tocPlugin({ container: tocRef.value, maxLevel: 3 })];
  }
});
</script>

<template>
  <div style="display: grid; grid-template-columns: 1fr 220px; gap: 16px">
    <MarkdownEditor v-model="content" :plugins="plugins" preview="split" :height="640" />
    <aside ref="tocRef" />
  </div>
</template>
```

## Custom Preview Rendering

Vue preview uses tag-style component keys compatible with `pd-markdown-ui/vue`.

```vue
<script setup lang="ts">
import CustomBlockquote from "./CustomBlockquote.vue";

const renderComponentMap = {
  blockquote: CustomBlockquote,
};
</script>

<template>
  <MarkdownEditor
    v-model="content"
    preview="split"
    :render-component-map="renderComponentMap"
  />
</template>
```

Common keys include `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `blockquote`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `pre`, and `code`.

## Composable API

Use `useMarkdownEditor` when you want to build your own Vue shell around the core editor:

```vue
<script setup lang="ts">
import { useMarkdownEditor } from "pd-editor-vue";

const { containerRef, getValue, executeCommand } = useMarkdownEditor({
  initialValue: "# Custom shell",
  onChange: (value) => console.log(value),
});

const logValue = () => {
  console.log(getValue());
};
</script>

<template>
  <button type="button" @click="executeCommand('bold')">Bold</button>
  <button type="button" @click="logValue">Log</button>
  <div ref="containerRef" style="height: 500px" />
</template>
```

Initialization options are read when the editor mounts. Recreate the composable owner if you need to change structural options such as plugins or extensions.

## SSR / Nuxt

The editor requires a browser DOM. In SSR frameworks, mount it from a client-only boundary.

```vue
<ClientOnly>
  <MarkdownEditor v-model="content" preview="split" />
</ClientOnly>
```

## FAQ

### Do I need to import CSS?

If you import `pd-editor-vue`, base preview styles are included automatically. If you import `pd-editor-vue/headless`, import `pd-editor-vue/styles.css` yourself.

### Why do some `pd-*` classes look unstyled?

Make sure Tailwind scans `pd-shad-ui` and `pd-markdown-ui` in `node_modules`, because the preview UI uses Tailwind-powered `pd-*` utilities.

### Can I use `v-model`?

Yes. `v-model` is the recommended component API. Use `defaultValue` for one-time uncontrolled initial content.

### Can I hide preview or toolbar?

Yes. Use `preview="edit"` and `:toolbar="false"`.

### Can I customize Markdown preview components?

Yes. Use `renderComponentMap` with tag-style keys such as `h1`, `p`, `blockquote`, `table`, `th`, and `td`.

### Can I access the underlying editor?

Use `useMarkdownEditor` for direct access to the core editor ref. The component API is intentionally higher-level.

### Does this work for admin/CMS apps?

Yes. It is designed for repeated product workflows: CMS fields, docs portals, changelog editors, support dashboards, knowledge bases, and AI writing tools.

## Related Packages

- `pd-editor-core` - Framework-agnostic CodeMirror editor core.
- `pd-editor-react` - React adapter.
- `pd-markdown` - Markdown parser/renderer.
- `pd-markdown-ui` - Styled Markdown preview primitives.

## License

MIT
