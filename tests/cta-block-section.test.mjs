import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const blockRenderer = await read("src/components/BlockRenderer.astro");
const ctaSection = await read("src/components/CtaSection.astro");

const ctaPropsStart = blockRenderer.indexOf("<CtaSection");
const ctaProps = ctaPropsStart === -1
  ? ""
  : blockRenderer.slice(ctaPropsStart, blockRenderer.indexOf("/>", ctaPropsStart));

test("BlockRenderer forwards CTA block semantics and a heading id", () => {
  assert.match(ctaProps, /semanticClasses=\{semanticClasses\}/);
  assert.match(ctaProps, /headingId=\{`\$\{id\}-heading`\}/);
});

test("CtaSection renders an addressable block section with a labelled heading", () => {
  assert.match(ctaSection, /semanticClasses:/);
  assert.match(ctaSection, /headingId:/);
  assert.match(ctaSection, /aria-labelledby=\{headingId\}/);
  assert.match(ctaSection, /<h2 id=\{headingId\}/);
  assert.match(ctaSection, /\.\.\.semanticClasses/);
});
