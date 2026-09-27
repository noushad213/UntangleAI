import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeLiveCivicService } from "./liveExtractor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DB_PATH = path.join(__dirname, "civicFormsDatabase.json");

function readCache() {
  if (!fs.existsSync(CACHE_DB_PATH)) {
    fs.writeFileSync(CACHE_DB_PATH, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(key, data) {
  const cache = readCache();
  cache[key.toLowerCase().trim()] = {
    ...data,
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(CACHE_DB_PATH, JSON.stringify(cache, null, 2));
}

// 1. Live Geocoding
async function resolveLocationLive(locationText) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText + ", India")}&format=json&addressdetails=1&countrycodes=in&limit=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "UntangleAI-CivicPortal/4.0" } });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const place = data[0];
      const addr = place.address || {};
      const city = addr.city || addr.town || addr.city_district || addr.county || "City Corporation";
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || city;
      const state = addr.state || "India";

      return {
        officeName: `${city} Municipal Corporation`,
        administrativeZone: `${suburb} Administrative Division`,
        address: place.display_name,
        city,
        suburb,
        state,
        pincode: addr.postcode || "N/A"
      };
    }
  } catch (err) {
    console.error("Geocoding notice:", err.message);
  }

  return {
    officeName: `${locationText} Municipal Corporation`,
    administrativeZone: `${locationText} Zone`,
    address: `${locationText}, India`,
    city: locationText,
    suburb: locationText,
    state: "India",
    pincode: "N/A"
  };
}

// 2. City Helplines & Counters Directory
function getHelplineDetails(city = "") {
  const c = city.toLowerCase();
  if (c.includes("mumbai") || c.includes("thane")) {
    return {
      phone: "1916 (BMC 24x7 Helpline) / 1800-22-1234",
      whatsapp: "+91 93245 00500",
      counter: "Citizen Facilitation Center (CFC), Ground Floor",
      timings: "10:00 AM - 04:30 PM (Mon-Sat)"
    };
  }
  if (c.includes("pune") || c.includes("pimpr")) {
    return {
      phone: "1800-1030-222 / 020-25501000 (PMC Care)",
      whatsapp: "+91 88882 51000",
      counter: "PMC Citizen Facilitation Counter / Ward Office",
      timings: "10:30 AM - 05:00 PM (Working Days)"
    };
  }
  if (c.includes("bengaluru") || c.includes("bangalore")) {
    return {
      phone: "1533 / 080-22660000 (BBMP Control Room)",
      whatsapp: "+91 94806 85700",
      counter: "BBMP Citizen Helpdesk / ARO Office",
      timings: "09:30 AM - 04:30 PM"
    };
  }
  if (c.includes("delhi")) {
    return {
      phone: "155305 (MCD Central Helpline)",
      whatsapp: "+91 98114 49576",
      counter: "MCD Zonal Citizen Service Center",
      timings: "10:00 AM - 04:00 PM"
    };
  }
  return {
    phone: "1913 (Urban Civic Helpline) / 112",
    whatsapp: "N/A",
    counter: "Local Municipal Corporation / Nagar Palika Public Desk",
    timings: "10:00 AM - 05:00 PM"
  };
}

// 3. Dynamic Authority & SLA Resolution
function getDepartmentAndSla(query) {
  const q = query.toLowerCase();
  if (q.includes("water") || q.includes("paani") || q.includes("pipeline") || q.includes("meter")) {
    return {
      requiresForm: true,
      department: "Hydraulic Engineering & Water Supply Department",
      officer: "The Executive Engineer (Water Supply)",
      sla: "15 Working Days",
      fee: "₹1,500 - ₹3,500 (Scrutiny + Meter Deposit)"
    };
  }
  if (q.includes("trade") || q.includes("shop") || q.includes("cafe") || q.includes("license")) {
    return {
      requiresForm: true,
      department: "Public Health & Commercial Licensing Department",
      officer: "The Senior Health Inspector / Ward License Officer",
      sla: "30 Working Days",
      fee: "Based on Carpet Area & Power Load (HP)"
    };
  }
  if (q.includes("tax") || q.includes("mutation") || q.includes("khata") || q.includes("property")) {
    return {
      requiresForm: true,
      department: "Assessment & Collection Department (Revenue)",
      officer: "The Assessor & Collector of Municipal Taxes",
      sla: "21 Working Days",
      fee: "₹500 Application Fee + Transfer Cess"
    };
  }
  if (q.includes("tree") || q.includes("cut") || q.includes("branch")) {
    return {
      requiresForm: true,
      department: "Tree Authority & Garden Department",
      officer: "The Tree Officer & Superintendent of Gardens",
      sla: "15 Working Days",
      fee: "₹500 Inspection Charge"
    };
  }

  // General inquiry
  return {
    requiresForm: false,
    department: "Citizen Facilitation Center (CFC) / Public Helpdesk",
    officer: "The Public Relations Officer / Ward Assistance Desk",
    sla: "Immediate on Call / 24-48 Hours at Helpdesk",
    fee: "Free (No fee for inquiry)"
  };
}

// 4. Master Generator
export async function generateCivicForm({ query, location, applicantDetails = {} }) {
  if (!query || !location) {
    throw new Error("Both query and location are required.");
  }

  const cacheKey = `${query.trim()}__${location.trim()}`.toLowerCase();
  const dbData = readCache();

  // Instant Cache Hit
  if (dbData[cacheKey]) {
    return {
      status: "SUCCESS",
      source: "DATABASE_CACHE",
      ...dbData[cacheKey]
    };
  }

  // 1. Live Geocoding
  const civicOffice = await resolveLocationLive(location);

  // 2. Live Web Scraped Form & Checklist Metadata
  const liveScraped = await scrapeLiveCivicService(query, civicOffice);

  // 3. Dept, SLA & Helpline Details
  const deptInfo = getDepartmentAndSla(query);
  const helpdesk = getHelplineDetails(civicOffice.city);

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  let printableFormDraft = null;

  if (deptInfo.requiresForm) {
    printableFormDraft = `
================================================================================
          ${civicOffice.officeName.toUpperCase()}
       ${civicOffice.administrativeZone.toUpperCase()}
--------------------------------------------------------------------------------
OFFICIAL SUBMISSION APPLICATION / COVER LETTER
Subject Reference: ${liveScraped.serviceTitle}
Live Official Form Source: ${liveScraped.directFormLink}
================================================================================

Date of Submission : ${currentDate}
Official Counter   : Citizen Facilitation Center (CFC Desk)
Estimated SLA      : ${deptInfo.sla}
Statutory Fees     : ${deptInfo.fee}

To,
${deptInfo.officer},
${civicOffice.officeName},
${civicOffice.address}

Sir/Madam,

I, ${applicantDetails.name || "___________________________________________"}, residing at 
${applicantDetails.address || "___________________________________________"} (Contact: ${applicantDetails.phone || "__________________"}), 
hereby formally submit our application regarding premises situated at:
Premise Location: ${applicantDetails.premiseAddress || location}, Suburb: ${civicOffice.suburb}.

I have enclosed the mandatory documents required as per current municipal regulations:

ENCLOSED MANDATORY ATTACHMENTS (Self-Attested Copies):
--------------------------------------------------------------------------------
${liveScraped.extractedDocuments.map((doc, idx) => `[  ] ${idx + 1}.${doc}`).join("\n")}

SOLEMN UNDERTAKING:
1. All particulars and enclosed documents are authentic and legally compliant.
2. I undertake to permit entry to the Municipal Field Inspector for physical site inspection during working hours.

Applicant Signature : _________________________________
Date                : ${currentDate}
Place               : ${civicOffice.city}
================================================================================
`.trim();
  }

  const finalPayload = {
    requiresForm: deptInfo.requiresForm,
    serviceTitle: liveScraped.serviceTitle,
    officialPortalLink: liveScraped.directFormLink,
    generalPortal: liveScraped.officialPortal,
    departmentAssigned: deptInfo.department,
    designatedOfficer: deptInfo.officer,
    statutoryTimeline: deptInfo.sla,
    estimatedFee: deptInfo.fee,
    helplinePhone: helpdesk.phone,
    whatsappBot: helpdesk.whatsapp,
    helpdeskDesk: helpdesk.counter,
    workingHours: helpdesk.timings,
    resolvedCivicOffice: civicOffice,
    requiredChecklist: liveScraped.extractedDocuments,
    printableFormDraft
  };

  // Cache result in DB
  writeCache(cacheKey, finalPayload);

  return {
    status: "SUCCESS",
    source: "LIVE_SCRAPED_AND_SAVED_TO_DB",
    ...finalPayload
  };
}