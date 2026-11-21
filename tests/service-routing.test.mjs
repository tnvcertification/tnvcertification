import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublishedServiceForLang,
  serviceIndexPath,
  servicePath,
} from "../src/lib/service-routing.ts";

test("English service is excluded from Indonesian index and included in English index", () => {
  const data = { draft: false, lang: "en" };
  assert.equal(isPublishedServiceForLang(data, "id"), false);
  assert.equal(isPublishedServiceForLang(data, "en"), true);
});

test("Indonesian service is included in Indonesian index and excluded from English index", () => {
  const data = { draft: false, lang: "id" };
  assert.equal(isPublishedServiceForLang(data, "id"), true);
  assert.equal(isPublishedServiceForLang(data, "en"), false);
});

test("draft service is hidden in both languages", () => {
  assert.equal(isPublishedServiceForLang({ draft: true, lang: "en" }, "en"), false);
  assert.equal(isPublishedServiceForLang({ draft: true, lang: "id" }, "id"), false);
});

test("index paths follow the language route", () => {
  assert.equal(serviceIndexPath("id"), "/services/");
  assert.equal(serviceIndexPath("en"), "/en/services/");
});

test("detail paths follow the service language", () => {
  assert.equal(
    servicePath({ lang: "en", slug: "iso-14001-2026-certification" }),
    "/en/services/iso-14001-2026-certification/",
  );
  assert.equal(
    servicePath({ lang: "id", slug: "sertifikasi-iso-9001-2026" }),
    "/services/sertifikasi-iso-9001-2026/",
  );
});
