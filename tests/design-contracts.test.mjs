import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { openSync } from "fontkit";
import { fileURLToPath } from "node:url";

test("exported reading content stays visible before animation initialization", async () => {
  for (const page of ["index.html", "docs/index.html", "brand/index.html"]) {
    const html = await readFile(
      new URL(`../out/${page}`, import.meta.url),
      "utf8",
    );
    const reveals = html.match(/<div\b[^>]*\bdata-reveal[^>]*>/g) || [];
    if (page === "index.html") assert.ok(reveals.length);
    for (const element of reveals) {
      assert.doesNotMatch(element, /style="[^"]*opacity:\s*0(?:;|")/, page);
    }
  }
});

test("request example controls expose their group name", async () => {
  const html = await readFile(
    new URL("../out/index.html", import.meta.url),
    "utf8",
  );
  const group = html.match(/<div\b[^>]*class="request-options"[^>]*>/)?.[0];
  assert.ok(group);
  assert.match(group, /role="group"/);
  assert.match(group, /aria-label="Example requests"/);
});

test("scrollable code examples can receive keyboard focus", async () => {
  for (const page of ["index.html", "docs/index.html"]) {
    const html = await readFile(
      new URL(`../out/${page}`, import.meta.url),
      "utf8",
    );
    const examples = html.match(/<pre\b[^>]*>/g) || [];
    assert.ok(examples.length);
    for (const example of examples) assert.match(example, /tabindex="0"/, page);
  }
});

test("both interface typefaces include Latin and Turkish glyphs and variable weights", () => {
  for (const name of ["space-grotesk", "jetbrains-mono"]) {
    const font = openSync(
      fileURLToPath(new URL(`../src/app/fonts/${name}.woff2`, import.meta.url)),
    );
    for (const character of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ğĞıİşŞçÇöÖüÜ") {
      assert.ok(
        font.hasGlyphForCodePoint(character.codePointAt(0)),
        `${name}: ${character}`,
      );
    }
    assert.ok(font.variationAxes.wght.min <= 400);
    assert.ok(font.variationAxes.wght.max >= 700);
  }
});
