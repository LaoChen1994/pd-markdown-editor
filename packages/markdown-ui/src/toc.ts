import type { TocItem } from "pd-markdown";

/**
 * TocRenderer — Renders a table of contents sidebar
 */
export class TocRenderer {
  private container: HTMLElement;
  private maxLevel: number;
  private activeId: string | null = null;

  constructor(container: HTMLElement, maxLevel: number = 3) {
    this.container = container;
    this.maxLevel = maxLevel;
    this.container.classList.add("pd-md-toc");
  }

  /**
   * Render the TOC from heading items
   */
  render(items: TocItem[]): void {
    const filtered = items.filter((item) => item.level <= this.maxLevel);

    const html = `
      <div class="pd-md-toc-title">目录</div>
      <ul class="pd-md-toc-list">
        ${filtered
          .map(
            (item) => `
          <li class="pd-md-toc-item">
            <a class="pd-md-toc-link${this.activeId === item.id ? " pd-md-toc-link--active" : ""}"
               href="#${item.id}"
               data-level="${item.level}"
               data-id="${item.id}">
              ${this.escapeHtml(item.text)}
            </a>
          </li>
        `
          )
          .join("")}
      </ul>
    `;

    this.container.innerHTML = html;

    // Bind click handlers
    this.container.querySelectorAll(".pd-md-toc-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = (link as HTMLElement).dataset.id;
        if (id) {
          this.setActive(id);
          this.scrollToHeading(id);
        }
      });
    });
  }

  /**
   * Set the active heading in the TOC
   */
  setActive(id: string): void {
    this.activeId = id;
    this.container.querySelectorAll(".pd-md-toc-link").forEach((link) => {
      const el = link as HTMLElement;
      if (el.dataset.id === id) {
        el.classList.add("pd-md-toc-link--active");
      } else {
        el.classList.remove("pd-md-toc-link--active");
      }
    });
  }

  /**
   * Scroll the preview pane to a specific heading
   */
  scrollToHeading(id: string): void {
    const heading = document.getElementById(id);
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Destroy the TOC
   */
  destroy(): void {
    this.container.innerHTML = "";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
