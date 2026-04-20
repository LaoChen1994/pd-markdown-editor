# pd-editor-vue

Vue 3 adapter for the `pd-markdown-editor` project.

## Installation

```bash
pnpm add pd-editor-vue pd-editor-core
```

## Usage

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
