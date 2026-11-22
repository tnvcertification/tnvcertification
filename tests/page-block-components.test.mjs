import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = async (name) => readFile(
  new URL(`../src/components/page/${name}.astro`, import.meta.url),
  "utf8",
).catch(() => "");

const files = {
  PageHero: await read("PageHero"),
  LinkGrid: await read("LinkGrid"),
  ListingSection: await read("ListingSection"),
  ContactPanel: await read("ContactPanel"),
  PageBlockRenderer: await read("PageBlockRenderer"),
};

for (const [name, source] of Object.entries(files)) {
  test(`${name}.astro exists with presentational markup`, () => {
    assert.ok(source.length > 0, `${name}.astro is missing`);
    assert.doesNotMatch(source, /\bgetCollection\b/);
  });
}

test("ContactPanel reads contact values from site.ts", () => {
  const source = files.ContactPanel;
  assert.match(source, /from "\.\.\/\.\.\/site"/);
  for (const literal of ["tnvcertification25@gmail.com", "+62 822-2721-7776", "WTC 3"]) {
    assert.ok(!source.includes(literal), `contact value must not be hardcoded: ${literal}`);
  }
});

test("ListingSection renders its items through a slot and keeps empty copy in the empty branch", () => {
  const source = files.ListingSection;
  assert.match(source, /<slot \/>/);
  assert.match(source, /hasItems/);
  assert.equal((source.match(/block\.emptyTitle/g) ?? []).length, 1);
  assert.equal((source.match(/block\.emptyDescription/g) ?? []).length, 1);
});

test("PageHero takes all visible copy from props", () => {
  const source = files.PageHero;
  assert.match(source, /fallbackImage/);
  assert.match(source, /block\.image \?\? fallbackImage\.src/);
  assert.ok(!source.includes("Sertifikasi dan kepatuhan, dengan informasi yang jelas."));
});

test("PageBlockRenderer delegates editorial blocks to BlockRenderer", () => {
  const source = files.PageBlockRenderer;
  assert.match(source, /import BlockRenderer from "\.\.\/BlockRenderer\.astro"/);
  for (const type of ["content-section", "faq", "howto", "cta"]) {
    assert.ok(source.includes(`"${type}"`), `missing delegation for ${type}`);
  }
});
