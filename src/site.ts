/**
 * PT. Intiprima Sertifikasi — single source of truth for company identity
 * and shared site settings. Company-wide data must not be hardcoded elsewhere.
 */
const SITE_URL = "https://tnv-certification.com";

export const organization = {
  id: "organization",
  name: "PT. Intiprima Sertifikasi",
  groupName: "TNV Group",
  slug: "pt-intiprima-sertifikasi",
  shortName: "Intiprima Sertifikasi",
  description:
    "PT. Intiprima Sertifikasi merupakan bagian dari TNV Group yang berfokus pada layanan sertifikasi dengan komitmen terhadap kredibilitas dan hasil yang bernilai bagi klien.",
  url: SITE_URL,
  logo: {
    url: "/logo.svg",
    width: 480,
    height: 128,
    format: "svg",
  },
  contact: {
    email: "tnvcertification25@gmail.com",
    phone: "+62 822-2721-7776",
    whatsapp: "+62 822-2721-7776",
    address: {
      street: "WTC 3, Lantai 20 R30, Jl. Jendral Sudirman Kav. 29–31",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      countryCode: "ID",
      postalCode: "12920",
    },
    addressLabels: {
      country: "Indonesia",
    },
  },
  sameAs: [],
} as const;

export const siteSettings = {
  url: SITE_URL,
  title: "PT. Intiprima Sertifikasi",
  description:
    "PT. Intiprima Sertifikasi — bagian dari TNV Group. Informasi layanan sertifikasi dan standar sistem manajemen.",
  tagline: "Bagian dari TNV Group",
  defaultLanguage: "id",
  languages: [
    { code: "id", label: "Bahasa Indonesia" },
    { code: "en", label: "English" },
  ],
  languageSwitcher: {
    ariaLabel: { id: "Pilih bahasa", en: "Language" },
    unavailable: {
      id: "Terjemahan belum tersedia",
      en: "Translation not available",
    },
  },
} as const;

export const primaryNavigation = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/services/" },
  { label: "CSMS", href: "/csms/" },
  { label: "Tentang", href: "/about-us/" },
  { label: "Pelatihan", href: "/trainings/" },
  { label: "Jadwal", href: "/schedules/" },
  { label: "Artikel", href: "/articles/" },
] as const;

export const footerNavigation = [
  {
    title: "Mulai",
    links: [
      { label: "Beranda", href: "/" },
      { label: "Layanan", href: "/services/" },
      { label: "CSMS", href: "/csms/" },
      { label: "Tentang", href: "/about-us/" },
      { label: "Pelatihan", href: "/trainings/" },
      { label: "Jadwal pelatihan", href: "/schedules/" },
    ],
  },
  {
    title: "Baca",
    links: [{ label: "Artikel dan panduan", href: "/articles/" }],
  },
] as const;
