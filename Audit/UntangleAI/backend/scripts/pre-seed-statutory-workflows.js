const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Workflow = require("../src/models/Workflow");
const Municipality = require("../src/models/Municipality");

const STATUTORY_WORKFLOWS = [
  {
    issueKey: "birth_certificate",
    title: "Birth Certificate Registration & Download (Aaple Sarkar / MCGM)",
    steps: [
      {
        stepId: "step_1",
        title: "Verify Hospital Reporting or Obtain Non-Availability Certificate",
        description: "Institutional births must be reported by the hospital/maternity home to the local Municipal Health Ward within 21 days under Section 8 of Registration of Births and Deaths Act.",
        eligibility: "Parents of newborn or legal guardian",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
        documentsRequired: ["Hospital Discharge Summary / Birth Report", "Parent Aadhaar Cards", "Parent Marriage Certificate (if available)"],
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on Aaple Sarkar or Municipal Portal",
        description: "Access the Aaple Sarkar or Municipal Corporation portal, select Vital Statistics / Birth Certificate, and enter the date of birth, mother name, and hospital registration number.",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
        fee: "Rs. 20 to Rs. 50 (free within 21 days)",
        documentsRequired: ["Hospital discharge slip", "Parent photo ID"],
      },
      {
        stepId: "step_3",
        title: "Download Digitally Signed Birth Certificate",
        description: "Once approved by the Medical Officer of Health (MOH), download the digitally signed birth certificate with verifiable QR code.",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
        deadline: "7 working days under Maharashtra RTS Act",
      }
    ]
  },
  {
    issueKey: "death_certificate",
    title: "Death Certificate Registration & Issuance (MCGM / Aaple Sarkar)",
    steps: [
      {
        stepId: "step_1",
        title: "Obtain Crematorium Receipt & Doctor Cause of Death Certificate",
        description: "Collect the official Cremation/Burial ground receipt and Form 4/4A (Medical Certificate of Cause of Death) from the attending physician or hospital.",
        documentsRequired: ["Cremation ground slip", "Doctor Medical Certificate Form 4", "Deceased Aadhaar Card"],
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Apply Online via Aaple Sarkar or Ward Health Office",
        description: "Submit online application with death date and crematorium details within 21 days to avoid delayed registration penalties.",
        fee: "Rs. 25 per certificate copy",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "Download Digitally Signed Death Certificate",
        description: "Medical Officer of Health approves the entry and issues the signed digital death certificate with QR verification.",
        deadline: "7 working days under RTS Act",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      }
    ]
  },
  {
    issueKey: "marriage_registration",
    title: "Marriage Registration Certificate (Maharashtra Marriage Act / Special Marriage Act)",
    steps: [
      {
        stepId: "step_1",
        title: "Complete Online Memorandum of Marriage Application",
        description: "Fill Form A on Aaple Sarkar or Municipal Corporation portal under the Maharashtra Regulation of Marriage Bureaus and Registration of Marriages Act, 1998.",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
        documentsRequired: ["Age proof of Bride (min 18) and Groom (min 21)", "Wedding invitation card", "Photographs of wedding ritual / ceremony", "Aadhaar cards of Bride, Groom and 3 Witnesses"],
      },
      {
        stepId: "step_2",
        title: "Book Appointment Slot at Local Ward Office / Sub-Registrar",
        description: "Pay the statutory registration fee online and book an in-person physical verification slot.",
        fee: "Rs. 100 (Normal) / Rs. 500 (Late registration)",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "In-Person Appearance & Certificate Issuance",
        description: "Bride, Groom, and 3 adult witnesses appear before the Marriage Registrar with original documents and sign the register. Certificate is issued immediately or within 3 days.",
        deadline: "10 working days under RTS Act",
        office: "Municipal Ward Office (Health / Vital Statistics Branch) or SRO",
      }
    ]
  },
  {
    issueKey: "property_tax_payment",
    title: "Property Tax Assessment, Bill Download & Online Payment (MCGM / PMC)",
    steps: [
      {
        stepId: "step_1",
        title: "Look Up Property Assessment Using SAC Number",
        description: "Access the municipal Property Tax portal (e.g. ptaxportal.mcgm.gov.in) and enter the 15-digit SAC / Property Account Number.",
        officialUrl: "https://ptaxportal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Verify Outstanding Dues & Rebates",
        description: "Review current year assessment, arrears, water/sewerage surcharges, and early payment rebate deductions (2% to 5% if applicable).",
        officialUrl: "https://ptaxportal.mcgm.gov.in",
      },
      {
        stepId: "step_3",
        title: "Make Online Payment & Download Official Receipt",
        description: "Pay using Net Banking, UPI, or Credit/Debit Card. Immediately download the signed tax receipt with barcode/receipt number for future legal title records.",
        officialUrl: "https://ptaxportal.mcgm.gov.in",
      }
    ]
  },
  {
    issueKey: "property_tax_transfer_mutation",
    title: "Property Tax Name Transfer & Mutation (MCGM / PMC Property Assessment Department)",
    steps: [
      {
        stepId: "step_1",
        title: "Gather Registered Sale Deed, Index II & Society NOC",
        description: "Collect the registered deed of transfer, sub-registrar Index II extract, No Objection Certificate from co-operative housing society, and latest property tax paid receipt.",
        documentsRequired: ["Registered Sale Deed / Gift Deed", "Sub-Registrar Index II Extract", "NOC from Society", "Latest Property Tax Paid Receipt", "Applicant ID"],
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online Transfer Application Form A",
        description: "Upload scanned deed and Index II on the municipal corporation citizen portal under Property Tax Mutation service.",
        fee: "Mutation fee calculated per municipal schedule (typically Rs. 100 to Rs. 500)",
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_3",
        title: "Inspection by Ward Assessment Officer & Order Issuance",
        description: "Ward assessment inspector verifies title and updates the Property Tax Ledger (P-Card). New property tax bills are issued in the transferee's name.",
        deadline: "30 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "water_connection_new",
    title: "New Municipal Drinking Water Connection (MCGM / PMC Hydraulic Department)",
    steps: [
      {
        stepId: "step_1",
        title: "Hire a Licensed Municipal Plumber & Prepare Layout Plan",
        description: "Engage an authorized licensed plumber to prepare the internal plumbing schematic and identify the nearest municipal water main distribution line.",
        documentsRequired: ["Ownership proof / Property Tax Receipt", "Sanctioned building plan", "Plumber completion certificate", "Aadhaar Card"],
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Application on Municipal Water Services Portal",
        description: "Apply on the MCGM Aquatax / Water Connection portal or PMC citizen services. Pay the inspection and connection fee.",
        fee: "Connection charges + Security Deposit based on pipe diameter (15mm / 25mm)",
        officialUrl: "https://aquatax.mcgm.gov.in",
      },
      {
        stepId: "step_3",
        title: "Site Inspection, Road Opening NOC & Water Meter Installation",
        description: "Assistant Engineer (Water Works) conducts site inspection, coordinates road cutting permission, taps the municipal main, and installs the sealed water meter.",
        deadline: "30 working days under RTS Act",
        office: "Ward Hydraulic Engineer Office",
      }
    ]
  },
  {
    issueKey: "water_bill_payment_complaint",
    title: "Water Bill Payment, Meter Reading Complaint & Dispute Redressal",
    steps: [
      {
        stepId: "step_1",
        title: "Check Water Bill on Aquatax Portal",
        description: "Enter the Consumer Connection Number (CCN) to verify units consumed, telescopic slab rates, and sewerage charges.",
        officialUrl: "https://aquatax.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit High Consumption or Faulty Meter Grievance",
        description: "If bill is inflated due to stuck meter or average billing, upload a clear timestamped photograph of current meter dial reading.",
        officialUrl: "https://aquatax.mcgm.gov.in",
      },
      {
        stepId: "step_3",
        title: "Meter Testing & Bill Revision",
        description: "Municipal meter testing squad checks calibration. If discrepancy is found, revised credit adjustment bill is issued.",
        deadline: "15 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "trade_license_gumasta",
    title: "Maharashtra Shop and Establishment (Gumasta) License / Intimation",
    steps: [
      {
        stepId: "step_1",
        title: "Determine Registration Category (Form F vs Form G)",
        description: "Under Maharashtra Shops & Establishments Act 2017: Establishments with 10 or more workers require Form F Registration (lifetime validity); fewer than 10 workers require Form G Online Intimation (instant receipt, free).",
        officialUrl: "https://lms.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on LMS MahaOnline / Aaple Sarkar",
        description: "Upload shop photo showing front entrance with prominent Marathi signboard (Devanagari script), rent agreement/NOC, PAN card, and Aadhaar.",
        documentsRequired: ["Shop entrance photo with Marathi board", "Rent Agreement / Ownership Proof", "Aadhaar Card & PAN Card", "List of employees with designations"],
        fee: "Rs. 0 (under 10 workers) / Rs. 1,000 to Rs. 2,000 (10+ workers)",
        officialUrl: "https://lms.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "Download Gumasta Certificate",
        description: "Download the digitally signed Shop Act Certificate for commercial operations and opening bank current accounts.",
        deadline: "Immediate (Form G) / 7 working days (Form F)",
      }
    ]
  },
  {
    issueKey: "land_records_7_12_ferfar",
    title: "Digital 7/12 Extract (Saat Bara), 8A Extract & Ferfar Mutation (Mahabhulekh)",
    steps: [
      {
        stepId: "step_1",
        title: "Access Mahabhulekh / Digital Satbara Portal",
        description: "Open the official land records portal (https://bhulekh.mahabhumi.gov.in or https://digitalsatbara.mahabhumi.gov.in).",
        officialUrl: "https://digitalsatbara.mahabhumi.gov.in",
      },
      {
        stepId: "step_2",
        title: "Select District, Taluka, Village & Enter Survey/Gat Number",
        description: "Enter your land parcel Survey Number, Hissa Number, or Gat Number to preview the record of rights (ROR).",
        officialUrl: "https://digitalsatbara.mahabhumi.gov.in",
      },
      {
        stepId: "step_3",
        title: "Download Legally Valid Digitally Signed 7/12 & 8A Extract",
        description: "Pay Rs. 15 fee via net banking or wallet and download the 16-digit digitally signed PDF with government emblem and QR code valid for court, bank, and registration purposes.",
        fee: "Rs. 15 per digital 7/12 extract",
        deadline: "Instant electronic download",
      }
    ]
  },
  {
    issueKey: "caste_certificate",
    title: "Caste Certificate & Caste Validity Application (Revenue Department / SDM)",
    steps: [
      {
        stepId: "step_1",
        title: "Gather Pre-1950/1967 Historical Evidence of Caste",
        description: "Gather primary historical documents showing caste of father or grandfather residing in Maharashtra prior to the deemed date (1950 for SC/ST, 1967 for OBC).",
        documentsRequired: ["Primary school leaving certificate of applicant and father showing caste", "Old 7/12 or land records showing ancestral residence", "Caste certificate of blood relative (father/uncle)", "Aadhaar and Ration Card", "Affidavit Form 3"],
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on Aaple Sarkar",
        description: "Select Revenue Department -> Caste Certificate, upload scanned documents and applicant photograph, and pay the statutory fee.",
        fee: "Rs. 50 + service charges",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "Inquiry by Talathi & SDO Approval",
        description: "Talathi and Circle Officer conduct field verification. Sub-Divisional Officer (SDO) approves and issues the barcoded Caste Certificate.",
        deadline: "21 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "income_certificate",
    title: "Tahsildar Income Certificate Application (Revenue Department / Aaple Sarkar)",
    steps: [
      {
        stepId: "step_1",
        title: "Gather Income Proofs and Family Details",
        description: "Collect proof of income (salary certificate / Form 16 / ITR / Talathi panchnama for agricultural income), ration card, and residence proof.",
        documentsRequired: ["Salary slip / Form 16 / ITR or Talathi income report", "Ration Card copy", "Aadhaar Card", "Self-declaration affidavit of annual family income"],
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Apply Online via Aaple Sarkar Portal",
        description: "Fill the online form under Revenue Services -> Income Certificate. Specify purpose (Education, Scholarship, Ration Scheme).",
        fee: "Rs. 50 + portal charges",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "Certificate Issuance by Tahsildar / Nayab Tahsildar",
        description: "Executive Magistrate verifies documents and issues the digitally signed Income Certificate (valid for 1 to 3 financial years).",
        deadline: "15 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "domicile_nationality_certificate",
    title: "Age, Nationality & Domicile Certificate (Revenue Department)",
    steps: [
      {
        stepId: "step_1",
        title: "Compile 15 Years Continuous Residence Proof",
        description: "Collect documentary proof establishing 15 consecutive years of continuous residence in Maharashtra.",
        documentsRequired: ["School Leaving Certificate showing birthplace in Maharashtra", "Ration card or electricity bills for 15 years", "Parent domicile or voter ID", "Aadhaar card", "Self-declaration affidavit"],
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on Aaple Sarkar",
        description: "Apply under Revenue Department -> Age, Nationality and Domicile Certificate. Pay online fee.",
        fee: "Rs. 50 + charges",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "Verification & Download Certificate",
        description: "Sub-Divisional Officer / Tahsildar reviews residence records and issues the lifelong digital Domicile Certificate.",
        deadline: "15 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "non_creamy_layer_certificate",
    title: "Non-Creamy Layer Certificate (NCL) for OBC / VJNT / SBC Categories",
    steps: [
      {
        stepId: "step_1",
        title: "Verify Gross Annual Income Under Rs. 8 Lakhs Threshold",
        description: "Applicant's parents must have had gross annual income below Rs. 8 Lakhs for the preceding 3 consecutive financial years.",
        documentsRequired: ["Caste Certificate of applicant", "Income proof for last 3 financial years (ITR / Form 16 / Tahsildar certificate)", "7/12 land holding extract (if agricultural)", "Aadhaar and Ration Card"],
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_2",
        title: "Apply Online via Aaple Sarkar",
        description: "Submit Form under Revenue Services -> Non-Creamy Layer Certificate.",
        fee: "Rs. 50 + service charges",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      },
      {
        stepId: "step_3",
        title: "SDO Scrutiny & Certificate Issuance",
        description: "Sub-Divisional Magistrate verifies financial documents and issues NCL Certificate valid for up to 3 years.",
        deadline: "21 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "ration_card_new_member",
    title: "Ration Card Member Addition, Deletion & Modification (RCMS Food & Civil Supplies)",
    steps: [
      {
        stepId: "step_1",
        title: "Collect Deletion Certificate or Birth Certificate",
        description: "For new spouse: Surrender/Deletion certificate from previous ration card. For newborn child: Municipal birth certificate.",
        documentsRequired: ["Original Ration Card copy", "Birth Certificate of child or Marriage certificate + deletion slip for spouse", "Aadhaar cards of all members"],
        officialUrl: "https://rcms.mahafood.gov.in",
      },
      {
        stepId: "step_2",
        title: "Apply Online on MahaFood RCMS Portal",
        description: "Login to RCMS portal, navigate to Citizen Services -> Member Addition, enter Aadhaar number with OTP verification.",
        officialUrl: "https://rcms.mahafood.gov.in",
        fee: "Rs. 20 statutory fee",
      },
      {
        stepId: "step_3",
        title: "Approval by Food Distribution Officer / Supply Inspector",
        description: "Zonal Rationing Officer / Tahsildar Supply Office approves addition. Member name is updated in e-Ration Card (NFSA/APL).",
        deadline: "15 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "driving_license_learner_permanent",
    title: "Learner & Permanent Driving License Application (Parivahan Sarathi / RTO Maharashtra)",
    steps: [
      {
        stepId: "step_1",
        title: "Apply for Learner License (LL) Online on Sarathi",
        description: "Submit Form 2 on Sarathi Parivahan portal, complete Aadhaar e-KYC, upload Form 1 self-declaration of physical fitness, and take the online computer test for traffic signs.",
        officialUrl: "https://parivahan.gov.in",
        fee: "Rs. 200 (Learner License)",
        documentsRequired: ["Aadhaar Card (Address & Age Proof)", "Blood Group Proof", "Passport size photo & signature", "Medical Certificate Form 1A (if aged 40+)"],
      },
      {
        stepId: "step_2",
        title: "Wait Minimum 30 Days & Book Permanent Driving License Slot",
        description: "After holding a valid Learner License for at least 30 days (and within 6 months), apply for Permanent Driving License (Form 4) and book a driving test slot at the local RTO.",
        fee: "Rs. 700 (Smart card DL fee + test slot charges)",
        officialUrl: "https://parivahan.gov.in",
      },
      {
        stepId: "step_3",
        title: "Appear for RTO Driving Test & Receive Smart Card DL",
        description: "Demonstrate vehicle driving on the automated RTO test track (H-track / S-track / parallel parking). Upon passing, the smart card DL is printed and dispatched via Speed Post.",
        deadline: "15 working days from test date",
        office: "Regional Transport Office (RTO)",
      }
    ]
  },
  {
    issueKey: "vehicle_rc_transfer_hypothecation",
    title: "Vehicle RC Ownership Transfer & Loan Hypothecation Cancellation (Parivahan Vahan)",
    steps: [
      {
        stepId: "step_1",
        title: "Prepare Form 29 & Form 30 with Seller & Buyer Signatures",
        description: "Under Section 50 of Motor Vehicles Act, execute Form 29 (Notice of Transfer) and Form 30 (Application for Transfer of Ownership). For loan termination, obtain Form 35 + NOC from the financing bank.",
        documentsRequired: ["Original Registration Certificate (RC Book / Smart Card)", "Form 29 and Form 30 signed by seller and buyer", "Form 35 + Bank NOC (if loan hypothecation cancellation)", "Valid Motor Vehicle Insurance Certificate", "Valid PUC Certificate", "Chassis number pencil print on paper"],
        officialUrl: "https://parivahan.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on Parivahan Vahan Portal",
        description: "Pay the transfer fee and hypothecation removal fee online. Schedule document submission appointment at the registered RTO.",
        fee: "Rs. 300 to Rs. 500 depending on vehicle class (Two-wheeler / Four-wheeler)",
        officialUrl: "https://parivahan.gov.in",
      },
      {
        stepId: "step_3",
        title: "RTO Verification & Dispatch of New RC Smart Card",
        description: "RTO Inspector verifies chassis print and clearances. New RC Smart Card in the buyer's name is dispatched via Speed Post.",
        deadline: "15 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "occupancy_certificate_oc",
    title: "Occupancy Certificate (OC) & Building Completion Approval (MCGM / PMC BPMS)",
    steps: [
      {
        stepId: "step_1",
        title: "Obtain Building Completion Certificate from Licensed Architect",
        description: "Architect / Licensed Structural Engineer inspects building and certifies work has been completed in compliance with the Sanctioned Building Plan (IOD/CC).",
        documentsRequired: ["Copy of approved plan and Commencement Certificate (CC)", "Structural Engineer stability certificate", "Chief Fire Officer Final Fire NOC", "Drainage and Storm Water completion NOC", "Lift installation safety certificate"],
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit OC Proposal via Online Building Permission System (BPMS / AutoDCR)",
        description: "Submit online application for Occupancy Certificate under Section 353A of Mumbai Municipal Corporation Act.",
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_3",
        title: "Joint Site Inspection by Executive Engineer & OC Order",
        description: "Executive Engineer (Building Proposal) conducts comprehensive site inspection. Once all compliance conditions are met, full or part Occupancy Certificate is granted.",
        deadline: "30 working days under RTS Act",
      }
    ]
  },
  {
    issueKey: "garbage_collection_complaint",
    title: "Municipal Solid Waste Garbage Collection & Overflowing Bin Redressal",
    steps: [
      {
        stepId: "step_1",
        title: "Log Grievance on Municipal Citizen App or Swachhata App",
        description: "Open the MCGM 24x7 / PMC Care mobile app or Aaple Sarkar grievance portal. Select Solid Waste Management (SWM).",
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Provide Exact Location Coordinates & Photo of Waste Dump",
        description: "Pin location on map, specify street name and landmark, and attach photo of unattended garbage or overflowing community dumper bin.",
      },
      {
        stepId: "step_3",
        title: "Junior Overseer Dispatch & Issue Resolution",
        description: "SWM ward dumper vehicle and clean-up squad are dispatched to clear the site. Citizen receives resolution photo and SMS closure.",
        deadline: "24 hours statutory SLA",
        office: "Ward Solid Waste Management (SWM) Department",
      }
    ]
  },
  {
    issueKey: "streetlight_repair_complaint",
    title: "Municipal Streetlight Repair & Dark Road Grievance Redressal",
    steps: [
      {
        stepId: "step_1",
        title: "Register Complaint on Municipal Portal or Ward Helpline",
        description: "Access municipal online complaint portal or dial civic toll-free helpline (1916). Select Electrical / Streetlights category.",
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Specify Street Name, Landmark & Pole Identification Number",
        description: "Provide the alphanumeric pole number painted on the electric pole and specify if light is blinking, extinguished, or damaged by rain.",
      },
      {
        stepId: "step_3",
        title: "Electric Maintenance Crew Dispatched",
        description: "Ward electrical contractor crew visits site with hydraulic crane and replaces LED fixture / underground cable. Service ticket is closed.",
        deadline: "48 hours statutory SLA",
      }
    ]
  },
  {
    issueKey: "drainage_sewage_blockage_complaint",
    title: "Sewerage Overflow, Gutter Blockage & Open Manhole Emergency Complaint",
    steps: [
      {
        stepId: "step_1",
        title: "Lodge Emergency Complaint with Ward Drainage Cell",
        description: "Dial municipal emergency helpline 1916 or lodge complaint online under Sewerage & Drainage department.",
        officialUrl: "https://portal.mcgm.gov.in",
      },
      {
        stepId: "step_2",
        title: "Specify Overflow Severity & Manhole Location",
        description: "Identify whether sewage water is entering premises, flooding public street, or if manhole cover is missing (high safety risk).",
      },
      {
        stepId: "step_3",
        title: "Suction Jetting Machine Dispatch & Desilting",
        description: "High-pressure sewer jetting and de-choking machine clears municipal underground sewer line. Damaged manhole cover replaced immediately.",
        deadline: "12 to 24 hours emergency SLA",
        office: "Assistant Engineer (Sewerage Operations)",
      }
    ]
  },
  {
    issueKey: "fire_noc_commercial",
    title: "Commercial Building & Enterprise Fire Safety NOC (Maharashtra Fire Service / CFO)",
    steps: [
      {
        stepId: "step_1",
        title: "Prepare Fire Safety Engineering Drawing & Equipment Layout",
        description: "Engage a licensed fire safety agency to design the fire protection scheme in compliance with Maharashtra Fire Prevention and Life Safety Measures Act, 2006.",
        documentsRequired: ["Architectural building layout", "Fire fighting installation plan (hydrants, sprinklers, alarms)", "Commercial LPG / PNG pipeline layout", "Smoke detection and exit evacuation plan"],
        officialUrl: "https://mahafireservice.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Application on MahaFireService Portal",
        description: "Apply for Provisional Fire NOC (before construction/fitout) or Final Fire NOC (after installation). Pay statutory fire cess and scrutiny fee.",
        fee: "Calculated based on built-up area and hazard category",
        officialUrl: "https://mahafireservice.gov.in",
      },
      {
        stepId: "step_3",
        title: "Fire Brigade Station Inspection & NOC Issuance",
        description: "Divisional Fire Officer conducts physical water pressure test and evacuation audit. Chief Fire Officer (CFO) issues signed Fire NOC valid for 1 year.",
        deadline: "15 working days under RTS Act",
        office: "Chief Fire Officer (Fire Prevention Cell)",
      }
    ]
  },
  {
    issueKey: "rti_application_first_appeal",
    title: "Right to Information (RTI) Application & First Appeal (RTI Online Maharashtra)",
    steps: [
      {
        stepId: "step_1",
        title: "Draft Specific RTI Information Query (Max 500 Words)",
        description: "Under Section 6(1) of the Right to Information Act, 2005, draft a clear, focused request seeking certified copies of records, orders, files, or audit reports.",
        officialUrl: "https://rtionline.maharashtra.gov.in",
      },
      {
        stepId: "step_2",
        title: "Submit Online on RTI Online Maharashtra Portal",
        description: "Select Department / Public Authority, upload ID proof, and pay the statutory application fee of Rs. 10 via payment gateway.",
        fee: "Rs. 10 application fee (Free for BPL card holders)",
        officialUrl: "https://rtionline.maharashtra.gov.in",
      },
      {
        stepId: "step_3",
        title: "Public Information Officer (PIO) Response & First Appeal",
        description: "PIO is legally bound to furnish information within 30 days (or 48 hours if life and liberty is involved). If denied or unsatisfied, file First Appeal under Section 19(1) to the First Appellate Authority within 30 days.",
        deadline: "30 calendar days statutory deadline",
      }
    ]
  },
  {
    issueKey: "building_permission_plan_sanction",
    title: "Building Permission & Building Plan Sanction (AutoDCR / BPMS Maharashtra)",
    steps: [
      {
        stepId: "step_1",
        title: "Submit Architectural Drawings via AutoDCR / BPMS Portal",
        description: "Submit digital building layout plans conforming to Unified Development Control and Promotion Regulations (UDCPR) through a registered licensed architect or structural engineer on the Building Plan Management System (BPMS).",
        officialUrl: "https://mahabpms.maharashtra.gov.in",
        documentsRequired: ["Title Ownership Document / 7/12 Extract", "Architectural CAD drawings (AutoDCR compliant)", "Structural Stability Certificate", "Property Tax NOC"],
      },
      {
        stepId: "step_2",
        title: "Site Inspection & Technical Scrutiny by Town Planning Department",
        description: "Executive Engineer and Town Planning Officer conduct site inspection and verify road widening setbacks, floor space index (FSI/TDR), and environmental clearances.",
        deadline: "30 days under Maharashtra RTS Act",
      },
      {
        stepId: "step_3",
        title: "Payment of Development Charges & Issuance of Commencement Certificate (CC)",
        description: "Pay development charges, betterment levies, and scrutiny fees. The competent planning authority issues the formal Commencement Certificate.",
        fee: "Calculated based on built-up area and ready reckoner rates",
        officialUrl: "https://mahabpms.maharashtra.gov.in",
      }
    ]
  },
  {
    issueKey: "tree_trimming_permission_complaint",
    title: "Dangerous Tree Trimming & Cutting Permission (Maharashtra Tree Authority)",
    steps: [
      {
        stepId: "step_1",
        title: "Submit Application / Complaint to Ward Tree Officer",
        description: "Apply to the Municipal Tree Authority under Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975, stating exact reasons such as danger to life, structural hazard, or storm damage.",
        officialUrl: "https://portal.mcgm.gov.in",
        documentsRequired: ["Photographs of tree/branches showing hazard", "Premises ownership or housing society NOC", "Site location plan"],
      },
      {
        stepId: "step_2",
        title: "Site Inspection by Municipal Tree Officer / Garden Superintendent",
        description: "Municipal tree officer inspects the site within 7 working days to assess whether trimming, pruning, or full tree transplantation is warranted.",
        deadline: "7 to 15 working days",
      },
      {
        stepId: "step_3",
        title: "Issuance of Trimming Permission Order or Departmental Execution",
        description: "Tree Authority issues formal written permission. For public municipal roads, departmental horticulturists execute trimming without citizen charges.",
        officialUrl: "https://punecorporation.org",
      }
    ]
  },
  {
    issueKey: "food_safety_fssai_registration",
    title: "Food Safety Registration & License (FoSCoS Maharashtra / FSSAI)",
    steps: [
      {
        stepId: "step_1",
        title: "Determine Eligibility (Registration vs State License)",
        description: "Petty food manufacturers, roadside snack vendors, and small food stalls with turnover up to Rs. 12 Lakhs apply for FSSAI Registration (Form A). Businesses with turnover above Rs. 12 Lakhs apply for State Food License (Form B).",
        officialUrl: "https://foscos.fssai.gov.in",
        documentsRequired: ["Photo ID (Aadhaar/PAN)", "Passport photograph", "Premises proof (rent agreement/electricity bill/hawking certificate)", "Water testing laboratory report"],
      },
      {
        stepId: "step_2",
        title: "Submit Online Application on FoSCoS Portal",
        description: "Log in to FoSCoS (foscos.fssai.gov.in), fill Form A/B with food categories, upload mandatory food handler medical fitness certificate, and submit.",
        officialUrl: "https://foscos.fssai.gov.in",
        fee: "Rs. 100/year for Registration; Rs. 2,000/year for State License",
      },
      {
        stepId: "step_3",
        title: "Download 14-Digit Digitally Signed FSSAI Certificate",
        description: "Designated Officer (DO) / Food Safety Officer (FSO) approves application. Download the 14-digit FSSAI license certificate with verifiable QR code to display prominently at the premises.",
        deadline: "7 to 30 working days",
        officialUrl: "https://foscos.fssai.gov.in",
      }
    ]
  },
  {
    issueKey: "commercial_kitchen_cloud_kitchen_approval",
    title: "Commercial Kitchen, Cloud Kitchen & Dhaba Statutory Clearances",
    steps: [
      {
        stepId: "step_1",
        title: "Premises Legal Clearance & Shop Act (Gumasta) Registration",
        description: "Secure commercial lease agreement or NOC from landlord for food preparation activities. Register the establishment under Maharashtra Shops & Establishments Act on Aaple Sarkar portal.",
        officialUrl: "https://aaplesarkar.mahaonline.gov.in",
        documentsRequired: ["Commercial Rent Agreement / Property Tax receipt", "Aadhaar and PAN card of proprietor/partners", "Partnership deed or Certificate of Incorporation"],
      },
      {
        stepId: "step_2",
        title: "Obtain Municipal Health Trade License & Local Fire NOC",
        description: "Apply for Municipal Health Department Eating House / Food Preparation NOC (MOH approval) and submit fire safety compliance to Local Fire Brigade for commercial LPG and exhaust ventilation installations.",
        officialUrl: "https://portal.mcgm.gov.in",
        fee: "Varies by kitchen square footage (typically Rs. 2,500 to Rs. 10,000 annually)",
      },
      {
        stepId: "step_3",
        title: "FSSAI State License Approval on FoSCoS Portal",
        description: "Apply for FSSAI State Food Business Operator License under Food Safety and Standards Act. Upload kitchen equipment layout plan, food handler medical fitness certificates, and potable water testing test report.",
        deadline: "15 to 30 working days",
        officialUrl: "https://foscos.fssai.gov.in",
      }
    ]
  },
  {
    issueKey: "saas_tech_business_setup",
    title: "SaaS & Tech Startup Registration and Incorporation (MCA / Udyam / Gumasta)",
    steps: [
      {
        stepId: "step_1",
        title: "Company Incorporation via MCA SPICe+ Portal",
        description: "Incorporate Private Limited Company or LLP through the Ministry of Corporate Affairs SPICe+ integrated form. Generates DIN, CIN, PAN, TAN, and EPFO/ESIC registrations in a single submission.",
        officialUrl: "https://mca.gov.in",
        documentsRequired: ["Director PAN and Aadhaar cards", "Proof of registered office (electricity bill + NOC)", "Draft Memorandum of Association (MOA) and Articles of Association (AOA)"],
      },
      {
        stepId: "step_2",
        title: "MSME Udyam Registration & DPIIT Startup India Recognition",
        description: "Register online on the Udyam portal (udyamregistration.gov.in) with Aadhaar and PAN for priority sector benefits. Apply for DPIIT recognition on Startup India portal for income tax exemptions under Section 80-IAC.",
        fee: "Zero government fee (Free registration)",
        officialUrl: "https://udyamregistration.gov.in",
      },
      {
        stepId: "step_3",
        title: "Maharashtra Shop Act (Gumasta) & Professional Tax (PTRC/PTEC)",
        description: "Submit online intimation or registration under Maharashtra Shops and Establishments Act on Aaple Sarkar. Enroll for Professional Tax Employer (PTEC) and Employee (PTRC) registration on Mahagst portal.",
        deadline: "Instant intimation for businesses under 10 employees; 7 days for larger firms",
        officialUrl: "https://mahagst.gov.in",
      }
    ]
  },
  {
    issueKey: "commercial_transport_delivery_permit",
    title: "Commercial Delivery Fleet & Goods Carriage Permit (Vahan / Parivahan Maharashtra)",
    steps: [
      {
        stepId: "step_1",
        title: "Vehicle Commercial Registration & Fitness Certification",
        description: "Obtain commercial goods carriage vehicle registration (yellow plate) and valid Fitness Certificate (Form 38) from the local Regional Transport Office (RTO) under Motor Vehicles Act, 1988.",
        officialUrl: "https://parivahan.gov.in",
        documentsRequired: ["Vehicle Registration Certificate (RC)", "Valid Commercial Insurance", "Pollution Under Control Certificate (PUCC)", "Chassis pencil print"],
      },
      {
        stepId: "step_2",
        title: "Submit Goods Carriage Permit Application (Form 46/48)",
        description: "Apply on the Parivahan Vahan portal for Intra-State Goods Carriage Permit or National Goods Permit (Form 46/48) for delivery operations across Maharashtra.",
        officialUrl: "https://parivahan.gov.in",
        fee: "Statutory permit fee as prescribed by Maharashtra Motor Vehicles Rules",
      },
      {
        stepId: "step_3",
        title: "Driver Commercial Badge Endorsement & Fleet Compliance",
        description: "Ensure delivery drivers hold valid Light Goods Vehicle (LGV) or Medium/Heavy Goods commercial driving license with police verification and authorized transport badge.",
        deadline: "15 working days",
        officialUrl: "https://transport.maharashtra.gov.in",
      }
    ]
  },
  {
    issueKey: "visa_and_frro_guidance",
    title: "Foreign Visa Application Guidance & e-FRRO Foreigner Registration",
    steps: [
      {
        stepId: "step_1",
        title: "Identify Visa Category & Diplomatic Jurisdiction",
        description: "Determine the appropriate visa category (Student, Employment, Tourist, Business) according to destination country embassy rules. Prepare appointment through authorized visa facilitation centers (VFS Global, BLS International).",
        officialUrl: "https://mea.gov.in",
        documentsRequired: ["Valid Passport with min 6 months validity", "Proof of funds / Bank statements", "Travel itinerary and accommodation booking", "Cover letter / Sponsor invitation"],
      },
      {
        stepId: "step_2",
        title: "Biometrics Appointment & Visa Application Submission",
        description: "Submit completed online visa application, pay consular and service fees, and attend biometric enrollment (fingerprints and digital photo) at the nearest Visa Application Centre (VAC) in Mumbai or Pune.",
        officialUrl: "https://mea.gov.in",
      },
      {
        stepId: "step_3",
        title: "Foreign Nationals in Maharashtra: e-FRRO Registration",
        description: "Foreign citizens arriving on long-term visas (Student, Employment, Medical, Research exceeding 180 days) must register online on the Bureau of Immigration e-FRRO portal within 14 days of arrival without physical visit.",
        deadline: "Mandatory within 14 days of arrival in India",
        officialUrl: "https://indianfrro.gov.in",
      }
    ]
  },
  {
    issueKey: "passport_application_renewal",
    title: "Indian Passport Application, Renewal & Tatkal (Passport Seva / MEA)",
    steps: [
      {
        stepId: "step_1",
        title: "Submit Online Application on Passport Seva Portal",
        description: "Register on passportindia.gov.in, fill the Passport Application Form (Normal or Tatkal), and pay the statutory passport fee online via SBI payment gateway.",
        officialUrl: "https://passportindia.gov.in",
        fee: "Rs. 1,500 for Normal (36 pages); Rs. 3,500 for Tatkal",
        documentsRequired: ["Proof of Date of Birth (Birth Certificate/Aadhaar/PAN/10th Marksheet)", "Proof of Present Address (Aadhaar/Voter ID/Electricity bill/Passbook)", "Old Passport (in case of renewal)"],
      },
      {
        stepId: "step_2",
        title: "Attend Appointment at Passport Seva Kendra (PSK / POPSK)",
        description: "Visit the designated PSK or Post Office PSK (POPSK) in Mumbai, Pune, Nagpur, or Nashik with original documents. Biometrics, photograph, and document counter verification are completed.",
        officialUrl: "https://passportindia.gov.in",
      },
      {
        stepId: "step_3",
        title: "Police Verification & Speed Post Dispatch",
        description: "Local Police Station conducts physical residence and character verification. Following clearance, the Regional Passport Office (RPO) prints and dispatches the passport via Speed Post.",
        deadline: "21 days for Normal; 3 to 7 days for Tatkal",
        officialUrl: "https://passportindia.gov.in",
      }
    ]
  },
  {
    issueKey: "aadhaar_card_update",
    title: "Aadhaar Card Address Update, Mobile Linking & Biometric Enrollment (UIDAI)",
    steps: [
      {
        stepId: "step_1",
        title: "Prepare Supporting Address Proof Documentation",
        description: "Gather valid proof of address acceptable under UIDAI guidelines (e.g., electricity bill, bank passbook/statement, voter ID, rent agreement, or passport).",
        officialUrl: "https://myaadhaar.uidai.gov.in",
        documentsRequired: ["Valid Proof of Address (POA)", "Current Aadhaar number linked with active mobile number for OTP"],
      },
      {
        stepId: "step_2",
        title: "Submit Online Request via myAadhaar Portal or Visit Aadhaar Seva Kendra",
        description: "Access myaadhaar.uidai.gov.in, log in with Aadhaar OTP, select 'Update Address', enter new address details, and upload scanned documentary proof. For mobile number linking, biometric update, or name changes, book an appointment at an official Aadhaar Seva Kendra.",
        officialUrl: "https://myaadhaar.uidai.gov.in",
        fee: "Rs. 50 for online address update; Rs. 50-100 for biometric update at Kendra",
      },
      {
        stepId: "step_3",
        title: "Track Status with URN & Download Digitally Signed e-Aadhaar",
        description: "Use the 14-digit Update Request Number (URN) to track update status. Once approved, download the password-protected e-Aadhaar PDF with valid digital signature.",
        deadline: "5 to 15 working days",
        officialUrl: "https://myaadhaar.uidai.gov.in",
      }
    ]
  },
  {
    issueKey: "pan_card_application",
    title: "Permanent Account Number (PAN) Card Application & Correction (Form 49A / NSDL / UTIITSL)",
    steps: [
      {
        stepId: "step_1",
        title: "Submit Online Form 49A on NSDL (Protean) or UTIITSL Portal",
        description: "Fill Form 49A for Indian Citizens on the NSDL Protean or UTIITSL portal. Select application type 'New PAN - Indian Citizen (Form 49A)' and choose paperless e-KYC mode using Aadhaar.",
        officialUrl: "https://www.onlineservices.nsdl.com",
        documentsRequired: ["Proof of Identity (Aadhaar card)", "Proof of Address (Aadhaar card)", "Proof of Date of Birth (Aadhaar card)"],
      },
      {
        stepId: "step_2",
        title: "Pay Statutory Fee & Submit Aadhaar e-Sign Authentication",
        description: "Pay the application fee via net banking/UPI. Authenticate using Aadhaar OTP for paperless submission (no physical document dispatch required).",
        fee: "Rs. 107 for physical PAN card delivery in India; Rs. 72 for digital e-PAN only",
        officialUrl: "https://www.onlineservices.nsdl.com",
      },
      {
        stepId: "step_3",
        title: "Income Tax Department Processing & Physical Card Dispatch",
        description: "Income Tax Department verifies data and issues 10-digit alphanumeric PAN. Download digital e-PAN within 48 hours; physical laminated PAN card is delivered by India Post.",
        deadline: "10 to 15 working days (48 hours for e-PAN)",
        officialUrl: "https://incometax.gov.in",
      }
    ]
  },
  {
    issueKey: "voter_id_epic_registration",
    title: "Voter ID Card Registration, Correction & Digital EPIC Download (Form 6 / ECI / NVSP)",
    steps: [
      {
        stepId: "step_1",
        title: "Submit Online Form 6 on Voters Service Portal",
        description: "Register on the official Election Commission of India portal (voters.eci.gov.in) and submit Form 6 for registration as a new elector / voter.",
        officialUrl: "https://voters.eci.gov.in",
        documentsRequired: ["Proof of Age (Birth Certificate, Aadhaar, PAN card, or Class 10 Certificate)", "Proof of Residence (Water/Electricity bill, Bank passbook, or Rent agreement)", "Passport size photograph"],
      },
      {
        stepId: "step_2",
        title: "Field Verification by Booth Level Officer (BLO)",
        description: "The appointed Booth Level Officer (BLO) visits the applicant's residential address to verify residency and document authenticity.",
        deadline: "15 to 21 calendar days",
      },
      {
        stepId: "step_3",
        title: "Electoral Roll Inclusion & Digital e-EPIC Download",
        description: "Electoral Registration Officer (ERO) approves entry in assembly electoral roll. Download digital color e-EPIC from the portal and receive personalized PVC Voter Card by India Post.",
        fee: "Free of cost (No fee)",
        officialUrl: "https://voters.eci.gov.in",
      }
    ]
  }
];

function classifyStepType(step, idx, total) {
  const text = `${step.title} ${step.description || ''} ${(step.documentsRequired || []).join(' ')}`.toLowerCase();
  if (
    idx === 0 &&
    (text.includes('gather') ||
      text.includes('collect') ||
      text.includes('proof') ||
      text.includes('eligibility') ||
      text.includes('prerequisite') ||
      text.includes('obtain') ||
      text.includes('verify') ||
      (step.documentsRequired && step.documentsRequired.length > 0))
  ) {
    return 'prerequisite';
  }
  if (
    idx === total - 1 &&
    total > 1 &&
    (text.includes('issuance') ||
      text.includes('download') ||
      text.includes('delivery') ||
      text.includes('approval') ||
      text.includes('appearance'))
  ) {
    return 'action';
  }
  if (
    text.includes('form') ||
    text.includes('document') ||
    text.includes('apply online') ||
    text.includes('submit online') ||
    text.includes('portal') ||
    text.includes('application')
  ) {
    return 'document';
  }
  if (text.includes('proof') || text.includes('prerequisite') || text.includes('eligibility')) {
    return 'prerequisite';
  }
  return 'action';
}

async function preSeedWorkflows() {
  await connectDB();
  const municipalities = await Municipality.find({ isActive: true });
  console.log(`Pre-seeding ${STATUTORY_WORKFLOWS.length} verified statutory workflows across ${municipalities.length} municipalities...`);

  let count = 0;
  for (const m of municipalities) {
    for (const item of STATUTORY_WORKFLOWS) {
      const stepsWithDeps = item.steps.map((step, idx) => ({
        ...step,
        stepType: step.stepType || classifyStepType(step, idx, item.steps.length),
        dependsOn:
          step.dependsOn && step.dependsOn.length > 0
            ? step.dependsOn
            : idx > 0
            ? [item.steps[idx - 1].stepId]
            : [],
      }));

      await Workflow.findOneAndUpdate(
        { municipalityId: m._id, issueKey: item.issueKey },
        {
          municipalityId: m._id,
          issueKey: item.issueKey,
          title: item.title,
          steps: stepsWithDeps,
          conflicts: [],
          missingInformation: [],
          detailsRecoveryAttempted: true,
          status: "verified",
          verifiedBy: "Statutory Maharashtra Citizen Services Framework (RTS Act)",
          verifiedAt: new Date(),
          lastRecheckedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      count++;
    }
  }

  console.log(`Successfully pre-seeded ${count} verified statutory workflows in MongoDB!`);
  process.exit(0);
}

preSeedWorkflows().catch((err) => {
  console.error(err);
  process.exit(1);
});
