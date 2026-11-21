# Service language routing — design

**Date:** 2026-11-21
**Status:** Approved by human partner

## Intent

All English public content must live under `/en/*`. The immediate case is service
content: the published English service `iso-14001-2026-certification` currently
renders on `/services/` alongside Indonesian services, which mixes languages on
the Indonesian index.

## Goals

- `/services/` and `/services/<slug>/` serve only entries with `lang: "id"`.
- `/en/services/` and `/en/services/<slug>/` serve only entries with `lang: "en"`.
- Canonical URLs, structured-data paths, and card links follow the language route.
- Service selection/filtering lives in one shared data module, not in page components.

## Non-goals

- No changes to any entry's `draft` state.
- No site-wide navigation changes, no hreflang/alternate links yet.
- No article migration: the only English article is still a draft, so no published
  article changes language route.
- No change to the local development domain (`http://tnvcertification.lan`), which
  is deliberately kept out of the upstream PR.

## Constraints

- `src/site.ts` remains the single source of truth for site identity and URL.
- Published-entry rules and deterministic ordering stay unchanged.
- Indonesian service index keeps its "Artikel Terbaru" section (ranks 4–6).
- English service index omits "Artikel Terbaru": no English articles are published,
  and Indonesian article cards do not belong on an English page.

## Approaches considered

1. Duplicate the two page templates under `/en/`, with inline filters. Rejected:
   filter and URL logic would be duplicated.
2. A dynamic `[lang]` route for both languages plus a redirect from `/services/`.
   Rejected: breaks existing URLs and adds redirect complexity.
3. **Chosen.** A shared pure routing helper plus `src/data/services.ts` that wraps
   `getCollection` with the language filter; thin page pairs consume it. Matches the
   existing `src/data/articles.ts` pattern and the repository rule that selection
   logic is centralized.

## Builder decisions

- Pure helpers (`serviceIndexPath`, `servicePath`, `isPublishedServiceForLang`) go
  in `src/lib/service-routing.ts` so they can be unit-tested without Astro.
- `src/data/services.ts` exports `getPublishedServices(lang)` and re-exports the
  path helpers.
- English detail pages omit the related-articles section; there are no published
  English articles and no article currently declares a `serviceId`.
