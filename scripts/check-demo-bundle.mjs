import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = [
  { name: "React demo", directory: "examples/react-demo/dist", maxGzipBytes: 450_000 },
  { name: "Vue demo", directory: "examples/vue-demo/dist", maxGzipBytes: 410_000 },
];

for (const { name, directory, maxGzipBytes } of budgets) {
  const html = readFileSync(`${directory}/index.html`, "utf8");
  const entry = html.match(/<script type="module" crossorigin src="([^"]+)"/)?.[1];
  if (!entry) {
    throw new Error(`${name}: unable to find the module entry in ${directory}/index.html`);
  }

  const assetPath = entry.slice(entry.indexOf("assets/"));
  const gzipBytes = gzipSync(readFileSync(`${directory}/${assetPath}`)).byteLength;
  if (gzipBytes > maxGzipBytes) {
    throw new Error(`${name}: entry gzip size ${gzipBytes} exceeds budget ${maxGzipBytes}`);
  }

  globalThis.console.log(`${name}: ${gzipBytes} gzip bytes`);
}
