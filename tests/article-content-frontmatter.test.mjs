import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { parse as parseYaml } from "yaml";

const contentDir = new URL("../src/content/articles/", import.meta.url);
const files = (await readdir(contentDir)).filter((file) => file.endsWith(".md")).sort();
const entries = await Promise.all(files.map(async (file) => {
  const raw = await readFile(new URL(file, contentDir), "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return {
    file,
    data: match ? parseYaml(match[1]) : {},
    body: match ? match[2] : "",
  };
}));

for (const { file, data, body } of entries) {
  test(`${file} has an empty Markdown body`, () => {
    assert.equal(body.trim(), "", `${file}: editorial entries must contain frontmatter only`);
  });

  test(`${file} has exactly one hero block matching its title`, () => {
    const heroes = (data.blocks ?? []).filter((block) => block.type === "hero");
    assert.equal(heroes.length, 1, `${file}: expected exactly one hero block`);
    assert.equal(heroes[0].title, data.title, `${file}: hero title must equal the entry title`);
  });

  test(`${file} has at least one content-section block`, () => {
    assert.ok(
      (data.blocks ?? []).some((block) => block.type === "content-section"),
      `${file}: expected at least one content-section block`,
    );
  });
}

const route = await readFile(new URL("../src/pages/articles/[slug].astro", import.meta.url), "utf8");
test("article route passes frontmatter blocks without rendering a body", () => {
  assert.match(route, /<ArticleLayout/);
  assert.match(route, /hero=\{hero\}/);
  assert.match(route, /blocks=\{blocks\}/);
  assert.doesNotMatch(route, /<Content/);
  assert.match(route, /siteCrumb\("\/articles\/"\)/);
});

const layout = await readFile(new URL("../src/layouts/ArticleLayout.astro", import.meta.url), "utf8");
test("ArticleLayout renders a frontmatter hero and blocks without hardcoded labels", () => {
  assert.match(layout, /PageHero/);
  assert.match(layout, /PageBlockRenderer/);
  assert.match(layout, /<Breadcrumbs items=\{breadcrumbs\}/);
  assert.doesNotMatch(layout, /<FeaturedImage/);
  assert.doesNotMatch(layout, /"Beranda"/);
  assert.doesNotMatch(layout, /"Artikel"/);
});
