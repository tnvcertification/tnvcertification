import assert from "node:assert/strict";
import test from "node:test";

import { findHeadingViolations } from "../scripts/audit-heading-hierarchy.mjs";

test("rendered heading audit rejects a downward level skip", () => {
  assert.deepEqual(findHeadingViolations("<h1>A</h1><h3>B</h3>"), ["1 -> 3"]);
});

test("rendered heading audit accepts sequential and returning headings", () => {
  assert.deepEqual(findHeadingViolations("<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><h3>E</h3>"), []);
});

test("rendered heading audit ignores markup outside heading tags", () => {
  assert.deepEqual(findHeadingViolations("<p>h1</p><div data-level='3'></div>"), []);
});
