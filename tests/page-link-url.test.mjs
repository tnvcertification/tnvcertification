import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isSupportedLinkUrl } from "../src/lib/link-url.ts";

for (const url of ["/", "/services/", "/articles/page/2/?q=1#top", "https://example.com/x", "http://example.com"]) {
  test(`accepts supported link URL: ${url}`, () => {
    assert.equal(isSupportedLinkUrl(url), true);
  });
}

for (const url of ["", " ", " /services/", "services/", "htp://x", "//example.com/x", "javascript:alert(1)", "mailto:info@example.com", "/bad path"]) {
  test(`rejects unsupported link URL: ${url || "(empty)"}`, () => {
    assert.equal(isSupportedLinkUrl(url), false);
  });
}

test("CTA and link-grid link fields use the shared URL validator", async () => {
  const source = await readFile(new URL("../src/content.config.ts", import.meta.url), "utf8");
  const cta = source.slice(source.indexOf("const ctaBlock"), source.indexOf("// --- Page structure"));
  const linkGrid = source.slice(source.indexOf("const linkGridBlock"), source.indexOf("const listingBlock"));
  assert.match(cta, /isSupportedLinkUrl/);
  assert.match(linkGrid, /isSupportedLinkUrl/);
  assert.doesNotMatch(cta, /url: z\.string\(\)\.min\(1\)/);
});
