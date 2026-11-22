# Language Switcher Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible ID/EN labels in the header switcher with compact inline SVG globe icons while preserving accessible names, active/disabled semantics, and URL-based behavior.

**Architecture:** Only `src/components/LanguageSwitcher.astro` changes in product code. Each option keeps its existing `<a>` / `<span aria-disabled>` structure, classes, and resolver data; the visible `{option.label}` is replaced by an inline SVG globe whose text is the uppercased `option.lang`. The active anchor gets `aria-label={option.label}`; the disabled span keeps the full name plus explanation in its existing `sr-only` text. `site.ts`, the resolver, and the data module stay untouched.

**Tech Stack:** Astro 7.4.13, TypeScript 7.1 beta, Tailwind CSS 4.3.5, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-22-language-switcher-icon-design.md` (approved).

## Global Constraints

- `site.ts` is the SSOT: labels and UI strings stay there; no hardcoded site-wide copy in components.
- Accessible name must remain `Bahasa Indonesia` / `English` from `siteSettings.languages`.
- SVG is decorative inside an already-labelled control: `aria-hidden="true"` and `focusable="false"`.
- Keep `aria-current="page"`, `aria-disabled="true"`, the `sr-only` unavailable explanation, ≥44px targets, and the existing `border-b-2` treatment.
- No JavaScript, cookie/localStorage, browser detection, or auto-redirect; no new dependency.
- Do not change `src/lib/locale-switch.ts`, `src/data/locale-switch.ts`, English fallback stubs, or content collections.
- Base work on `upstream/main` (`5188edb` or newer), never the divergent local `main`.
- Fork `main` may be used for preview, but the PR head is a dedicated branch created from that commit.
- Auth for fork push/PR: basic `x-access-token` from `/home/aapanel/.git-pat-skyforgged`; never print the token.

## Review Focus

- Icon-only anchor with no accessible name → every available option carries `aria-label={option.label}`. Test: Task 1 markup guard.
- SVG announced as a separate image → every SVG has `aria-hidden="true"` and `focusable="false"`. Test: Task 1 markup guard.
- Visible full label regresses into the switcher → no `>{option.label}<` in the component. Test: Task 1 markup guard plus dist inspection in Task 1.
- Disabled state loses its explanation → `sr-only` text remains `{option.label} — {unavailableText}`. Test: Task 1 markup guard plus dist inspection.
- Wrong branch/base → branch must descend from `upstream/main`, and PR base must be upstream `main`. Test: Task 2 ancestry check and PR verification.

---

### Task 1: Replace switcher labels with accessible SVG icons

**Files:**
- Modify: `src/components/LanguageSwitcher.astro`
- Test: `tests/language-switcher-markup.test.mjs`
- Include: `docs/superpowers/specs/2026-11-22-language-switcher-icon-design.md`

**Interfaces:**
- Consumes: `getLanguageOptions(pathname, lang)` returning `{ lang, label, href, active, available }` in `siteSettings.languages` order; `siteSettings.languageSwitcher.unavailable`.
- Produces: the same `<nav><ul><li>` structure, with icon-only options and unchanged state attributes/classes.

- [ ] **Step 1: Write the failing markup guard test**

Create `tests/language-switcher-markup.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(
  new URL("../src/components/LanguageSwitcher.astro", import.meta.url),
  "utf8",
);

test("language switcher options are icon-only but keep accessible names", () => {
  assert.match(component, /aria-label=\{option\.label\}/);
  assert.match(component, /<svg\b/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /focusable="false"/);
  assert.match(component, /\{option\.lang\.toUpperCase\(\)\}/);
  assert.doesNotMatch(component, />\{\s*option\.label\s*\}</);
});

test("disabled option keeps full label and unavailable explanation in sr-only text", () => {
  assert.match(component, /\{option\.label\} — \{unavailableText\}/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL because `LanguageSwitcher.astro` still renders `{option.label}` visibly and has no `aria-label`, SVG, or `option.lang.toUpperCase()`.

- [ ] **Step 3: Implement the icon markup in `src/components/LanguageSwitcher.astro`**

Keep the existing `nav`, `ul`, `li`, class lists, `href`, `aria-current`, `aria-disabled`, and focus-visible utilities unchanged. Replace each visible `{option.label}` with this inline SVG, duplicated in both branches:

```astro
<svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5" />
  <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.5" />
  <path d="M3 12h18" fill="none" stroke="currentColor" stroke-width="1.5" />
  <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor">
    {option.lang.toUpperCase()}
  </text>
</svg>
```

On the available `<a>`, add `aria-label={option.label}` before `aria-current`. On the disabled `<span>`, do **not** add `aria-label`; replace its current `sr-only` content with `{option.label} — {unavailableText}` after the SVG.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS; the two new tests pass and the existing resolver tests are unchanged.

- [ ] **Step 5: Run the full validation and inspect the build**

Run:

```bash
pnpm check
pnpm lint
pnpm build
pnpm audit:seo
pnpm audit:blocks
pnpm audit:page-images
```

Expected: every command exits 0. Then verify generated markup:

```bash
grep -o 'aria-label="Bahasa Indonesia"' dist/index.html | wc -l
grep -o 'aria-label="English"' dist/index.html | wc -l
grep -o 'aria-current="page"' dist/index.html | wc -l
grep -o 'aria-disabled="true"' dist/index.html | wc -l
```

Expected: both `aria-label` values are present, exactly one `aria-current="page"` exists, and the disabled option is still present with `aria-disabled="true"` and its `sr-only` explanation. Also confirm no switcher `href` points to a fallback stub.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/components/LanguageSwitcher.astro tests/language-switcher-markup.test.mjs docs/superpowers/specs/2026-11-22-language-switcher-icon-design.md docs/superpowers/plans/2026-11-22-language-switcher-icons.md
git commit -m "feat: use compact ID/EN icons in language switcher"
```

---

### Task 2: Preview on fork `main`, then open the upstream PR

**Files:** None. Git/GitHub delivery only.

**Interfaces:**
- Consumes: the commit created in Task 1.
- Produces: fork `main` at the preview commit, branch `feat/icon-language-switcher`, and an open PR to `tnvcertification/tnvcertification` base `main`.

- [ ] **Step 1: Prepare fork `main` from upstream**

```bash
git fetch origin --prune
git fetch upstream --prune
git merge-base --is-ancestor origin/main upstream/main
git switch -c fork-main --track origin/main
git merge --ff-only upstream/main
```

Expected: ancestry check exits 0; `fork-main` fast-forwards to `upstream/main`. Do not use the divergent local `main`.

- [ ] **Step 2: Carry the Task 1 commit onto fork `main` and push for preview**

If the Task 1 commit was made on another branch, cherry-pick it onto `fork-main`. Then:

```bash
TOKEN=$(tr -d '\n\r' < /home/aapanel/.git-pat-skyforgged)
git -c http.extraHeader="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)" push origin HEAD:main
git ls-remote --heads origin main
```

Expected: fork `main` points at the Task 1 commit. Report the GitHub Actions run URL if the workflow starts; do not claim a CI result while it is still running.

- [ ] **Step 3: Create the PR head branch**

```bash
git switch -c feat/icon-language-switcher
TOKEN=$(tr -d '\n\r' < /home/aapanel/.git-pat-skyforgged)
git -c http.extraHeader="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)" push -u origin feat/icon-language-switcher
```

Expected: the new branch points at the same commit as fork `main`.

- [ ] **Step 4: Open the upstream PR via API**

POST to `https://api.github.com/repos/tnvcertification/tnvcertification/pulls` with:

```json
{
  "title": "feat: use compact ID/EN icons in language switcher",
  "head": "skyforgged:feat/icon-language-switcher",
  "base": "main",
  "body": "Replace the long visible ID/EN labels with compact globe icons while keeping full accessible names from site.ts, aria-current, and the disabled state explanation. Validation: pnpm check, lint, test, build, audit:seo, audit:blocks, audit:page-images all pass.",
  "maintainer_can_modify": false
}
```

Use the same basic `x-access-token` auth header. Expected: `state=open`, `base.sha` equals current `upstream/main`, `head.ref` is `feat/icon-language-switcher`.

- [ ] **Step 5: Report and preserve fork `main`**

Report the PR URL and head SHA. Leave fork `main` at the preview commit until the PR is merged; after merge, sync fork `main` with upstream again.
