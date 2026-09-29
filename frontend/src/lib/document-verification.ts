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

/**
 * Attempts to map a requirement title to a known verifiable document type.
 */
export function guessVerifiableDocumentType(title?: string): string | null {
  if (!title || typeof title !== 'string') return null;
  const lower = title.toLowerCase();

  if (lower.includes('pan') && !lower.includes('company')) return 'pan';
  if (lower.includes('aadhaar') || lower.includes('aadhar') || lower.includes('uidai')) return 'aadhaar';
  if (lower.includes('passport')) return 'passport';
  if (lower.includes('driving') || lower.includes('licence') || lower.includes('license') || lower.includes('dl')) return 'driving_license';
  if (lower.includes('voter') || lower.includes('epic') || lower.includes('election')) return 'voter_id';
  if (lower.includes('domicile') || lower.includes('residence') || lower.includes('adhavas')) return 'domicile_certificate';
  if (lower.includes('birth') || lower.includes('janma') || lower.includes('dakha')) return 'birth_certificate';
  if (lower.includes('income') || lower.includes('utpann') || lower.includes('salary')) return 'income_certificate';

  return null;
}

/**
 * Converts a stored base64 dataUrl back to a Blob for verification.
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

/** Calls the type checker for a requirement resolved from the stored roadmap. */
interface StoredRequirementReference {
  workflowId: string;
  stepId: string;
  requirementIndex: number;
}

export async function verifyDocumentType(
  fileOrBlob: Blob,
  fileName: string,
  requirement: StoredRequirementReference,
  consentToThirdPartyOcr: boolean = true
): Promise<VerificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const formData = new FormData();
  formData.append('document', fileOrBlob, fileName);
  formData.append('workflowId', requirement.workflowId);
  formData.append('stepId', requirement.stepId);
  formData.append('requirementIndex', String(requirement.requirementIndex));
  if (consentToThirdPartyOcr) {
    formData.append('consentToThirdPartyOcr', 'true');
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/documents/verify`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    const errorMessage = data?.error?.message;
    return {
      valid: Boolean(data.valid),
      status: (data.status as 'match' | 'mismatch' | 'unverified') || (data.valid ? 'match' : 'error'),
      code: data.code,
      expectedDocumentType: data.expectedDocumentType,
      detectedDocumentType: data.detectedDocumentType,
      confidence: data.confidence,
      verificationLevel: data.verificationLevel,
      message: data.message || errorMessage || (data.valid ? 'Document type verified.' : 'Verification failed.'),
    };
  } catch (error) {
    return {
      valid: false,
      status: 'error',
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Document verification service is offline.',
    };
  }
}
