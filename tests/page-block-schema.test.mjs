import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");
const config = await read("src/content.config.ts");
const helper = await read("src/data/pages.ts");
const slugRoute = await read("src/pages/[slug].astro");

test("page block schema declares the four structural block types", () => {
  for (const type of ["hero", "link-grid", "listing", "contact"]) {
    assert.ok(config.includes(`type: z.literal("${type}")`), `missing ${type} block`);
  }
});

test("page schema owns the page block union", () => {
  assert.match(config, /const pageBlockSchema = z\.discriminatedUnion\("type"/);
  assert.match(config, /blocks: z\.array\(pageBlockSchema\)\.optional\(\)/);
});

test("page helper exports slug routing and block selectors", () => {
  for (const name of ["routeOwnedPageSlugs", "getPageEntry", "getPageHero", "getPageBlocks"]) {
    assert.match(helper, new RegExp(`export (?:const|async function|function) ${name}\\b`), `missing ${name}`);
  }
});

test("generic slug route skips route-owned slugs", () => {
  assert.match(slugRoute, /import \{[^}]*routeOwnedPageSlugs[^}]*\} from/);
  assert.match(slugRoute, /!routeOwnedPageSlugs\.includes\(/);
});
