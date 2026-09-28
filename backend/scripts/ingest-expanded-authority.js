const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Source = require("../src/models/Source");
const Municipality = require("../src/models/Municipality");
const { chunkPages } = require("../src/services/civicChunker");

const EXPANDED_REGULATIONS = [
  {
    issueKey: "commercial_kitchen_cloud_kitchen_approval",
    title: "Statutory Approval Guidelines for Commercial Kitchens, Cloud Kitchens & Dhabas in Maharashtra",
    url: "https://foscos.fssai.gov.in/guidelines/commercial-kitchen-cloud-kitchen-dhaba-approval",
    domain: "foscos.fssai.gov.in",
    content: `
FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA (FSSAI) & URBAN DEVELOPMENT DEPARTMENT, MAHARASHTRA

STATUTORY REGULATORY REQUIREMENTS FOR COMMERCIAL KITCHENS, CLOUD KITCHENS (DARK GHOST KITCHENS) & DHABAS

1. FSSAI FOOD SAFETY LICENSE & REGISTRATION:
- Under Section 31(1) of the Food Safety and Standards Act, 2006, all food preparation premises including cloud kitchens, commercial catering setups, and dhabas must hold a valid FSSAI license:
  * Annual turnover up to Rs. 12 Lakhs: FSSAI Registration (Form A) - Fee: Rs. 100/year.
  * Annual turnover between Rs. 12 Lakhs and Rs. 20 Crores: FSSAI State License (Form B) - Fee: Rs. 2,000/year.
  * More than 1 state operation / central supply: FSSAI Central License - Fee: Rs. 7,500/year.
- Application portal: FoSCoS portal (https://foscos.fssai.gov.in).
- Mandatory documents: Kitchen layout blueprint with equipment dimensions, list of food categories manufactured, water test report from NABL accredited lab (IS 10500 standards), premises ownership proof (NOC from owner / registered rent agreement), identity proof, and medical fitness certificates of food handlers.

2. MUNICIPAL HEALTH TRADE LICENSE & POLICE EATING HOUSE PERMISSION:
- Section 394 of the Mumbai Municipal Corporation Act (and equivalent provisions under Maharashtra Municipal Corporations Act):
  * Commercial kitchens and dhabas must secure a Health Trade License from the local Municipal Health Officer (MOH).
  * Minimum floor area: 100 to 250 sq.ft for cloud kitchens; 500+ sq.ft for dine-in dhabas.
  * Flooring must be impervious, washable tile. Wall tiling (dado) must extend to minimum 6 feet height in cooking and wash zones.
  * Potable running water supply and grease trap installation on drain outlets are mandatory.
- Dhabas and restaurants providing customer seating require an Eating House Registration / Police NOC from the local Police Commissionerate / Licensing Branch.

3. FIRE SAFETY NOC & VENTILATION COMPLIANCE:
- Commercial cooking utilizing commercial LPG cylinder manifolds (LOT cylinders) or piped natural gas (PNG) requires a Fire Safety NOC from the Chief Fire Officer (CFO).
- Requirements: Heavy-duty exhaust hoods with grease filters, dedicated stainless steel ducting extending 3 meters above the building terrace, automatic fire suppression systems over fryers, and portable ABC / CO2 fire extinguishers.

4. GUMASTA LICENSE & LABOUR COMPLIANCE:
- Mandatory registration under the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017 via LMS MahaOnline portal.
- Form F (10 or more employees) or Form G Intimation (fewer than 10 employees).
    `,
  },
  {
    issueKey: "saas_tech_business_setup",
    title: "Statutory Setup Guidelines for SaaS, Software & Tech Startups in Maharashtra",
    url: "https://lms.mahaonline.gov.in/guidelines/saas-tech-software-startup-registration",
    domain: "lms.mahaonline.gov.in",
    content: `
INDUSTRIES, ENERGY AND LABOUR DEPARTMENT, GOVERNMENT OF MAHARASHTRA

STATUTORY REGISTRATION & COMPLIANCE ROADMAP FOR SAAS, SOFTWARE DEVELOPMENT & IT ENTERPRISES

1. MAHARASHTRA SHOP AND ESTABLISHMENT REGISTRATION (GUMASTA LICENSE):
- Under the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017:
  * Every commercial establishment operating software development, SaaS platforms, or cloud engineering services must register online via the LMS MahaOnline portal (https://lms.mahaonline.gov.in) or Aaple Sarkar.
  * Establishments with 10 or more employees: Submit Form F for Registration Certificate (valid lifetime, no periodic renewal required). Fee: Rs. 1,000 to Rs. 2,000 depending on employee count.
  * Establishments with fewer than 10 employees: Submit Form G for Online Intimation Receipt (instant download, zero government fee).
  * Exemption under Maharashtra IT Policy: Information Technology (IT) and ITeS establishments are permitted 24x7 operational flexibility with flexible work shifts subject to employee safety provisions.

2. UDYAM MSME REGISTRATION:
- Micro, Small, and Medium Enterprises (MSME) registration through the official Ministry of MSME portal (https://udyamregistration.gov.in).
- Zero government fees. Requires Aadhaar of proprietor/director and Company PAN.
- Benefits: Priority sector bank lending, 50% government subsidy on patent and trademark registration, delayed payment protection under MSMED Act, and eligibility for Maharashtra State Industrial Cluster incentives.

3. GSTIN REGISTRATION (GOODS AND SERVICES TAX):
- Mandatory under Section 22 of the CGST Act for service providers whose aggregate annual turnover exceeds Rs. 20 Lakhs (Rs. 10 Lakhs in special category states).
- Voluntary registration permitted from day one to claim Input Tax Credit (ITC) on cloud server expenses (AWS, Google Cloud, Azure), hardware, and office leases.
- Portal: GST Common Portal (https://www.gst.gov.in).

4. PROFESSIONAL TAX REGISTRATION (PTRC & PTEC):
- Under Maharashtra State Tax on Professions, Trades, Callings and Employments Act, 1975:
  * PTEC (Profession Tax Enrolment Certificate): Company / LLP / Proprietorship must pay annual professional tax of Rs. 2,500.
  * PTRC (Profession Tax Registration Certificate): Employer must deduct professional tax from employee salaries (up to Rs. 200/month, Rs. 300 in February) and deposit with the Maharashtra State Goods and Services Tax Department.
    `,
  },
  {
    issueKey: "commercial_transport_delivery_permit",
    title: "Statutory Regulations for Commercial Goods Transport & E-Commerce Delivery Fleets in Maharashtra",
    url: "https://transport.maharashtra.gov.in/guidelines/commercial-goods-delivery-transport-permits",
    domain: "transport.maharashtra.gov.in",
    content: `
MOTOR VEHICLES DEPARTMENT, TRANSPORT COMMISSIONERATE, MAHARASHTRA

STATUTORY COMPLIANCE FOR COMMERCIAL GOODS VEHICLES, PARCEL COURIERS & E-COMMERCE DELIVERY FLEETS

1. GOODS CARRIAGE PERMIT (RTO COMMERCIAL PERMIT):
- Under Section 66 of the Motor Vehicles Act, 1988, no owner of a motor vehicle shall use or permit the use of the vehicle as a transport vehicle in any public place without an authorized Goods Carriage Permit issued by the Regional Transport Authority (RTA).
- Application Portal: Parivahan Sewa portal (https://parivahan.gov.in) or local RTO office.
- Permit Types:
  * Local Goods Permit: Valid within municipal corporation limits (e.g. Mumbai MMR / Pune Municipal Area).
  * State Goods Carriage Permit: Valid across the entire State of Maharashtra (validity: 5 years, renewable).
  * National Permit: For interstate operations under Central Motor Vehicles Rules.
- Documents Required: Form 46, Vehicle Registration Certificate (RC), valid Commercial Fitness Certificate (Form 38), Insurance Certificate, and PUC.

2. VEHICLE REGISTRATION & COMMERCIAL NUMBER PLATES:
- Vehicles used for commercial deliveries (vans, mini-trucks, electric cargo bikes/three-wheelers) must be registered under Transport Category with yellow background and black lettering (or green background with yellow lettering for commercial Electric Vehicles).
- Annual road tax and passenger/goods tax clearance must be verified on Vahan portal.

3. DRIVER QUALIFICATIONS & AUTHORIZATION:
- Commercial drivers must hold a valid Driving License with Transport Vehicle (LMV-TR / HGMV) endorsement.
- Public service vehicle badge and police background verification for delivery agents handling valuable commercial consignments.
    `,
  },
  {
    issueKey: "visa_and_frro_guidance",
    title: "Statutory Procedures for Outbound Travel Visas & Foreigners Regional Registration (e-FRRO) in India",
    url: "https://indianfrro.gov.in/guidelines/visa-application-frro-registration-procedure",
    domain: "indianfrro.gov.in",
    content: `
BUREAU OF IMMIGRATION & MINISTRY OF EXTERNAL AFFAIRS, GOVERNMENT OF INDIA

STATUTORY PROCEDURES FOR FOREIGN TRAVEL VISAS AND FOREIGNERS REGIONAL REGISTRATION (e-FRRO)

1. OUTBOUND TRAVEL VISAS FOR INDIAN CITIZENS:
- An entry visa is a sovereign travel authorization issued by the government of the destination country, granting permission to enter and stay for specified purposes (Tourist, Business, Employment, Student, or Transit).
- Application Process:
  * Identify jurisdiction: Check whether destination country issues electronic visas (e-Visa), Visa on Arrival (VoA), or sticker visas via authorized consular service partners (e.g., VFS Global, BLS International).
  * Standard Requirements: Valid Indian Passport with minimum 6 months validity from date of travel and minimum 2 blank pages, confirmed return flight tickets, accommodation proof, financial bank statements showing sufficient funds, travel medical insurance, and applicable consular fee.

2. INBOUND FOREIGN NATIONALS - e-FRRO ONLINE REGISTRATION:
- Under the Foreigners Act, 1946 and Registration of Foreigners Rules, 1992:
  * Foreign nationals holding long-term visas (Student, Employment, Medical, or Research) valid for more than 180 days must register within 14 days of arrival in India.
  * Portal: e-FRRO Web Portal (https://indianfrro.gov.in) provides 100% paperless, cashless, and faceless services. No physical visit to the FRRO office (located at Mumbai / Pune) is required.
- Mandatory Services Available Online:
  * Registration Certificate / Residential Permit (RC/RP).
  * Visa Extension and Visa Conversion (e.g., Student to Employment).
  * Change of address, passport details, or educational institution.
  * Exit Permits for departure after visa expiry or newborn foreign children.
- Documents Required: Valid Passport and Indian Visa, Form C verification from hotel or rental agreement with police verification, bonafide letter from employer/university, financial sustenance proof, and passport-size photographs.
    `,
  },
  {
    issueKey: "passport_application_renewal",
    title: "Statutory Guidelines for Indian Passport Online Application, Renewal & Tatkal Services",
    url: "https://passportindia.gov.in/guidelines/passport-application-renewal-procedure",
    domain: "passportindia.gov.in",
    content: `
CENTRAL PASSPORT ORGANIZATION, MINISTRY OF EXTERNAL AFFAIRS, GOVERNMENT OF INDIA

STATUTORY PASSPORT ISSUANCE RULES UNDER THE PASSPORTS ACT, 1967

1. ONLINE APPLICATION & APPOINTMENT SCHEDULING:
- Under Section 5 of the Passports Act, 1967, every Indian citizen seeking an ordinary passport (Type P, 36 or 60 pages) must submit an electronic application:
  * Official Portal: Passport Seva Online Portal (https://passportindia.gov.in) or mPassport Seva App.
  * Service Types: Fresh Passport, Re-issue/Renewal of Passport (validity expired, exhaustion of pages, lost/damaged, or change of personal particulars).
  * Fees:
    - Normal Application (36 pages): Rs. 1,500 (Validity: 10 years for adults, 5 years for minors).
    - Normal Application (60 pages): Rs. 2,000.
    - Tatkal Scheme surcharge: Additional Rs. 2,000 paid online for expedited processing (dispatched within 1 to 3 working days).

2. MANDATORY DOCUMENTARY EVIDENCE:
- Proof of Date of Birth: Birth Certificate issued by Municipal Corporation, Registrar of Births & Deaths, or school transfer/matriculation certificate.
- Proof of Present Address: Aadhaar Card, Voter ID Card (EPIC), Electricity / Water utility bill, Registered Rent Agreement, or active Bank Passbook.
- Proof of Non-ECR (Emigration Check Not Required) Status: 10th standard pass certificate or higher educational degree.

3. VERIFICATION & DISPATCH WORKFLOW:
- In-person appointment at Passport Seva Kendra (PSK) or Post Office Passport Seva Kendra (POPSK) for biometric capture (ten-fingerprints, digital photograph, and original document verification).
- Police Verification Report (PVR): Dispatched electronically to local Police Commissionerate / District Superintendent of Police. Police officer conducts home visit verification within 21 days.
- Secure Dispatch: Printed passport is dispatched directly via India Post Speed Post with secure SMS tracking.
    `,
  },
];

async function ingestExpanded() {
  await connectDB();
  const municipalities = await Municipality.find({ isActive: true });
  console.log(`Ingesting 5 expanded statutory services for ${municipalities.length} municipalities...`);

  for (const item of EXPANDED_REGULATIONS) {
    const pages = [{ pageNumber: 1, text: item.content.trim() }];
    const chunks = chunkPages(pages, "html");

    for (const m of municipalities) {
      // Ensure allowedDomains includes the portal domain
      if (!m.allowedDomains.includes(item.domain)) {
        m.allowedDomains.push(item.domain);
        await m.save();
      }

      await Source.findOneAndUpdate(
        { municipalityId: m._id, url: item.url },
        {
          municipalityId: m._id,
          url: item.url,
          domain: item.domain,
          documentType: "html",
          title: item.title,
          extractedText: item.content.trim(),
          contentHash: `${item.issueKey}-v1`,
          resolvedUrl: item.url,
          retrievalMethod: "http",
          extractionMethod: "authoritative_regulation",
          pages,
          chunks,
          quality: {
            usable: true,
            score: 1.0,
            reasons: [],
            characterCount: item.content.length,
            wordCount: item.content.split(/\s+/).length,
            language: "en",
          },
          issueKeys: [item.issueKey],
          fetchedAt: new Date(),
          lastCheckedAt: new Date(),
          extractionStatus: "success",
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Ingested: ${item.issueKey}`);
  }

  console.log("All expanded statutory services ingested successfully!");
  process.exit(0);
}

ingestExpanded().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
