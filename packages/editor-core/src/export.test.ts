import { describe, expect, it, vi } from "vitest";
import { copyHtml, copyMarkdown, downloadMarkdown } from "./export";

describe("editor export utilities", () => {
  it("copies Markdown and HTML source", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await copyMarkdown("# Hello");
    await copyHtml("<h1>Hello</h1>");

    expect(writeText).toHaveBeenNthCalledWith(1, "# Hello");
    expect(writeText).toHaveBeenNthCalledWith(2, "<h1>Hello</h1>");
  });

  it("downloads Markdown with the requested filename", () => {
    const createObjectURL = vi.fn(() => "blob:markdown");
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });

    downloadMarkdown("# Hello", "hello.md");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:markdown");
    expect(document.querySelector('a[download="hello.md"]')).toBeNull();
  });
});
