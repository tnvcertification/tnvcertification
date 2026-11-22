import assert from "node:assert/strict";
import test from "node:test";

import { getContentLastmod } from "../src/lib/sitemap-lastmod.mjs";

test("homepage sitemap lastmod comes from the home page entry", () => {
  assert.equal(getContentLastmod("/"), "2026-11-02T00:00:00Z");
  assert.equal(getContentLastmod("/home/"), undefined);
});

test("other page entries keep their own lastmod", () => {
  assert.equal(getContentLastmod("/about-us/"), "2026-10-01T00:00:00Z");
  assert.equal(getContentLastmod("/articles/"), "2026-11-07T00:00:00Z");
});
