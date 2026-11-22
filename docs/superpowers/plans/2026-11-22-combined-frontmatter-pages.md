# Combined Frontmatter Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every main page's editorial copy come from `src/content/pages/*.md` while keeping all existing routes, validation gates, and `site.ts` SSOT intact.

**Architecture:** Extend the `pages` collection with a discriminated block union that reuses the existing editorial blocks and adds page-structure blocks (`hero`, `link-grid`, `listing`, `contact`). Add a small helper module mapping slug → entry, then make each existing route resolve its entry and render thin components. `[slug].astro` skips route-owned slugs so no path is duplicated. Documentation is explicitly labelled as development-mode, not final architecture.

**Tech Stack:** Astro 7+, TypeScript strict, Zod via Astro Content Collections, Node test runner (`node:test`), Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-22-combined-frontmatter-pages-design.md`

## Global Constraints

- Branch from `upstream/main` at `f123502`; commit on that branch, never directly on fork `main`.
- Run all validation in the main checkout `/www/wwwroot/tnvcertification`; the native worktree at `/home/aapanel/.local/share/opencode/worktree/...` makes `astro sync` exit `132` (SIGILL).
- The `konsult`/`consult` word family is prohibited in all public-facing content and component copy; CONTENT-013 fails the build.
- Every publishable entry needs: H1, exactly one intro paragraph after it matching `intro`, intro beginning with `title adalah ...`, unique `metaDescription`, one `featuredImage` whose alt contains `title adalah` and is shorter than the intro, and no downward heading-level skips.
- `src/site.ts` is the single source of truth for company identity, contact details, addresses, and navigation. Do not duplicate those values in markdown or components.
- No new dependencies. Tailwind utilities plus existing semantic CSS classes only.
- Do not modify the language switcher, its flags, or its tests.

## Review Focus

- **Reserved slug collision:** adding `home`/`services`/etc. entries must not make `[slug].astro` emit `/home/` etc. → Task 1 test asserts the filter and Task 7 inspects `dist/`.
- **Build-blocking editorial rules:** new entries easily violate CONTENT-003/006/008/009 → Task 2 test parses each entry's frontmatter and asserts those rules before build.
- **Leftover hardcoded copy:** old hero/heading strings may remain in `.astro` → Task 4 and Task 5 tests assert the exact old strings are absent.
- **Missing or ambiguous page entry:** a route must fail loudly when its entry is missing or draft → Task 1 test asserts `getPageEntry` throws with the slug in the message.
- **Contact SSOT drift:** the `/about-us/` contact block must not gain literal email/phone/address → Task 3 test asserts `ContactPanel.astro` imports from `site.ts` and contains no literal contact value.

---

### Task 1: Page block schema and access helpers

**Files:**
- Modify: `src/content.config.ts:18-96,182-205`
- Modify: `src/pages/[slug].astro` (reserved-slug filter only)
- Create: `src/data/pages.ts`
- Create: `tests/page-block-schema.test.mjs`

**Interfaces:**
- Consumes: `blockIdSchema`, `sectionSurfaceSchema`, `baseEntrySchema`, `collectionRegistry` from `src/content.config.ts`.
- Produces: `pageBlockSchema` in the Zod config; from `src/data/pages.ts`: `routeOwnedPageSlugs: readonly string[]`, `getPageEntry(slug: string): Promise<CollectionEntry<"pages">>`, `getPageHero(entry: CollectionEntry<"pages">): HeroBlock | undefined`, `getPageBlocks(entry: CollectionEntry<"pages">): PageBlock[]`; exported types `PageBlock`, `HeroBlock`, `LinkGridBlock`, `ListingBlock`, `ContactBlock`.

- [ ] **Step 1: Create the working branch**

```bash
git switch fork-main
git fetch upstream --prune
git switch -c feat/combined-frontmatter-pages upstream/main
git status --short --branch
```

Expected: clean tree on `feat/combined-frontmatter-pages` at `f123502`.

- [ ] **Step 2: Write the failing schema/helper contract test**

`tests/page-block-schema.test.mjs` must read `src/content.config.ts`, `src/data/pages.ts`, and `src/pages/[slug].astro` as text and assert:
- the config contains `type: z.literal("hero")`, `type: z.literal("link-grid")`, `type: z.literal("listing")`, and `type: z.literal("contact")`;
- the config contains `pageBlockSchema` and `blocks: z.array(pageBlockSchema).optional()` inside `pageSchema`;
- `src/data/pages.ts` exists and exports `routeOwnedPageSlugs`, `getPageEntry`, `getPageHero`, and `getPageBlocks`;
- `[slug].astro` imports `routeOwnedPageSlugs` and filters entries with `!routeOwnedPageSlugs.includes(...)` in `getStaticPaths`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-block-schema.test.mjs`
Expected: FAIL because `src/data/pages.ts` does not exist.

- [ ] **Step 4: Extend the Zod schema**

In `src/content.config.ts`, define `heroBlock`, `linkGridBlock`, `listingBlock`, `contactBlock` with `id: blockIdSchema.optional()` and `surface: sectionSurfaceSchema.optional()` each. Use exactly these required fields:
- `heroBlock`: `title: z.string().min(1)`; optional `eyebrow`, `description`, `image`, `imageAlt`.
- `linkGridBlock`: `items: z.array(z.object({ title: z.string().min(1), href: z.string().min(1), eyebrow: z.string().optional(), description: z.string().optional(), actionLabel: z.string().optional() })).min(1)`; optional `eyebrow`, `title`.
- `listingBlock`: `source: z.enum(["services", "trainings", "schedules", "articles"])`; optional `eyebrow`, `title`, `description`, `emptyTitle`, `emptyDescription`, `emptyActionLabel`, `emptyActionHref`.
- `contactBlock`: `title: z.string().min(1)`; optional `eyebrow`, `description`, `labels` object with optional `email`, `phone`, `address`.

Build `pageBlockSchema = z.discriminatedUnion("type", [heroBlock, linkGridBlock, listingBlock, contactBlock, contentSectionBlock, faqBlock, howToBlock, ctaBlock])`. Extend `pageSchema` with `blocks: z.array(pageBlockSchema).optional()`. Do not change `blockSchema` used by services/training.

- [ ] **Step 5: Add the helper module**

In `src/data/pages.ts`, set `routeOwnedPageSlugs = ["home", "services", "csms", "trainings", "schedules", "articles"] as const`. Implement `getPageEntry(slug)` with `getCollection("pages", entry => entry.data.slug === slug && entry.data.draft !== true)`, throwing `Page entry "slug" not found or is a draft` when the array is empty. Implement `getPageHero` and `getPageBlocks` as typed selectors over `entry.data.blocks`, exporting matching TypeScript union types. Then filter `getStaticPaths()` in `src/pages/[slug].astro` with the reserved-slug list so future entries cannot emit a duplicate route.

- [ ] **Step 6: Run the test and the type check**

Run: `corepack pnpm test -- tests/page-block-schema.test.mjs && corepack pnpm check`
Expected: new test PASS; `check` exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/data/pages.ts src/pages/\[slug\].astro tests/page-block-schema.test.mjs
git commit -m "feat(pages): add page block schema and entry helpers"
```

---

### Task 2: Markdown entries for every page surface

**Files:**
- Create: `src/content/pages/0020-halaman-home.md`, `0021-halaman-services.md`, `0022-halaman-csms.md`, `0023-halaman-trainings.md`, `0024-halaman-schedules.md`, `0025-halaman-articles.md`
- Modify: `src/content/pages/0010-halaman-about-us.md` (add one `contact` block)
- Test: `tests/page-content-frontmatter.test.mjs`

**Interfaces:**
- Consumes: `pageBlockSchema` field names from Task 1.
- Produces: entries with slugs `home`, `services`, `csms`, `trainings`, `schedules`, `articles`; `about-us` gains a `contact` block.

- [ ] **Step 1: Write the failing content test**

`tests/page-content-frontmatter.test.mjs` must read the seven files with `node:fs/promises`, parse frontmatter with the existing `yaml` package, and assert for each file:
- `title`, `intro`, `metaDescription`, `pubDate`, `featuredImage.src`, `featuredImage.alt`, `slug`, `translationKey`, `lang === "id"` are present;
- `intro.toLowerCase().startsWith((title + " adalah").toLowerCase())`;
- `featuredImage.alt` includes `title + " adalah"` and has fewer characters than `intro`;
- `metaDescription !== intro` and `metaDescription !== featuredImage.alt`;
- no `(?i)konsult|consult` in the whole file;
- body contains exactly one `# ` heading and no heading-level skips.

Additionally assert the slug set equals `["home", "services", "csms", "about-us", "trainings", "schedules", "articles"]` and that each slug appears only once.

- [ ] **Step 2: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-content-frontmatter.test.mjs`
Expected: FAIL because the six new files do not exist.

- [ ] **Step 3: Create the six entries**

Use `draft: false`, distinct `pubDate` values in 2026, unique `translationKey` values `page-hal-<slug>`, and existing images from `public/images/illustrations/`:
- `home`: title `Beranda Intiprima Sertifikasi`; `featuredImage.src` `/images/illustrations/home-assurance.webp`; blocks: one `hero` (eyebrow `Informasi • Layanan • Wawasan`, title `Sertifikasi dan kepatuhan, dengan informasi yang jelas.`, description from `siteSettings.description` copy in markdown), one `link-grid` with the two existing homepage links (`/services/`, `/articles/`), one `listing` with `source: articles` and title `Artikel Terbaru`, eyebrow `Wawasan terbaru`.
- `services`: title `Layanan Intiprima Sertifikasi`; image `/images/illustrations/services-assessment.webp`; blocks: `hero` (eyebrow `Layanan profesional`, title `Layanan Kami`, existing description), `listing` with `source: services` and empty copy, `listing` with `source: articles` and title `Artikel Terbaru`.
- `csms`: title `Contractor Safety Management System (CSMS)`; image `/images/illustrations/csms-safety.webp`; blocks: `hero`, four `content-section` blocks carrying the existing four sections and six readiness items, one `cta` block linking to `/services/`.
- `trainings`: title `Program Pelatihan Intiprima Sertifikasi`; image `/images/illustrations/training-competency.webp`; blocks: `hero` and `listing` with `source: trainings` plus the existing empty-state copy.
- `schedules`: title `Jadwal Pelatihan Intiprima Sertifikasi`; image `/images/illustrations/schedules-calendar.webp`; blocks: `hero` and `listing` with `source: schedules` plus the existing empty-state copy and link `/trainings/`.
- `articles`: title `Artikel Intiprima Sertifikasi`; image `/images/illustrations/articles-editorial.webp`; blocks: `hero` and `listing` with `source: articles` plus `emptyTitle: "Artikel belum tersedia."`.

Every body must be `# <title>`, then the exact `intro` paragraph, then at least one `## ` section with a short factual paragraph. Never invent dates, prices, claims, or relationships.

- [ ] **Step 4: Add the contact block to `about-us`**

Append to `blocks:` in `0010-halaman-about-us.md` one `contact` block with id `kontak-intiprima`, title `Hubungi Intiprima Sertifikasi`, description asking visitors to use the contact channels for certification information, and `labels` for email, phone, and address. Do not put actual contact values in the markdown.

- [ ] **Step 5: Run the content test and the build gate**

Run: `corepack pnpm test -- tests/page-content-frontmatter.test.mjs && corepack pnpm build`
Expected: test PASS; build exit 0 with no CONTENT-00x diagnostics.

- [ ] **Step 6: Commit**

```bash
git add src/content/pages
git commit -m "content: move main page copy into pages collection"
```

---

### Task 3: Presentational components for page blocks

**Files:**
- Create: `src/components/page/PageHero.astro`, `LinkGrid.astro`, `ListingSection.astro`, `ContactPanel.astro`, `PageBlockRenderer.astro`
- Test: `tests/page-block-components.test.mjs`

**Interfaces:**
- Consumes: exported block types from `src/data/pages.ts`; `organization`, `siteSettings` from `src/site.ts`; existing `BlockRenderer.astro`.
- Produces: `PageHero` props `{ block: HeroBlock; fallbackImage: { src: string; alt: string } }`; `LinkGrid` props `{ block: LinkGridBlock }`; `ListingSection` props `{ block: ListingBlock; hasItems: boolean }` with a default slot for item markup; `ContactPanel` props `{ block: ContactBlock }`; `PageBlockRenderer` props `{ blocks: PageBlock[]; fallbackImage: { src: string; alt: string } }`.

- [ ] **Step 1: Write the failing component contract test**

`tests/page-block-components.test.mjs` reads each new `.astro` file and asserts:
- every file exists;
- `ContactPanel.astro` contains `from "../../site"` and does **not** contain any literal from `organization.contact` (email, phone, street);
- `ListingSection.astro` contains `<slot />` and renders `emptyTitle` and `emptyDescription` only in the no-items branch;
- `PageHero.astro` does not contain a literal Indonesian sentence and uses `fallbackImage` when `block.image` is absent;
- `PageBlockRenderer.astro` imports `BlockRenderer` and delegates `content-section`, `faq`, `howto`, and `cta` blocks to it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-block-components.test.mjs`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the five components**

Use existing shared components and Tailwind classes; no new packages. `PageBlockRenderer` handles `hero`, `link-grid`, and `contact` itself and passes the remaining blocks to `BlockRenderer` unchanged. `listing` blocks are intentionally rendered by routes because their item markup differs per data source.

- [ ] **Step 4: Run the component test and lint**

Run: `corepack pnpm test -- tests/page-block-components.test.mjs && corepack pnpm lint`
Expected: test PASS; lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/page tests/page-block-components.test.mjs
git commit -m "feat(pages): add page block presentational components"
```

---

### Task 4: Migrate listing routes to page entries

**Files:**
- Modify: `src/pages/index.astro`, `src/pages/services/index.astro`, `src/pages/trainings/index.astro`, `src/pages/articles/index.astro`, `src/pages/articles/page/[page].astro`
- Modify: `src/components/HomeHero.astro`
- Test: `tests/page-listing-routes.test.mjs`

**Interfaces:**
- Consumes: `getPageEntry`, `getPageHero`, `getPageBlocks`, `routeOwnedPageSlugs` from Task 1; components from Task 3; existing `getPublishedArticles`, `getServiceIndexArticles`, `getPublishedServices`, `servicePath`, `getHomepageArticles`, `getPageLinks`, `getAdjacentPageHrefs`.
- Produces: no new exports.

- [ ] **Step 1: Write the failing route regression test**

`tests/page-listing-routes.test.mjs` reads the five route files and `HomeHero.astro` and asserts each of these exact old strings is absent:
- `Sertifikasi dan kepatuhan, dengan informasi yang jelas.`
- `Informasi layanan`
- `Artikel dan panduan`
- `Artikel Terbaru` as a literal in a route file (the word must now come from a block)
- `Layanan Kami`
- `Program Pelatihan`
- `Katalog pelatihan sedang disiapkan`
- `Wawasan dan publikasi`
- `Artikel sertifikasi, pelatihan, dan kepatuhan.`
- `eyebrow="Informasi • Layanan • Wawasan"`

It also asserts each route file contains `getPageEntry(` with its own slug (`"home"`, `"services"`, `"trainings"`, `"articles"`; the paginated route uses `"articles"`).

- [ ] **Step 2: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-listing-routes.test.mjs`
Expected: FAIL on the first absent-string assertion.

- [ ] **Step 3: Rewrite the routes**

In each route: call `getPageEntry(slug)`, take `hero = getPageHero(entry)` and `blocks = getPageBlocks(entry)`, use `entry.data.title`/`entry.data.metaDescription`/`entry.data.featuredImage.src` for layout metadata (append `siteSettings.title` only for the browser title where the current route already does). Render `PageHero` from the hero block; for each `listing` block, render `ListingSection` with `hasItems` from the existing dynamic query and keep the current cards/rows in the default slot. `articles/page/[page].astro` reuses the `articles` entry for metadata and keeps its on-page `Halaman ${page}` label and canonical. Remove `HomeHero.astro`'s default eyebrow so it is prop-only.

- [ ] **Step 4: Run the route test, check, and build**

Run: `corepack pnpm test -- tests/page-listing-routes.test.mjs && corepack pnpm check && corepack pnpm build`
Expected: test PASS; check and build exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages src/components/HomeHero.astro tests/page-listing-routes.test.mjs
git commit -m "feat(pages): feed listing routes from page entries"
```

---

### Task 5: Migrate content routes

**Files:**
- Modify: `src/pages/csms/index.astro`, `src/pages/schedules/index.astro`
- Test: `tests/page-content-routes.test.mjs`

**Interfaces:**
- Consumes: `getPageEntry`, `getPageHero`, `getPageBlocks` from Task 1; `PageBlockRenderer`, `ListingSection` from Task 3.
- Produces: no new exports.

- [ ] **Step 1: Write the failing route test**

`tests/page-content-routes.test.mjs` reads the two route files plus `src/pages/[slug].astro` and asserts:
- `csms/index.astro` contains `getPageEntry("csms")` and `PageBlockRenderer`, and does not contain any of the four old section headings (`Status layanan TNCVCertification`, `Area kesiapan yang dapat dipersiapkan`, `Hubungan CSMS dengan ISO 45001`, `Informasi layanan lainnya`) or the six old readiness list items;
- `schedules/index.astro` contains `getPageEntry("schedules")` and `ListingSection`, and does not contain `Belum ada jadwal yang dipublikasikan` or `Jadwal Pelatihan`;
- `[slug].astro` still renders `about-us` body and delegates its blocks to `PageBlockRenderer` so the `contact` block is rendered through `ContactPanel`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-content-routes.test.mjs`
Expected: FAIL on the first assertion.

- [ ] **Step 3: Rewrite the three routes**

`csms/index.astro` becomes layout + `PageHero` + `PageBlockRenderer` only. `schedules/index.astro` keeps schedule query, date formatting, and `statusLabel` logic but moves all visible copy to its entry's hero and `listing` block. In `[slug].astro`, keep the Task 1 reserved-slug filter unchanged and add `PageBlockRenderer` after the `about-us` body so its `contact` block renders with values from `site.ts`.

- [ ] **Step 4: Run the route test and build**

Run: `corepack pnpm test -- tests/page-content-routes.test.mjs && corepack pnpm build`
Expected: test PASS; build exit 0; build log page count unchanged (36 pages).

- [ ] **Step 5: Commit**

```bash
git add src/pages/csms/index.astro src/pages/schedules/index.astro src/pages/\[slug\].astro tests/page-content-routes.test.mjs
git commit -m "feat(pages): feed content routes and filter reserved slugs"
```

---

### Task 6: Revise rules and documentation

**Files:**
- Modify: `AGENTS.md`, `docs/architecture.md`, `docs/components-blocks-layouts.md`, `docs/bilingual-content.md`
- Test: `tests/page-docs-contract.test.mjs`

**Interfaces:**
- Consumes: approved spec at `docs/superpowers/specs/2026-11-22-combined-frontmatter-pages-design.md`.
- Produces: no code exports.

- [ ] **Step 1: Write the failing documentation test**

`tests/page-docs-contract.test.mjs` reads the four files and asserts:
- `AGENTS.md` contains a section heading matching `/Page content source of truth \(development mode\)/` and the phrase `development`;
- `AGENTS.md` states that `.astro` files must not own editorial page copy;
- `docs/architecture.md` mentions `routeOwnedPageSlugs` and `src/data/pages.ts`;
- `docs/components-blocks-layouts.md` mentions all four new block types;
- `docs/bilingual-content.md` states that page entries are ID-only in this phase.

- [ ] **Step 2: Run the test to verify it fails**

Run: `corepack pnpm test -- tests/page-docs-contract.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Update the documents**

Add the named AGENTS.md section describing the combined development-mode rule: page copy lives in `src/content/pages/`, `.astro` only presents and wires dynamic data, `site.ts` remains SSOT, and the concept is provisional. Update architecture flow, block catalogue, and bilingual status accordingly. Do not rewrite unrelated sections.

- [ ] **Step 4: Run the documentation test and lint**

Run: `corepack pnpm test -- tests/page-docs-contract.test.mjs && corepack pnpm lint`
Expected: test PASS; lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs/architecture.md docs/components-blocks-layouts.md docs/bilingual-content.md tests/page-docs-contract.test.mjs
git commit -m "docs: record combined frontmatter pages as development mode"
```

---

### Task 7: Full validation and delivery handoff

**Files:** no source changes expected; fix-forward commits only if a gate fails.

**Interfaces:**
- Consumes: all previous tasks.

- [ ] **Step 1: Run every project gate**

```bash
export PATH="$HOME/.nvm/versions/node/v26.13.1/bin:$PATH"
for cmd in check lint test build audit:seo audit:blocks audit:page-images; do
  corepack pnpm "$cmd" >"/tmp/opencode/combined-$cmd.log" 2>&1
  code=$?
  echo "$cmd EXIT=$code"
  [ "$code" -ne 0 ] && tail -n 40 "/tmp/opencode/combined-$cmd.log" && exit "$code"
done
```

Expected: all seven commands exit 0; test log shows zero failures; build log shows 36 pages.

- [ ] **Step 2: Inspect built output**

Run: `find dist -maxdepth 3 -name index.html | sort` and assert there is no `dist/home/index.html`, no duplicate `services` path, and that `dist/index.html`, `dist/about-us/index.html`, `dist/csms/index.html`, and `dist/articles/index.html` exist. Page-2 output is conditional on more than 9 published articles (currently 9), so do not assert it.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --stat upstream/main..HEAD && git status --short --branch`.
Expected: only files named in Tasks 1–6 plus any fix-forward changes; clean working tree.

- [ ] **Step 4: Report and hand off**

Report commit hashes, validation evidence, and anything not verified. Stop before pushing or opening the PR; the human partner decides the fork preview and upstream PR steps after reviewing the branch.
