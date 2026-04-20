# pd-markdown

Framework-agnostic Markdown parsing and rendering library based on `markdown-it`.

## Features

- GFM (GitHub Flavored Markdown) support
- Task List support
- Syntax highlighting via `highlight.js`
- Heading anchor generation for TOC
- Table of Contents extraction

## Usage

```ts
import { MarkdownRenderer } from 'pd-markdown';

const renderer = new MarkdownRenderer();
const html = renderer.render('# Hello World');
const toc = renderer.extractToc('# Title\n## Section');
```
