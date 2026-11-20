# Pre-launch work status — 2026-11-20

## Current checkpoint

- Repository: `tnvcertification/tnvcertification`
- Base branch: `main`
- Completed audit branch: `prep/site-identity-taxonomy-audit` (merged via PR #3)
- Completed implementation branch: `feat/bilingual-service-taxonomy` (merged at `736bd14`)
- Current HEAD: `a68b53b`

The taxonomy implementation is merged into `main`. It contains taxonomy schema, planned bilingual category records, and build-time reference validation. Integration fixed stale `categoryIds` references so the build passes. No category routes, certification scheme records, or active service claims have been published.

## Completed in the previous audit branch

| Commit | Change |
|---|---|
| `eea6d3b` | Audit `src/site.ts` and document placeholder identity/contact values |
| `051403a` | Define service taxonomy, multilingual category rules and explicit scheme relationships |
| `ac14094` | Record pre-launch work status |

The audit branch was merged into `main` by PR #3 (`ab54c88`).

## Merged implementation branch

| Commit | Change |
|---|---|
| `c747167` | Add bilingual taxonomy cross-validation and tests |
| `fbd70ea` | Add 12 planned category groups (24 Indonesian/English records), category status schema, and explicit CSMS category reference |
| `9a52d51` | Record bilingual taxonomy implementation status |
| `a68b53b` | Migrate legacy `categoryIds` to canonical slugs so validation and build pass |

## Roadmap status

| Phase | Scope | Status |
|---|---|---|
| P1 | Foundation and architecture audit | Completed in prior work |
| P2 | CSMS planned-service draft | Completed; remains `draft: true` |
| P3 | Site identity / `site.ts` SSOT audit | Audit completed; code replacement blocked on confirmed company details |
| P4 | Service taxonomy design and implementation | Completed; 12 bilingual category pairs and reference validation merged and locally validated |
| P5 | ISO service/scheme catalog | Internal 12-item planned catalog and build-time validation implemented; editions and TNCV scope remain unverified |
| P6 | Article-to-service relationships | Architecture exists; requires canonical service records and editorial mapping |
| P7 | Service SEO and structured data | Shared SEO/JSON-LD helpers exist; verify against approved canonical service data |
| P8 | Full quality gate | Local checks passed on pinned toolchain; deployment runtime verification still pending |

## Verified repository facts

- `src/site.ts` is the intended company/site SSOT.
- Its current canonical domain, email, telephone and street address include placeholder/unconfirmed values; these must not be used for production.
- Organization JSON-LD emits contact/address fields from that configuration.
- The content registry includes articles, services, categories, certifications, training, training schedules and pages.
- The category collection now contains 12 candidate groups as 24 localized records, all `status: planned`; no public category routes exist.
- The certification collection currently has no content records.
- The services collection currently contains a CSMS draft; it is not a published service.
- Current repository runtime policy pins Node.js `26.13.1` in `.node-version` / `.nvmrc`, with `package.json` engine `>=26.13.1 <27`; pnpm is `12.21.0`.
- Current TypeScript is `7.1.0-beta`; TypeScript 6.x is prohibited by repository policy. This is a beta exception, not a stable release.
- `categoryIds` values now use canonical stable slugs. Legacy `kualitas` and `organisasi` references were removed during integration.
- GitHub Actions workflow `.github/workflows/quality.yml` is introduced on the current P5 branch; it must pass after the branch is pushed/opened as a PR.

## External confirmations needed

1. Production domain.
2. Correct legal/public company address and postal code (project context includes WTC 3, 20th Floor, R30, Jl. Jendral Sudirman; full formatting remains to be confirmed).
3. Official email and telephone/WhatsApp.
4. Official social profiles and approved logo.
5. TNCV's exact certification/assessment scope, accreditation and authorization evidence, including any partner-delivered schemes.

Do not replace these values with guesses. If a field is optional and not confirmed, omit it from public UI and structured data after checking the relevant component contracts.

## Next implementation sequence

1. Resolve the site identity inputs above, then update `src/site.ts` and any optional-field consumers in a dedicated code commit.
2. Add verified certification scheme records and explicit service-to-scheme relationships; do not publish unverified standards.
3. Complete service/article mapping and service SEO.
4. Re-run `check`, `typecheck`, `lint`, `test` and `build` on the deployment runtime, then inspect generated routes and JSON-LD.

## Validation note

Local full validation ran on `main` at `a68b53b` with the pinned Node.js `26.13.1` and pnpm `12.21.0` toolchain:

| Command | Result |
|---|---|
| `npm run check` | PASS, exit `0` |
| `npm run build` | PASS, exit `0`, 13 pages |
| `npm run typecheck` | PASS, exit `0` |
| `npm run lint` | PASS, exit `0` |
| `npm run test` | PASS, exit `0`, 14 tests |

No GitHub Actions workflow or verifiable automated build result is present in this repository. Build success is recorded from local execution on the pinned toolchain, not from CI. Non-fatal warnings remain for bilingual category records sharing one slug across languages and for empty content collections.


## Current branch work — P5 and CI

Branch: `feat/certification-scheme-catalog-ci`

- Added 12 internal candidate scheme records in `src/data/certification-schemes.ts`; all remain `planned`, with edition values intentionally unset pending official verification.
- Added cross-reference validation and tests for duplicate identifiers/designations, category references and active-scheme edition requirements.
- Integrated scheme validation into the existing build-time content gate.
- Added `.github/workflows/quality.yml` to run `pnpm check`, `pnpm lint`, `pnpm test` and `pnpm build` on pull requests to `main` and pushes to `main`.
- No local install, test, lint, typecheck or build has been run by the assistant. Wait for GitHub Actions or a user-run build before merging.
