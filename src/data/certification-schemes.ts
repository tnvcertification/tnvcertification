/**
 * Internal planning catalog of candidate standards/schemes.
 * This is NOT a list of approved TNCV certification services.
 * Editions remain null until verified against the publisher and TNCV scope.
 */
export type SchemeStatus = "planned" | "active";

export interface CertificationScheme {
  id: string;
  designation: string;
  title: string;
  categorySlug: string;
  edition: string | null;
  status: SchemeStatus;
  verificationNote: string;
}

const pendingVerification =
  "Verify current edition, official title, transition rules and TNCV authorization before publication.";

export const certificationSchemes: readonly CertificationScheme[] = [
  { id: "iso-9001", designation: "ISO 9001", title: "Quality management systems", categorySlug: "quality-management", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-14001", designation: "ISO 14001", title: "Environmental management systems", categorySlug: "environmental-management", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-45001", designation: "ISO 45001", title: "Occupational health and safety management systems", categorySlug: "occupational-health-safety", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-iec-27001", designation: "ISO/IEC 27001", title: "Information security management systems", categorySlug: "information-security-and-it", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-iec-20000-1", designation: "ISO/IEC 20000-1", title: "Service management systems", categorySlug: "information-security-and-it", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-22000", designation: "ISO 22000", title: "Food safety management systems", categorySlug: "food-safety", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-50001", designation: "ISO 50001", title: "Energy management systems", categorySlug: "energy-management", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-37001", designation: "ISO 37001", title: "Anti-bribery management systems", categorySlug: "governance-and-anti-bribery", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-22301", designation: "ISO 22301", title: "Business continuity management systems", categorySlug: "business-continuity", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-13485", designation: "ISO 13485", title: "Medical devices — Quality management systems", categorySlug: "medical-device-quality", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-iec-27701", designation: "ISO/IEC 27701", title: "Privacy information management systems", categorySlug: "privacy-information-management", edition: null, status: "planned", verificationNote: pendingVerification },
  { id: "iso-iec-42001", designation: "ISO/IEC 42001", title: "Artificial intelligence management systems", categorySlug: "artificial-intelligence-management", edition: null, status: "planned", verificationNote: pendingVerification },
] as const;
