import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "out");
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const pages = ["index.html", "docs/index.html", "brand/index.html", "404.html"];
let child;
let origin;

function exportPath(url) {
  const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  assert.ok(
    !base || pathname === base || pathname.startsWith(`${base}/`),
    `Missing base path on ${url}`,
  );
  const relative = pathname.slice(base.length).replace(/^\//, "");
  return path.join(
    out,
    relative.endsWith("/") || !relative ? `${relative}index.html` : relative,
  );
}

before(async () => {
  await stat(path.join(out, "index.html")).catch(() => {
    throw new Error("Run npm run build before npm test.");
  });
  child = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Static preview did not start")),
      10000,
    );
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Preview exited: ${code}`));
    });
    child.stdout.on("data", (chunk) => {
      const found = String(chunk).match(/localhost:(\d+)/);
      if (found) {
        clearTimeout(timeout);
        resolve(found[1]);
      }
    });
  });
  origin = `http://127.0.0.1:${port}`;
});
after(() => child?.kill());

test("every route is served from the static export, including direct deep links", async () => {
  for (const route of ["/", "/docs/", "/brand/"]) {
    const response = await fetch(`${origin}${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /GuardianWAF/);
  }
});

test("all local links, Next chunks, preloaded fonts, and image references resolve", async () => {
  const seen = new Set();
  for (const page of pages) {
    const html = await readFile(path.join(out, page), "utf8");
    for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const url = match[1].replaceAll("&amp;", "&");
      if (!url.startsWith("/") || url.startsWith("//") || seen.has(url))
        continue;
      seen.add(url);
      const target = exportPath(url);
      assert.ok(
        (await stat(target)).isFile(),
        `Missing ${url}, linked from ${page}`,
      );
      assert.equal((await fetch(`${origin}${url}`)).status, 200, url);
    }
  }
  assert.ok(
    seen.size > 15,
    `Expected route and asset coverage; saw ${seen.size} references`,
  );
});

test("navigation fragments and quick-start anchors point to existing sections", async () => {
  for (const page of pages.slice(0, 3)) {
    const html = await readFile(path.join(out, page), "utf8");
    for (const match of html.matchAll(/href="([^"<>]*#[^"<>]+)"/g)) {
      const [target, hash] = match[1].split("#");
      if (target && !target.startsWith("/")) continue;
      const targetHtml = target
        ? await readFile(exportPath(target), "utf8")
        : html;
      assert.ok(
        targetHtml.includes(`id="${hash}"`),
        `Missing #${hash} from ${page}`,
      );
    }
  }
});

test("SVG downloads are self-contained, outlined, and delivered as SVG", async () => {
  for (const variant of [
    "logo-dark",
    "logo-light",
    "mark-dark",
    "mark-light",
    "stacked-dark",
    "stacked-light",
  ]) {
    const response = await fetch(
      `${origin}${base}/brand/guardianwaf-${variant}.svg`,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/svg+xml");
    const svg = await response.text();
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.match(svg, /<path/);
    assert.doesNotMatch(
      svg,
      /<text|<image|<script|https?:\/\/(?!www\.w3\.org)/,
    );
  }
});

test("unknown routes return a genuine 404 with the branded recovery page", async () => {
  const response = await fetch(`${origin}${base}/this-page-does-not-exist/`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Nothing to guard here/);
});

test("social images, discovery metadata, and font licenses are included", async () => {
  for (const file of [
    "social-card.png",
    "apple-touch-icon.png",
    "favicon.svg",
    "brand/guardianwaf-mark.png",
    "brand/guardianwaf-stacked.png",
    "robots.txt",
    "sitemap.xml",
    "licenses/Geist-OFL.txt",
    "licenses/GeistMono-OFL.txt",
  ]) {
    const response = await fetch(`${origin}${base}/${file}`);
    assert.equal(response.status, 200, file);
    assert.ok(
      (await response.arrayBuffer()).byteLength > 10,
      `Empty asset: ${file}`,
    );
  }
  const home = await readFile(path.join(out, "index.html"), "utf8");
  assert.match(home, /property="og:image"/);
  assert.match(home, /rel="canonical"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
});

test("encoded traversal cannot expose workspace source", async () => {
  const response = await fetch(`${origin}${base}/%2e%2e%2fpackage.json`);
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /"dependencies"/);
});
