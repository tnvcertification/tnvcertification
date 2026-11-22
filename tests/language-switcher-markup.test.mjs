import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(
  new URL("../src/components/LanguageSwitcher.astro", import.meta.url),
  "utf8",
);
const flag = await readFile(new URL("../src/components/LanguageFlag.astro", import.meta.url), "utf8").catch(
  () => "",
);

test("switcher delegates flag rendering to LanguageFlag", () => {
  assert.match(component, /import LanguageFlag from "\.\/LanguageFlag\.astro"/);
  assert.equal((component.match(/<LanguageFlag lang=\{option\.lang\} \/>/g) ?? []).length, 2);
  assert.doesNotMatch(component, /<svg\b/);
});

test("available options keep accessible names and no visible label", () => {
  assert.match(component, /aria-label=\{option\.label\}/);
  assert.doesNotMatch(component, />\{\s*option\.label\s*\}</);
});

test("disabled option keeps full label and unavailable explanation in sr-only text", () => {
  assert.match(component, /\{option\.label\} — \{unavailableText\}/);
});

test("flags are decorative and use both flag color sets", () => {
  const svgCount = (flag.match(/<svg\b/g) ?? []).length;
  assert.equal(svgCount, 2);
  assert.equal((flag.match(/aria-hidden="true"/g) ?? []).length, svgCount);
  assert.equal((flag.match(/focusable="false"/g) ?? []).length, svgCount);
  for (const color of ["#CE1126", "#FFFFFF", "#012169", "#C8102E"]) {
    assert.ok(flag.includes(color), `missing flag color ${color}`);
  }
});

test("flag component branches on lang without globe or text remnants", () => {
  assert.match(flag, /lang === "id"/);
  assert.doesNotMatch(flag, /<text\b/);
  assert.doesNotMatch(flag, /toUpperCase\(\)/);
  assert.doesNotMatch(flag, /<(?:circle|ellipse)\b/);
});

test("flags render at 24x16", () => {
  assert.equal((flag.match(/class="h-4 w-6"/g) ?? []).length, 2);
  assert.doesNotMatch(flag, /h-5 w-8/);
});

test("switcher keeps 44px targets while tightening flag spacing", () => {
  assert.match(component, /class="flex items-center gap-0 text-sm font-semibold"/);
  assert.equal((component.match(/px-2\.5/g) ?? []).length, 2);
  assert.equal((component.match(/min-h-11/g) ?? []).length, 2);
  assert.doesNotMatch(component, /gap-1/);
  assert.doesNotMatch(component, /px-3/);
});
