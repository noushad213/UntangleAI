import { getCachedDoc, storeDocInDb } from "./dbCache.js";

// 1. Dynamic Task & Civic Department Analyzer
function analyzeCivicIntent(queryText = "") {
  const q = queryText.toLowerCase();

  if (q.includes("water") || q.includes("pipeline") || q.includes("meter") || q.includes("jal")) {
    return {
      category: "WATER_SUPPLY",
      targetDesignation: "The Executive Engineer (Hydraulic / Water Supply Dept)",
      subjectLine: "Application for New Municipal Water Connection & Pipeline Inspection",
      legalActRef: "Municipal Water Supply Bylaws & Public Health Drainage Regulations",
      mandatoryEnclosures: [
        "Proof of Ownership / Registered Lease Deed",
        "Sanctioned Building Layout & Plumbing Route Blueprint",
        "Current Property Assessment Tax Clearance",
        "Plumber License Certificate / Work Estimation Note"
      ]
    };
  }

  if (q.includes("trade") || q.includes("license") || q.includes("shop") || q.includes("cafe") || q.includes("restaurant")) {
    return {
      category: "TRADE_LICENSE",
      targetDesignation: "The Senior Health Officer / Licensing Inspector",
      subjectLine: "Application for Grant of Municipal Trade / Health License",
      legalActRef: "Shops & Commercial Establishments Act & Municipal Health Bylaws",
      mandatoryEnclosures: [
        "Proof of Legal Premise Possession",
        "Site Floor Blueprint with Fire Equipment Layout",
        "Property Tax Up-to-date Receipt",
        "Partnership Deed / Incorporation Certificate (if applicable)"
      ]
    };
  }

  if (q.includes("tax") || q.includes("assessment") || q.includes("mutation") || q.includes("property")) {
    return {
      category: "PROPERTY_TAX",
      targetDesignation: "The Assessor & Collector of Municipal Taxes",
      subjectLine: "Application for Property Tax Assessment & Khata / Mutation Transfer",
      legalActRef: "Municipal Corporation Assessment and Collection Regulations",
      mandatoryEnclosures: [
        "Registered Sale Deed / Title Documents",
        "Previous Property Tax Bill & Payment Receipt",
        "Occupancy Certificate (OC) / Building Completion Copy",
        "Indemnity Bond & Identity Proof"
      ]
    };
  }

  // Default General Civic Request
  return {
    category: "GENERAL_CIVIC",
    targetDesignation: "The Ward Executive Officer / Assistant Commissioner",
    subjectLine: `Application Regarding Civic Services - ${queryText}`,
    legalActRef: "Right to Public Services Act & Municipal Civic Charter",
    mandatoryEnclosures: [
      "Applicant Photo Identity & Address Proof",
      "Site Location Landmark Plan",
      "Self-Declaration Undertaking"
    ]
  };
}

// 2. Dynamic Live Municipal Authority Resolver (External Live Search)
async function fetchLiveCivicAuthority(locationText) {
  const encoded = encodeURIComponent(`${locationText.trim()}, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&countrycodes=in&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "UntangleAI-CivicDocGenerator/2.0" }
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const place = data[0];
      const addr = place.address || {};
      const city = addr.city || addr.town || addr.city_district || addr.county || "Municipal Region";
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || city;
      const state = addr.state || "India";

      return {
        officeName: `${city} Municipal Corporation (${suburb} Administrative Division)`,
        address: place.display_name,
        city,
        suburb,
        state
      };
    }
  } catch (err) {
    console.error("Live lookup failed, using input location:", err.message);
  }

  return {
    officeName: `${locationText} Municipal Council Office`,
    address: `${locationText}, India`,
    city: locationText,
    suburb: locationText,
    state: "India"
  };
}

// 3. Dynamic Template Builder
function buildOfficialLetter(userData, civicOffice, taskInfo) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return `
FORMAL MUNICIPAL APPLICATION LETTER
(Generated for submission at Citizen Facilitation Center / CFC Desk)

Date: ${currentDate}
Location: ${civicOffice.city}, ${civicOffice.state}

To,
${taskInfo.targetDesignation},
${civicOffice.officeName},
${civicOffice.address}

Subject: ${taskInfo.subjectLine}
Reference: Governed under ${taskInfo.legalActRef}

Respected Sir/Madam,

I, ${userData.applicantName || "Applicant"}, residing at ${userData.residentialAddress || "Residential Address"} (Contact: ${userData.contactPhone || "N/A"}), hereby formally submit this application regarding our premise located within your municipal jurisdiction:

ESTABLISHMENT / PROPERTY DETAILS:
- Premise Address: ${userData.premisesAddress || "Premises Address"}
- Locality / Suburb: ${civicOffice.suburb}
- Municipal Jurisdiction: ${civicOffice.officeName}
- Specific Requirement: ${userData.specificQuery || taskInfo.subjectLine}

STATEMENT OF UNDERTAKING:
1. The applicant agrees to abide by all the conditions stipulated under the ${taskInfo.legalActRef}.
2. The site is open for physical inspection by the Municipal Junior Engineer / Authorized Inspector during working hours.
3. All attached documents have been self-attested and represent genuine legal records.

LIST OF ENCLOSED DOCUMENTS:
${taskInfo.mandatoryEnclosures.map((doc, idx) => `  ${idx + 1}.${doc}`).join("\n")}

Kindly verify the enclosed records, register this application under the Citizen Service Charter SLA, and issue the inspection schedule date.

Yours faithfully,

_________________________________
Signature of Applicant: ${userData.applicantName || "Applicant"}
Mobile: ${userData.contactPhone || "N/A"}
`.trim();
}

// 4. Main Exported Function (Search -> DB Store -> Cache Return)
export async function getOrGenerateCivicDoc(userData = {}) {
  const userQuery = userData.specificQuery || "Water Connection";
  const userLoc = userData.location || userData.city || "Mumbai";
  const cacheKey = `${userQuery}__${userLoc}`;

  // Step A: Check DB / Cache
  const cachedResult = getCachedDoc(cacheKey);
  if (cachedResult.hit) {
    return {
      source: "DATABASE_CACHE",
      message: "Fetched instantly from local DB cache without external network call.",
      ...cachedResult.data
    };
  }

  // Step B: Task Extraction + Live External Search
  const taskInfo = analyzeCivicIntent(userQuery);
  const civicOffice = await fetchLiveCivicAuthority(userLoc);

  // Step C: Format specific document
  const generatedLetter = buildOfficialLetter(userData, civicOffice, taskInfo);

  const finalPayload = {
    taskCategory: taskInfo.category,
    designatedAuthority: taskInfo.targetDesignation,
    civicOffice,
    officialLetterText: generatedLetter
  };

  // Step D: Store in DB for future queries
  storeDocInDb(cacheKey, finalPayload);

  return {
    source: "LIVE_SEARCH_AND_GENERATED",
    message: "Searched live, tailored to specific municipal authority, and saved to DB.",
    ...finalPayload
  };
}