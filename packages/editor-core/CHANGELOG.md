# pd-editor-core

## 2.0.0

### Major Changes

- 00cb71e: Broaden Node.js compatibility, remove the unnecessary Tailwind peer requirement, keep default code previews lightweight without loading a full syntax-highlighting catalog, and clarify package positioning for technical content workflows.

## 1.3.0

### Minor Changes

- 0f2e495: Make fenced code language data opt-in through the new `codeLanguages` editor option, removing the default `@codemirror/language-data` dependency from the core editor path.

## 1.2.2

### Patch Changes

- 974201a: Prevent controlled React and Vue value sync from emitting editor change callbacks, align Vue preview with React by omitting raw HTML nodes, and render TOC heading text through DOM text nodes instead of HTML strings.
- d39e7bc: Point npm package homepage metadata to the GitHub Pages demo.

## 1.2.1

### Patch Changes

- b066813: Fix npm package repository, homepage, and issue tracker URLs.

## 1.2.0

### Minor Changes

- b8d48db: Add core content plugins for code blocks, mermaid diagrams, math expressions, frontmatter metadata, and markdown lint diagnostics.

## 1.1.4

### Patch Changes

- eee8ecf: Fix toolbar command state rendering and make image upload placeholders unique while exposing upload rejection and error callbacks.

## 1.1.3

### Patch Changes

- 3613023: Fix single-line selection visibility in the editor.

  The active line highlight now uses a translucent background so it no longer hides selection backgrounds on the current line, including Markdown list lines such as `- item`.

## 1.1.2

### Patch Changes

- fa5cb7b: Harden release publishing auth and read-only editor command behavior.

  The release workflow now passes `NODE_AUTH_TOKEN` to npm publish and verifies npm auth before Changesets runs. Core commands now respect read-only state at execution time, including toolbar/programmatic commands and Markdown typing helpers.

## 1.1.1

### Patch Changes

- 786d2d6: Expand package README documentation for npm consumers.

  Each package now documents its feature set, keyboard shortcuts, toolbar commands, plugin usage, extension points, styling strategy, integration examples, and FAQ so developers can evaluate and adopt the editor directly from npm.

## 1.1.0

### Minor Changes

- 4524860: Improve Markdown editing ergonomics and expose command state for toolbar integrations.

  Core now supports Markdown-aware `Enter`, `Tab`, and `Shift+Tab` behavior for list, task, ordered, and quote blocks. Runtime plugins can install and remove CodeMirror extensions after mount, plugin toolbar items refresh automatically, and consumers can query `isActive`, `canExecute`, and `getCommandState` for framework toolbar states.

## 1.0.0

### Major Changes

- Release the stabilized editor packages as the first major version.

## 0.2.0

### Minor Changes

- Stabilize the editor packages for npm consumption with pd-markdown based rendering, styled and headless adapter entries, CI quality gates, and package metadata.
