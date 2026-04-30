# pd-editor-vue

Vue 3 adapter for the `pd-markdown-editor` project.

## Installation

```bash
pnpm add pd-editor-vue pd-editor-core vue tailwindcss
```

## Usage

The default entry includes preview styles automatically. `vue` and `tailwindcss` are peer dependencies so your app owns the framework and Tailwind versions.

### Component

```vue
<script setup>
import { ref } from 'vue';
import { MarkdownEditor } from 'pd-editor-vue';

const content = ref('# Hello Vue 3');
</script>

<template>
  <MarkdownEditor 
    v-model="content" 
    theme="dark" 
    preview="split" 
    height="600px"
  />
</template>
```

For manual style control, use the headless entry:

```ts
import { MarkdownEditor } from 'pd-editor-vue/headless';
import 'pd-editor-vue/styles.css';
```

When using the styled entry, make sure your Tailwind content config scans `pd-shad-ui` output so the `pd-*` utility classes used by `pd-markdown-ui` are generated.

### Composable (Advanced)

```vue
<script setup>
import { useMarkdownEditor } from 'pd-editor-vue';

const { containerRef } = useMarkdownEditor({
  initialValue: '# Custom useMarkdownEditor'
});
</script>

<template>
  <div ref="containerRef" style="height: 500px" />
</template>
```

## Props

Supports `v-model` and common props like `theme`, `preview`, `height`, `placeholder`, `readOnly`.

## Notes

- `useMarkdownEditor` initialization options are read when the editor mounts. Recreate the composable owner if you need to change structural options such as plugins or extensions.
- Custom toolbar `icon` values are treated as trusted SVG/HTML from your application code.
- `renderComponentMap` uses HTML tag-style keys from `pd-markdown-ui/vue`, such as `h1`, `p`, `blockquote`, `table`, `th`, and `td`.
- The editor itself requires a browser DOM. In SSR apps, mount it from a client-only boundary.
