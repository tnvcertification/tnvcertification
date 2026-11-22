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
