# Desain: seluruh konten editorial dari frontmatter (tanpa body Markdown)

## Status

**Diimplementasikan.** Seluruh 22 entri editorial kini hanya berisi frontmatter tanpa body Markdown, dan CONTENT-014 menolak body yang ditambahkan kembali. Contoh visual dan struktural adalah `/services/` (`hero-layanan`), bukan `/csms/`.

## Masalah

- Detail service belum memakai blok `hero`; H1/intro datang dari body Markdown dan `featuredImage` dirender terpisah, sehingga tidak ada hero yang utuh.
- Masih ada teks tampilan di `.astro` (judul “Artikel Terkait”, breadcrumb).
- Halaman lain sudah memakai blok, tetapi file `.md`-nya masih menyimpan body Markdown yang tidak dirender. Itu duplikasi dan membuat frontmatter bukan satu-satunya sumber.
- Layout artikel/service saat ini masih memiliki label breadcrumb hardcode dan merender gambar sendiri; keduanya perlu disesuaikan agar tidak menduplikasi hero.

## Keputusan

1. **Semua 22 entri editorial** (`src/content/pages`: 7, `src/content/services`: 4, `src/content/articles`: 11) hanya berisi frontmatter. Body Markdown dihapus total.
2. Pola referensi adalah `/services/`: blok `hero` dengan `id: hero-layanan` dan `description`, gambar dari `featuredImage`, dirender lewat `PageHero` → `MainMenuHero` (H1 48px desktop, intro, gambar dalam satu section).
3. Setiap halaman yang menampilkan teks harus merender blok frontmatter, bukan `<Content />`.
4. Validator build-time tidak boleh lagi bergantung pada body Markdown.

## Perubahan yang diperlukan

### Schema (`src/content.config.ts`)

- `serviceSchema.blocks` dan `articleSchema.blocks` memakai `pageBlockSchema` sehingga `hero`, `link-grid`, dan blok halaman lain tersedia.
- `serviceSchema` mendapat `relatedArticles: { title: string; emptyTitle?: string }` untuk judul bagian artikel terkait.
- `pageSchema` sudah memakai `pageBlockSchema`; tidak diubah.

### Konten

- **7 page entries**: hapus body. Tambah blok `hero` pada `about-us` (belum punya).
- **4 service entries**: hapus body; pindahkan isi “Status pengembangan layanan”, “Proses sertifikasi secara umum”, “Referensi resmi” ke blok `content-section` / `link-grid`; tambah blok `hero` dan `relatedArticles`.
- **11 article entries**: hapus body; H1 + intro menjadi blok `hero`; setiap `##` menjadi `content-section` dengan `description` dari paragraf di bawahnya; kutipan dimasukkan ke blok.

### Validator (`src/lib/content-validation.ts`, `src/content-validation.ts`, `scripts/validate-changed-content.mjs`)

- Saat body kosong, struktur dokumen diturunkan dari blok: `hero` → H1, `content-section`/`faq`/`howto`/`cta`/`link-grid`/`listing`/`contact` → H2, `items`/`steps` → H3.
- `CONTENT-001` menerima H1 dari blok `hero`.
- `CONTENT-002` memakai field `intro` sebagai paragraf pembuka; tidak lagi mensyaratkan paragraf di body.
- `CONTENT-011` memeriksa hierarki heading turunan blok.
- Aturan baru `CONTENT-014`: entri editorial tidak boleh memiliki body Markdown (diterapkan di integration build-time dan preflight perubahan).
- Jalur lama untuk body tetap dipertahankan di unit test agar regresi fixture terdeteksi.

### Route dan layout

- Hapus `render()` / `<Content />` dari `src/pages/[slug].astro`, `src/pages/articles/[slug].astro`, `src/pages/services/[slug].astro`, `src/pages/en/services/[slug].astro`, `src/pages/trainings/[slug].astro`.
- Route editorial memakai layout yang sesuai tujuan halaman: `ServiceLayout` untuk detail service, `ArticleLayout` untuk artikel, `WidePageLayout` untuk halaman korporat/details lain — sesuai prinsip `AGENTS.md` agar layout tetap spesifik per purpose.
- `ServiceLayout.astro` dan `ArticleLayout.astro` **dipertahankan dan direfactor**: menerima `hero` + `blocks`, merender `PageHero` + `PageBlockRenderer`, menghapus `FeaturedImage` dan `<div class="prose"><slot /></div>` mereka, serta mengambil label breadcrumb dari `site.ts` lewat helper `siteCrumb`.
- Tanggal artikel tetap ditampilkan dari `updatedDate ?? pubDate`, tanpa teks hardcode baru.

### Gate

- `scripts/audit-page-images.mjs`: hero wajib pada semua route detail editorial (`/services/<slug>/`, `/en/services/<slug>/`, `/articles/<slug>/`, halaman generik).
- `audit:headings` tetap dijalankan terhadap HTML hasil render.
- Tes baru: tidak ada `<Content` di route editorial; semua entri memiliki body kosong dan minimal satu blok `hero`; hierarki heading turunan blok valid.

## Dampak visual

- H1 hero 48px desktop / 30px mobile, intro, dan gambar dalam satu section di semua halaman editorial.
- Bagian konten memakai permukaan bergantian seperti `/services/` dan `/csms/`.
- Tidak ada duplikasi prosa Markdown + blok.

## Tidak termasuk

- Entri `categories` (24 taxonomy record, bukan halaman editorial).
- Perubahan teks editorial di luar pemindahan bentuk ke blok.
- Push/PR/merge; berhenti setelah commit di branch baru dari `upstream/main`.

## Validasi

`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit:seo`, `pnpm audit:blocks`, `pnpm audit:page-images`, `pnpm audit:headings`, serta pengukuran DOM/CSS di 1440px dan 390px pada `/services/sertifikasi-iso-9001-2026/` dan `/articles/<slug>/` untuk membuktikan hero ada dan tidak ada overflow.
