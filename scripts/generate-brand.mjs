import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as fontkit from "fontkit";
import sharp from "sharp";
import { brandColors, shieldMarkup } from "../src/lib/brand-shapes.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const font = fontkit.openSync(path.join(root, "scripts/fonts/Geist.ttf"));
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
for (const [mode, accent, ink] of [
  ["dark", brandColors.sky, "#EDF4FF"],
  ["light", brandColors.blue, brandColors.navy],
]) {
  const logomark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" fill="none" role="img" aria-label="GuardianWAF shield"><title>GuardianWAF shield</title>${shieldMarkup()}</svg>`;
  await writeFile(
    path.join(brandDir, `guardianwaf-mark-${mode}.svg`),
    logomark,
  );
  const guardian = textOutline("Guardian", 55, 36, 31, ink, 760);
  const waf = textOutline("WAF", 55 + guardian.width, 36, 31, accent, 760);
  const width = Math.ceil(60 + guardian.width + waf.width);
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 48" role="img" aria-label="GuardianWAF"><title>GuardianWAF</title><g transform="scale(.4)">${shieldMarkup()}</g>${guardian.paths}${waf.paths}</svg>`;
  await writeFile(path.join(brandDir, `guardianwaf-logo-${mode}.svg`), logo);
  const stackedGuardian = textOutline("Guardian", 0, 0, 76, ink, 760);
  const stackedWaf = textOutline(
    "WAF",
    stackedGuardian.width,
    0,
    76,
    accent,
    760,
  );
  const textWidth = stackedGuardian.width + stackedWaf.width;
  const stacked = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="GuardianWAF stacked logo"><title>GuardianWAF</title><g transform="translate(150 40) scale(3)">${shieldMarkup()}</g><g transform="translate(${(600 - textWidth) / 2} 510)">${stackedGuardian.paths}${stackedWaf.paths}</g></svg>`;
  await writeFile(
    path.join(brandDir, `guardianwaf-stacked-${mode}.svg`),
    stacked,
  );
  if (mode === "light") {
    await sharp(Buffer.from(logomark))
      .resize(512, 614)
      .png()
      .toFile(path.join(brandDir, "guardianwaf-mark.png"));
    await sharp(Buffer.from(stacked))
      .resize(1200, 1200)
      .png()
      .toFile(path.join(brandDir, "guardianwaf-stacked.png"));
  }
}
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><title>GuardianWAF</title>${shieldMarkup()}</svg>`;
await writeFile(path.join(root, "public/favicon.svg"), favicon);
const touchIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="${brandColors.night}"/><g transform="translate(35 24) scale(1.1)">${shieldMarkup()}</g></svg>`;
await sharp(Buffer.from(touchIcon))
  .png()
  .toFile(path.join(root, "public/apple-touch-icon.png"));
const headline = textOutline(
  "Your traffic. Your rules.",
  80,
  295,
  76,
  "#EDF4FF",
  500,
);
const subhead = textOutline(
  "Your guardian.",
  80,
  389,
  83,
  brandColors.sky,
  500,
);
const guardian = textOutline("Guardian", 131, 114, 31, "#EDF4FF", 760);
const waf = textOutline(
  "WAF",
  131 + guardian.width,
  114,
  31,
  brandColors.sky,
  760,
);
const caption = textOutline(
  "Pure Go. Zero dependencies. One binary.",
  83,
  486,
  25,
  "#A3B4CC",
  400,
);
const footer = textOutline(
  "OPEN SOURCE / MIT LICENSED",
  83,
  565,
  14,
  "#A3B4CC",
  500,
);
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="glow"><stop stop-color="${brandColors.blue}" stop-opacity=".2"/><stop offset="1" stop-color="${brandColors.blue}" stop-opacity="0"/></radialGradient><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0v42" stroke="${brandColors.sky}" stroke-opacity=".06" fill="none"/></pattern></defs><path fill="${brandColors.night}" d="M0 0h1200v630H0z"/><path fill="url(#grid)" d="M0 0h1200v630H0z"/><ellipse cx="1000" cy="300" rx="350" ry="340" fill="url(#glow)"/><g transform="translate(82 78) scale(.36)">${shieldMarkup("header")}</g>${guardian.paths}${waf.paths}${headline.paths}${subhead.paths}${caption.paths}${footer.paths}<path d="M82 530h1036" stroke="#2A3B55"/><g transform="translate(930 187) scale(2)">${shieldMarkup("hero")}</g></svg>`;
await writeFile(path.join(brandDir, "social-card.svg"), social);
await sharp(Buffer.from(social))
  .png()
  .toFile(path.join(root, "public/social-card.png"));
const assetVersions = {};
for (const file of [
  "brand/guardianwaf-logo-dark.svg",
  "brand/guardianwaf-logo-light.svg",
  "brand/guardianwaf-mark-dark.svg",
  "brand/guardianwaf-mark-light.svg",
  "brand/guardianwaf-stacked-dark.svg",
  "brand/guardianwaf-stacked-light.svg",
  "brand/guardianwaf-mark.png",
  "brand/guardianwaf-stacked.png",
  "brand/social-card.svg",
  "favicon.svg",
  "apple-touch-icon.png",
  "social-card.png",
]) {
  assetVersions[`/${file}`] = createHash("sha256")
    .update(await readFile(path.join(root, "public", file)))
    .digest("hex")
    .slice(0, 12);
}
await writeFile(
  path.join(root, "src/lib/brand-versions.json"),
  JSON.stringify(assetVersions, null, 2) + "\n",
);
console.log(
  "Generated six outlined SVG logos, two transparent PNGs, favicon, touch icon, and social card.",
);
