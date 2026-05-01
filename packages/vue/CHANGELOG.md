# pd-editor-vue

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
