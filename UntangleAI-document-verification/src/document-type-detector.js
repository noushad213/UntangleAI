const { DOCUMENT_TYPES } = require("./document-types");

const LABEL_RULES = [
  {
    type: DOCUMENT_TYPES.AADHAAR,
    pattern: /\b(?:AADHAAR|AADHAR|UIDAI)\b|UNIQUE IDENTIFICATION AUTHORITY OF INDIA|आधार|आधार कार्ड|भारतीय विशिष्ट पहचान प्राधिकरण/i,
  },
  {
    type: DOCUMENT_TYPES.PAN,
    pattern: /PERMANENT ACCOUNT NUMBER|INCOME TAX DEPARTMENT|\bPAN CARD\b|\bपैन कार्ड\b|आयकर विभाग/i,
  },
  {
    type: DOCUMENT_TYPES.PASSPORT,
    pattern: /\bPASSPORT\b|\bPASSPORT NO\b|पासपोर्ट/i,
  },
  {
    type: DOCUMENT_TYPES.DRIVING_LICENSE,
    pattern: /DRIVING LICEN[CS]E|DRIVING PERMIT|\bDL NO\b|ड्राइविंग लाइसेंस/i,
  },
  {
    type: DOCUMENT_TYPES.VOTER_ID,
    pattern: /ELECTION COMMISSION OF INDIA|ELECTOR PHOTO ID|\bEPIC\b|मतदाता पहचान पत्र/i,
  },
  {
    type: DOCUMENT_TYPES.DOMICILE_CERTIFICATE,
    pattern: /DOMICILE CERTIFICATE|NATIVE OF MAHARASHTRA|अधिवास प्रमाणपत्र|डोमिसाइल प्रमाणपत्र/i,
  },
  {
    type: DOCUMENT_TYPES.BIRTH_CERTIFICATE,
    pattern: /BIRTH CERTIFICATE|CERTIFICATE OF BIRTH|जन्म प्रमाणपत्र|जन्म दाखला/i,
  },
  {
    type: DOCUMENT_TYPES.INCOME_CERTIFICATE,
    pattern: /INCOME CERTIFICATE|CERTIFICATE OF INCOME|उत्पन्न प्रमाणपत्र|आय प्रमाणपत्र/i,
  },
];

function detectDocumentType(ocrText) {
  if (typeof ocrText !== "string" || !ocrText.trim()) {
    return { documentType: null, confidence: 0, reason: "empty_ocr_text" };
  }

  const matches = LABEL_RULES.filter(({ pattern }) => pattern.test(ocrText));
  if (matches.length === 1) {
    return { documentType: matches[0].type, confidence: 0.98, reason: "document_label" };
  }
  if (matches.length > 1) {
    return { documentType: null, confidence: 0, reason: "multiple_document_labels" };
  }

  // PAN numbers have a fixed format. Without a readable label, treat that
  // pattern as a useful signal but keep the confidence below a label match.
  const panNumber = /\b[A-Z]{5}\s?\d{4}\s?[A-Z]\b/i.test(ocrText);
  if (panNumber) {
    return { documentType: DOCUMENT_TYPES.PAN, confidence: 0.86, reason: "pan_number_pattern" };
  }

  // An Aadhaar number alone is not enough because other documents can contain
  // 12-digit identifiers. Require a government/Aadhaar context as well.
  const aadhaarNumber = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(ocrText);
  const indiaContext = /GOVERNMENT OF INDIA|भारत सरकार/i.test(ocrText);
  if (aadhaarNumber && indiaContext) {
    return { documentType: DOCUMENT_TYPES.AADHAAR, confidence: 0.82, reason: "aadhaar_number_with_government_label" };
  }

  return { documentType: null, confidence: 0, reason: "document_type_not_recognized" };
}

module.exports = { detectDocumentType };
