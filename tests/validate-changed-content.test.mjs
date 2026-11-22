import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const validator = join(repoRoot, "scripts/validate-changed-content.mjs");
const classifier = join(repoRoot, "scripts/classify-build-changes.mjs");
const tsxLoader = join(repoRoot, "node_modules/tsx/dist/loader.mjs");

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function fixtureRepo() {
  const cwd = mkdtempSync(join(tmpdir(), "tnvc-content-preflight-"));
  git(cwd, "init", "-q");
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "TNCV test");
  mkdirSync(join(cwd, "src/content/articles"), { recursive: true });
  writeFileSync(join(cwd, "src/content/articles/article.md"), "# Initial");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "fixture baseline");
  return cwd;
}

function commitChangedEntry(cwd, content) {
  const path = join(cwd, "src/content/articles/article.md");
  writeFileSync(path, content);
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "change editorial entry");
}

function runNode(script, cwd, args = [], withTsx = false) {
  const nodeArgs = withTsx ? ["--import", tsxLoader, script, ...args] : [script, ...args];
  return spawnSync(process.execPath, nodeArgs, { cwd, encoding: "utf8" });
}

const validEntry = `---
title: Audit Keselamatan
lang: id
draft: true
intro: Audit Keselamatan adalah proses evaluasi sistematis.
metaDescription: Panduan audit keselamatan untuk organisasi.
featuredImage:
  src: /images/audit.webp
  alt: Audit Keselamatan adalah pemeriksaan sistematis.
blocks:
  - type: hero
    id: hero-audit
    title: Audit Keselamatan
    description: Audit Keselamatan adalah proses evaluasi sistematis.
  - type: content-section
    id: ruang-lingkup-audit
    title: Ruang lingkup audit
    description: Penilaian dilakukan terhadap proses yang relevan.
---
`;

test("changed valid editorial Markdown passes the real preflight CLI", () => {
  const cwd = fixtureRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    commitChangedEntry(cwd, validEntry);
    const result = runNode(validator, cwd, [base, "HEAD"], true);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /1 changed file\(s\)/);
    assert.match(result.stdout, /passed individual validation/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("malformed YAML frontmatter fails the real preflight CLI", () => {
  const cwd = fixtureRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    commitChangedEntry(cwd, `---
title: [unterminated
---
# Broken
`);
    const result = runNode(validator, cwd, [base, "HEAD"], true);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid YAML frontmatter/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("editorial rule violations fail the real preflight CLI", () => {
  const cwd = fixtureRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    commitChangedEntry(cwd, `---
title: Audit Keselamatan
lang: id
draft: true
intro: Audit Keselamatan adalah proses evaluasi sistematis.
metaDescription: Panduan audit keselamatan untuk organisasi.
featuredImage:
  src: /images/audit.webp
  alt: Audit Keselamatan adalah pemeriksaan sistematis.
blocks:
  - type: content-section
    id: ruang-lingkup-audit
    title: Ruang lingkup audit
    description: Penilaian dilakukan terhadap proses yang relevan.
---
`);
    const result = runNode(validator, cwd, [base, "HEAD"], true);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /CONTENT-001/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("Astro changes remain full-build classified in the isolated workflow fixture", () => {
  const cwd = fixtureRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    mkdirSync(join(cwd, "src/components"), { recursive: true });
    writeFileSync(join(cwd, "src/components/Header.astro"), "<header />");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "change Astro component");
    const result = runNode(classifier, cwd, [base, "HEAD"]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /"build_mode": "full"/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
