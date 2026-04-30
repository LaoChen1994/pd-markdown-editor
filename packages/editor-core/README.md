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
- Runtime plugin installation and removal
- Markdown-aware keyboard shortcuts and typing flow
- Command state API for toolbar active and disabled states
- Extensible plugin system powered by CodeMirror 6

## Editing Flow

The editor includes Markdown-aware typing behavior out of the box:

- `Enter` continues bullet, ordered, task, and quote blocks.
- Empty list, task, and quote markers are removed on `Enter`.
- `Tab` and `Shift+Tab` indent and outdent Markdown block lines.
- Common formatting shortcuts are available for bold, italic, links, headings, lists, quotes, and strikethrough.

## Runtime Plugins

Plugins can be installed at construction time or after the editor has mounted:

```ts
editor.use(myPlugin);
editor.unuse('my-plugin');
```

Runtime plugins may return CodeMirror extensions from `install()`. Toolbar items are refreshed when plugins are installed or removed.

## Command State

Toolbar integrations can query command state directly:

```ts
editor.isActive('bold');
editor.canExecute('link');
editor.getCommandState('heading2'); // { active, enabled }
```

## API

Check our [main documentation](https://github.com/pidan/pd-markdown-editor) for full API details.
