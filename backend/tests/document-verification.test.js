const test = require('node:test');
const assert = require('node:assert/strict');
const { detectDocumentType } = require('../src/features/document-verification/document-type-detector');
const { normalizeDocumentType } = require('../src/features/document-verification/document-types');
const {
  assertSupportedFile,
  createDocumentVerificationService,
} = require('../src/features/document-verification/services/document-verification.service');
const { createOcrSpaceProvider } = require('../src/features/document-verification/services/ocr-space.provider');

function pdfFile(text = '%PDF-1.7\nmock document') {
  const buffer = Buffer.from(text);
  return {
    buffer,
    size: buffer.length,
    mimetype: 'application/pdf',
    originalname: 'upload.pdf',
  };
}

test('normalizes common PAN and Aadhaar field names', () => {
  assert.equal(normalizeDocumentType('PAN Card'), 'pan');
  assert.equal(normalizeDocumentType('Aadhar Card'), 'aadhaar');
  assert.equal(normalizeDocumentType('unknown_field'), null);
});

test('detects PAN from the card label and identifier pattern', () => {
  assert.deepEqual(
    detectDocumentType('INCOME TAX DEPARTMENT  ABCDE1234F  PERMANENT ACCOUNT NUMBER'),
    { documentType: 'pan', confidence: 0.98, reason: 'document_label' }
  );
});

test('detects Aadhaar and rejects mixed or unclear OCR evidence', () => {
  assert.equal(detectDocumentType('Government of India - Aadhaar - Unique Identification Authority').documentType, 'aadhaar');
  assert.equal(detectDocumentType('Aadhaar PAN card').documentType, null);
  assert.equal(detectDocumentType('Name: A Person\nDate of Birth: 2000').documentType, null);
});

test('returns a mismatch when an Aadhaar card is uploaded into the PAN field', async () => {
  let ocrCalled = false;
  const service = createDocumentVerificationService({
    ocrProvider: {
      recognize: async () => {
        ocrCalled = true;
        return { text: 'Government of India\nAadhaar\nUnique Identification Authority of India' };
      },
    },
  });

  const result = await service.verify({ file: pdfFile(), expectedDocumentType: 'PAN Card' });
  assert.equal(ocrCalled, true);
  assert.equal(result.valid, false);
  assert.equal(result.status, 'mismatch');
  assert.equal(result.code, 'DOCUMENT_TYPE_MISMATCH');
  assert.equal(result.expectedDocumentType, 'pan');
  assert.equal(result.detectedDocumentType, 'aadhaar');
  assert.equal(JSON.stringify(result).includes('Unique Identification Authority'), false);
});

test('accepts a type match but labels the scope as document-type-only', async () => {
  const service = createDocumentVerificationService({
    ocrProvider: { recognize: async () => ({ text: 'INCOME TAX DEPARTMENT\nABCDE1234F\nPermanent Account Number' }) },
  });
  const result = await service.verify({ file: pdfFile(), expectedDocumentType: 'pan' });
  assert.equal(result.valid, true);
  assert.equal(result.verificationLevel, 'document_type_only');
});

test('rejects unsupported MIME types and MIME spoofing before OCR', () => {
  assert.throws(() => assertSupportedFile({
    buffer: Buffer.from('<html>not a pdf</html>'),
    size: 22,
    mimetype: 'application/pdf',
  }), { code: 'FILE_CONTENT_MISMATCH' });
  assert.throws(() => assertSupportedFile({
    buffer: Buffer.from('plain text'),
    size: 10,
    mimetype: 'text/plain',
  }), { code: 'UNSUPPORTED_FILE_TYPE' });
});

test('OCR.Space adapter sends multipart input and returns OCR text without logging it', async () => {
  let request;
  const provider = createOcrSpaceProvider({
    env: { OCR_SPACE_API_KEY: 'test-key', OCR_SPACE_ENGINE: '3' },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        headers: { get: () => '80' },
        text: async () => JSON.stringify({ ParsedResults: [{ ParsedText: 'INCOME TAX DEPARTMENT ABCDE1234F' }] }),
      };
    },
  });

  const result = await provider.recognize({
    buffer: pdfFile().buffer,
    mimeType: 'application/pdf',
    filename: 'upload.pdf',
  });
  assert.equal(result.provider, 'ocr.space');
  assert.match(result.text, /ABCDE1234F/);
  assert.equal(request.url, 'https://api.ocr.space/parse/image');
  assert.equal(request.options.headers.apikey, 'test-key');
  assert.equal(request.options.body.get('OCREngine'), '3');
  assert.equal(request.options.body.get('language'), 'auto');
  assert.equal(request.options.body.get('file').name, 'upload.pdf');
  assert.equal(request.options.body.get('scale'), 'true');
});

test('OCR.Space adapter fails clearly when the API key is still a placeholder', async () => {
  const provider = createOcrSpaceProvider({ env: { OCR_SPACE_API_KEY: 'replace_with_your_ocr_space_api_key' } });
  await assert.rejects(provider.recognize({
    buffer: pdfFile().buffer,
    mimeType: 'application/pdf',
    filename: 'upload.pdf',
  }), { code: 'OCR_NOT_CONFIGURED', statusCode: 503 });
});
