# pd-markdown-editor

面向技术内容、AI 写作工具和 CMS 的 Markdown 编辑器 SDK。项目提供 React、Vue 3 和无框架 Core 三套入口，内容始终保持为可存储、可 diff、可迁移的 Markdown。

[在线体验](https://laochen1994.github.io/pd-markdown-editor/) · [React npm](https://www.npmjs.com/package/pd-editor-react) · [Vue npm](https://www.npmjs.com/package/pd-editor-vue) · [English README](./README.md)

## 主要能力

- CodeMirror 6 编辑体验，以及常用 Markdown 工具栏和快捷键。
- 编辑、分屏预览、纯预览三种模式，移动端自动切换为上下布局。
- Mermaid、数学公式、代码块、Frontmatter、目录和 Markdown Lint。
- 图片粘贴与拖拽上传，支持进度、取消、失败重试和状态回调。
- Markdown/HTML 复制、Markdown 下载、字符数和最大长度限制。
- 内置英文与简体中文消息，可按产品需要覆盖任意文案。

## React 快速开始

```bash
pnpm add pd-editor-react
```

```tsx
import { useState } from "react";
import { MarkdownEditor, markdownLintPlugin, tocPlugin, zhCN } from "pd-editor-react";

const App = () => {
  const [value, setValue] = useState("# 你好");

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      messages={zhCN}
      preview="split"
      plugins={[tocPlugin(), markdownLintPlugin()]}
    />
  );
};
```

## Vue 3 快速开始

```bash
pnpm add pd-editor-vue
```

```vue
<script setup>
import { ref } from "vue";
import { MarkdownEditor, zhCN } from "pd-editor-vue";

const content = ref("# 你好");
</script>

<template>
  <MarkdownEditor v-model="content" :messages="zhCN" preview="split" />
</template>
```

完整的插件、上传、导出、Headless 和 Core API 请查看 [英文主文档](./README.md)、[React 文档](./packages/react/README.md)、[Vue 文档](./packages/vue/README.md) 和 [Core 文档](./packages/editor-core/README.md)。

## 本地开发

```bash
pnpm install
pnpm run ci
pnpm --filter react-demo dev
```

欢迎提交 Issue 和 Pull Request。若这个项目解决了你的问题，也欢迎给仓库点 Star。
