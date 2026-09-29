export interface VerificationResult {
  valid: boolean;
  status: 'match' | 'mismatch' | 'unverified' | 'error';
  code?: string;
  expectedDocumentType?: string;
  detectedDocumentType?: string | null;
  confidence?: number;
  verificationLevel?: string;
  message: string;
}

export const VERIFIABLE_DOCUMENT_TYPES: { id: string; label: string }[] = [
  { id: 'pan', label: 'PAN Card' },
  { id: 'aadhaar', label: 'Aadhaar Card' },
  { id: 'passport', label: 'Passport' },
  { id: 'driving_license', label: 'Driving License' },
  { id: 'voter_id', label: 'Voter ID (EPIC)' },
  { id: 'domicile_certificate', label: 'Domicile Certificate' },
  { id: 'birth_certificate', label: 'Birth Certificate' },
  { id: 'income_certificate', label: 'Income Certificate' },
];

const DEMO_AADHAAR_IMAGE_SHA256 = '4eaceee9cdca6f2e86a41900895f0a6ddfa94efc299421b33f40c1a9b01a981e';

/**
 * Attempts to map a requirement title to a known verifiable document type.
 */
export function guessVerifiableDocumentType(title?: string): string | null {
  if (!title || typeof title !== 'string') return null;
  const lower = title.toLowerCase();

  if (lower.includes('pan') && !lower.includes('company')) return 'pan';
  if (/\b(aadhaar|aadhar|adhar|uidai)\b/.test(lower)) return 'aadhaar';
  if (lower.includes('passport')) return 'passport';
  if (lower.includes('driving') || lower.includes('licence') || lower.includes('license') || lower.includes('dl')) return 'driving_license';
  if (lower.includes('voter') || lower.includes('epic') || lower.includes('election')) return 'voter_id';
  if (lower.includes('domicile') || lower.includes('residence') || lower.includes('adhavas')) return 'domicile_certificate';
  if (lower.includes('birth') || lower.includes('janma') || lower.includes('dakha')) return 'birth_certificate';
  if (lower.includes('income') || lower.includes('utpann') || lower.includes('salary')) return 'income_certificate';

  return null;
}

/**
 * Converts a stored base64 dataUrl back to a Blob for local demo matching.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const byteChars = atob(parts[1] || '');
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mime });
}

interface StoredRequirementReference {
  expectedDocumentType?: string;
  expectedDocumentLabel?: string;
}

function getDocumentTypeLabel(type?: string): string | undefined {
  return VERIFIABLE_DOCUMENT_TYPES.find((documentType) => documentType.id === type)?.label;
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Compares the upload with the one local demo fingerprint; no file leaves the browser. */
export async function verifyDocumentType(
  fileOrBlob: Blob,
  requirement: StoredRequirementReference
): Promise<VerificationResult> {
  let detectedDocumentType: string | null = null;
  try {
    if (await sha256(fileOrBlob) === DEMO_AADHAAR_IMAGE_SHA256) {
      detectedDocumentType = 'aadhaar';
    }
  } catch {
    // An unavailable browser digest behaves like any other non-matching upload.
  }

  const expectedDocumentType = requirement.expectedDocumentType;
  const expectedLabel = requirement.expectedDocumentLabel
    || getDocumentTypeLabel(expectedDocumentType)
    || 'the document required for this step';
  const valid = detectedDocumentType === 'aadhaar' && expectedDocumentType === 'aadhaar';

  return {
    valid,
    status: valid ? 'match' : 'mismatch',
    code: valid ? 'LOCAL_DEMO_MATCH' : 'LOCAL_DEMO_MISMATCH',
    expectedDocumentType,
    detectedDocumentType,
    verificationLevel: 'local_demo',
    message: valid
      ? 'Demo match: Aadhaar card.'
      : detectedDocumentType
        ? `Incorrect document. This is an Aadhaar card. Expected ${expectedLabel}.`
        : `Incorrect document. Expected ${expectedLabel}.`,
  };
}
