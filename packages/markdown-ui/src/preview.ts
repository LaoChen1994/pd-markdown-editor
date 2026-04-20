import { MarkdownRenderer } from "pd-markdown";
import type { TocItem } from "pd-markdown";
import type { MarkdownPreviewOptions, PreviewTheme, TocOptions } from "./types";
import { TocRenderer } from "./toc";

export class MarkdownPreview {
  private container: HTMLElement;
  private contentEl: HTMLElement;
  private tocRenderer: TocRenderer | null = null;
  private theme: PreviewTheme;
  private renderer: MarkdownRenderer;

  constructor(options: MarkdownPreviewOptions) {
    this.container = options.container;
    this.theme = options.theme ?? "light";
    this.renderer = new MarkdownRenderer();
    this.container.classList.add("pd-md-preview-wrapper", `pd-md-theme-${this.theme}`);

    const layout = document.createElement("div");
    layout.className = "pd-md-preview-layout";
    Object.assign(layout.style, { display: "flex", gap: "0", width: "100%", height: "100%" });

    this.contentEl = document.createElement("div");
    this.contentEl.className = "pd-md-preview";
    Object.assign(this.contentEl.style, { flex: "1", minWidth: "0", overflow: "auto" });

    if (options.toc !== false) {
      const tocOpts: TocOptions = typeof options.toc === "object" ? options.toc : {};
      const tocEl = document.createElement("div");
      tocEl.style.width = "220px";
      tocEl.style.flexShrink = "0";
      if (tocOpts.position === "left") { layout.appendChild(tocEl); layout.appendChild(this.contentEl); }
      else { layout.appendChild(this.contentEl); layout.appendChild(tocEl); }
      this.tocRenderer = new TocRenderer(tocEl, tocOpts.maxLevel ?? 3);
    } else {
      layout.appendChild(this.contentEl);
    }
    this.container.appendChild(layout);
  }

  render(html: string, tocItems?: TocItem[]): void {
    this.contentEl.innerHTML = html;
    if (this.tocRenderer && tocItems) this.tocRenderer.render(tocItems);
  }

  renderMarkdown(markdown: string): void {
    const html = this.renderer.render(markdown);
    const tocItems = this.renderer.extractToc(markdown);
    this.render(html, tocItems);
  }

  setTheme(theme: PreviewTheme): void {
    this.container.classList.remove(`pd-md-theme-${this.theme}`);
    this.theme = theme;
    this.container.classList.add(`pd-md-theme-${this.theme}`);
  }

  scrollToHeading(id: string): void {
    if (this.tocRenderer) this.tocRenderer.setActive(id);
    const heading = this.contentEl.querySelector(`#${CSS.escape(id)}`);
    if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  destroy(): void {
    if (this.tocRenderer) this.tocRenderer.destroy();
    this.container.innerHTML = "";
    this.container.classList.remove("pd-md-preview-wrapper", `pd-md-theme-${this.theme}`);
  }
}
