import { expect, test } from "@playwright/test";

for (const [adapter, url] of [
  ["React", "http://127.0.0.1:4173/pd-markdown-editor/"],
  ["Vue", "http://127.0.0.1:4174/"],
]) {
  test(`${adapter} preserves an editable draft across mode switches`, async ({ page }) => {
    await page.goto(url);
    const input = page.getByRole("textbox");
    await input.fill("# Kept draft");
    await expect(page.locator(".pd-md-preview h1")).toHaveText("Kept draft");

    for (let cycle = 0; cycle < 2; cycle += 1) {
      await page.getByRole("button", { name: "preview", exact: true }).click();
      await expect(input).not.toBeVisible();
      await expect(page.locator(".pd-md-preview h1")).toHaveText("Kept draft");
      await page.getByRole("button", { name: "edit", exact: true }).click();
      await expect(input).toBeVisible();
      await expect(input).toHaveText("# Kept draft");
      await page.getByRole("button", { name: "split", exact: true }).click();
      await expect(page.locator(".pd-md-preview h1")).toHaveText("Kept draft");
    }

    await input.fill("# Still editable");
    await expect(page.locator(".pd-md-preview h1")).toHaveText("Still editable");
    await expect(page.locator(".cm-editor")).toHaveCount(1);
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
  });
}

test("React demo supports document actions and localization", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("http://127.0.0.1:4173/pd-markdown-editor/");

  await page.getByRole("button", { name: "Copy Markdown" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Markdown copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("# Technical Markdown");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .md" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("pd-editor-demo.md");

  await page.locator('input[type="file"]').setInputFiles({
    name: "demo.png",
    mimeType: "image/png",
    buffer: Buffer.from("demo"),
  });
  const uploadStatus = page.locator(".demo-upload-status");
  await expect(uploadStatus).toContainText("demo.png");
  await expect(uploadStatus).toContainText("success");

  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByRole("heading", { name: "面向 React 和 Vue 的技术型 Markdown 编辑器。" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "目录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "上传图片" })).toBeVisible();
});

test("mobile demos keep the table of contents accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("http://127.0.0.1:4173/pd-markdown-editor/");
  const reactToc = page.getByRole("navigation", { name: "Table of Contents" });
  await expect(reactToc).toBeVisible();
  await expect.poll(async () => (await reactToc.boundingBox())?.width ?? 0).toBeGreaterThan(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.goto("http://127.0.0.1:4174/");
  const vueToc = page.getByRole("navigation", { name: "Table of Contents" });
  await expect(vueToc).toBeVisible();
  await expect.poll(async () => (await vueToc.boundingBox())?.width ?? 0).toBeGreaterThan(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByRole("heading", { name: "pd-editor Vue 演示" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "目录" })).toBeVisible();
});
