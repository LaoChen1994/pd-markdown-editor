<script setup lang="ts">
import { ref } from "vue";
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
} from "pd-editor-vue";
import katex from "katex";
import type {
  CodeBlockInfo,
  FrontmatterResult,
  MarkdownDiagnostic,
  MathExpression,
  MermaidDiagram,
} from "pd-editor-vue";
import CustomBlockquote from "./CustomBlockquote.vue";

const content = ref(`---
title: Plugin demo
published: true
order: 1
---

# Welcome to pd-editor

This demo shows the core content plugins working through editor callbacks.

## Code Example

\`\`\`typescript
import { MarkdownEditor, markdownLintPlugin } from "pd-editor-vue";
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
`);

const theme = ref<"light" | "dark">("light");
const locale = ref<"en-US" | "zh-CN">("en-US");
const preview = ref<"edit" | "preview" | "split">("split");
const codeBlocks = ref<CodeBlockInfo[]>([]);
const diagrams = ref<MermaidDiagram[]>([]);
const mathExpressions = ref<MathExpression[]>([]);
const frontmatter = ref<FrontmatterResult | null>(null);
const diagnostics = ref<MarkdownDiagnostic[]>([]);

const plugins = [
  tocPlugin(),
  codeHighlightPlugin({ onCodeBlocks: (blocks) => { codeBlocks.value = blocks; } }),
  mermaidPlugin({ onDiagrams: (items) => { diagrams.value = items; } }),
  mathPlugin({ onExpressions: (items) => { mathExpressions.value = items; } }),
  frontmatterPlugin({ onFrontmatter: (result) => { frontmatter.value = result; } }),
  markdownLintPlugin({ onDiagnostics: (items) => { diagnostics.value = items; } }),
  imageUploadPlugin({
    handler: async (file: File) => URL.createObjectURL(file),
  }),
];

const renderComponentMap = {
  blockquote: CustomBlockquote,
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

const handleSave = (value: string) => {
  alert((locale.value === "zh-CN" ? "已保存，字符数：" : "Saved! Length: ") + value.length);
};

const renderMath = (value: string, displayMode: boolean) => {
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
    <div :style="{ maxWidth: '1280px', margin: '0 auto' }">
      <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }">
        <h1 :style="{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#e6edf3' : '#1f2328', margin: 0 }">
          {{ locale === 'zh-CN' ? 'pd-editor Vue 演示' : 'pd-editor Vue Demo' }}
        </h1>
        <div :style="{ display: 'flex', gap: '8px', flexWrap: 'wrap' }">
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
            {{ theme === 'light' ? (locale === 'zh-CN' ? '深色' : 'Dark') : (locale === 'zh-CN' ? '浅色' : 'Light') }}
          </button>
          <button
            @click="locale = locale === 'en-US' ? 'zh-CN' : 'en-US'"
            :style="{
              padding: '6px 16px', borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`,
              backgroundColor: theme === 'dark' ? '#21262d' : '#ffffff',
              color: theme === 'dark' ? '#e6edf3' : '#1f2328',
              cursor: 'pointer', fontSize: '14px',
            }"
          >
            {{ locale === 'en-US' ? '中文' : 'English' }}
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
            {{ locale === 'zh-CN' ? ({ edit: '编辑', split: '分屏', preview: '预览' } as const)[mode] : mode }}
          </button>
        </div>
      </div>

      <MarkdownEditor
        v-model="content"
        :theme="theme"
        :preview="preview"
        :height="620"
        :plugins="plugins"
        :messages="locale === 'zh-CN' ? zhCN : enUS"
        :render-component-map="renderComponentMap"
        :placeholder="locale === 'zh-CN' ? '开始编写 Markdown...' : 'Start writing Markdown...'"
        @save="handleSave"
      />

      <div
        :style="{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginTop: '16px',
        }"
      >
        <section :style="{ border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`, borderRadius: '8px', padding: '16px', backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', color: theme === 'dark' ? '#e6edf3' : '#1f2328' }">
          <h2 :style="{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#8b949e' : '#57606a', textTransform: 'uppercase' }">
            Frontmatter
          </h2>
          <pre :style="{ margin: 0, whiteSpace: 'pre-wrap' }">{{ JSON.stringify(frontmatter?.data ?? {}, null, 2) }}</pre>
        </section>

        <section :style="{ border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`, borderRadius: '8px', padding: '16px', backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', color: theme === 'dark' ? '#e6edf3' : '#1f2328' }">
          <h2 :style="{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#8b949e' : '#57606a', textTransform: 'uppercase' }">
            {{ locale === 'zh-CN' ? '代码块' : 'Code Blocks' }}
          </h2>
          <p :style="{ margin: 0 }">{{ codeBlocks.map((block) => block.language).join(", ") || (locale === 'zh-CN' ? '无' : 'None') }}</p>
        </section>

        <section :style="{ border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`, borderRadius: '8px', padding: '16px', backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', color: theme === 'dark' ? '#e6edf3' : '#1f2328' }">
          <h2 :style="{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#8b949e' : '#57606a', textTransform: 'uppercase' }">
            Mermaid
          </h2>
          <p :style="{ margin: 0 }">{{ diagrams.map((diagram) => diagram.id).join(", ") || (locale === 'zh-CN' ? '无' : 'None') }}</p>
        </section>

        <section :style="{ border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`, borderRadius: '8px', padding: '16px', backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', color: theme === 'dark' ? '#e6edf3' : '#1f2328' }">
          <h2 :style="{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#8b949e' : '#57606a', textTransform: 'uppercase' }">
            {{ locale === 'zh-CN' ? '数学公式' : 'Math' }}
          </h2>
          <p v-if="mathExpressions.length === 0" :style="{ margin: 0 }">{{ locale === 'zh-CN' ? '无' : 'None' }}</p>
          <div v-else :style="{ display: 'grid', gap: '10px' }">
            <div v-for="(expression, index) in mathExpressions" :key="`${expression.type}-${index}`">
              <div v-html="renderMath(expression.value, expression.type === 'block')" />
              <code :style="{ fontSize: '12px' }">{{ expression.raw }}</code>
            </div>
          </div>
        </section>

        <section :style="{ border: `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`, borderRadius: '8px', padding: '16px', backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', color: theme === 'dark' ? '#e6edf3' : '#1f2328' }">
          <h2 :style="{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#8b949e' : '#57606a', textTransform: 'uppercase' }">
            {{ locale === 'zh-CN' ? 'Lint 诊断' : 'Lint Diagnostics' }}
          </h2>
          <ul :style="{ margin: 0, paddingLeft: '18px' }">
            <li v-for="(diagnostic, index) in diagnostics" :key="`${diagnostic.rule}-${index}`">
              {{ diagnostic.rule }}: {{ diagnostic.message }}
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
