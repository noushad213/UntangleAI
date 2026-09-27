export function getSelfDeclarationTemplate(data, civicInfo) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return `
SELF-DECLARATION UNDERTAKING
(To be submitted to Civic Facilitation Center / Municipal Ward Office)

Date: ${currentDate}
Location: ${civicInfo.city || "Mumbai"}, ${civicInfo.state || "Maharashtra"}

To,
The Ward Executive Officer / Assistant Commissioner,
${civicInfo.officeName || "Local Municipal Ward Office"},
${civicInfo.address || "Municipal Administrative Building"}

Subject: Self-declaration undertaking for ${data.purpose || "Trade License / Premise Registration"}

I, ${data.applicantName}, son/daughter/partner of ${data.guardianOrEntity || "N/A"}, aged about ${data.age || "Adult"} years, residing at:
Permanent/Residential Address: ${data.residentialAddress}
Contact: ${data.contactPhone || "N/A"} | Email: ${data.contactEmail || "N/A"}

Do hereby solemnly affirm and state as follows:

1. APPLICATION DETAILS:
   I am the applicant operating/proposing the activity named "${data.entityName || "Commercial Unit"}" situated at:
   Site Address: ${data.premisesAddress}
   Ward / Jurisdiction: ${civicInfo.suburb || data.area || "Local Area"}
   Pincode: ${data.pincode || "N/A"}

2. COMPLIANCE & UNDERTAKINGS:
   a) The establishment premises strictly follow municipal building safety, public hygiene, and local bylaws.
   b) No illegal construction, unauthorized shed, or civic right-of-way encroachment exists on the establishment site.
   c) All requisite property taxes / assessment charges for the property are cleared without arrears.
   d) I undertake sole responsibility for the authenticity of the submitted identity and premise records.

3. INDEMNITY:
   I shall indemnify and keep indemnified the Municipal Corporation against any loss, legal claim, or dispute arising out of any misleading information furnished by me.

Deponent / Applicant Signature: ___________________________
Name: ${data.applicantName}
Designation: ${data.applicantDesignation || "Proprietor / Authorized Signatory"}
Place: ${civicInfo.city || "Mumbai"}
`.trim();
}