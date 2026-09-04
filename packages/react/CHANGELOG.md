# pd-editor-react

## 2.3.1

### Patch Changes

- 59f9477: Keep the generated table of contents accessible on narrow screens and expose it as labeled navigation.
- Updated dependencies [59f9477]
  - pd-editor-core@2.2.1

## 2.3.0

### Minor Changes

- ee171e4: Add built-in en-US and zh-CN message catalogs, runtime message switching, localized plugin feedback, and mobile TOC behavior.

### Patch Changes

- Updated dependencies [ee171e4]
  - pd-editor-core@2.2.0

## 2.2.0

### Minor Changes

- 9c26383: Add image upload progress, cancellation, retry, and status APIs; document length limits and character counts; toolbar label overrides; Markdown and preview HTML copy helpers; Markdown downloads; and framework component export actions.

### Patch Changes

- 9c26383: Preserve the editor instance, undo history, and current uncontrolled content when switching preview modes.
- Updated dependencies [9c26383]
  - pd-editor-core@2.1.0

## 2.1.1

### Patch Changes

- 618f7a9: Open the image upload file picker from plugin toolbar actions, mount the default table of contents inside the editor, and expose undo, redo, and search/replace in the default toolbar.
- 618f7a9: Use Mermaid strict security mode for the default preview renderers.
- Updated dependencies [618f7a9]
  - pd-editor-core@2.0.2

## 2.1.0

### Minor Changes

- 6a89179: Improve split preview usability with synchronized scrolling, mobile stacked layout, and toolbar aria labels.

### Patch Changes

- Updated dependencies [6a89179]
  - pd-editor-core@2.0.1

## 2.0.0

### Major Changes

- 00cb71e: Broaden Node.js compatibility, remove the unnecessary Tailwind peer requirement, keep default code previews lightweight without loading a full syntax-highlighting catalog, and clarify package positioning for technical content workflows.

### Patch Changes

- Updated dependencies [00cb71e]
  - pd-editor-core@2.0.0

## 1.4.0

### Minor Changes

- ab60b76: feat: add lazy-loaded graphical mermaid flowchart rendering with modern styling

## 1.3.0

### Minor Changes

- 0f2e495: Make fenced code language data opt-in through the new `codeLanguages` editor option, removing the default `@codemirror/language-data` dependency from the core editor path.

### Patch Changes

- Updated dependencies [0f2e495]
  - pd-editor-core@1.3.0

## 1.2.2

### Patch Changes

- 974201a: Prevent controlled React and Vue value sync from emitting editor change callbacks, align Vue preview with React by omitting raw HTML nodes, and render TOC heading text through DOM text nodes instead of HTML strings.
- d39e7bc: Point npm package homepage metadata to the GitHub Pages demo.
- Updated dependencies [974201a]
- Updated dependencies [d39e7bc]
  - pd-editor-core@1.2.2

## 1.2.1

### Patch Changes

- b066813: Fix npm package repository, homepage, and issue tracker URLs.
- Updated dependencies [b066813]
  - pd-editor-core@1.2.1

## 1.2.0

### Minor Changes

- b8d48db: Add core content plugins for code blocks, mermaid diagrams, math expressions, frontmatter metadata, and markdown lint diagnostics.

### Patch Changes

- Updated dependencies [b8d48db]
  - pd-editor-core@1.2.0

## 1.1.4

### Patch Changes

- Updated dependencies [eee8ecf]
  - pd-editor-core@1.1.4

## 1.1.3

### Patch Changes

- cb05943: Use the compiled pd-markdown-ui stylesheet entry.

  React and Vue adapters now import `pd-markdown-ui/styles.css` so preview components receive the bundled Markdown UI styles without requiring consumers to compile pd-shad-ui Tailwind source styles.

- 3613023: Fix single-line selection visibility in the editor.

  The active line highlight now uses a translucent background so it no longer hides selection backgrounds on the current line, including Markdown list lines such as `- item`.

- Updated dependencies [3613023]
  - pd-editor-core@1.1.3

## 1.1.2

### Patch Changes

- fa5cb7b: Harden release publishing auth and read-only editor command behavior.

  The release workflow now passes `NODE_AUTH_TOKEN` to npm publish and verifies npm auth before Changesets runs. Core commands now respect read-only state at execution time, including toolbar/programmatic commands and Markdown typing helpers.

- Updated dependencies [fa5cb7b]
  - pd-editor-core@1.1.2

## 1.1.1

### Patch Changes

- 786d2d6: Expand package README documentation for npm consumers.

  Each package now documents its feature set, keyboard shortcuts, toolbar commands, plugin usage, extension points, styling strategy, integration examples, and FAQ so developers can evaluate and adopt the editor directly from npm.

- Updated dependencies [786d2d6]
  - pd-editor-core@1.1.1

## 1.1.0

### Minor Changes

- 4524860: Improve Markdown editing ergonomics and expose command state for toolbar integrations.

  Core now supports Markdown-aware `Enter`, `Tab`, and `Shift+Tab` behavior for list, task, ordered, and quote blocks. Runtime plugins can install and remove CodeMirror extensions after mount, plugin toolbar items refresh automatically, and consumers can query `isActive`, `canExecute`, and `getCommandState` for framework toolbar states.

### Patch Changes

- Updated dependencies [4524860]
  - pd-editor-core@1.1.0

## 1.0.0

### Major Changes

- Release the stabilized editor packages as the first major version.

### Patch Changes

- Updated dependencies
  - pd-editor-core@1.0.0

## 0.2.0

### Minor Changes

- Stabilize the editor packages for npm consumption with pd-markdown based rendering, styled and headless adapter entries, CI quality gates, and package metadata.

### Patch Changes

- Updated dependencies
  - pd-editor-core@0.2.0
