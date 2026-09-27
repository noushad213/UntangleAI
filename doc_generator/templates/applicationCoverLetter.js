export function getCoverLetterTemplate(data, civicInfo) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return `
FORMAL CIVIC APPLICATION COVERING LETTER

Date: ${currentDate}

To,
The Ward Officer / Designated Officer,
${civicInfo.officeName || "Municipal Corporation Ward Office"},
${civicInfo.address || "City Office"}

Subject: Submission of Application for ${data.purpose || "Civic Clearance / Trade Registration"}

Respected Sir/Madam,

I am formally submitting our application dossier for "${data.entityName || data.applicantName}" located at:
${data.premisesAddress}, ${civicInfo.suburb || ""}, ${civicInfo.city || ""}.

List of Enclosed Records:
1. Proof of Legal Possession / Registered Agreement
2. Property Tax Clearance Receipt
3. Prescribed Self-Declaration & Indemnity Undertaking
4. Applicant Identity (PAN / Aadhaar Copy)
${data.additionalDocuments ? data.additionalDocuments.map((doc, idx) => `${idx + 5}.${doc}`).join("\n") : "5. Site Layout Blueprint Plan"}

Kindly verify the enclosed documents, issue the application acknowledgment token, and advise on the scheduled Junior Engineer site inspection.

Yours faithfully,

___________________________
${data.applicantName}
Authorized Signatory / Applicant
Contact: ${data.contactPhone || "N/A"}
`.trim();
}