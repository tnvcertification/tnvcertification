import assert from "node:assert/strict";
import test from "node:test";
import { certificationSchemes } from "../src/data/certification-schemes.ts";
import { validateCertificationSchemes } from "../src/lib/certification-scheme-validation.ts";

const categorySlugs = [
  "quality-management", "environmental-management", "occupational-health-safety",
  "information-security-and-it", "food-safety", "energy-management",
  "governance-and-anti-bribery", "business-continuity", "medical-device-quality",
  "privacy-information-management", "artificial-intelligence-management",
];

test("catalog has 12 planned schemes and no unverified editions", () => {
  assert.equal(certificationSchemes.length, 12);
  assert.ok(certificationSchemes.every((scheme) => scheme.status === "planned"));
  assert.ok(certificationSchemes.every((scheme) => scheme.edition === null));
  assert.deepEqual(validateCertificationSchemes(certificationSchemes, categorySlugs), []);
});

test("rejects unknown category references", () => {
  const diagnostics = validateCertificationSchemes(
    [{ ...certificationSchemes[0], categorySlug: "missing-category" }],
    categorySlugs,
  );
  assert.ok(diagnostics.some((item) => item.rule === "SCHEME-003"));
});

test("active schemes require a verified edition", () => {
  const diagnostics = validateCertificationSchemes(
    [{ ...certificationSchemes[0], status: "active", edition: null }],
    categorySlugs,
  );
  assert.ok(diagnostics.some((item) => item.rule === "SCHEME-004"));
});

test("rejects duplicate identifiers and designations", () => {
  const scheme = { ...certificationSchemes[0] };
  const diagnostics = validateCertificationSchemes([scheme, scheme], categorySlugs);
  assert.ok(diagnostics.some((item) => item.rule === "SCHEME-001"));
  assert.ok(diagnostics.some((item) => item.rule === "SCHEME-002"));
});
