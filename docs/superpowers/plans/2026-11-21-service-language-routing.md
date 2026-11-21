# Service language routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Indonesian services at `/services/*` and move English services to `/en/services/*`.

**Architecture:** A pure routing helper defines index/detail paths and the language predicate. A shared `src/data/services.ts` wraps `getCollection` with that predicate. Four thin pages (two per language) consume the module; canonical URLs and JSON-LD paths derive from the same helper.

**Tech Stack:** Astro 7 Content Collections, TypeScript 7 strict, node:test.

**Spec:** `docs/superpowers/specs/2026-11-21-service-language-routing-design.md`

## Global Constraints

- Do not change any `draft` value or any content entry.
- `src/site.ts` is the single source of truth for site identity and URL.
- Indonesian service index keeps "Artikel Terbaru" ranks 4–6 from `getServiceIndexArticles`.
- English service index omits "Artikel Terbaru".
- Canonical, card links, and JSON-LD paths must match the language route.

## Review Focus

- English entry must never appear on `/services/` — test `isPublishedServiceForLang` with the real English frontmatter shape.
- Indonesian entry must never appear on `/en/services/` — test the same predicate with Indonesian data.
- Draft entries stay hidden in both languages — test `draft: true` with matching `lang`.
- Detail canonical must follow the entry language — test `servicePath` for both languages.
- Build must emit `/en/services/` and `/en/services/<slug>/` and keep Indonesian detail paths — verify in `dist/` after build.

---

### Task 1: Shared routing helper and service query

**Files:**
- Create: `src/lib/service-routing.ts`
- Create: `src/data/services.ts`
- Test: `tests/service-routing.test.mjs`

**Interfaces:**
- Produces: `serviceIndexPath(lang: "id" | "en"): string`
- Produces: `servicePath(service: { lang: string; slug: string }): string`
- Produces: `isPublishedServiceForLang(data: { draft?: boolean; lang?: string }, lang: "id" | "en"): boolean`
- Produces: `getPublishedServices(lang: "id" | "en")` — wraps `getCollection("services", ...)`

- [ ] **Step 1: Write failing tests** in `tests/service-routing.test.mjs` asserting: English entry false for `id` and true for `en`; Indonesian entry true for `id` and false for `en`; `draft: true` false for both; `serviceIndexPath("id") === "/services/"`, `serviceIndexPath("en") === "/en/services/"`; `servicePath({lang:"en",slug:"iso-14001-2026-certification"}) === "/en/services/iso-14001-2026-certification/"`; `servicePath({lang:"id",slug:"sertifikasi-iso-9001-2026"}) === "/services/sertifikasi-iso-9001-2026/"`.
- [ ] **Step 2:** Run `npm run test` and confirm the new tests fail on missing module.
- [ ] **Step 3:** Implement `src/lib/service-routing.ts` with the three pure helpers and `src/data/services.ts` with `getPublishedServices`.
- [ ] **Step 4:** Run `npm run test`; all tests pass.
- [ ] **Step 5:** Commit `src/lib/service-routing.ts`, `src/data/services.ts`, `tests/service-routing.test.mjs`.

### Task 2: Indonesian service pages use the shared query

**Files:**
- Modify: `src/pages/services/index.astro`
- Modify: `src/pages/services/[slug].astro`

**Interfaces:**
- Consumes: `getPublishedServices("id")`, `serviceIndexPath("id")`, `servicePath(service)`

- [ ] **Step 1:** Replace the inline `getCollection` in the index with `getPublishedServices("id")`; keep ranks 4–6 article section and `lang="id"`.
- [ ] **Step 2:** Change detail `getStaticPaths` to `getPublishedServices("id")`; use `servicePath(service.data)` for both `canonical` and the JSON-LD `path`.
- [ ] **Step 3:** Run `npm run check` and `npm run build`; confirm no `/en/` entry appears in `dist/services/`.
- [ ] **Step 4:** Commit the two modified pages.

### Task 3: English service pages under `/en/services/`

**Files:**
- Create: `src/pages/en/services/index.astro`
- Create: `src/pages/en/services/[slug].astro`

**Interfaces:**
- Consumes: `getPublishedServices("en")`, `serviceIndexPath("en")`, `servicePath(service)`

- [ ] **Step 1:** Create the English index with `WidePageLayout`, `MainMenuHero`, `ServiceCard`, canonical `/en/services/`, `lang="en"`, and no article section.
- [ ] **Step 2:** Create the English detail page with `getPublishedServices("en")` in `getStaticPaths`, `ServiceLayout lang="en"`, canonical/JSON-LD from `servicePath(service.data)`, and no related-articles section.
- [ ] **Step 3:** Run `npm run check` and `npm run build`; confirm `dist/en/services/index.html` and `dist/en/services/iso-14001-2026-certification/index.html` exist and contain no Indonesian service cards.
- [ ] **Step 4:** Commit the two new pages.

### Task 4: Full validation

- [ ] **Step 1:** Run `npm run check`, `npm run test`, `npm run build`.
- [ ] **Step 2:** Assert `dist/services/index.html` contains only the two Indonesian ISO cards and no English slug; assert `dist/en/services/index.html` contains only the English slug.
- [ ] **Step 3:** Commit any validation-driven fix in a focused follow-up commit.
