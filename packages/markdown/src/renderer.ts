import MarkdownIt from "markdown-it";
import type { MarkdownRendererOptions, TocItem } from "./types";
import { taskListPlugin } from "./plugins/task-list";
import { createHighlighter } from "./plugins/highlight";

/**
 * MarkdownRenderer — Framework-agnostic Markdown parsing & rendering
 *
 * Wraps markdown-it with sensible defaults and a plugin system.
 *
 * @example
 * ```ts
 * import { MarkdownRenderer } from 'pd-markdown';
 *
 * const renderer = new MarkdownRenderer({ highlight: true });
 * const html = renderer.render('# Hello World');
 * const toc = renderer.extractToc('# Title\n## Section');
 * ```
 */
export class MarkdownRenderer {
  private md: MarkdownIt;

  constructor(options: MarkdownRendererOptions = {}) {
    const {
      html = false,
      linkify = true,
      typographer = false,
      highlight = true,
      plugins = [],
    } = options;

    this.md = new MarkdownIt({
      html,
      linkify,
      typographer,
      breaks: true,
      highlight: highlight ? createHighlighter() : undefined,
    });

    // Built-in plugins
    this.md.use(taskListPlugin);

    // Add heading anchors
    this.addHeadingAnchors();

    // User plugins
    for (const plugin of plugins) {
      this.md.use(plugin);
    }
  }

  /**
   * Render Markdown string to HTML
   */
  render(markdown: string): string {
    return this.md.render(markdown);
  }

  /**
   * Render inline Markdown (no wrapping <p> tags)
   */
  renderInline(markdown: string): string {
    return this.md.renderInline(markdown);
  }

  /**
   * Extract table of contents from Markdown headings
   */
  extractToc(markdown: string): TocItem[] {
    const toc: TocItem[] = [];
    const tokens = this.md.parse(markdown, {});

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "heading_open") {
        const level = parseInt(token.tag.slice(1), 10);
        const inlineToken = tokens[i + 1];
        if (inlineToken && inlineToken.type === "inline") {
          const text = inlineToken.content;
          const id = this.slugify(text);
          toc.push({ level, text, id });
        }
      }
    }

    return toc;
  }

  /**
   * Register a markdown-it plugin dynamically
   */
  use(plugin: MarkdownIt.PluginSimple | MarkdownIt.PluginWithOptions | MarkdownIt.PluginWithParams, ...params: any[]): this {
    this.md.use(plugin, ...params);
    return this;
  }

  /**
   * Add ID anchors to heading elements for TOC linking
   */
  private addHeadingAnchors(): void {
    const slugify = this.slugify.bind(this);
    const originalOpen =
      this.md.renderer.rules.heading_open ||
      function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
      };

    this.md.renderer.rules.heading_open = function (
      tokens,
      idx,
      options,
      env,
      self
    ) {
      const inlineToken = tokens[idx + 1];
      if (inlineToken && inlineToken.type === "inline") {
        const id = slugify(inlineToken.content);
        tokens[idx].attrSet("id", id);
        tokens[idx].attrJoin("class", "pd-md-heading");
      }
      return originalOpen(tokens, idx, options, env, self);
    };
  }

  /**
   * Convert heading text to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\u4e00-\u9fff-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
