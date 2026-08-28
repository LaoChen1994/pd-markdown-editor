/** Copy Markdown source to the clipboard. */
export const copyMarkdown = (markdown: string): Promise<void> => navigator.clipboard.writeText(markdown);

/** Copy rendered HTML source to the clipboard. */
export const copyHtml = (html: string): Promise<void> => navigator.clipboard.writeText(html);

/** Download Markdown source as a local file. */
export const downloadMarkdown = (markdown: string, filename = "document.md"): void => {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
