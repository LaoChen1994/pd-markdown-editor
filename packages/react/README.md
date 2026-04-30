# pd-editor-react

React adapter for the `pd-markdown-editor` project.

## Installation

```bash
pnpm add pd-editor-react pd-editor-core react react-dom tailwindcss
```

## Usage

The default entry includes preview styles automatically. `react`, `react-dom`, and `tailwindcss` are peer dependencies so your app owns the framework and Tailwind versions.

### Component

```tsx
import { MarkdownEditor } from 'pd-editor-react';
import { useState } from 'react';

function App() {
  const [value, setValue] = useState('# Hello React');

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      theme="light"
      preview="split"
      height="500px"
    />
  );
}
```

For manual style control, use the headless entry:

```tsx
import { MarkdownEditor } from 'pd-editor-react/headless';
import 'pd-editor-react/styles.css';
```

When using the styled entry, make sure your Tailwind content config scans `pd-shad-ui` output so the `pd-*` utility classes used by `pd-markdown-ui` are generated.

### Hook (Advanced)

```tsx
import { useMarkdownEditor } from 'pd-editor-react';

function CustomEditor() {
  const { containerRef, editorRef } = useMarkdownEditor({
    initialValue: '# Custom implementation'
  });

  return <div ref={containerRef} />;
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | `""` | Uncontrolled initial value |
| `onChange` | `(val: string) => void` | - | Change callback |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor theme |
| `preview` | `'edit' \| 'preview' \| 'split'` | `'edit'` | View mode |
| `height` | `string \| number` | `'500px'` | Container height |

## Notes

- `useMarkdownEditor` initialization options are read when the editor mounts. Recreate the hook owner if you need to change structural options such as plugins or extensions.
- Custom toolbar `icon` values are treated as trusted SVG/HTML from your application code.
- `renderComponentMap` uses `pd-markdown/web` mdast component keys such as `heading`, `paragraph`, `list`, `tableCell`, and `blockquote`.
- The editor itself requires a browser DOM. In SSR apps, render it from a client-only boundary.
