import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as fontkit from "fontkit";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const font = fontkit.openSync(path.join(root, "scripts/fonts/Geist.ttf"));
const markPath = "M20 2 37 9v12c0 10-7 17-17 21C10 38 3 31 3 21V9L20 2Z";
function mark(color, cutout) {
  return `<path d="${markPath}" fill="${color}"/><path d="m20 10 10 4v8c0 5-4 10-10 13-6-3-10-8-10-13v-8l10-4Z" fill="${cutout}"/><path d="M20 15v13m-6-10v6m12-6v6" stroke="${color}" stroke-width="3"/>`;
}
function textOutline(text, x, y, size, color, weight = 550) {
  const face = font.getVariation ? font.getVariation({ wght: weight }) : font;
  const run = face.layout(text);
  const scale = size / face.unitsPerEm;
  let cursor = x;
  const result = run.glyphs
    .map((glyph, index) => {
      const position = run.positions[index];
      const glyphPath = `<path d="${glyph.path.toSVG()}" transform="translate(${cursor + position.xOffset * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})" fill="${color}"/>`;
      cursor += position.xAdvance * scale;
      return glyphPath;
    })
    .join("");
  return { paths: result, width: cursor - x };
}
const brandDir = path.join(root, "public/brand");
await mkdir(brandDir, { recursive: true });
for (const [mode, green, background, ink] of [
  ["dark", "#b6eb8b", "#101411", "#f1f3e9"],
  ["light", "#417b2e", "#f6f7f2", "#1d2c20"],
]) {
  const logomark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44" fill="none" role="img" aria-label="GuardianWAF logomark"><title>GuardianWAF logomark</title>${mark(green, background)}</svg>`;
  await writeFile(
    path.join(brandDir, `guardianwaf-mark-${mode}.svg`),
    logomark,
  );
  const guardian = textOutline("guardian", 55, 34, 31, ink, 650);
  const waf = textOutline("waf", 55 + guardian.width, 34, 31, ink, 400);
  const dot = textOutline(
    ".",
    55 + guardian.width + waf.width,
    34,
    31,
    green,
    650,
  );
  const width = Math.ceil(60 + guardian.width + waf.width + dot.width);
  await writeFile(
    path.join(brandDir, `guardianwaf-logo-${mode}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 44" role="img" aria-label="GuardianWAF"><title>GuardianWAF</title><g>${mark(green, background)}</g>${guardian.paths}${waf.paths}${dot.paths}</svg>`,
  );
}
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#101411"/><g transform="translate(4 2)">${mark("#b6eb8b", "#101411")}</g></svg>`;
await writeFile(path.join(root, "public/favicon.svg"), favicon);
await sharp(Buffer.from(favicon))
  .resize(180, 180)
  .png()
  .toFile(path.join(root, "public/apple-touch-icon.png"));
const headline = textOutline(
  "Your traffic. Your rules.",
  80,
  295,
  76,
  "#f1f3e9",
  500,
);
const subhead = textOutline("Your guardian.", 80, 389, 83, "#b6eb8b", 500);
const brand = textOutline("guardianwaf.", 131, 114, 31, "#f1f3e9", 600);
const caption = textOutline(
  "Pure Go. Zero dependencies. One binary.",
  83,
  486,
  25,
  "#a0a89e",
  400,
);
const footer = textOutline(
  "OPEN SOURCE / MIT LICENSED",
  83,
  565,
  14,
  "#a0a89e",
  500,
);
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="glow"><stop stop-color="#b6eb8b" stop-opacity=".13"/><stop offset="1" stop-color="#b6eb8b" stop-opacity="0"/></radialGradient><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0v42" stroke="#b6eb8b" stroke-opacity=".045" fill="none"/></pattern></defs><path fill="#101411" d="M0 0h1200v630H0z"/><path fill="url(#grid)" d="M0 0h1200v630H0z"/><ellipse cx="1000" cy="300" rx="350" ry="340" fill="url(#glow)"/><g transform="translate(82 80) scale(.85)">${mark("#b6eb8b", "#101411")}</g>${brand.paths}${headline.paths}${subhead.paths}${caption.paths}${footer.paths}<path d="M82 530h1036" stroke="#2b3329"/><g transform="translate(950 228) scale(4)">${mark("#b6eb8b", "#101411")}</g></svg>`;
await writeFile(path.join(brandDir, "social-card.svg"), social);
await sharp(Buffer.from(social))
  .png()
  .toFile(path.join(root, "public/social-card.png"));
console.log(
  "Generated four outlined SVG logos, favicon, touch icon, and social card.",
);
