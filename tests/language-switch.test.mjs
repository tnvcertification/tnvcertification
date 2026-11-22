import assert from "node:assert/strict";
import test from "node:test";
import { resolveLanguageOptions } from "../src/lib/locale-switch.ts";

const services = [
  { lang: "id", slug: "sertifikasi-iso-14001-2026", translationKey: "service-sertifikasi-iso-14001-2026" },
  { lang: "en", slug: "iso-14001-2026-certification", translationKey: "service-sertifikasi-iso-14001-2026" },
  { lang: "id", slug: "sertifikasi-iso-9001-2026", translationKey: "service-sertifikasi-iso-9001-2026" },
];
const articles = [
  { lang: "id", slug: "panduan-dokumen-iso-9001", translationKey: "article-document-control-iso-9001" },
  { lang: "en", slug: "iso-9001-document-control", translationKey: "article-document-control-iso-9001" },
];
const fallbackPaths = [
  "/services/sertifikasi-iso-9001-2026/",
  "/articles/",
  "/about-us/",
];

const options = (pathname, currentLang = "id", overrides = {}) =>
  resolveLanguageOptions({ pathname, currentLang, services, articles, fallbackPaths, ...overrides });

const shape = (list) =>
  list.map(({ lang, href, active, available }) => ({ lang, href, active, available }));

test("service detail links Indonesian to English by translationKey", () => {
  assert.deepEqual(shape(options("/services/sertifikasi-iso-14001-2026/", "id")), [
    { lang: "id", href: "/services/sertifikasi-iso-14001-2026/", active: true, available: true },
    { lang: "en", href: "/en/services/iso-14001-2026-certification/", active: false, available: true },
  ]);
});

test("service detail links English to Indonesian by translationKey", () => {
  assert.deepEqual(shape(options("/en/services/iso-14001-2026-certification/", "en")), [
    { lang: "id", href: "/services/sertifikasi-iso-14001-2026/", active: false, available: true },
    { lang: "en", href: "/en/services/iso-14001-2026-certification/", active: true, available: true },
  ]);
});

test("article detail links Indonesian to English by translationKey", () => {
  const result = options("/articles/panduan-dokumen-iso-9001/");
  assert.equal(result[1].href, "/articles/iso-9001-document-control/");
  assert.equal(result[1].available, true);
});

test("article detail links English to Indonesian without an /en/ prefix", () => {
  const pathname = "/articles/iso-9001-document-control/";
  const result = options(pathname, "en");
  assert.equal(result[0].href, "/articles/panduan-dokumen-iso-9001/");
  assert.equal(result[0].available, true);
  assert.equal(result[1].active, true);
  assert.equal(result[1].href, pathname);
});

test("service index links both ways", () => {
  assert.equal(options("/services/")[1].href, "/en/services/");
  const english = options("/en/services/", "en");
  assert.equal(english[0].href, "/services/");
  assert.equal(english[1].active, true);
});

test("generic paths have no counterpart", () => {
  for (const pathname of ["/", "/trainings/", "/schedules/", "/articles/", "/about-us/", "/csms/"]) {
    const inactive = options(pathname).find((option) => !option.active);
    assert.equal(inactive.available, false, pathname);
    assert.equal(inactive.href, "", pathname);
  }
});

test("fallback stubs and missing translations never produce an English link", () => {
  for (const option of options("/about-us/")) {
    assert.ok(!option.href.startsWith("/en/"));
  }
  const missingPartner = options("/services/sertifikasi-iso-9001-2026/")[1];
  assert.equal(missingPartner.available, false);
  assert.equal(missingPartner.href, "");
});

test("an Indonesian article counterpart is not mistaken for an English stub", () => {
  const result = options("/articles/iso-9001-document-control/", "en", {
    fallbackPaths: [...fallbackPaths, "/articles/panduan-dokumen-iso-9001/"],
  });
  assert.equal(result[0].href, "/articles/panduan-dokumen-iso-9001/");
  assert.equal(result[0].available, true);
});

test("labels follow siteSettings and the active option links to the current path", () => {
  const result = options("/services/", "id");
  assert.deepEqual(result.map((option) => option.label), ["Bahasa Indonesia", "English"]);
  assert.equal(result.find((option) => option.active).href, "/services/");
});

test("pathnames are normalized to a trailing slash before matching", () => {
  assert.deepEqual(shape(options("/services")), shape(options("/services/")));
});
