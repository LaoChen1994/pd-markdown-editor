---
"pd-editor-core": patch
"pd-editor-react": patch
"pd-editor-vue": patch
---

Harden release publishing auth and read-only editor command behavior.

The release workflow now passes `NODE_AUTH_TOKEN` to npm publish and verifies npm auth before Changesets runs. Core commands now respect read-only state at execution time, including toolbar/programmatic commands and Markdown typing helpers.
