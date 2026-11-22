import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = {
  csms: await readFile(new URL("../src/pages/csms/index.astro", import.meta.url), "utf8"),
  schedules: await readFile(new URL("../src/pages/schedules/index.astro", import.meta.url), "utf8"),
  "generic slug": await readFile(new URL("../src/pages/[slug].astro", import.meta.url), "utf8"),
};

const csmsObsolete = [
  "Status layanan TNCVCertification",
  "Area kesiapan yang dapat dipersiapkan",
  "Hubungan CSMS dengan ISO 45001",
  "Informasi layanan lainnya",
  "Kebijakan, tanggung jawab, dan tata kelola keselamatan kerja.",
  "Identifikasi bahaya, penilaian risiko, dan pengendalian risiko pekerjaan.",
  "Kompetensi pekerja, pelatihan, dan bukti kualifikasi personel.",
  "Prosedur kerja aman, kesiapan peralatan, dan pengendalian operasional.",
  "Kesiapsiagaan dan tanggap darurat serta pelaporan insiden.",
  "Pemenuhan persyaratan K3 dari pemberi kerja atau pemilik proyek.",
];

test("csms route reads its page entry and delegates blocks", () => {
  assert.match(routes.csms, /getPageEntry\("csms"\)/);
  assert.match(routes.csms, /PageBlockRenderer/);
});

for (const copy of csmsObsolete) {
  test(`csms route no longer hardcodes: ${copy}`, () => {
    assert.ok(!routes.csms.includes(copy), `csms route still contains "${copy}"`);
  });
}

test("schedules route reads its page entry and renders a listing block", () => {
  assert.match(routes.schedules, /getPageEntry\("schedules"\)/);
  assert.match(routes.schedules, /ListingSection/);
});

for (const copy of ["Belum ada jadwal yang dipublikasikan", "Jadwal Pelatihan"]) {
  test(`schedules route no longer hardcodes: ${copy}`, () => {
    assert.ok(!routes.schedules.includes(copy), `schedules route still contains "${copy}"`);
  });
}

test("generic route renders a frontmatter hero and blocks without a body", () => {
  assert.doesNotMatch(routes["generic slug"], /<Content/);
  assert.match(routes["generic slug"], /PageHero/);
  assert.match(routes["generic slug"], /getPageHero/);
  assert.match(routes["generic slug"], /getPageBlocks\(entry\)/);
  assert.match(routes["generic slug"], /PageBlockRenderer/);
});
