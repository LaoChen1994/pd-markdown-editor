/** markdown-it plugin type */
export type MarkdownItPlugin = (md: MarkdownItInstance, ...params: unknown[]) => void;

/** Simplified markdown-it instance interface */
export interface MarkdownItInstance {
  use: (plugin: MarkdownItPlugin, ...params: unknown[]) => MarkdownItInstance;
  render: (src: string, env?: unknown) => string;
  renderInline: (src: string, env?: unknown) => string;
}

/** Configuration options for the MarkdownRenderer */
export interface MarkdownRendererOptions {
  /** Allow HTML tags in source, default: false */
  html?: boolean;
  /** Auto-convert URL-like text to links, default: true */
  linkify?: boolean;
  /** Enable typographic replacements, default: false */
  typographer?: boolean;
  /** Enable code syntax highlighting via highlight.js, default: true */
  highlight?: boolean;
  /** Custom markdown-it plugins */
  plugins?: MarkdownItPlugin[];
}

/** Table of contents item extracted from headings */
export interface TocItem {
  /** Heading level 1-6 */
  level: number;
  /** Heading text content */
  text: string;
  /** Generated anchor ID */
  id: string;
}
