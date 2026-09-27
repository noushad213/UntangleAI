export function getLandlordNocTemplate(data, civicInfo) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return `
NO OBJECTION CERTIFICATE (NOC) FROM PROPERTY OWNER
(For Municipal Commercial / Civic Licensing)

Date: ${currentDate}

To Whomsoever It May Concern,

I, ${data.ownerName}, residing at ${data.ownerAddress}, being the lawful owner of the commercial property specified below:

PROPERTY PARTICULARS:
Property / Unit No: ${data.unitNumber || "Premise Unit"}
Building / Compound: ${data.buildingName || data.premisesAddress}
Area / Locality: ${civicInfo.suburb || data.area || "Local Ward"}
City: ${civicInfo.city || "Mumbai"} - ${data.pincode || ""}

DO HEREBY CONFIRM AND DECLARE:

1. That I have leased / rented out the aforesaid premises to Mr./Ms./M/s ${data.applicantName} ("Tenant / Applicant") via an executed agreement.
2. I have NO OBJECTION to the applicant applying for and obtaining relevant civic permissions, trade licenses, electricity load sanctions, or water connection utilities in the name of "${data.entityName || "Business Unit"}" from ${civicInfo.officeName || "the local Municipal Corporation"}.
3. The proposed trade/utility activity does not violate any residential welfare bylaws or registered lease restrictions.

Property Owner Signature: ___________________________
Owner Name: ${data.ownerName}
Contact Phone: ${data.ownerPhone || "N/A"}
Identity Proof Enclosed: ${data.ownerIdType || "Aadhaar / PAN Copy"}
`.trim();
}