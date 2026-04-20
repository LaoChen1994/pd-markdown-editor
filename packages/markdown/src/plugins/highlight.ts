import hljs from "highlight.js";

/**
 * Create a highlight function for markdown-it
 * Uses highlight.js for syntax highlighting
 */
export function createHighlighter() {
  return (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const result = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        });
        return `<pre class="pd-md-code-block hljs"><code class="language-${lang}">${result.value}</code></pre>`;
      } catch {
        // Fall through to default
      }
    }

    // Default: escape HTML
    const escaped = str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    return `<pre class="pd-md-code-block"><code>${escaped}</code></pre>`;
  };
}
