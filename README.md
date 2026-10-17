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

`/brand/` provides downloads of four self-contained SVGs: dark/light logotypes and dark/light logomarks. Wordmarks are outlined paths and do not depend on fonts. `public/brand/social-card.svg` is the editable source for `public/social-card.png`. The favicon and Apple touch icon use the same mark.

To regenerate the committed assets:

```sh
node scripts/generate-brand.mjs
```

This optional generator uses the `fontkit` and `sharp` development dependencies. Assets are already included and ordinary builds do not run the generator. Geist and Geist Mono are self-hosted; their SIL Open Font Licenses are in `public/licenses/`. The original variable font used to outline wordmarks is in `scripts/fonts/` under the same license.

## Content and interaction notes

- Product claims and quick-start examples are grounded in the upstream README, `go.mod`, and `docs/`. The supplied infographic is visual inspiration; its outdated detector/MCP counts are not copied.
- The `<1ms` p99 value is explicitly described as the upstream performance **target**, not a benchmark performed by this website.
- The request inspector is an illustration with fixed examples, not a real detection engine. Its scores and the dashboard preview are labeled as illustrative.
- Theme selection persists in browser local storage, follows the system until explicitly selected, and initializes before paint.
- Native accordions, accessible keyboard tabs, a mobile menu, skip navigation, visible focus states, and reduced-motion support are included.
- Some optional upstream features use external services. “Zero dependencies” refers to the core WAF’s external Go module dependencies.

## Dependency audit

At implementation, `npm audit --omit=dev` reported zero vulnerabilities. Full `npm audit` reported an unpatched `braces` denial-of-service advisory (GHSA-vfj7-8cjw-p6xm) through the Next ESLint development dependency chain. The npm-proposed fix downgrades `eslint-config-next` to 14.x and is not applied to this Next.js 16 project. Recheck advisories before publication; these tools do not ship in the static site.
