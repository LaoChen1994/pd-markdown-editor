<script setup lang="ts">
import { ref } from "vue";
import { MarkdownEditor, imageUploadPlugin, tocPlugin } from "pd-editor-vue";
import CustomBlockquote from "./CustomBlockquote.vue";

const content = ref(`# Welcome to pd-editor

This is a **Markdown editor** built with [CodeMirror 6](https://codemirror.net/).

## Features

- ✅ Rich toolbar with keyboard shortcuts
- ✅ Syntax highlighting
- ✅ Split-view preview
- ✅ Dark / Light themes
- ✅ Plugin system (image upload, TOC)

## Code Example

\`\`\`typescript
import { MarkdownEditor } from "pd-editor-vue";

// Use with v-model
<MarkdownEditor v-model="content" theme="light" preview="split" />
\`\`\`

> Enjoy writing Markdown! 🎉
`);

const theme = ref<"light" | "dark">("light");
const preview = ref<"edit" | "preview" | "split">("split");
const plugins = [
  tocPlugin(),
  imageUploadPlugin({
    upload: async (file: File) => URL.createObjectURL(file),
  }),
];
const renderComponentMap = {
  blockquote: CustomBlockquote,
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

const handleSave = (value: string) => {
  alert("Saved! Length: " + value.length);
};
</script>

<template>
  <div
    :style="{
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#0d1117' : '#f0f2f5',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      transition: 'background-color 0.3s ease',
    }"
  >
    <div :style="{ maxWidth: '1200px', margin: '0 auto' }">
      <!-- Header -->
      <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }">
        <h1 :style="{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#e6edf3' : '#1f2328', margin: 0 }">
          📝 pd-editor Vue Demo
        </h1>
        <div :style="{ display: 'flex', gap: '8px' }">
          <button
            @click="toggleTheme"
            :style="{
              padding: '6px 16px', borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`,
              backgroundColor: theme === 'dark' ? '#21262d' : '#ffffff',
              color: theme === 'dark' ? '#e6edf3' : '#1f2328',
              cursor: 'pointer', fontSize: '14px',
            }"
          >
            {{ theme === 'light' ? '🌙 Dark' : '☀️ Light' }}
          </button>
          <button
            v-for="mode in (['edit', 'split', 'preview'] as const)"
            :key="mode"
            @click="preview = mode"
            :style="{
              padding: '6px 16px', borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`,
              backgroundColor: preview === mode ? (theme === 'dark' ? '#58a6ff' : '#0969da') : (theme === 'dark' ? '#21262d' : '#ffffff'),
              color: preview === mode ? '#ffffff' : (theme === 'dark' ? '#e6edf3' : '#1f2328'),
              cursor: 'pointer', fontSize: '14px', textTransform: 'capitalize',
            }"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <!-- Editor -->
      <MarkdownEditor
        v-model="content"
        :theme="theme"
        :preview="preview"
        :height="600"
        :plugins="plugins"
        :render-component-map="renderComponentMap"
        placeholder="Start writing Markdown..."
        @save="handleSave"
      />
    </div>
  </div>
</template>
