import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const agents = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");
const architecture = await readFile(new URL("../docs/architecture.md", import.meta.url), "utf8");
const blocks = await readFile(new URL("../docs/components-blocks-layouts.md", import.meta.url), "utf8");
const bilingual = await readFile(new URL("../docs/bilingual-content.md", import.meta.url), "utf8");

test("AGENTS.md names the development-mode page content rule", () => {
  assert.match(agents, /Page content source of truth \(development mode\)/);
  assert.match(agents, /development/i);
  assert.match(agents, /\.astro` files must not own editorial page copy/);
});

test("architecture documents the page-entry helpers and route ownership", () => {
  assert.match(architecture, /routeOwnedPageSlugs/);
  assert.match(architecture, /src\/data\/pages\.ts/);
});

test("block catalogue lists the page structure block types", () => {
  for (const type of ["hero", "link-grid", "listing", "contact"]) {
    assert.ok(blocks.includes(type), `missing ${type} block in block catalogue`);
  }
});

test("bilingual standard records the ID-only page phase", () => {
  assert.match(bilingual, /page entries are ID-only/i);
});
