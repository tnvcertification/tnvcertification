import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseYaml } from "yaml";

const files = [
  "0020-halaman-home.md",
  "0021-halaman-services.md",
  "0022-halaman-csms.md",
  "0023-halaman-trainings.md",
  "0024-halaman-schedules.md",
  "0025-halaman-articles.md",
  "0010-halaman-about-us.md",
];

const entries = await Promise.all(files.map(async (file) => {
  const raw = await readFile(new URL(`../src/content/pages/${file}`, import.meta.url), "utf8").catch(() => "");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return {
    file,
    raw,
    data: match ? parseYaml(match[1]) : {},
    body: match ? match[2] : "",
  };
}));

for (const { file, raw, data, body } of entries) {
  test(`${file} has complete publication frontmatter`, () => {
    for (const field of ["title", "intro", "metaDescription", "pubDate", "slug", "translationKey"]) {
      assert.ok(data[field], `${file}: missing ${field}`);
    }
    assert.equal(data.lang, "id", `${file}: lang must be id`);
    assert.ok(data.featuredImage?.src, `${file}: missing featuredImage.src`);
    assert.ok(data.featuredImage?.alt, `${file}: missing featuredImage.alt`);
  });

  test(`${file} follows intro, meta and alt editorial rules`, () => {
    const phrase = `${data.title} adalah`;
    assert.ok(String(data.intro ?? "").toLocaleLowerCase("id").startsWith(phrase.toLocaleLowerCase("id")), `${file}: intro must start with "${phrase}"`);
    const alt = String(data.featuredImage?.alt ?? "").toLocaleLowerCase("id");
    assert.ok(alt.includes(" adalah ") && alt.includes(data.title.toLocaleLowerCase("id")), `${file}: alt must explain the title with "adalah"`);
    assert.ok(data.featuredImage.alt.length < data.intro.length, `${file}: alt must be shorter than intro`);
    assert.notEqual(data.metaDescription, data.intro, `${file}: metaDescription duplicates intro`);
    assert.notEqual(data.metaDescription, data.featuredImage.alt, `${file}: metaDescription duplicates alt`);
  });

  test(`${file} avoids prohibited terminology`, () => {
    assert.doesNotMatch(raw, /konsult|consult/i);
  });

  test(`${file} has one H1 and no skipped heading levels`, () => {
    const levels = [...body.matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length);
    assert.equal(levels.filter((level) => level === 1).length, 1, `${file}: expected exactly one H1`);
    for (let index = 1; index < levels.length; index += 1) {
      assert.ok(levels[index] <= levels[index - 1] + 1, `${file}: heading level skipped (${levels[index - 1]} → ${levels[index]})`);
    }
  });
}

test("each page surface has exactly one published entry", () => {
  const expected = ["home", "services", "csms", "about-us", "trainings", "schedules", "articles"];
  const slugs = entries.map((entry) => entry.data.slug).sort();
  assert.deepEqual(slugs, [...expected].sort());
  assert.equal(new Set(slugs).size, slugs.length);
});
