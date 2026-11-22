# Language switcher flags implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the compact globe icons in the header switcher with an Indonesia flag and a United Kingdom flag, keeping accessible names, active/disabled semantics, and URL-based behavior unchanged.

**Architecture:** `src/components/LanguageSwitcher.astro` keeps its `<nav><ul><li>` structure and imports a small typed `LanguageFlag.astro` component. The new component renders one of two inline SVG flags from a `lang` prop; both branches of the switcher use it. `site.ts`, the resolver, the data module, and all content stay untouched.

**Tech Stack:** Astro 7.4.13, TypeScript 7.1 beta, Tailwind CSS 4.3.5, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-22-language-switcher-icon-design.md` (approved, revised after build review).

## History and deviations

- The original plan replaced visible labels with globe + `ID`/`EN` icons. It was executed as commit `49a02d9` and delivered as PR #23.
- After reviewing the built header, the owner said the globes looked too similar and chose Indonesia + Union Jack. This plan supersedes the **visual** part of that work; the delivery work continues on the same PR.
- PR head branch is `feat/language-switcher-icons` (not the earlier `feat/icon-language-switcher`).
- Fork `main` is used for preview at the owner's explicit request, then re-synced after merge.
- The native worktree path caused `astro sync` to exit 132 (SIGILL); validation and commits run in the main checkout.
- Auth uses basic `x-access-token` from `/home/aapanel/.git-pat-skyforgged`; never print the token.

## Global Constraints

- `site.ts` is the SSOT for labels and UI strings; no hardcoded site-wide copy in components. Flag colors are visual assets, not copy.
- Accessible names remain `Bahasa Indonesia` / `English` from `siteSettings.languages`.
- SVG is decorative inside an already-labelled control: `aria-hidden="true"` and `focusable="false"` on each SVG.
- Keep `aria-current="page"`, `aria-disabled="true"`, the `sr-only` unavailable explanation, ≥44px targets, and the existing `border-b-2` treatment.
- No JavaScript, cookie/localStorage, browser detection, auto-redirect, or new dependency.
- Base work on `upstream/main` (`5188edb` or newer).

## Review Focus

- No accessible name → available anchor keeps `aria-label={option.label}`; disabled span keeps full name in `sr-only`.
- SVG announced as an image → every SVG has `aria-hidden="true"` and `focusable="false"`.
- Globe code regresses → no `<text>`, `toUpperCase()`, `<circle>`, or `<ellipse>` in the flag component.
- Wrong flag for a language → `LanguageFlag` branches on `lang`, with both color sets present.
- Wrong branch/base → branch descends from `upstream/main`; PR base is upstream `main` at `5188edb`.

---

### Task 1: Replace globe icons with accessible flags

**Files:**
- Modify: `src/components/LanguageSwitcher.astro`
- Add: `src/components/LanguageFlag.astro`
- Test: `tests/language-switcher-markup.test.mjs`

**Interfaces:**
- Consumes: `getLanguageOptions(pathname, lang)` returning `{ lang, label, href, active, available }`; `siteSettings.languageSwitcher.unavailable`.
- Produces: same switcher HTML structure, with one flag SVG per option.

- [x] **Step 1: Write the failing markup guard test**

Replace `tests/language-switcher-markup.test.mjs` with tests that read both components and assert:
  - `LanguageSwitcher.astro` has no inline `<svg>` and renders `<LanguageFlag lang={option.lang} />` exactly twice;
  - available anchor keeps `aria-label={option.label}` and no visible `>{option.label}<`;
  - disabled span keeps `{option.label} — {unavailableText}` in `sr-only`;
  - `LanguageFlag.astro` has two `<svg>` blocks, equal counts of `aria-hidden="true"` and `focusable="false"`, both flag color sets (`#CE1126`, `#012169`, `#C8102E`), and no globe/text remnants.

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL because `LanguageFlag.astro` does not exist and the switcher still contains globe SVGs.

- [x] **Step 3: Implement `LanguageFlag.astro`**

Typed `lang: string` prop. Use `lang === "id"` for the red/white flag (`viewBox="0 0 24 12"`) and the Union Jack for every other lang (`viewBox="0 0 60 30"`). Both SVGs use `class="h-5 w-8"`, `aria-hidden="true"`, `focusable="false"`, and a thin `currentColor` outline. No text nodes.

- [x] **Step 4: Wire the flag into `LanguageSwitcher.astro`**

Import `LanguageFlag`, replace both globe SVG blocks with `<LanguageFlag lang={option.lang} />`, and leave every other attribute, class, and string untouched.

- [x] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS; new guards pass and existing resolver tests are unchanged.

- [x] **Step 6: Run the full validation and inspect the build**

Run `pnpm check`, `pnpm lint`, `pnpm build`, `pnpm audit:seo`, `pnpm audit:blocks`, `pnpm audit:page-images`.
Expected: every command exits 0. Inspect `dist/index.html` switcher `<nav>`: active `aria-label` present, one switcher `aria-current="page"`, disabled `aria-disabled="true"` with `English — Terjemahan belum tersedia`, two decorative flag SVGs, no visible full labels, and no switcher href to a fallback stub.

- [x] **Step 7: Commit the flag revision**

```bash
git add src/components/LanguageSwitcher.astro src/components/LanguageFlag.astro tests/language-switcher-markup.test.mjs docs/superpowers/specs/2026-11-22-language-switcher-icon-design.md docs/superpowers/plans/2026-11-22-language-switcher-icons.md
git commit -m "feat: use Indonesia and UK flags in language switcher"
```

---

### Task 2: Update preview and PR #23

**Files:** None. Git/GitHub delivery only.

- [x] **Step 1: Push the revised commit**

From `feat/language-switcher-icons`, push the new commit with the temporary token, then fast-forward fork `main` to the same commit for preview:

```bash
TOKEN=$(tr -d '\n\r' < /home/aapanel/.git-pat-skyforgged)
AUTH="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)"
git -c http.extraHeader="$AUTH" push origin feat/language-switcher-icons
git -c http.extraHeader="$AUTH" push origin HEAD:main
git ls-remote --heads origin main feat/language-switcher-icons
```

Expected: both refs equal the new commit.

- [x] **Step 2: Update PR #23 body/title via API**

PATCH `https://api.github.com/repos/tnvcertification/tnvcertification/pulls/23` with a title/body describing flags, not globes, and the fresh validation evidence. Do not open a new PR.

- [x] **Step 3: Verify PR and Actions**

Confirm PR #23 is `open`, base remains upstream `main` at `5188edb`, head is `feat/language-switcher-icons` at the new SHA. Report the fork Actions run URL; do not claim a CI result while it is still running. After merge, re-sync fork `main` with upstream.
