import type { TocItem } from "pd-markdown";

/** Theme variants */
export type PreviewTheme = "light" | "dark";

/** TOC configuration */
export interface TocOptions {
  /** Position of the TOC sidebar */
  position?: "right" | "left";
  /** Maximum heading level to include, default: 3 */
  maxLevel?: number;
}

/** Configuration options for MarkdownPreview */
export interface MarkdownPreviewOptions {
  /** Container element to render into */
  container: HTMLElement;
  /** Theme variant */
  theme?: PreviewTheme;
  /** TOC configuration, true for defaults, false to disable */
  toc?: boolean | TocOptions;
}

export type { TocItem };
