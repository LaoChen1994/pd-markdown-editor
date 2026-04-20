# pd-editor-react

React adapter for the `pd-markdown-editor` project.

## Installation

```bash
pnpm add pd-editor-react pd-editor-core
```

## Usage

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
