import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateAllEntries,
  validateEntry,
} from "../src/lib/content-validation.ts";

const fixture = (name) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

function makeEntry(overrides = {}) {
  const id = overrides.id ?? "0010-test.md";
  return {
    id,
    collection: "articles",
    path: `src/content/articles/${id}`,
    data: {
      title: "Judul Uji",
      lang: "id",
      intro: "Judul Uji adalah intro yang menjelaskan topik halaman ini.",
      metaDescription: "Ringkasan SEO unik untuk halaman uji ini.",
      featuredImage: {
        src: "/images/uji.webp",
        alt: "Judul Uji adalah ilustrasi topik ini.",
      },
      ...overrides.data,
    },
    body:
      overrides.body ??
      "# Judul Uji\n\nJudul Uji adalah intro yang menjelaskan topik halaman ini.\n\n## Bagian\n\nIsi.",
  };
}

test("heading skip reports CONTENT-011 with headingText and expectedLevel", () => {
  const diagnostics = validateEntry(
    makeEntry({ body: fixture("heading-skip.md"), data: { title: "Judul Uji" } }),
  );
  const found = diagnostics.find((d) => d.rule === "CONTENT-011");
  assert.ok(found, "expected CONTENT-011 diagnostic");
  assert.equal(found.headingText, "Subheading");
  assert.equal(found.expectedLevel, 2);
});

test("duplicate metaDescription reports CONTENT-006 on the later entry", () => {
  const shared = "Ringkasan SEO yang sama persis untuk dua artikel.";
  const diagnostics = validateAllEntries([
    makeEntry({
      id: "0001-pertama.md",
      body: fixture("duplicate-meta.md"),
      data: { title: "Judul Kedua", metaDescription: shared },
    }),
    makeEntry({
      id: "0002-kedua.md",
      data: { metaDescription: shared },
    }),
  ]);
  const found = diagnostics.find(
    (d) => d.rule === "CONTENT-006" && d.entry === "0002-kedua.md",
  );
  assert.ok(found, "expected CONTENT-006 on 0002-kedua.md");
});

test("alt identical to intro reports CONTENT-006 and CONTENT-009", () => {
  const intro = "Judul Alt adalah teks intro yang sama persis dengan alt gambar.";
  const diagnostics = validateEntry(
    makeEntry({
      body: fixture("bad-alt.md"),
      data: {
        title: "Judul Alt",
        intro,
        metaDescription: intro,
        featuredImage: { src: "/images/alt.webp", alt: intro },
      },
    }),
  );
  const rules = diagnostics.map((d) => d.rule);
  assert.ok(rules.includes("CONTENT-006"), "expected CONTENT-006");
  assert.ok(rules.includes("CONTENT-009"), "expected CONTENT-009");
});

test("missing intro field reports CONTENT-002", () => {
  const data = { title: "Judul Tanpa Field" };
  delete data.intro;
  const diagnostics = validateEntry(
    makeEntry({ body: fixture("missing-intro.md"), data }),
  );
  assert.ok(
    diagnostics.some((d) => d.rule === "CONTENT-002"),
    "expected CONTENT-002",
  );
});

test("two paragraphs after H1 report CONTENT-002", () => {
  const body = [
    "# Judul Dua Paragraf",
    "",
    "Judul Dua Paragraf adalah paragraf intro pertama.",
    "",
    "Ini paragraf kedua yang bukan intro.",
    "",
    "## Bagian",
    "",
    "Isi.",
  ].join("\n");
  const diagnostics = validateEntry(
    makeEntry({ body, data: { title: "Judul Dua Paragraf" } }),
  );
  assert.ok(
    diagnostics.some((d) => d.rule === "CONTENT-002"),
    "expected CONTENT-002",
  );
});


test("metaDescription matching featuredImage.alt reports CONTENT-006", () => {
  const alt = "Judul Uji adalah ilustrasi sertifikasi.";
  const diagnostics = validateEntry(makeEntry({data: {
    metaDescription: alt,
    featuredImage: { src: "/image.webp", alt },
  }}));
  assert.ok(diagnostics.some(d => d.rule === "CONTENT-006" && d.field === "metaDescription"));
});

test("duplicate slug is rejected within same collection and language", () => {
  const diagnostics = validateAllEntries([
    makeEntry({id: "a.md", data: {slug: "slug-sama", lang: "id"}}),
    makeEntry({id: "b.md", data: {slug: "SLUG-SAMA", lang: "id"}}),
  ]);
  assert.ok(diagnostics.some(d => d.rule === "CONTENT-006" && d.field === "slug"));
});

test("gallery image objects require src and alt", () => {
  const diagnostics = validateEntry(makeEntry({data: {images: [
    {src: "", alt: "Gambar"},
    {src: "/image.webp", alt: ""},
  ]}}));
  assert.equal(diagnostics.filter(d => d.rule === "CONTENT-010").length, 2);
});


test("English article intro and featured image alt use English validation rules", () => {
  const diagnostics = validateEntry(makeEntry({
    data: {
      title: "ISO 9001 Document Control",
      lang: "en",
      intro: "ISO 9001 Document Control is the process of keeping information accurate and available.",
      metaDescription: "Practical guidance for controlling documented information in an organization.",
      featuredImage: {
        src: "/images/document-control.webp",
        alt: "ISO 9001 Document Control is illustrated by an organized document library.",
      },
    },
    body: "# ISO 9001 Document Control\\n\\nISO 9001 Document Control is the process of keeping information accurate and available.\\n\\n## Practical controls\\n\\nOrganizations should define clear controls.",
  }));
  assert.equal(diagnostics.filter((d) => d.rule === "CONTENT-003").length, 0);
  assert.equal(diagnostics.filter((d) => d.rule === "CONTENT-008").length, 0);
});

test("English entries still reject Indonesian-only intro and image-alt wording", () => {
  const diagnostics = validateEntry(makeEntry({
    data: {
      title: "ISO 9001 Document Control",
      lang: "en",
      intro: "ISO 9001 Document Control adalah proses menjaga informasi.",
      metaDescription: "A unique English search description for document control.",
      featuredImage: {
        src: "/images/document-control.webp",
        alt: "ISO 9001 Document Control adalah ilustrasi pengendalian dokumen.",
      },
    },
    body: "# ISO 9001 Document Control\\n\\nISO 9001 Document Control adalah proses menjaga informasi.\\n\\n## Practical controls\\n\\nOrganizations should define clear controls.",
  }));
  assert.ok(diagnostics.some((d) => d.rule === "CONTENT-003"));
  assert.ok(diagnostics.some((d) => d.rule === "CONTENT-008"));
});

test("draft articles may omit publication date and featured image pending approval", () => {
  const data = { ...makeEntry().data, draft: true };
  delete data.featuredImage;
  delete data.pubDate;
  const diagnostics = validateEntry(makeEntry({ data }));
  assert.equal(diagnostics.filter((d) => d.rule === "CONTENT-007" || d.rule === "CONTENT-012").length, 0);
});

test("published articles require publication date and featured image", () => {
  const data = { ...makeEntry().data, draft: false };
  data.featuredImage = undefined;
  data.pubDate = undefined;
  const diagnostics = validateEntry(makeEntry({ data }));
  assert.ok(diagnostics.some((d) => d.rule === "CONTENT-007"));
  assert.ok(diagnostics.some((d) => d.rule === "CONTENT-012"));
});


test("consultation terminology is rejected in body and nested frontmatter block copy", () => {
  const bodyDiagnostics = validateEntry(makeEntry({
    body: "# Judul Uji\\n\\nJudul Uji adalah penjelasan yang valid.\\n\\n## Informasi\\n\\nSilakan konsultasikan kebutuhan.",
  }));
  assert.ok(bodyDiagnostics.some((d) => d.rule === "CONTENT-013"));

  const blockDiagnostics = validateEntry(makeEntry({
    data: { blocks: [{ type: "cta", title: "Konsultasi gratis", link: { label: "Consult our team", url: "https://example.com" } }] },
  }));
  assert.ok(blockDiagnostics.some((d) => d.rule === "CONTENT-013"));
});

test("certification-focused wording passes consultation terminology validation", () => {
  const diagnostics = validateEntry(makeEntry({
    data: { blocks: [{ type: "cta", title: "Ajukan Sertifikasi", link: { label: "Informasi Sertifikasi", url: "https://example.com" } }] },
  }));
  assert.equal(diagnostics.filter((d) => d.rule === "CONTENT-013").length, 0);
});

test("body-less entry with a hero and valid block headings has no CONTENT-001/002/011", () => {
  const diagnostics = validateEntry(makeEntry({
    body: "",
    data: {
      blocks: [
        { type: "hero", title: "Judul Uji", description: "Judul Uji adalah intro yang menjelaskan topik halaman ini." },
        {
          type: "content-section",
          title: "Bagian pertama",
          items: [
            { title: "Item satu", description: "Penjelasan item satu." },
            { title: "Item dua", description: "Penjelasan item dua." },
          ],
        },
      ],
    },
  }));
  const structural = diagnostics.filter((d) => ["CONTENT-001", "CONTENT-002", "CONTENT-011"].includes(d.rule));
  assert.deepEqual(structural, []);
});

test("body-less entry with a skipped block heading reports CONTENT-011 on blocks", () => {
  const diagnostics = validateEntry(makeEntry({
    body: "",
    data: {
      blocks: [
        { type: "hero", title: "Judul Uji" },
        { type: "link-grid", items: [{ title: "Tautan", href: "https://example.com" }] },
      ],
    },
  }));
  const found = diagnostics.find((d) => d.rule === "CONTENT-011");
  assert.ok(found, "expected CONTENT-011 diagnostic");
  assert.equal(found.field, "blocks");
  assert.equal(found.expectedLevel, 2);
});

test("body-less entry without hero reports CONTENT-001 on blocks", () => {
  const diagnostics = validateEntry(makeEntry({
    body: "",
    data: { blocks: [{ type: "content-section", title: "Bagian tanpa H1" }] },
  }));
  const found = diagnostics.find((d) => d.rule === "CONTENT-001");
  assert.ok(found, "expected CONTENT-001 diagnostic");
  assert.equal(found.field, "blocks");
});
