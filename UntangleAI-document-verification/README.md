# UntangleAI document-type verification feature

This is a separate, drop-in backend feature folder. It does not modify the
Noushad branch or the cloned project. It adds a multipart endpoint that OCRs a
PDF/JPEG/PNG and compares the detected document type with the expected field.

## Behavior

- `POST /api/documents/verify`, multipart fields: `document`, `expectedDocumentType`, and `consentToThirdPartyOcr=true`.
- An Aadhaar upload in a PAN field returns HTTP `422` with `DOCUMENT_TYPE_MISMATCH`.
- Low-confidence or ambiguous OCR returns HTTP `422` with `DOCUMENT_TYPE_UNCLEAR`.
- A type match returns `verificationLevel: "document_type_only"`.
- Files are held in memory for the request. No OCR text or document image is returned, logged, or stored by this module.
- The OCR provider is OCR.Space. It receives the document bytes, so use the route only after getting user consent and reviewing your privacy requirements. OCR text matching checks the document type, not authenticity, tampering, ownership, or validity of the document.

The provider supports multipart file/PDF input, an API key in the `apikey`
header, automatic language detection with Engine 3, and the documented endpoint
[`https://api.ocr.space/parse/image`](https://ocr.space/ocrapi). Register for a
free API key at [OCR.Space](https://ocr.space/ocrapi/freekey); free-plan quotas
and service terms can change. The `.env.example` value is only a placeholder.

## Integrate into the backend

1. Copy this feature's `src` directory into `backend/src/features/document-verification`.
2. Install Multer in the backend: `npm install multer`.
3. Copy the variables in `.env.example` into `backend/.env` and set a real `OCR_SPACE_API_KEY`.
4. Mount the route in `backend/src/app.js`:

   ```js
   const { createDocumentVerificationRouter } = require("./features/document-verification/routes/document-verification.routes");
   app.use("/api/documents", createDocumentVerificationRouter({
     // Load and authorize a workflow requirement on the server, then return
     // its expected document type. Do not trust a browser-selected type.
     resolveExpectedDocumentType: (req) => documentRequirementService.getExpectedType(req),
   }));
   ```

5. Submit a `multipart/form-data` request to `/api/documents/verify`. The route
   uses the server-side resolver above to get the expected type from the selected
   workflow requirement. The body field `expectedDocumentType` is only a
   standalone/demo fallback and must not be trusted in production.

For example, send `expectedDocumentType=pan`, `consentToThirdPartyOcr=true`,
and a PDF/image part named `document`. The service supports `pan`, `aadhaar`,
`passport`, `driving_license`, `voter_id`, `domicile_certificate`,
`birth_certificate`, and `income_certificate` labels. The type detector is
deliberately conservative: unclear or conflicting OCR signals fail closed.

## Local tests

Run `npm test` in this folder. Tests use mocked OCR responses and do not need an
API key or send documents to OCR.Space.

## Integration contract

```json
{
  "valid": false,
  "status": "mismatch",
  "code": "DOCUMENT_TYPE_MISMATCH",
  "expectedDocumentType": "pan",
  "detectedDocumentType": "aadhaar",
  "confidence": 0.98,
  "message": "This upload appears to be aadhaar, but pan is expected. Upload the correct document."
}
```

The OCR provider is injectable through `createDocumentVerificationService({
ocrProvider })`, which allows a future local Tesseract adapter without changing
the route/controller contract.
