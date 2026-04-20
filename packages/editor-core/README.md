# pd-editor-core

Core engine for the `pd-markdown-editor` project. Powered by **CodeMirror 6**.

## Installation

```bash
pnpm add pd-editor-core
```

## Usage

```ts
import { MarkdownEditor } from 'pd-editor-core';

const editor = new MarkdownEditor({
  parent: document.querySelector('#editor'),
  initialValue: '# Hello World',
  theme: 'light', // or 'dark'
  onChange: (value) => {
    console.log('Content updated:', value);
  }
});
```

## Features

- Framework agnostic
- Built-in Toolbar
- Theme support (Light/Dark)
- Extensible Plugin System
- Markdown-it integration for rendering

## API

Check our [main documentation](https://github.com/pidan/pd-markdown-editor) for full API details.
