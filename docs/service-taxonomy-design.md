# Service taxonomy design — 2026-11-20

## Status

**P4 taxonomy implementation started: 12 candidate category groups now have 24 bilingual records, all marked `planned`. No public category routes or active service claims are created. No certification scheme records have been approved.**

This design uses the current collection architecture and the preliminary competitor research in `docs/iso-competitor-research/`. Competitor presence is market research only; it is not evidence of PT. Intiprima Sertifikasi's accreditation, authorization, capability or approved service scope.

## 1. Separate the content concepts

The content model must keep these entities distinct:

| Entity | Meaning | Current repository representation |
|---|---|---|
| Category | Navigation/discovery grouping across related content | `categories` collection |
| Service | A commercial service page offered by the company (e.g. certification audit, assessment, verification, training where appropriate) | `services` collection |
| Certification scheme / standard | A defined standard or scheme, including its exact designation and edition | `certifications` collection (registered, currently empty) |
| Training | A course/program page | `training` collection |
| Training schedule | A dated delivery/batch occurrence | `trainingSchedules` collection |
| Article | Editorial information | `articles` collection |

Do not create one service page per ISO standard automatically. First determine whether the company offers that scheme, whether it is delivered directly or through a disclosed partner, and whether the page should describe a certification service, assessment, training, or information resource.

A service can reference one or more scheme records; a scheme can be related to a service only through an explicit, validated relationship. Do not infer relationships from category labels, titles or URL slugs.

## 2. Proposed top-level category groups

These are candidate taxonomy groups for planning. They are not a statement that the company currently provides every related service.

| Stable category slug | Indonesian label | English label | Candidate content |
|---|---|---|---|
| `quality-management` | Manajemen Mutu | Quality Management | ISO 9001; quality-management topics |
| `environmental-management` | Manajemen Lingkungan | Environmental Management | ISO 14001 |
| `occupational-health-safety` | Kesehatan dan Keselamatan Kerja | Occupational Health & Safety | ISO 45001; K3 topics |
| `information-security-and-it` | Keamanan Informasi dan Layanan TI | Information Security & IT Services | ISO/IEC 27001; ISO/IEC 20000-1 |
| `food-safety` | Keamanan Pangan | Food Safety | ISO 22000 |
| `energy-management` | Manajemen Energi | Energy Management | ISO 50001 |
| `governance-and-anti-bribery` | Tata Kelola dan Anti Penyuapan | Governance & Anti-Bribery | ISO 37001 |
| `business-continuity` | Kelangsungan Bisnis | Business Continuity | ISO 22301 |
| `medical-device-quality` | Mutu Alat Kesehatan | Medical Device Quality | ISO 13485 |
| `privacy-information-management` | Manajemen Privasi Informasi | Privacy Information Management | ISO/IEC 27701 |
| `artificial-intelligence-management` | Manajemen Kecerdasan Artifisial | Artificial Intelligence Management | ISO/IEC 42001 |
| `contractor-safety` | Keselamatan Kontraktor | Contractor Safety | CSMS Contractor Safety Management System; keep distinct from automotive cybersecurity CSMS / UN R155 |

The list is intentionally domain-based rather than a flat list of standard numbers. New schemes can be added without changing the top-level navigation every time.

## 3. Standards in the research shortlist

The competitor matrix covers these 12 candidate standards:

1. ISO 9001 — Quality management systems.
2. ISO 14001 — Environmental management systems.
3. ISO 45001 — Occupational health and safety management systems.
4. ISO 22000 — Food safety management systems.
5. ISO/IEC 27001 — Information security management systems.
6. ISO 37001 — Anti-bribery management systems.
7. ISO 50001 — Energy management systems.
8. ISO 22301 — Business continuity management systems.
9. ISO 13485 — Quality management systems for medical devices.
10. ISO/IEC 20000-1 — Service management systems.
11. ISO/IEC 27701 — Privacy information management systems.
12. ISO/IEC 42001 — Artificial intelligence management systems.

These are a research/content-planning shortlist only. Confirm current edition, exact title, applicable conformity-assessment scheme, accreditation scope, authorization and delivery model before any service or certification page is published. Do not imply that all 12 are currently offered.

## 4. Category record and multilingual rules

The current category schema in `src/content.config.ts` contains:

- `title`
- `slug`
- optional `description`
- `lang` (`id` or `en`)
- `translationKey`
- `status` (`planned` or `active`, default `planned`)

Recommended authoring rules:

- Use the same stable `slug` and `translationKey` for Indonesian and English variants of the same category.
- Keep the localized `title` and `description` in each language entry.
- Use `categoryIds` as explicit references from services, certifications, training and articles. Values are stable category slugs (for example, `quality-management`), not localized labels or filenames.
- New category records default to `status: planned`; only move to `active` after category ownership and the related content scope are approved.
- Never infer a category relationship from the content title or slug.
- Keep category pages useful for discovery; do not create empty public category routes.
- Consider an optional `parentSlug` only if a real second-level taxonomy is needed. Do not add hierarchy or schema fields without a consumer and validation rule.

Implemented in `src/lib/taxonomy-validation.ts` and invoked by `src/content-validation.ts`: duplicate slug/language pairs, duplicate translation variants, missing `id`/`en` counterparts, mismatched translated slugs, duplicate category references and dangling category references are build diagnostics with file paths.

## 5. Service and certification relationship model

Recommended direction:

- A service has a stable positive numeric `id` (already required by the service schema).
- A certification/scheme record should have a stable identifier and exact standard designation/edition; do not use a mutable display title as its identity.
- Add explicit `certificationIds` (or an equivalent documented reference field) to a service only after the certification record schema and ownership rules are agreed.
- Keep `categoryIds` for broad classification; they are not a substitute for scheme relationships.
- Keep article `serviceId` as an explicit optional foreign-key-style reference to a service.
- A training page and schedule remain separate from certification scheme records. A schedule must reference a training using `trainingSlug`; optional service context must remain explicit.

Avoid duplicating the same certification standard's name, edition and description in multiple service frontmatters. Resolve canonical scheme metadata from the certification record where the relationship exists.

## 6. CSMS treatment

The existing CSMS draft is correctly marked `draft: true` and the catalog note says pending verification. Keep it in the Contractor Safety category only as a planning association. It must remain unpublished until the scheme owner/requirements, criteria, scoring, assessment process, scope and required authorization/recognition are verified.

CSMS here means **Contractor Safety Management System**, not the automotive cybersecurity management system associated with UN R155. Do not describe it as an ISO certification.

## 7. Implementation sequence

1. Confirm company service authority, accreditation scope, partner-delivered schemes and exact services.
2. Approve the category labels and stable slugs in this document.
3. Refine the category Zod schema and add bilingual category records with stable translation keys (implemented; records remain planned).
4. Add build-time cross-collection validation for bilingual pairs and category references (implemented; requires local/CI verification).
5. Add certification/scheme records only for verified candidate scope; otherwise keep them as internal planning notes.
6. Add explicit service-to-scheme relationships only after stable scheme identifiers and authorization evidence are approved.
7. Add category discovery/navigation only after there is enough approved, published content.
8. Run typecheck, lint, tests, build and inspect generated routes.

## 8. Non-goals

- This document does not approve or advertise any of the 12 ISO standards as a TNCV service.
- It does not create accreditation or authorization claims.
- It does not convert CSMS into an ISO certification.
- It does not change production routes, page content or navigation.


## 9. P5 certification scheme catalog implementation

The internal candidate catalog is maintained in `src/data/certification-schemes.ts`. It contains the 12 standards listed above, each with a stable ID, designation, title, category slug, `planned` status and a verification note.

Edition values are deliberately `null` for now. The catalog does not assert current editions, TNCV accreditation, authorization, or that these schemes are commercially available. Confirm each item against the official standards publisher and the applicable accreditation/authorization scope before completing edition metadata or changing status to `active`.

The catalog is not wired to public routes or SEO output. It is a planning data source only. Build-time validation in `src/lib/certification-scheme-validation.ts` checks unique IDs/designations, category references, and prevents an active scheme without a verified edition. CSMS remains a separate planned Contractor Safety service concept, not an ISO standard and not an entry in this ISO shortlist.
