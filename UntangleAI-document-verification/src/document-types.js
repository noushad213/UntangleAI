const DOCUMENT_TYPES = Object.freeze({
  PAN: "pan",
  AADHAAR: "aadhaar",
  PASSPORT: "passport",
  DRIVING_LICENSE: "driving_license",
  VOTER_ID: "voter_id",
  DOMICILE_CERTIFICATE: "domicile_certificate",
  BIRTH_CERTIFICATE: "birth_certificate",
  INCOME_CERTIFICATE: "income_certificate",
});

const aliases = new Map([
  ["pan", DOCUMENT_TYPES.PAN],
  ["pan_card", DOCUMENT_TYPES.PAN],
  ["pancard", DOCUMENT_TYPES.PAN],
  ["aadhaar", DOCUMENT_TYPES.AADHAAR],
  ["aadhar", DOCUMENT_TYPES.AADHAAR],
  ["aadhaar_card", DOCUMENT_TYPES.AADHAAR],
  ["aadhar_card", DOCUMENT_TYPES.AADHAAR],
  ["passport", DOCUMENT_TYPES.PASSPORT],
  ["driving_license", DOCUMENT_TYPES.DRIVING_LICENSE],
  ["driving_licence", DOCUMENT_TYPES.DRIVING_LICENSE],
  ["voter_id", DOCUMENT_TYPES.VOTER_ID],
  ["epic", DOCUMENT_TYPES.VOTER_ID],
  ["domicile_certificate", DOCUMENT_TYPES.DOMICILE_CERTIFICATE],
  ["birth_certificate", DOCUMENT_TYPES.BIRTH_CERTIFICATE],
  ["income_certificate", DOCUMENT_TYPES.INCOME_CERTIFICATE],
]);

function normalizeDocumentType(value) {
  if (typeof value !== "string") return null;
  const key = value.normalize("NFKC").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return aliases.get(key) || null;
}

module.exports = { DOCUMENT_TYPES, normalizeDocumentType };
