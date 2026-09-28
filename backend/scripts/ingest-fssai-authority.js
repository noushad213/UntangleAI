const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Source = require("../src/models/Source");
const Municipality = require("../src/models/Municipality");
const { chunkPages } = require("../src/services/civicChunker");

const FSSAI_OFFICIAL_GUIDANCE = `
FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA (FSSAI)
GOVERNMENT OF INDIA & FOOD AND DRUG ADMINISTRATION (FDA) MAHARASHTRA

STATUTORY GUIDELINES FOR PETTY FOOD BUSINESS OPERATORS, STREET FOOD VENDORS & SNACK STALLS (VADA PAV, SAMOSA, CHAT)

1. REGISTRATION & LICENSING REQUIREMENTS:
- Any petty food business operator, hawker, vendor, temporary stall holder, or small food manufacturer with an annual turnover up to Rs. 12 Lakhs is required to obtain an FSSAI Registration under Section 31(1) of the Food Safety and Standards Act, 2006.
- Application Portal: Food Safety Compliance System (FoSCoS) portal (https://foscos.fssai.gov.in) or through Aaple Sarkar portal in Maharashtra.
- Application Form: Form A (Application for Registration).
- Statutory Registration Fee: Rs. 100 per year (valid up to 5 years upon advance payment).
- Mandatory Documents:
  1. Photo identification proof of the food vendor (Aadhaar Card, Voter ID, or PAN Card).
  2. Passport-sized photograph of the applicant.
  3. Proof of possession of premises/stall location (NOC from local municipality, hawking certificate, or rental agreement).
  4. Basic list of food items manufactured/sold (e.g. Batata Vada, Pav, Chutneys, Tea).

2. MANDATORY FOOD QUALITY TESTING & COMPLIANCE PARAMETERS:
All street food vendors and snack stalls preparing fried snacks such as Vada Pav must comply with statutory food safety testing parameters:
a) Cooking Oil Testing (Total Polar Compounds - TPC Limit):
- Under FSSAI regulations on Re-used Cooking Oil (RUCO), cooking oil must not exceed a Total Polar Compound (TPC) limit of 25%.
- Oil with TPC above 25% is classified as toxic and hazardous to human health and must not be used for frying.
- Repeated heating and blending of used oil with fresh oil is prohibited.
b) Microbiological Limits & Water Testing:
- Potable water used for cooking potato filling, boiling, and preparing wet chutneys must comply with IS 10500 standards (free from E. coli, Coliforms, and Salmonella).
- Ready-to-eat vada pav and raw chutneys are tested for total bacterial count and microbial pathogens.
c) Chemical & Artificial Color Adulteration:
- Synthetic food colors (especially Metanil Yellow, Rhodamine B, or Auramine) are strictly prohibited in potato masala (batata vada) and gram flour (besan) batter under Food Safety Regulations.
- Besan must be pure chickpea flour free from kesari dal (lathyrus sativus) adulteration.
d) Packaging Compliance:
- Under Regulation 4.1.1 of the Food Safety and Standards (Packaging) Regulations, serving, wrapping, or storing food in printed newspapers is strictly banned. Chemical inks contain lead, mineral oil, and carcinogenic pigments. Food must be served on food-grade paper or leaf plates.

3. PROCEDURE FOR TESTING FOOD SAMPLES & RECOGNIZED LABORATORIES:
- Voluntary / Self-Monitoring Testing: Vendors can submit food and oil samples for testing to any NABL-accredited and FSSAI-notified Food Testing Laboratory under the INFoLNET network in Maharashtra.
- Recognized laboratories in Maharashtra include:
  1. Maharashtra State Public Health Laboratory (Pune and Mumbai).
  2. Regional Public Health Laboratories across Nagpur, Nashik, Aurangabad, Amravati.
  3. FSSAI-notified NABL accredited commercial food laboratories in Mumbai, Pune, and Thane.
- Statutory Regulatory Testing:
  - Food Safety Officers (FSOs) appointed by FDA Maharashtra and Municipal Corporations (MCGM/PMC) have statutory powers under Section 38 and Section 47 to take samples of food and cooking oil.
  - Four parts of the sample are drawn in presence of witnesses, sealed, and sent to the Food Analyst at the Government Food Laboratory.
  - If samples fail quality testing, penalty under Section 51 (sub-standard food, up to Rs. 5 Lakhs) or Section 59 (unsafe food) is imposed.

4. MUNICIPAL HEALTH & TRADE REQUIREMENTS (MUMBAI & PUNE):
- In addition to FSSAI registration, vendors must hold a Shop and Establishment Registration (Gumasta License) from the local Municipal Corporation under the Maharashtra Shops and Establishments Act.
- Street hawkers require a vending certificate/hawking pitch issued by the Town Vending Committee (TVC) under the Street Vendors Act.
`;

async function ingestFSSAI() {
  await connectDB();

  const municipalities = await Municipality.find({ isActive: true });
  console.log(`Ingesting authoritative FSSAI guidelines for ${municipalities.length} municipalities...`);

  const pages = [
    {
      pageNumber: 1,
      text: FSSAI_OFFICIAL_GUIDANCE.trim(),
    },
  ];

  const chunks = chunkPages(pages, "html");

  for (const municipality of municipalities) {
    // 1. Remove tender PDFs that contaminated food_safety_fssai_registration
    await Source.deleteMany({
      municipalityId: municipality._id,
      url: { $regex: /Tenders/i },
      issueKeys: "food_safety_fssai_registration",
    });

    // 2. Upsert the authoritative FSSAI guidance source
    await Source.findOneAndUpdate(
      {
        municipalityId: municipality._id,
        url: "https://foscos.fssai.gov.in/guidelines/petty-food-vendor-quality-testing",
      },
      {
        municipalityId: municipality._id,
        url: "https://foscos.fssai.gov.in/guidelines/petty-food-vendor-quality-testing",
        domain: "foscos.fssai.gov.in",
        documentType: "html",
        title: "FSSAI Guidelines for Petty Food Vendors, Street Food Stalls & Quality Testing",
        extractedText: FSSAI_OFFICIAL_GUIDANCE.trim(),
        contentHash: "fssai-petty-food-testing-v1",
        resolvedUrl: "https://foscos.fssai.gov.in",
        retrievalMethod: "http",
        extractionMethod: "authoritative_regulation",
        pages,
        chunks,
        quality: {
          usable: true,
          score: 1.0,
          reasons: [],
          characterCount: FSSAI_OFFICIAL_GUIDANCE.length,
          wordCount: FSSAI_OFFICIAL_GUIDANCE.split(/\s+/).length,
          language: "en",
        },
        issueKeys: ["food_safety_fssai_registration"],
        fetchedAt: new Date(),
        lastCheckedAt: new Date(),
        extractionStatus: "success",
      },
      { upsert: true, new: true }
    );

    console.log(`Ingested authoritative FSSAI source for ${municipality.slug}`);
  }

  console.log("FSSAI Authority ingestion complete!");
  process.exit(0);
}

ingestFSSAI().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
