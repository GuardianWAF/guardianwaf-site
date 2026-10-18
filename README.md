# GuardianWAF website

The independent Next.js website for [GuardianWAF](https://github.com/GuardianWAF/GuardianWAF). Built with Next.js 16.4.2, React 19.3.1, TypeScript, Motion, Lucide, and custom CSS. Versions were checked against npm on 17 October 2026. All routes export to static HTML for GitHub Pages.

## Local development

```sh
npm ci
npm run dev
```

## Production preview and checks

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

`npm test` checks the actual `out/` export, starts an ephemeral static server, and verifies direct routes, local links, fragments, fonts/chunks, downloadable SVGs, metadata, images, and 404 behavior. It does not claim to test a live WAF. To preview the production output:

```sh
# PowerShell
$env:PORT = '3187'
npm run preview
```

Visit `http://localhost:3187/`. The preview serves `out/`; rebuild after editing. `npm run dev` supports live updates. No backend, database, runtime environment variables, analytics, or external font CDN is required.

## GitHub Pages: GuardianWAF/guardianwaf-site

The included `.github/workflows/pages.yml` performs installation, lint, type checking, static export, artifact tests, and deployment. Pushes to `main` publish the verified static export; the workflow can also be started manually.

1. Create or select `GuardianWAF/guardianwaf-site`, with `main` as its default branch.
2. Push this source, including `package-lock.json`, `public/`, and `.github/workflows/pages.yml`.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
4. Run the workflow or push to `main`. The deployment URL appears in the Actions run.

`actions/configure-pages` supplies the correct `base_path`. Production metadata uses `https://guardianwaf.com`; the default GitHub Pages address redirects to the configured custom domain. Next.js links, fonts, and brand downloads follow the Pages base path, while social images, canonicals, and sitemap use the production origin.

To rehearse a project-subpath export locally:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/guardianwaf-site'
$env:NEXT_PUBLIC_SITE_URL = 'https://guardianwaf.github.io/guardianwaf-site'
npm run build
npm test
$env:PORT = '3187'
npm run preview
# http://localhost:3187/guardianwaf-site/
```

Clear the two `NEXT_PUBLIC_*` variables and rebuild to return to a root export. These variables are build-time values.

### Custom domain: guardianwaf.com

The custom domain is `guardianwaf.com`; `public/CNAME` includes this value in every static export. With GitHub Actions publishing, the repository’s Pages custom-domain setting controls domain routing. The workflow reads that setting for the root base path and explicitly uses `https://guardianwaf.com` for metadata and sitemap URLs. The apex domain needs GitHub Pages A/AAAA records. The optional `www` variant requires its own DNS record and is not part of the apex-domain setup.

## Brand assets

`/brand/` provides six self-contained SVGs: horizontal logos, stacked logos and logomarks for dark/light backgrounds. The blue shield and white terminal prompt follow the supplied GuardianWAF identity. Wordmarks are outlined paths and do not depend on fonts. `src/lib/brand-shapes.mjs` is the shared vector source for the site, downloads, favicon, Apple touch icon and social card. Transparent PNGs are also available in `public/brand/`.

Header, footer and dashboard wordmarks use the same SVG files as the downloads. The generator records content hashes in `src/lib/brand-versions.json`; previews, downloads, icons and social metadata use these versions so updated artwork gets a fresh browser cache entry.

The 1200×630 social preview is `public/og.png`, generated from `public/brand/social-card.svg` and used by Open Graph and Twitter metadata. `public/social-card.png` remains available at its original URL.

To regenerate the committed assets:

```sh
node scripts/generate-brand.mjs
```

This optional generator uses the `fontkit` and `sharp` development dependencies. Assets are already included and ordinary builds do not run the generator. Geist and Geist Mono are self-hosted; their SIL Open Font Licenses are in `public/licenses/`. The original variable font used to outline wordmarks is in `scripts/fonts/` under the same license.

## Content and interaction notes

Layout uses shared CSS tokens in `src/app/globals.css`: a fluid gutter and a 1728px maximum shell align navigation, content and footer. Wide screens use four feature tracks and three brand/resource columns; documentation separates readable copy from code panels at 1280px. Text keeps a 68ch reading measure while visual panels can fill the shell. Responsive review targets 375, 768, 1024, 1440, 1920 and 2560px.

`AnimatedBackground` in the root layout supplies two continuous SVG layers across every page and the footer: a calm field behind content and a low-opacity interaction layer above it. The foreground is a direct body child, so card overflow, section backgrounds and nested stacking contexts cannot clip its waves, trails or energized glyphs. Only viewport edges use gradient masks; text rectangles never cut holes into the scene. `AMBIENT` in `src/lib/ambient-field.mjs` controls density, speed, parallax, force radius and lifetimes. `src/lib/ambient-svg.mjs` pools four scan effects, eighteen short trail segments and up to ten lifted glyphs. Pointer events are observed passively in document capture, including over text and controls. Protected links/buttons and text selections reject scans; scrolling cancels a possible tap while preserving the mouse's viewport position. Mobile uses at most twelve background objects and smaller waves. Reduced motion displays a static field and hides the interaction layer. One frame loop pauses when hidden, and route changes clean up both scenes and their listeners/observers. Tests cover layer separation, input protection, scroll coordinates, culling, bounded effects, timing, reduced motion and cleanup. Nearby objects follow depth-weighted orbits through a critically damped spring. Each click plans one attenuating nearest-neighbour chain with at most five relays (three on mobile), curved connections and short local rings; relay slots are pooled and expire with the parent wave. No recursive effects are spawned. There is no Canvas, WebGL or additional animation dependency.

- Product claims and quick-start examples are grounded in the upstream README, `go.mod`, and `docs/`. The supplied infographic is visual inspiration; its outdated detector/MCP counts are not copied.
- The `<1ms` p99 value is explicitly described as the upstream performance **target**, not a benchmark performed by this website.
- The request inspector is an illustration with fixed examples, not a real detection engine. Its scores and the dashboard preview are labeled as illustrative.
- Theme selection persists in browser local storage, follows the system until explicitly selected, and initializes before paint.
- Native accordions, accessible keyboard tabs, a mobile menu, skip navigation, visible focus states, and reduced-motion support are included.
- Some optional upstream features use external services. “Zero dependencies” refers to the core WAF’s external Go module dependencies.

## Dependency audit

At implementation, `npm audit --omit=dev` reported zero vulnerabilities. Full `npm audit` reported an unpatched `braces` denial-of-service advisory (GHSA-vfj7-8cjw-p6xm) through the Next ESLint development dependency chain. The npm-proposed fix downgrades `eslint-config-next` to 14.x and is not applied to this Next.js 16 project. Recheck advisories before publication; these tools do not ship in the static site.
