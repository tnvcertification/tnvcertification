# Desain: Combined Frontmatter Pages (mode development)

- Tanggal: 2026-11-22
- Status: **disetujui 2026-11-22** — menjadi dasar plan implementasi
- Cabang rencana:branch baru dari `upstream/main` (`f123502`)

## 1. Konteks

Repo pusattraining menyimpan konten halaman statis di `src/content/pages/*.md`. Setiap route `index.astro` mengambil satu entry berdasarkan `slug`, lalu merender judul, deskripsi, dan blok dari frontmatter. Di repo ini, koleksi `pages` baru berisi satu entry (`about-us`) dan halaman utama lainnya masih menyimpan teks editorial langsung di file `.astro`.

Keputusan user:

- Pakai pola pusattraining **tanpa menghilangkan** struktur yang sudah ada di repo ini (route, navigasi, validasi, SSOT `site.ts`). Ini disebut **pola combined**.
- **Semua konten halaman bersumber dari frontmatter; tidak ada lagi konten editorial di file `.astro`.**
- Konsep ini masih **development sementara**, belum final. Dokumentasi dan aturan harus menyatakan hal itu supaya tidak terkunci sebagai arsitektur permanen.

## 2. Prinsip pola combined

| Aspek | Dipertahankan dari repo ini | Diambil dari pusattraining |
| --- | --- | --- |
| Penyimpanan | Koleksi `pages` + skema yang ada (intro, metaDescription, featuredImage, aturan CONTENT-001..013) | Satu markdown entry per halaman, diambil oleh route berdasarkan `slug` |
| Route | Semua route yang ada (`/`, `/services/`, `/csms/`, `/trainings/`, `/schedules/`, `/articles/`, halaman paginasi, detail entri) tidak dihapus/diganti | Route menjadi konsumer konten halaman, bukan pemilik teks |
| Data dinamis | Query langsung untuk layanan, pelatihan, jadwal, artikel tetap di `src/data/*` dan route | Label bagian (judul, empty state, CTA) ikut entry `pages` |
| Blok | Union blok existing (`content-section`, `faq`, `howto`, `cta`) + validator section-ID | Blok struktural halaman (`hero`, `link-grid`, `listing`) ditambahkan ke union yang sama |
| Identitas | `src/site.ts` tetap SSOT untuk nama perusahaan, kontak, alamat, navigasi | — |

Definisi "konten" untuk desain ini:

- **Konten editorial halaman** — hero eyebrow/judul/deskripsi, judul setiap bagian, paragraf, daftar isi, empty state, label CTA, judul section artikel. **Wajib pindah ke frontmatter.**
- **Infrastruktur** — nama perusahaan, kontak, menu, canonical, logika sorting/filter, atribut aksesibilitas, dan string UI generik milik komponen (misalnya label pagination "Sebelumnya"/"Berikutnya" pada komponen navigasi) **bukan konten halaman**. Ini tetap di `site.ts`/komponen, dengan catatan di dokumentasi bahwa klasifikasinya dapat direvisi saat konsep final.

## 3. Lingkup halaman dan slug

Satu entry `pages` per permukaan halaman. Slug menjadi penghubung tetap antara entry dan route.

| Entry `pages` | Route pemilik | Catatan |
| --- | --- | --- |
| `home` | `src/pages/index.astro` | Hero + link grid + artikel terbaru |
| `services` | `src/pages/services/index.astro` | Hero + kartu layanan dinamis + artikel terbaru |
| `csms` | `src/pages/csms/index.astro` | Hero + blok prose/status/kesiapan + CTA |
| `about-us` | `src/pages/[slug].astro` | Entry sudah ada; dipertahankan. Juga menjadi satu-satunya permukaan informasi kontak — tidak dibuat route `/contact/` |
| `trainings` | `src/pages/trainings/index.astro` | Hero + katalog dinamis + empty state |
| `schedules` | `src/pages/schedules/index.astro` | Hero lewat `ScheduleArchiveLayout` + daftar jadwal dinamis + empty state |
| `articles` | `src/pages/articles/index.astro` dan `src/pages/articles/page/[page].astro` | Satu entry untuk seluruh arsip; halaman 2+ mewarisi judul/deskripsi/gambar dari entry yang sama |

Tidak dibuat route `/contact/` maupun entry `kontak`. Informasi kontak ditampilkan dari `/about-us/`: entry `about-us` mendapat blok kontak yang memuat copy editorial, sementara nilai email/telepon/alamat tetap dibaca dari `site.ts` agar SSOT tidak diduplikasi. Ini menggantikan `kontak.md` dari pusattraining dan tercatat sebagai keputusan development.

### Konflik path

`src/pages/[slug].astro` saat ini membuat `/${slug}/` untuk setiap entry. Entri baru dengan slug `home`, `services`, `csms`, `trainings`, `schedules`, `articles` akan menimpa route eksplisit. Mitigasi:

- Definisikan `routeOwnedPageSlugs` di `src/data/pages.ts`.
- `getStaticPaths()` pada `[slug].astro` melewati slug tersebut.
- Helper `getPage(slug)` dipakai semua route pemilik, dengan error build yang jelas bila entry tidak ditemukan.

## 4. Perubahan skema `pages`

`pageSchema` diperluas dengan satu field opsional:

```ts
blocks: z.array(pageBlockSchema).optional()
```

`pageBlockSchema` adalah discriminated union yang **memperluas** union blok existing:

- Dipakai ulang tanpa perubahan: `content-section`, `faq`, `howto`, `cta`.
- Blok struktural baru:
  - `hero`: `eyebrow?`, `title`, `description?`, `image?`, `imageAlt?`. `image`/`imageAlt` boleh kosong dan saat itu jatuh ke `featuredImage`.
  - `link-grid`: `eyebrow?`, `title?`, `items[]` berisi `eyebrow?`, `title`, `description?`, `href`, `actionLabel?`. Dipakai homepage.
  - `listing`: `source: "services" | "trainings" | "schedules" | "articles"`, `eyebrow?`, `title?`, `description?`, `emptyTitle?`, `emptyDescription?`, `emptyActionLabel?`, `emptyActionHref?`. Route tetap yang mengambil data dinamis; blok hanya mendefinisikan salinan tampilannya.
  - `contact`: `eyebrow?`, `title`, `description?`, `labels?: { email?, phone?, address? }`. Dipakai entry `about-us`; nilai email/telepon/alamat tetap diambil dari `site.ts`, blok hanya menyimpan judul dan label.
- Semua blok struktural memakai `blockIdSchema` dan `surface` yang sama dengan blok existing, sehingga `audit:blocks` tetap berlaku.

Body Markdown tetap wajib berisi H1, satu paragraf intro persis sama dengan field `intro`, dan hierarki heading tanpa loncatan. Untuk halaman yang seluruh tampilannya berasal dari blok, body berisi H1 + intro + bagian pendukung minimum; tidak boleh kosong.

## 5. Perubahan route dan komponen

- `src/data/pages.ts` (baru): `routeOwnedPageSlugs`, `getPageEntry(slug)`, `getPageHero(entry)`, `getPageBlocks(entry)`.
- `src/pages/index.astro`: ambil entry `home`; judul/deskripsi/ogImage layout dari entry; `HomeHero` menerima nilai dari blok `hero`; link grid dirender dari blok `link-grid` lewat komponen presentasional baru; judul section artikel dari blok `listing` `articles`.
- `src/pages/services/index.astro`, `trainings/index.astro`, `articles/index.astro`: layout + hero dari entry; judul section/empty state dari blok `listing`; data dinamis tetap seperti sekarang.
- `src/pages/schedules/index.astro`: layout dan hero dari entry `schedules`; empty state dari blok `listing`; `statusLabel` dan format tanggal tetap merupakan logika presentasi (bukan teks halaman) — akan dipindah ke helper bila konsep final.
- `src/pages/csms/index.astro`: seluruh teks dipindah ke blok `content-section` + `cta`; file `.astro` tinggal merender `BlockRenderer`.
- `src/pages/articles/page/[page].astro`: mewarisi metadata dari entry `articles`; nomor halaman dan canonical tetap dihitung di route.
- `src/pages/[slug].astro`: filter `routeOwnedPageSlugs`; tidak ada perubahan pada cara render `about-us`.
- `src/components/HomeHero.astro`: hapus eyebrow default hardcode; semua nilai datang dari props.
- Komponen presentasional baru untuk `hero`, `link-grid`, dan `listing` ditempatkan di `src/components/page/` agar route tetap tipis. Tidak menambah dependency.

## 6. Daftar konten yang dipindah (ringkas)

- Homepage: judul hero, eyebrow link grid (2 kartu), judul/deskripsi/CTA kartu, eyebrow + judul "Artikel Terbaru", tautan "Semua artikel".
- Services: metadata layout, eyebrow/judul/deskripsi/gambar hero, empty state, judul "Artikel Terbaru".
- CSMS: metadata, hero, 4 judul section + paragraf + 6 item kesiapan + CTA.
- Trainings: metadata, hero, empty state beserta paragraf panjang.
- Schedules: metadata, judul/deskripsi hero, empty state beserta CTA.
- Articles: metadata, hero, empty state, judul pagination; halaman 2+ mengikuti entry yang sama.
- `siteSettings.title/description` pada `<Layout>` diganti dengan judul/deskripsi entry tempat-entry, kecuali untuk data identitas perusahaan yang memang tetap di `site.ts`.

## 7. Revisi dokumentasi dan aturan

- `AGENTS.md`: tambah bagian "Page content source of truth (development mode)" — konten editorial halaman wajib di `src/content/pages/`; `.astro` hanya presentasi dan pengikatan data dinamis; `site.ts` tetap SSOT; status sementara/experimental.
- `docs/architecture.md`: jelaskan alur `pages` entry → route → komponen, daftar `routeOwnedPageSlugs`, dan alasan filter pada `[slug].astro`.
- `docs/components-blocks-layouts.md`: dokumentasikan blok struktural baru dan aturan `surface`/ID.
- `docs/bilingual-content.md`: catat bahwa entry halaman saat ini berbahasa ID; pasangan EN masuk fase berikutnya.
- `docs/superpowers/specs/...` (dokumen ini) menjadi referensi keputusan, dengan label jelas "development, bukan final".
- Tidak mengubah `docs/agent-operational-memory.md` kecuali prosedur rilis berubah.

## 8. Validasi

Gerbang yang dijalankan setelah implementasi:

- `npm run check`, `npm run lint`, `npm run test`, `npm run build`.
- `npm run audit:seo`, `npm run audit:blocks`, `npm run audit:page-images`.
- Inspeksi `dist/`: tidak ada `/home/`, tidak ada duplicate path, semua halaman ter-build.
- Tes baru (bila layak): setiap slug dalam `routeOwnedPageSlugs` punya entry `pages` yang tidak draft, dan `[slug].astro` tidak menghasilkan path untuk slug tersebut.

Tidak ada gerbang otomatis yang mencoba membuktikan "nol string editorial di `.astro`" secara regex; ini terlalu rapuh untuk konsep sementara. Kepatuhan dijaga lewat code review dan dokumentasi, dan dapat diperketat saat konsep final.

## 9. Non-goal / keputusan ditunda

- Tidak membuat route `/contact/`; informasi kontak tampil di `/about-us/` dari `site.ts`.
- Tidak membuat pasangan EN untuk halaman-halaman ini pada fase ini.
- Tidak mengubah skema entri `services`, `training`, `articles`, atau `trainingSchedules`.
- Tidak menghapus blok FAQ/HowTo fallback di `BlockRenderer` — dicatat sebagai utang teknis transisional.
- Tidak mengubah navigasi, footer, structured data, atau aturan SEO selain yang disebut di atas.
- Tidak menghapus branch `feat/language-switcher-icons` tanpa persetujuan terpisah.

## 10. Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Build gagal karena path duplikat | Filter `routeOwnedPageSlugs` + inspeksi `dist/` |
| CONTENT-003/008/009 gagal karena judul baru | Setiap entry ditulis dengan intro `judul adalah ...`, alt lebih pendek dari intro, metaDescription unik |
| `audit:blocks` gagal karena blok baru tanpa ID | Semua blok struktural memakai `blockIdSchema`; ID eksplisit di entry |
| Teks tersisa di `.astro` | Audit manual daftar pada bagian 6 sebelum commit |
| Konsep berubah lagi | Semua dokumentasi diberi label development; perubahan berikutnya cukup mengubah entry + satu helper, bukan menyusun ulang route |
