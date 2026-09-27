export type LanguageCode = 'auto' | 'en' | 'hinglish' | 'hi' | 'ur' | 'ta' | 'bn';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  native: string;
  isRtl?: boolean;
}

export const NAV_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Multilingual', native: 'All Languages' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ur', label: 'Urdu', native: 'اردو', isRtl: true },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

export interface ProcessTranslation {
  title: string;
  description: string;
  category: string;
  steps?: Record<string, {
    title: string;
    shortTitle?: string;
    description: string;
  }>;
}

export interface TranslationDictionary {
  nav: {
    brand: string;
    tagline: string;
    featuredRoadmap: string;
    aboutUs: string;
    directory: string;
    findGuidance: string;
    selectLanguage: string;
    themeLight: string;
    themeDark: string;
    canvasBtn: string;
    menu: string;
    closeMenu: string;
  };
  hero: {
    brand: string;
    tagline: string;
    findGuidance: string;
    title: string;
    queryHeading: string;
    viewRoadmaps: string;
    helplineTitle: string;
    helplineNumber: string;
    mcaPill: string;
    sarathiPill: string;
    fssaiPill: string;
    exploreRoadmaps: string;
  };
  heroCategories: {
    business: string;
    businessSub: string;
    property: string;
    propertySub: string;
    idDocs: string;
    idDocsSub: string;
    welfare: string;
    welfareSub: string;
    tax: string;
    taxSub: string;
    education: string;
    educationSub: string;
    more: string;
  };
  heroStats: {
    citizensCount: string;
    citizensLabel: string;
    servicesCount: string;
    servicesLabel: string;
    languagesCount: string;
    languagesLabel: string;
    exploreTitle: string;
    exploreDesc: string;
  };
  search: {
    placeholder: string;
    submitBtn: string;
    searchBtnAria: string;
    recommendedRoadmaps: string;
    searchResults: string;
    dropdownHeader: string;
    dropdownEnterHint: string;
    noResults: string;
    stepsCount: string;
    estimatedTime: string;
    statutoryFee: string;
    officialPortal: string;
    clearQuery: string;
    voiceSearch: string;
    voiceListening: string;
    voiceStop: string;
    voiceUnsupported: string;
    uploadDoc: string;
    removeDoc: string;
    fileLimitError: string;
    fileFormatError: string;
    supportedFormats: string;
  };
  about: {
    sectionTitle: string;
    sectionSubtitle: string;
    card1Heading: string;
    card1Body: string;
    card1Tag: string;
    side1Heading: string;
    side1Text: string;
    side1Btn: string;
    card2Heading: string;
    card2BodyTeam: string;
    card2BodySolo: string;
    withTeam: string;
    soloApplicant: string;
    scope: string;
    side2Heading: string;
    side2Text: string;
    side2Btn: string;
  };
  footer: {
    brand: string;
    mcaLink: string;
    sarathiLink: string;
    fssaiLink: string;
    nationalPortal: string;
    disclaimer: string;
    copyright: string;
  };
  roadmap: {
    backToSearch: string;
    search: string;
    canvas: string;
    list: string;
    shareRoadmap: string;
    shareSuccess: string;
    resetProgress: string;
    toggleTheme: string;
    stepsProgress: string;
    step: string;
    of: string;
    status: string;
    action: string;
    document: string;
    prerequisite: string;
    info: string;
    completed: string;
    locked: string;
    pending: string;
    inProgress: string;
    markCompleted: string;
    markIncomplete: string;
    prerequisitesRequired: string;
    officialPortal: string;
    department: string;
    location: string;
    statutoryFee: string;
    estimatedTimeline: string;
    legalBasis: string;
    requiredDocs: string;
    mandatory: string;
    optional: string;
    selectRoadmap: string;
    close: string;
    interactive: string;
    canvasTip: string;
    officialSource: string;
    legendAction: string;
    legendDoc: string;
    legendPrereq: string;
    legendCompleted: string;
    legendLocked: string;
  };
  processes: Record<string, ProcessTranslation>;
}

export const TRANSLATIONS: Record<Exclude<LanguageCode, 'auto'>, TranslationDictionary> = {
  en: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'Civic Process Navigator',
      featuredRoadmap: 'Featured Roadmap',
      aboutUs: 'About Us',
      directory: 'Directory',
      findGuidance: 'Find guidance',
      selectLanguage: 'Select Language',
      themeLight: 'Switch to light mode',
      themeDark: 'Switch to dark mode',
      canvasBtn: 'Interactive Canvas',
      menu: 'Open menu',
      closeMenu: 'Close menu',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'Civic Process Navigator',
      findGuidance: 'Find guidance',
      title: 'Find Your Roadmap',
      queryHeading: 'What do you need to get done?',
      viewRoadmaps: 'view roadmap selection',
      helplineTitle: 'National Government Services Portal helpline',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'Sarathi Parivahan',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'explore roadmaps',
    },
    heroCategories: {
      business: 'Business',
      businessSub: '& Licenses',
      property: 'Property',
      propertySub: '& Land',
      idDocs: 'ID Documents',
      idDocsSub: '& Certificates',
      welfare: 'Social Welfare',
      welfareSub: '& Benefits',
      tax: 'Tax',
      taxSub: '& Finance',
      education: 'Education',
      educationSub: '& Scholarships',
      more: 'More',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'Citizens helped',
      servicesCount: '500+',
      servicesLabel: 'Services indexed',
      languagesCount: '12+',
      languagesLabel: 'Languages',
      exploreTitle: 'Browse guided roadmaps',
      exploreDesc: 'Step-by-step walkthroughs for common processes',
    },
    search: {
      placeholder: 'Ask in any language... e.g. How to renew driving license',
      submitBtn: 'Untangle',
      searchBtnAria: 'Search civic process roadmaps',
      recommendedRoadmaps: 'Recommended Roadmaps',
      searchResults: 'Search Results',
      dropdownHeader: 'Official Civic Roadmaps',
      dropdownEnterHint: 'Press Enter to select',
      noResults: 'No direct match found. Press Enter to view related roadmaps.',
      stepsCount: 'steps',
      estimatedTime: 'Time',
      statutoryFee: 'Fee',
      officialPortal: 'Official Portal',
      clearQuery: 'Clear input',
      voiceSearch: 'Search by voice',
      voiceListening: 'Listening... Speak your question',
      voiceStop: 'Stop voice input',
      voiceUnsupported: 'Voice input is not supported in this browser.',
      uploadDoc: 'Attach document (PDF, Word, TXT, Images)',
      removeDoc: 'Remove document',
      fileLimitError: 'File size must be under 10MB.',
      fileFormatError: 'Please upload a PDF, Word document, TXT, or image file.',
      supportedFormats: 'Supported: PDF, DOCX, TXT, JPG, PNG, WEBP (up to 10MB)',
    },
    about: {
      sectionTitle: 'About Us',
      sectionSubtitle: 'Government processes mapped out so you know what to do, step by step.',
      card1Heading: 'Built from official government sources',
      card1Body: 'Every roadmap is based on procedures published on ministry portals (.gov.in and .nic.in). No brokers, no jargon.',
      card1Tag: 'Central & State Jurisdictions',
      side1Heading: 'Verified Requirements',
      side1Text: 'View verified prerequisites, authorized forms, and statutory fee schedules on every roadmap.',
      side1Btn: 'View roadmaps',
      card2Heading: 'Personalized for Solo Applicants & Enterprises',
      card2BodyTeam: 'Incorporate companies, assign multiple directors, obtain commercial food safety permits, and manage tax registrations with full compliance.',
      card2BodySolo: 'Personal driving license renewals, citizen certificates, and individual permits without redundant paperwork.',
      withTeam: 'With team',
      soloApplicant: 'Solo applicant',
      scope: '< Scope >',
      side2Heading: 'Offline Checklists',
      side2Text: 'Track your documentation offline or export interactive checklists directly before visiting authorities.',
      side2Btn: 'View checklists',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'Sarathi Parivahan',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'National Portal ↗',
      disclaimer: 'UntangleAI is an open-access civic navigation tool. All procedural guidance, timelines, and forms are sourced from official gazettes and ministry portals.',
      copyright: '© 2026 UntangleAI.',
    },
    roadmap: {
      backToSearch: 'Back to UntangleAI Search',
      search: 'Search',
      canvas: 'Canvas',
      list: 'List',
      shareRoadmap: 'Share this roadmap',
      shareSuccess: 'Roadmap link copied to clipboard!',
      resetProgress: 'Reset completed checklist',
      toggleTheme: 'Toggle theme',
      stepsProgress: 'steps',
      step: 'Step',
      of: 'of',
      status: 'Status',
      action: 'Action',
      document: 'Document',
      prerequisite: 'Prerequisite',
      info: 'Info',
      completed: 'Completed',
      locked: 'Locked',
      pending: 'Ready to start',
      inProgress: 'In progress',
      markCompleted: 'Mark as Completed',
      markIncomplete: 'Mark as Incomplete',
      prerequisitesRequired: 'Prerequisites Required',
      officialPortal: 'Visit Official Portal',
      department: 'Authority / Department',
      location: 'Location',
      statutoryFee: 'Statutory Fee',
      estimatedTimeline: 'Estimated Timeline',
      legalBasis: 'Official Legal Basis',
      requiredDocs: 'Required Documents & Prerequisites',
      mandatory: 'Mandatory',
      optional: 'Optional',
      selectRoadmap: 'Select Civic Process Roadmap',
      close: 'Close',
      interactive: 'Interactive',
      canvasTip: 'Click any step to inspect documents, fees, and official links',
      officialSource: 'Official Government Source',
      legendAction: 'Action Step',
      legendDoc: 'Document / Form',
      legendPrereq: 'Prerequisite',
      legendCompleted: 'Completed',
      legendLocked: 'Prereqs Pending',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'Register a Private Limited Company',
        description: 'Complete incorporation roadmap via Ministry of Corporate Affairs (MCA21 V3 / SPICe+)',
        category: 'Business & Commercial',
        steps: {
          'step-dsc': {
            title: 'Obtain Class 3 Digital Signature Certificate (DSC)',
            shortTitle: 'Class 3 DSC',
            description: 'All proposed directors must hold a valid Class-3 DSC with encryption & signing capabilities to digitally sign MCA21 e-forms.',
          },
          'step-spice-name': {
            title: 'Reserve Unique Company Name (SPICe+ Part A / RUN)',
            shortTitle: 'Name Reservation (RUN)',
            description: 'Submit up to two proposed names in order of preference following Companies Rules 2014 naming guidelines.',
          },
          'step-din': {
            title: 'Director Identification Number (DIN Allocation)',
            shortTitle: 'DIN Allocation',
            description: 'Obtain unique 8-digit DIN for proposed directors who do not currently possess one.',
          },
          'step-moa-aoa': {
            title: 'Draft Electronic MOA (INC-33) & AOA (INC-34)',
            shortTitle: 'Draft e-MOA & e-AOA',
            description: 'Draft electronic Memorandum of Association and Articles of Association defining company objects and internal regulations.',
          },
          'step-spice-part-b': {
            title: 'SPICe+ Part B Integrated Incorporation Filing',
            shortTitle: 'SPICe+ Part B',
            description: 'Consolidated single-window application for company PAN, TAN, EPFO, ESIC, and Certificate of Incorporation.',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S Mandatory Registrations',
            shortTitle: 'AGILE-PRO-S',
            description: 'Mandatory filing for GSTIN registration, EPFO, ESIC, Professional Tax, and opening corporate bank account.',
          },
          'step-inc-20a': {
            title: 'Commencement of Business Declaration (Form INC-20A)',
            shortTitle: 'INC-20A Commencement',
            description: 'File declaration within 180 days of incorporation confirming that directors have deposited their agreed share capital.',
          },
        },
      },
      'driving-license-delhi': {
        title: 'Apply for Permanent Driving License',
        description: 'Step-by-step licensing process under Sarathi Parivahan (Ministry of Road Transport and Highways)',
        category: 'Transport & Driving',
        steps: {
          'step-learner-app': {
            title: 'Apply for Learner License (LL) Online',
            shortTitle: 'Apply for LL Online',
            description: 'Submit Form 2 on Sarathi Parivahan portal with Aadhaar e-KYC and upload address and medical proofs.',
          },
          'step-ll-slot': {
            title: 'Book Slot for LL Driving / Traffic Rules Test',
            shortTitle: 'LL Test Slot Booking',
            description: 'Schedule date and time slot for online or in-person computer-based traffic rules examination.',
          },
          'step-dl-training': {
            title: 'Mandatory 30-Day Training Period & Driving Practice',
            shortTitle: '30-Day Practice Period',
            description: 'Complete minimum 30 days mandatory waiting period from LL issue date while practicing driving under guidance.',
          },
          'step-dl-test-slot': {
            title: 'Book Permanent DL Driving Skill Test Slot',
            shortTitle: 'Permanent DL Slot Booking',
            description: 'Select automated driving test track (ADTT) location and schedule your practical driving test.',
          },
          'step-dl-track-test': {
            title: 'Appear for Automated Driving Skill Test (ADTT)',
            shortTitle: 'ADTT Driving Skill Test',
            description: 'Execute driving maneuvers on camera-monitored automated test track.',
          },
          'step-dl-dispatch': {
            title: 'Biometrics Verification & DL Postal Dispatch',
            shortTitle: 'Biometrics & DL Dispatch',
            description: 'Complete digital photograph and signature capture; Smart Card DL dispatched via Speed Post.',
          },
        },
      },
      'fssai-food-license': {
        title: 'Apply for FSSAI Food Business License',
        description: 'Official licensing & registration workflow via FoSCoS portal for food business operators',
        category: 'Food & Commercial Safety',
        steps: {
          'step-foscos-eligibility': {
            title: 'Determine License Eligibility & Annual Turnover',
            shortTitle: 'Eligibility Check',
            description: 'Check whether your business qualifies for Basic Registration (< ₹12 Lakhs) or State/Central License (> ₹12 Lakhs).',
          },
          'step-foscos-docs': {
            title: 'Compile Mandatory Premise & Hygiene Documents',
            shortTitle: 'Document Dossier',
            description: 'Assemble government photo ID, electricity/rent agreement of premises, water testing report, and FSMS food safety plan.',
          },
          'step-foscos-form-b': {
            title: 'Submit Form B / Registration on FoSCoS Portal',
            shortTitle: 'FoSCoS e-Filing',
            description: 'Create account on foscos.fssai.gov.in, select Food Business Operator category, upload documents and pay fee.',
          },
          'step-fso-inspection': {
            title: 'Food Safety Officer (FSO) Premise Inspection',
            shortTitle: 'FSO Physical Inspection',
            description: 'Designated officer inspects food storage, kitchen equipment, staff medical fitness certificates, and hygiene.',
          },
          'step-fssai-certificate': {
            title: 'Download Digitally Signed FSSAI Certificate',
            shortTitle: 'Download License',
            description: 'Upon approval, download 14-digit FSSAI license certificate and display prominently at food business entrance.',
          },
        },
      },
      'pmay-housing': {
        title: 'Pradhan Mantri Awas Yojana (PMAY-G / Housing for All)',
        description: 'Government financial grant and geo-tagged DBT installments for constructing a durable pucca house with basic civic amenities.',
        category: 'Property & Land',
        steps: {
          'step-pmay-check': {
            title: 'Verify Priority List Eligibility & Land Record',
            shortTitle: 'Eligibility Verification',
            description: 'Check beneficiary inclusion in the Awaas+ / SECC deprivation database and confirm ownership of unencumbered home site land.',
          },
          'step-pmay-kyc': {
            title: 'Seed Bank Account with Aadhaar & NPCI for DBT',
            shortTitle: 'Aadhaar Bank Seeding',
            description: 'Ensure beneficiary single savings bank account or post office account is active and seeded with Aadhaar in the NPCI mapper for Direct Benefit Transfer.',
          },
          'step-pmay-geotag-pre': {
            title: 'Site Geo-tagging via AwaasApp by Gram Panchayat Officer',
            shortTitle: 'Pre-construction Geo-tag',
            description: 'Village nodal officer conducts physical field inspection and captures geo-tagged photographs of the vacant site or existing kutcha structure.',
          },
          'step-pmay-inst-1': {
            title: 'Receive Sanction Order & First Installment (Plinth Level)',
            shortTitle: 'First Installment Release',
            description: 'First installment of ₹40,000 is credited via PFMS directly to your account to begin foundation digging and plinth construction.',
          },
          'step-pmay-geotag-roof': {
            title: 'Lintel Inspection & Second Installment (Roof Level)',
            shortTitle: 'Mid-stage Inspection',
            description: 'Once foundation and walls reach window/lintel level, officer captures second geo-tagged photo to trigger the second installment (₹60,000 - ₹70,000).',
          },
          'step-pmay-completion': {
            title: 'Final Completion Verification & Toilet Grant Release',
            shortTitle: 'Completion & Toilet Grant',
            description: 'Roof casting, door/window installation, and Swachh Bharat toilet construction verified for final release of remaining funds and house handover.',
          },
        },
      },
      'pm-kisan-welfare': {
        title: 'PM-Kisan Samman Nidhi & Farmer Income Support',
        description: 'Direct income assistance of ₹6,000 annually in three equal quarterly installments of ₹2,000 for landholding agricultural families.',
        category: 'Social Welfare & Benefits',
        steps: {
          'step-kisan-land': {
            title: 'Verify Land Title & Revenue Record (Bhulekh / 7/12 / RoR)',
            shortTitle: 'Land Record Check',
            description: 'Ensure agricultural land is registered in the applicant name with updated Khata, Khesra/Survey number in state land records.',
          },
          'step-kisan-reg': {
            title: 'Submit Farmer Self-Registration on PM-Kisan Portal',
            shortTitle: 'Farmer Registration',
            description: 'Enter Aadhaar number, state, district, sub-district, block, village, land record survey details, and upload the land ownership copy.',
          },
          'step-kisan-npci': {
            title: 'Link Aadhaar with Bank Account via NPCI Mapper',
            shortTitle: 'NPCI Bank Linkage',
            description: 'Verify your bank account is seeded with Aadhaar on the NPCI gateway; PM-Kisan payments are strictly transferred via Aadhaar-based DBT payment bridge.',
          },
          'step-kisan-ekyc': {
            title: 'Complete Mandatory e-KYC Verification',
            shortTitle: 'Mandatory e-KYC',
            description: 'Authenticate through OTP on UIDAI registered mobile number, biometric fingerprint at a CSC, or Face Authentication via the official PM-KISAN mobile app.',
          },
          'step-kisan-approval': {
            title: 'State Verification & Installment Release Notification',
            shortTitle: 'Approval & DBT Credit',
            description: 'District and State Agriculture Nodal Officers verify land ownership and approve the record, triggering automated direct transfer of ₹2,000 every 4 months.',
          },
        },
      },
      'ayushman-bharat': {
        title: 'Ayushman Bharat PM-JAY Health Protection',
        description: 'Cashless hospital insurance coverage up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization across India.',
        category: 'Social Welfare & Benefits',
        steps: {
          'step-pmjay-check': {
            title: 'Check Family Eligibility on NHA Beneficiary Portal',
            shortTitle: 'Eligibility Check',
            description: 'Search by Ration Card number, Aadhaar number, Family ID, or PM-JAY ID to verify your family coverage under SECC deprivation criteria.',
          },
          'step-pmjay-abha': {
            title: 'Generate 14-Digit Ayushman Bharat Health Account (ABHA)',
            shortTitle: 'Create ABHA ID',
            description: 'Create unique 14-digit ABHA number linked with Aadhaar to store electronic health records, diagnostic reports, and digital prescriptions securely.',
          },
          'step-pmjay-kyc': {
            title: 'Complete Aadhaar e-KYC Verification',
            shortTitle: 'Complete e-KYC',
            description: 'Perform instant digital e-KYC on the Beneficiary Portal or via Ayushman Mitra at any empanelled hospital or Common Service Centre.',
          },
          'step-pmjay-card': {
            title: 'Download Ayushman Bharat Golden Card (PVC / Digital)',
            shortTitle: 'Ayushman Card Download',
            description: 'Download the official Ayushman card featuring QR code, PM-JAY ID, and family details. Printed PVC cards are issued free at CSCs or hospital helpdesks.',
          },
          'step-pmjay-hospital': {
            title: 'Avail Cashless Hospital Admission at Empanelled Hospital',
            shortTitle: 'Cashless Hospital Admission',
            description: 'Present Ayushman Card at the Pradhan Mantri Aarogya Mitra (PMAM) desk in any of 27,000+ empanelled public or private hospitals nationwide.',
          },
        },
      },
      'sukanya-samriddhi': {
        title: 'Sukanya Samriddhi Yojana (SSY) & Section 80C Tax Exemption',
        description: 'Government savings scheme for girl child with sovereign 8.2% interest and triple tax exemption (EEE) under Section 80C of the Income Tax Act.',
        category: 'Tax & Finance',
        steps: {
          'step-ssy-eligibility': {
            title: 'Confirm Eligibility & Age Criteria for Girl Child',
            shortTitle: 'Age & Eligibility Check',
            description: 'Account can be opened by natural or legal guardian for a girl child from her birth up to the age of 10 years (maximum 2 accounts per family).',
          },
          'step-ssy-kyc': {
            title: 'Gather Guardian KYC & Address Documents',
            shortTitle: 'Guardian KYC Prep',
            description: 'Prepare self-attested identity proof and address proof of the biological or legal guardian operating the account on behalf of the minor child.',
          },
          'step-ssy-apply': {
            title: 'Submit Account Opening Form (Form SSA-1)',
            shortTitle: 'Submit Form SSA-1',
            description: 'Complete official Form SSA-1 with girl child details, guardian details, initial deposit amount, and nominee declaration.',
          },
          'step-ssy-deposit': {
            title: 'Make Initial Deposit (₹250 - ₹1,50,000)',
            shortTitle: 'Make Initial Deposit',
            description: 'Deposit minimum opening amount of ₹250 (up to ₹1.5 Lakh per financial year) via Cash, Cheque, Demand Draft, or online IPPB transfer.',
          },
          'step-ssy-passbook': {
            title: 'Collect SSY Passbook & Download 80C Tax Deduction Receipt',
            shortTitle: 'Passbook & 80C Receipt',
            description: 'Receive dedicated Sukanya Samriddhi Passbook with account number. Download deposit receipts for filing annual Income Tax returns under Section 80C.',
          },
        },
      },
      'nsp-scholarship': {
        title: 'National Scholarship Portal (NSP) Post-Matric & Higher Education',
        description: 'Central and state scholarship assistance providing 100% tuition reimbursement, maintenance allowances, and book grants for eligible students.',
        category: 'Education & Scholarships',
        steps: {
          'step-nsp-otr': {
            title: 'Generate One-Time Registration (OTR) with Aadhaar FaceRD',
            shortTitle: 'OTR Registration',
            description: 'Install AadhaarFaceRD & NSP OTR App or visit scholarships.gov.in to generate your unique 14-digit OTR number via facial authentication or Aadhaar OTP.',
          },
          'step-nsp-profile': {
            title: 'Complete Student Profile & Select Eligible Scheme',
            shortTitle: 'Profile & Scheme Selection',
            description: 'Log in with OTR credentials, select your AISHE/DISE registered institution, course, year of study, community category, and scheme.',
          },
          'step-nsp-docs': {
            title: 'Upload Mandatory Income, Caste, and Academic Proofs',
            shortTitle: 'Upload Documents',
            description: 'Upload verified Competent Authority Income Certificate, Category/Caste Certificate, Previous Year Marksheets, and Bonafide Student Certificate.',
          },
          'step-nsp-institute': {
            title: 'Institute Level Verification by Nodal Officer (INO)',
            shortTitle: 'Institute Verification',
            description: 'College or university Institute Nodal Officer (INO) reviews online application, tallies enrollment records and fee receipts, and forwards to District/State.',
          },
          'step-nsp-dbt': {
            title: 'State Sanction & Direct DBT Disbursement via PFMS',
            shortTitle: 'Sanction & DBT Credit',
            description: 'State Nodal Officer approves application; Public Financial Management System (PFMS) credits tuition fees and maintenance directly to student bank account.',
          },
        },
      },
    },
  },

  hinglish: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'Sarkari Process Navigator',
      featuredRoadmap: 'Featured Roadmap',
      aboutUs: 'Hamare Baare Mein',
      directory: 'Directory',
      findGuidance: 'Guidance dekhein',
      selectLanguage: 'Bhasha Chunein',
      themeLight: 'Light mode karein',
      themeDark: 'Dark mode karein',
      canvasBtn: 'Interactive Canvas',
      menu: 'Menu kholein',
      closeMenu: 'Menu band karein',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'Sarkari Process Navigator',
      findGuidance: 'Guidance dekhein',
      title: 'Sarkari Kaam-Kaaj Ko Aasan Banayein',
      queryHeading: 'Apne sawaal poochhein',
      viewRoadmaps: 'roadmaps ki soochi dekhein',
      helplineTitle: 'Rashtriya Portal Helpline',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'Sarathi Parivahan',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'roadmaps explore karein',
    },
    heroCategories: {
      business: 'Business',
      businessSub: '& Licenses',
      property: 'Property',
      propertySub: '& Zameen',
      idDocs: 'ID Dastavej',
      idDocsSub: '& Certificates',
      welfare: 'Sarkari Yojna',
      welfareSub: '& Labh',
      tax: 'Tax',
      taxSub: '& Finance',
      education: 'Shiksha',
      educationSub: '& Scholarships',
      more: 'Aur',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'Nagrik sahayata',
      servicesCount: '500+',
      servicesLabel: 'Services indexed',
      languagesCount: '12+',
      languagesLabel: 'Bhashayein',
      exploreTitle: 'Explore guided roadmaps',
      exploreDesc: 'Har lakshya ke liye step-by-step guidance',
    },
    search: {
      placeholder: 'Kisi bhi bhasha mein poochhein... jaise driving license renew kaise karein',
      submitBtn: 'Khojein',
      searchBtnAria: 'Roadmaps khojein',
      recommendedRoadmaps: 'Recommended Roadmaps',
      searchResults: 'Khoj Ke Parinaam',
      dropdownHeader: 'Official Civic Roadmaps',
      dropdownEnterHint: 'Chunne ke liye Enter dabayein',
      noResults: 'Direct match nahi mila. Sambandhit roadmaps dekhne ke liye Enter dabayein.',
      stepsCount: 'steps',
      estimatedTime: 'Samay',
      statutoryFee: 'Sarkari Fees',
      officialPortal: 'Official Portal',
      clearQuery: 'Saaf karein',
      voiceSearch: 'Bolkar search karein',
      voiceListening: 'Sun rahe hain... Apna sawal bolein',
      voiceStop: 'Voice input rokein',
      voiceUnsupported: 'Is browser mein voice input support nahi karta.',
      uploadDoc: 'Document attach karein (PDF, Word, TXT, Images)',
      removeDoc: 'Document hatayein',
      fileLimitError: 'File size 10MB se kam hona chahiye.',
      fileFormatError: 'Kripya PDF, Word document, TXT, ya image file upload karein.',
      supportedFormats: 'Supported: PDF, DOCX, TXT, JPG, PNG, WEBP (10MB tak)',
    },
    about: {
      sectionTitle: 'Hamare Baare Mein',
      sectionSubtitle: 'Jatil sarkari prashasan ko seedhe, aasan aur spasht roadmaps mein badalna.',
      card1Heading: 'Official Sarkari Portals Se Seedha Data',
      card1Body: 'Sarkari ministry portals (.gov.in aur .nic.in) se seedhe li gayi pramanit jankari. Na koi dalal, na koi uljhan, aur na hi koi extra kharcha.',
      card1Tag: 'Kendriya Aur Rajya Sarkar',
      side1Heading: 'Pramanit Jaruratein',
      side1Text: 'Har roadmap par jaruri dastavej, authorized forms, aur sarkari fees schedule dekhein.',
      side1Btn: 'Roadmaps dekhein',
      card2Heading: 'Akele Applicant Aur Business Dono Ke Liye',
      card2BodyTeam: 'Company banayein, multiple directors jodein, commercial food safety license lein, aur tax registration bina kisi rukawat ke poora karein.',
      card2BodySolo: 'Personal driving license renewal, citizen praman-patra, aur aam permits bina kisi bekar documents ke aasaani se banwayein.',
      withTeam: 'Team ke saath',
      soloApplicant: 'Akele applicant',
      scope: '< Scope >',
      side2Heading: 'Offline Checklists',
      side2Text: 'Daftar jaane se pehle offline checklist download karein ya interactive list se apne papers verify karein.',
      side2Btn: 'Checklists dekhein',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'Sarathi Parivahan',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'Rashtriya Portal ↗',
      disclaimer: 'UntangleAI ek open-access civic navigation tool hai. Jankari, sarkari niyam aur forms seedhe official gazettes aur ministry portals se liye gaye hain.',
      copyright: '© 2026 UntangleAI. Transparent public administration ke liye samarpit.',
    },
    roadmap: {
      backToSearch: 'UntangleAI Search Par Vaapas',
      search: 'Khojein',
      canvas: 'Graph View',
      list: 'Soochi View',
      shareRoadmap: 'Roadmap share karein',
      shareSuccess: 'Roadmap link copy ho gaya hai!',
      resetProgress: 'Progress reset karein',
      toggleTheme: 'Theme badlein',
      stepsProgress: 'steps poore hue',
      step: 'Step',
      of: 'ka',
      status: 'Sthiti',
      action: 'Action',
      document: 'Dastavej',
      prerequisite: 'Jaruri Shart',
      info: 'Jankari',
      completed: 'Poora hua',
      locked: 'Locked',
      pending: 'Taiyar',
      inProgress: 'Chalu hai',
      markCompleted: 'Complete mark karein',
      markIncomplete: 'Incomplete mark karein',
      prerequisitesRequired: 'Pehle pichle steps poore karein',
      officialPortal: 'Official Portal Par Jaayein',
      department: 'Vibhag / Office',
      location: 'Sthan',
      statutoryFee: 'Sarkari Fees',
      estimatedTimeline: 'Anumanit Samay',
      legalBasis: 'Kanooni Aadhar',
      requiredDocs: 'Jaruri Dastavej Aur Shartein',
      mandatory: 'Anivarya',
      optional: 'Aichhik',
      selectRoadmap: 'Roadmap chunein',
      close: 'Band karein',
      interactive: 'Interactive',
      canvasTip: 'Kisi bhi step par click karke documents aur fees dekhein',
      officialSource: 'Official Government Source',
      legendAction: 'Action Step',
      legendDoc: 'Document / Form',
      legendPrereq: 'Prerequisite',
      legendCompleted: 'Completed',
      legendLocked: 'Prereqs Pending',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'Private Limited Company Register Karein',
        description: 'Ministry of Corporate Affairs (MCA21 V3 / SPICe+) ke dwara poora company registration process',
        category: 'Business & Commercial',
        steps: {
          'step-dsc': {
            title: 'Class 3 Digital Signature Certificate (DSC) Prapt Karein',
            shortTitle: 'Class 3 DSC',
            description: 'Sabhi directors ke paas MCA21 e-forms digitally sign karne ke liye Class-3 DSC hona anivarya hai.',
          },
          'step-spice-name': {
            title: 'Company Ka Unique Naam Reserve Karein (SPICe+ Part A)',
            shortTitle: 'Naam Reservation',
            description: 'Companies Rules 2014 ke anusar do pasandida naamon ki preference submit karein.',
          },
          'step-din': {
            title: 'Director Identification Number (DIN Allocation)',
            shortTitle: 'DIN Allocation',
            description: 'Naye directors ke liye 8-digit ka unique DIN number aavantit karwayein.',
          },
          'step-moa-aoa': {
            title: 'Electronic MOA (INC-33) aur AOA (INC-34) Tayyar Karein',
            shortTitle: 'e-MOA aur e-AOA',
            description: 'Company ke uddeshya aur internal rules define karne ke liye e-MOA aur e-AOA draft karein.',
          },
          'step-spice-part-b': {
            title: 'SPICe+ Part B Integrated Incorporation Filing',
            shortTitle: 'SPICe+ Part B',
            description: 'Company PAN, TAN, EPFO, ESIC aur Incorporation Certificate ke liye single application jama karein.',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S Anivarya Registration',
            shortTitle: 'AGILE-PRO-S',
            description: 'GSTIN, EPFO, ESIC, Professional Tax aur bank account kholne ke liye AGILE-PRO-S form bharein.',
          },
          'step-inc-20a': {
            title: 'Vyavasay Shuru Karne Ki Ghoshna (Form INC-20A)',
            shortTitle: 'INC-20A Ghoshna',
            description: 'Directors dwara share capital jama karne ki pushti ke liye 180 din ke andar Form INC-20A file karein.',
          },
        },
      },
      'driving-license-delhi': {
        title: 'Driving License Renew Karein (Delhi NCT)',
        description: 'Sarathi Parivahan ke tahat step-by-step renewal process',
        category: 'Transport & Driving',
        steps: {
          'step-learner-app': {
            title: 'Learner License (LL) Ke Liye Online Apply Karein',
            shortTitle: 'LL Online Apply',
            description: 'Sarathi Parivahan portal par Aadhaar e-KYC ke saath Form 2 bharein aur documents upload karein.',
          },
          'step-ll-slot': {
            title: 'LL Traffic Rules Test Ke Liye Slot Book Karein',
            shortTitle: 'Test Slot Booking',
            description: 'Traffic niyam pariksha ke liye online ya RTO center par slot book karein.',
          },
          'step-dl-training': {
            title: '30-Din Ka Anivarya Training Period Aur Practice',
            shortTitle: '30 Din Practice',
            description: 'LL issue hone ke baad permanent DL test ke liye kam se kam 30 din ka waiting period poora karein.',
          },
          'step-dl-test-slot': {
            title: 'Permanent DL Driving Test Ka Slot Book Karein',
            shortTitle: 'Driving Test Slot',
            description: 'Automated driving test track (ADTT) chunein aur driving test ka slot schedule karein.',
          },
          'step-dl-track-test': {
            title: 'Automated Driving Test Track (ADTT) Par Test Dein',
            shortTitle: 'ADTT Driving Test',
            description: 'Camera-monitored track par reverse S, parallel parking aur gradient test pass karein.',
          },
          'step-dl-dispatch': {
            title: 'Biometrics Verification Aur DL Postal Dispatch',
            shortTitle: 'Biometrics & Dispatch',
            description: 'Photo aur signature verification poora karein; Smart Card DL Speed Post se ghar bheja jayega.',
          },
        },
      },
      'fssai-food-license': {
        title: 'FSSAI Food Business License Apply Karein',
        description: 'Food business ke liye FoSCoS portal se official licensing aur registration',
        category: 'Food & Commercial Safety',
        steps: {
          'step-foscos-eligibility': {
            title: 'License Eligibility Aur Annual Turnover Check Karein',
            shortTitle: 'Eligibility Check',
            description: 'Dekhein ki aapka business Basic Registration (< ₹12 Lakh) me aata hai ya State/Central License (> ₹12 Lakh) me.',
          },
          'step-foscos-docs': {
            title: 'Jaruri Dastavej Aur Hygiene Papers Ikatha Karein',
            shortTitle: 'Dastavej Dossier',
            description: 'Govt ID, rent agreement/bijli bill, water test report aur FSMS safety plan tayyar karein.',
          },
          'step-foscos-form-b': {
            title: 'FoSCoS Portal Par Form B Submit Karein',
            shortTitle: 'FoSCoS Online Form',
            description: 'foscos.fssai.gov.in par account banayein, food business category chunein aur online fee bharein.',
          },
          'step-fso-inspection': {
            title: 'Food Safety Officer (FSO) Premise Inspection',
            shortTitle: 'FSO Inspection',
            description: 'Adhikari dwara kitchen hygiene, medical fitness certificates aur storage ki jaanch ki jayegi.',
          },
          'step-fssai-certificate': {
            title: 'FSSAI Certificate Download Karein Aur Display Karein',
            shortTitle: 'Certificate Download',
            description: 'Approval milne par 14-digit ka FSSAI certificate download karein aur entrance par lagayein.',
          },
        },
      },
      'pmay-housing': {
        title: 'Pradhan Mantri Awas Yojana (PMAY-G / Sabke Liye Ghar)',
        description: 'Pakka makan banane ke liye sarkari grant, geo-tagged inspection aur seedhe bank me DBT kistein.',
        category: 'Property Aur Zameen',
        steps: {
          'step-pmay-check': {
            title: 'Priority List Aur Zameen Ke Kagzat Check Karein',
            shortTitle: 'Eligibility Jaanch',
            description: 'Awaas+ aur SECC list me apna naam check karein aur ghar ki zameen ka patta verify karein.',
          },
          'step-pmay-kyc': {
            title: 'Bank Account Ko Aadhaar Aur NPCI Se Link Karein',
            shortTitle: 'Aadhaar Bank Seeding',
            description: 'Direct Benefit Transfer ke liye single savings khate ko Aadhaar aur NPCI mapper se jodein.',
          },
          'step-pmay-geotag-pre': {
            title: 'Panchayat Adhikari Dwara Site Ka Geo-tagging',
            shortTitle: 'Pre-construction Geo-tag',
            description: 'Panchayat Sachiv AwaasApp ke zariye zameen ki geo-tagged photo kheench kar upload karenge.',
          },
          'step-pmay-inst-1': {
            title: 'Pehli Kist (₹40,000 Plinth Level) Prapt Karein',
            shortTitle: 'Pehli Kist Release',
            description: 'Sanction letter milne ke baad seedhe account me neenv khodne ke liye pehli kist credit hogi.',
          },
          'step-pmay-geotag-roof': {
            title: 'Deewar Aur Chhat Dhalai Ki Inspection Aur Doosri Kist',
            shortTitle: 'Mid-stage Inspection',
            description: 'Khidki aur lintel level tak deewar banne par doosra geo-tag hoga aur agle ₹60,000 - ₹70,000 aayenge.',
          },
          'step-pmay-completion': {
            title: 'Makan Tayyar Hone Ka Verification Aur Shauchalay Grant',
            shortTitle: 'Final Completion Grant',
            description: 'Chhat dhalai, rangai aur Swachh Bharat shauchalay banne par bachi hui kist aur ₹12,000 toilet grant milega.',
          },
        },
      },
      'pm-kisan-welfare': {
        title: 'PM-Kisan Samman Nidhi & Farmer Sahayata',
        description: 'Kisan parivaron ke liye har saal ₹6,000 ki aarthik sahayata, ₹2,000 ki teen quarterly DBT kiston me.',
        category: 'Social Welfare Aur Kisan',
        steps: {
          'step-kisan-land': {
            title: 'Zameen Ke Dastavej (Bhulekh / 7/12 / Khasra) Check Karein',
            shortTitle: 'Zameen Record Check',
            description: 'Kisan ke naam par kheti ki zameen aur revenue record me khata/khasra number confirm karein.',
          },
          'step-kisan-reg': {
            title: 'PM-Kisan Portal Par Naya Farmer Registration Bharein',
            shortTitle: 'Farmer Registration',
            description: 'Aadhaar number, mobile OTP aur zameen ki details daalkar pmkisan.gov.in par register karein.',
          },
          'step-kisan-npci': {
            title: 'Bank Account Ko NPCI DBT Bridge Se Link Karein',
            shortTitle: 'NPCI Bank Linkage',
            description: 'Apne bank me jakar Aadhaar seeding karwayein taaki kist seedhe bina rukaawat credit ho.',
          },
          'step-kisan-ekyc': {
            title: 'Mandatory e-KYC Verification Pura Karein',
            shortTitle: 'Mandatory e-KYC',
            description: 'Mobile OTP, CSC centre biometric ya PM-KISAN app par Face Authentication se e-KYC karein.',
          },
          'step-kisan-approval': {
            title: 'State Approval Aur ₹2,000 Kist Transfer Status',
            shortTitle: 'Approval & DBT Credit',
            description: 'Zila kheti adhikari ki verification ke baad har 4 mahine me ₹2,000 account me aana shuru ho jayenge.',
          },
        },
      },
      'ayushman-bharat': {
        title: 'Ayushman Bharat PM-JAY Health Card',
        description: 'Har saal pure parivar ke liye ₹5 Lakh tak ka cashless ilaj, sarkari aur top private hospitals me.',
        category: 'Health Aur Welfare',
        steps: {
          'step-pmjay-check': {
            title: 'Ration Card Ya Aadhaar Se Eligibility Check Karein',
            shortTitle: 'Eligibility Check',
            description: 'beneficiary.nha.gov.in par Ration Card ya Family ID daalkar dekhein ki naam list me hai ya nahi.',
          },
          'step-pmjay-abha': {
            title: '14-Digit Ka ABHA Health Account Banayein',
            shortTitle: 'ABHA Health ID',
            description: 'Apne digital medical records aur prescriptions ke liye Aadhaar se ABHA card banayein.',
          },
          'step-pmjay-kyc': {
            title: 'Aadhaar e-KYC Verification Pura Karein',
            shortTitle: 'Complete e-KYC',
            description: 'Portal par selfie/OTP se ya CSC/Mo Seva Kendra par biometric fingerprint se e-KYC karein.',
          },
          'step-pmjay-card': {
            title: 'Ayushman Bharat Golden Card Download Karein',
            shortTitle: 'Golden Card Download',
            description: 'Approval hote hi QR-code wala Golden Card download karein ya hospital kiosk se PVC card lein.',
          },
          'step-pmjay-hospital': {
            title: 'Empanelled Hospital Me Cashless Admission Lein',
            shortTitle: 'Cashless Ilaj',
            description: 'Hospital me Ayushman Mitra desk par card dikhayein aur bina koi paisa diye cashless admit ho.',
          },
        },
      },
      'sukanya-samriddhi': {
        title: 'Sukanya Samriddhi Yojana (SSY) & Section 80C Tax Chhut',
        description: 'Beti ke bhavishya ke liye sarkari bachat khata, 8.2% byaj aur Income Tax Section 80C me tax chhut.',
        category: 'Tax Aur Bachat',
        steps: {
          'step-ssy-eligibility': {
            title: 'Beti Ki Umra Aur Eligibility Confirm Karein',
            shortTitle: 'Age & Eligibility Check',
            description: 'Janm se lekar 10 saal tak ki beti ke naam par mata-pita ya legal guardian khata khol sakte hain.',
          },
          'step-ssy-kyc': {
            title: 'Guardian KYC Aur Beti Ka Birth Certificate Ikatha Karein',
            shortTitle: 'Kagzat Tayyari',
            description: 'Mata-pita ka PAN, Aadhaar, photo aur beti ka official janam praman patra attach karein.',
          },
          'step-ssy-apply': {
            title: 'Form SSA-1 Bhar Kar Post Office Ya Bank Me Jama Karein',
            shortTitle: 'Form SSA-1 Submit',
            description: 'Nazdeeki Dakghar ya authorized sarkari bank branch me khata kholne ka form bharein.',
          },
          'step-ssy-deposit': {
            title: 'Pehli Jama Rashi (Kam Se Kam ₹250) Jama Karein',
            shortTitle: 'Initial Deposit',
            description: 'Kam se kam ₹250 cash ya cheque se jama karein (saal me ₹1.5 Lakh tak deposit kar sakte hain).',
          },
          'step-ssy-passbook': {
            title: 'SSY Passbook Lein Aur 80C Tax Receipt Download Karein',
            shortTitle: 'Passbook & 80C Receipt',
            description: 'Passbook prapt karein aur ITR me Section 80C deduction claim karne ke liye receipt sambhal kar rakhein.',
          },
        },
      },
      'nsp-scholarship': {
        title: 'National Scholarship Portal (NSP) Post-Matric & Higher Education',
        description: 'Students ke liye 100% tuition fees reimbursement, maintenance allowances aur book grants.',
        category: 'Education Aur Scholarships',
        steps: {
          'step-nsp-otr': {
            title: 'Aadhaar FaceRD Se 14-Digit OTR Number Banayein',
            shortTitle: 'OTR Registration',
            description: 'NSP portal ya app par One-Time Registration (OTR) generate karein Aadhaar verification ke zariye.',
          },
          'step-nsp-profile': {
            title: 'Student Profile Bharein Aur Scheme Select Karein',
            shortTitle: 'Scheme Chunein',
            description: 'Apne college ka AISHE code, course, category aur applicable Post-Matric scholarship chunein.',
          },
          'step-nsp-docs': {
            title: 'Aay Praman Patra, Marksheet Aur Bonafide Certificate Upload Karein',
            shortTitle: 'Dastavej Upload',
            description: 'Tehsildar dwara jari income certificate, college bonafide aur pichle saal ki marksheet upload karein.',
          },
          'step-nsp-institute': {
            title: 'College / Institute Nodal Officer Dwara Verification',
            shortTitle: 'Institute Verification',
            description: 'College ke scholarship desk par jakar biometric ya document scrutiny confirm karwayein.',
          },
          'step-nsp-dbt': {
            title: 'State Sanction Aur PFMS DBT Se Bank Khate Me Credit',
            shortTitle: 'Scholarship Credit',
            description: 'State approval ke baad PFMS ke zariye seedhe student ke Aadhaar-seeded bank khate me scholarship credit hogi.',
          },
        },
      },
    },
  },

  hi: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'नागरिक प्रक्रिया पथप्रदर्शक',
      featuredRoadmap: 'विशेष रोडमैप',
      aboutUs: 'हमारे बारे में',
      directory: 'निर्देशिका',
      findGuidance: 'मार्गदर्शन पाएं',
      selectLanguage: 'भाषा चुनें',
      themeLight: 'लाइट मोड करें',
      themeDark: 'डार्क मोड करें',
      canvasBtn: 'इंटरैक्टिव कैनवास',
      menu: 'मेनू खोलें',
      closeMenu: 'मेनू बंद करें',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'नागरिक प्रक्रिया पथप्रदर्शक',
      findGuidance: 'मार्गदर्शन पाएं',
      title: 'सरकारी प्रक्रियाओं को सरल बनाएं',
      queryHeading: 'अपने प्रश्न पूछें',
      viewRoadmaps: 'रोडमैप सूची देखें',
      helplineTitle: 'राष्ट्रीय सरकारी सेवा पोर्टल हेल्पलाइन',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'सारथी परिवहन',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'रोडमैप देखें',
    },
    heroCategories: {
      business: 'व्यवसाय',
      businessSub: 'एवं लाइसेंस',
      property: 'संपत्ति',
      propertySub: 'एवं भूमि',
      idDocs: 'पहचान पत्र',
      idDocsSub: 'एवं प्रमाण पत्र',
      welfare: 'कल्याणकारी योजनाएं',
      welfareSub: 'एवं लाभ',
      tax: 'कर (Tax)',
      taxSub: 'एवं वित्त',
      education: 'शिक्षा',
      educationSub: 'एवं छात्रवृत्ति',
      more: 'अधिक',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'नागरिकों की सहायता',
      servicesCount: '500+',
      servicesLabel: 'सेवाएं अनुक्रमित',
      languagesCount: '12+',
      languagesLabel: 'भाषाएं',
      exploreTitle: 'निर्देशित रोडमैप देखें',
      exploreDesc: 'नागरिक लक्ष्यों के लिए चरण-दर-चरण मार्गदर्शिका',
    },
    search: {
      placeholder: 'किसी भी भाषा में पूछें... जैसे ड्राइविंग लाइसेंस कैसे रिन्यू करें',
      submitBtn: 'खोजें',
      searchBtnAria: 'नागरिक रोडमैप खोजें',
      recommendedRoadmaps: 'अनुशंसित रोडमैप',
      searchResults: 'खोज परिणाम',
      dropdownHeader: 'आधिकारिक नागरिक रोडमैप',
      dropdownEnterHint: 'चुनने के लिए Enter दबाएं',
      noResults: 'कोई सीधा परिणाम नहीं मिला। संबंधित रोडमैप देखने के लिए Enter दबाएं।',
      stepsCount: 'चरण',
      estimatedTime: 'समय',
      statutoryFee: 'सरकारी शुल्क',
      officialPortal: 'आधिकारिक पोर्टल',
      clearQuery: 'साफ़ करें',
      voiceSearch: 'बोलकर खोजें',
      voiceListening: 'सुन रहे हैं... अपना प्रश्न बोलें',
      voiceStop: 'वॉइस इनपुट बंद करें',
      voiceUnsupported: 'इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।',
      uploadDoc: 'दस्तावेज़ संलग्न करें (PDF, Word, TXT, छवियां)',
      removeDoc: 'दस्तावेज़ हटाएं',
      fileLimitError: 'फ़ाइल का आकार 10MB से कम होना चाहिए।',
      fileFormatError: 'कृपया PDF, Word दस्तावेज़, TXT या छवि फ़ाइल अपलोड करें।',
      supportedFormats: 'समर्थित: PDF, DOCX, TXT, JPG, PNG, WEBP (10MB तक)',
    },
    about: {
      sectionTitle: 'हमारे बारे में',
      sectionSubtitle: 'जटिल सार्वजनिक प्रशासन को पारदर्शी और स्पष्ट रोडमैप में बदलना।',
      card1Heading: 'आधिकारिक सरकारी पोर्टलों से प्रमाणित',
      card1Body: 'मंत्रालय पोर्टलों (.gov.in और .nic.in) से सीधे सत्यापित प्रक्रियात्मक मार्गदर्शन। न कोई दलाल, न कोई भ्रामक शब्दावली, पूरी पारदर्शिता।',
      card1Tag: 'केंद्रीय एवं राज्य क्षेत्राधिकार',
      side1Heading: 'सत्यापित आवश्यकताएं',
      side1Text: 'प्रत्येक रोडमैप पर आवश्यक दस्तावेज, अधिकृत प्रपत्र और वैधानिक शुल्क अनुसूची देखें।',
      side1Btn: 'रोडमैप देखें',
      card2Heading: 'व्यक्तिगत आवेदकों और उद्यमों दोनों के अनुकूल',
      card2BodyTeam: 'कंपनी स्थापित करें, निदेशकों को जोड़ें, वाणिज्यिक खाद्य सुरक्षा लाइसेंस प्राप्त करें और कर पंजीकरण की पूर्ण अनुपालना करें।',
      card2BodySolo: 'ड्राइविंग लाइसेंस नवीनीकरण, नागरिक प्रमाण पत्र और व्यक्तिगत अनुमतियों को बिना अनावश्यक दस्तावेजों के सुगमता से प्राप्त करें।',
      withTeam: 'टीम के साथ',
      soloApplicant: 'एकल आवेदक',
      scope: '< दायरा >',
      side2Heading: 'ऑफ़लाइन चेकलिस्ट',
      side2Text: 'अधिकारियों के पास जाने से पहले अपने दस्तावेजों को ऑफ़लाइन ट्रैक करें या इंटरैक्टिव चेकलिस्ट का उपयोग करें।',
      side2Btn: 'चेकलिस्ट देखें',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'सारथी परिवहन',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'राष्ट्रीय पोर्टल ↗',
      disclaimer: 'UntangleAI एक सार्वजनिक नागरिक मार्गदर्शन उपकरण है। प्रक्रियात्मक नियम, समय-सीमाएं और प्रपत्र आधिकारिक राजपत्रों और मंत्रालयों से संकलित हैं।',
      copyright: '© 2026 UntangleAI. पारदर्शी सार्वजनिक प्रशासन के लिए निर्मित।',
    },
    roadmap: {
      backToSearch: 'UntangleAI खोज पर वापस जाएं',
      search: 'खोजें',
      canvas: 'ग्राफ दृश्य',
      list: 'सूची दृश्य',
      shareRoadmap: 'रोडमैप साझा करें',
      shareSuccess: 'रोडमैप लिंक क्लिपबोर्ड में कॉपी हो गया!',
      resetProgress: 'प्रगति रीसेट करें',
      toggleTheme: 'थीम बदलें',
      stepsProgress: 'चरण पूर्ण',
      step: 'चरण',
      of: 'का',
      status: 'स्थिति',
      action: 'कार्रवाई',
      document: 'दस्तावेज़',
      prerequisite: 'पूर्व-शर्त',
      info: 'जानकारी',
      completed: 'पूर्ण',
      locked: 'अवरुद्ध (Locked)',
      pending: 'शुरू करने के लिए तैयार',
      inProgress: 'प्रगति पर',
      markCompleted: 'पूर्ण चिह्नित करें',
      markIncomplete: 'अपूर्ण चिह्नित करें',
      prerequisitesRequired: 'पूर्व-शर्तें आवश्यक हैं',
      officialPortal: 'आधिकारिक पोर्टल पर जाएं',
      department: 'प्राधिकरण / कार्यालय',
      location: 'स्थान',
      statutoryFee: 'वैधानिक शुल्क',
      estimatedTimeline: 'अनुमानित समय',
      legalBasis: 'आधिकारिक विधिक आधार',
      requiredDocs: 'आवश्यक दस्तावेज़ एवं शर्तें',
      mandatory: 'अनिवार्य',
      optional: 'वैकल्पिक',
      selectRoadmap: 'रोडमैप चुनें',
      close: 'बंद करें',
      interactive: 'इंटरैक्टिव',
      canvasTip: 'दस्तावेज़, शुल्क और आधिकारिक लिंक देखने के लिए किसी भी चरण पर क्लिक करें',
      officialSource: 'आधिकारिक सरकारी स्रोत',
      legendAction: 'कार्य चरण',
      legendDoc: 'दस्तावेज़ / फ़ॉर्म',
      legendPrereq: 'पूर्व-आवश्यकता',
      legendCompleted: 'पूर्ण',
      legendLocked: 'शर्तें लंबित',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'प्राइवेट लिमिटेड कंपनी पंजीकृत करें',
        description: 'कॉर्पोरेट कार्य मंत्रालय (MCA21 V3 / SPICe+) के माध्यम से पूर्ण पंजीकरण रोडमैप',
        category: 'व्यापार एवं वाणिज्यिक',
        steps: {
          'step-dsc': {
            title: 'क्लास 3 डिजिटल सिग्नेचर सर्टिफिकेट (DSC) प्राप्त करें',
            shortTitle: 'क्लास 3 DSC',
            description: 'MCA21 ई-फॉर्म को डिजिटल रूप से हस्ताक्षरित करने के लिए सभी निदेशकों के पास वैध क्लास-3 DSC होना अनिवार्य है।',
          },
          'step-spice-name': {
            title: 'कंपनी का विशिष्ट नाम आरक्षित करें (SPICe+ Part A / RUN)',
            shortTitle: 'नाम आरक्षण',
            description: 'कंपनी नियम 2014 के दिशा-निर्देशों के अनुसार प्राथमिकता क्रम में दो प्रस्तावित नाम जमा करें।',
          },
          'step-din': {
            title: 'निदेशक पहचान संख्या (DIN आवंटन)',
            shortTitle: 'DIN आवंटन',
            description: 'उन प्रस्तावित निदेशकों के लिए 8-अंकीय विशिष्ट DIN प्राप्त करें जिनके पास वर्तमान में DIN नहीं है।',
          },
          'step-moa-aoa': {
            title: 'इलेक्ट्रॉनिक MOA (INC-33) और AOA (INC-34) तैयार करें',
            shortTitle: 'e-MOA एवं e-AOA',
            description: 'कंपनी के उद्देश्यों और आंतरिक नियमों को परिभाषित करने वाले ई-मेमोरेंडम और ई-आर्टिकल्स तैयार करें।',
          },
          'step-spice-part-b': {
            title: 'SPICe+ पार्ट B एकीकृत निगमन फाइलिंग',
            shortTitle: 'SPICe+ पार्ट B',
            description: 'कंपनी PAN, TAN, EPFO, ESIC और निगमन प्रमाण पत्र के लिए एकल खिड़की आवेदन।',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S अनिवार्य पंजीकरण',
            shortTitle: 'AGILE-PRO-S पंजीकरण',
            description: 'GSTIN पंजीकरण, EPFO, ESIC, व्यावसायिक कर और कॉर्पोरेट बैंक खाता खोलने के लिए अनिवार्य फाइलिंग।',
          },
          'step-inc-20a': {
            title: 'व्यवसाय प्रारंभ करने की घोषणा (फॉर्म INC-20A)',
            shortTitle: 'INC-20A घोषणा',
            description: 'निगमन के 180 दिनों के भीतर घोषणा दाखिल करें कि निदेशकों ने अपनी सहमत शेयर पूंजी जमा कर दी है।',
          },
        },
      },
      'driving-license-delhi': {
        title: 'ड्राइविंग लाइसेंस नवीनीकृत करें (दिल्ली एनसीटी)',
        description: 'सारथी परिवहन (सड़क परिवहन और राजमार्ग मंत्रालय) के तहत चरणबद्ध नवीनीकरण प्रक्रिया',
        category: 'परिवहन एवं ड्राइविंग',
        steps: {
          'step-learner-app': {
            title: 'लर्नर लाइसेंस (LL) के लिए ऑनलाइन आवेदन करें',
            shortTitle: 'LL ऑनलाइन आवेदन',
            description: 'सारथी परिवहन पोर्टल पर आधार ई-केवाईसी के साथ फॉर्म 2 जमा करें और दस्तावेज अपलोड करें।',
          },
          'step-ll-slot': {
            title: 'LL यातायात नियम परीक्षा के लिए स्लॉट बुक करें',
            shortTitle: 'परीक्षा स्लॉट बुकिंग',
            description: 'ऑनलाइन या व्यक्तिगत कंप्यूटर आधारित यातायात नियम परीक्षा के लिए तारीख और समय स्लॉट निर्धारित करें।',
          },
          'step-dl-training': {
            title: 'अनिवार्य 30-दिवसीय प्रशिक्षण अवधि और ड्राइविंग अभ्यास',
            shortTitle: '30-दिवसीय अभ्यास',
            description: 'मार्गदर्शन में ड्राइविंग अभ्यास करते हुए LL जारी होने की तारीख से न्यूनतम 30 दिनों की अनिवार्य अवधि पूरी करें।',
          },
          'step-dl-test-slot': {
            title: 'स्थायी DL ड्राइविंग टेस्ट स्लॉट बुक करें',
            shortTitle: 'ड्राइविंग टेस्ट स्लॉट',
            description: 'स्वचालित ड्राइविंग टेस्ट ट्रैक (ADTT) स्थान चुनें और अपने व्यावहारिक ड्राइविंग टेस्ट का समय निर्धारित करें।',
          },
          'step-dl-track-test': {
            title: 'स्वचालित ड्राइविंग टेस्ट (ADTT) में उपस्थित हों',
            shortTitle: 'ADTT कौशल परीक्षा',
            description: 'कैमरा-निगरानी वाले स्वचालित ट्रैक पर ड्राइविंग युद्धाभ्यास पूरा करें।',
          },
          'step-dl-dispatch': {
            title: 'बायोमेट्रिक्स सत्यापन और DL डाक द्वारा प्रेषण',
            shortTitle: 'बायोमेट्रिक्स एवं प्रेषण',
            description: 'डिजिटल फोटो और हस्ताक्षर सत्यापन पूरा करें; स्मार्ट कार्ड DL स्पीड पोस्ट के माध्यम से आपके पते पर भेजा जाएगा।',
          },
        },
      },
      'fssai-food-license': {
        title: 'FSSAI खाद्य व्यवसाय लाइसेंस के लिए आवेदन करें',
        description: 'खाद्य व्यवसाय संचालकों के लिए FoSCoS पोर्टल के माध्यम से आधिकारिक लाइसेंसिंग और पंजीकरण प्रक्रिया',
        category: 'खाद्य एवं सुरक्षा',
        steps: {
          'step-foscos-eligibility': {
            title: 'लाइसेंस पात्रता और वार्षिक टर्नओवर निर्धारित करें',
            shortTitle: 'पात्रता निर्धारण',
            description: 'जांचें कि क्या आपका व्यवसाय मूल पंजीकरण (< ₹12 लाख) या राज्य/केंद्रीय लाइसेंस (> ₹12 लाख) के लिए पात्र है।',
          },
          'step-foscos-docs': {
            title: 'अनिवार्य परिसर एवं स्वच्छता दस्तावेज संकलित करें',
            shortTitle: 'दस्तावेज संकलन',
            description: 'सरकारी फोटो पहचान पत्र, परिसर का बिजली/किराया अनुबंध, जल परीक्षण रिपोर्ट और FSMS योजना एकत्र करें।',
          },
          'step-foscos-form-b': {
            title: 'FoSCoS पोर्टल पर फॉर्म B / पंजीकरण जमा करें',
            shortTitle: 'FoSCoS ऑनलाइन फॉर्म',
            description: 'foscos.fssai.gov.in पर खाता बनाएं, खाद्य श्रेणी चुनें, दस्तावेज अपलोड करें और ऑनलाइन शुल्क का भुगतान करें।',
          },
          'step-fso-inspection': {
            title: 'खाद्य सुरक्षा अधिकारी (FSO) परिसर निरीक्षण',
            shortTitle: 'FSO भौतिक निरीक्षण',
            description: 'नामित अधिकारी खाद्य भंडारण, रसोई उपकरण, कर्मचारियों के स्वास्थ्य प्रमाण पत्र और कीट नियंत्रण लॉग का निरीक्षण करता है।',
          },
          'step-fssai-certificate': {
            title: 'डिजिटल रूप से हस्ताक्षरित FSSAI प्रमाण पत्र डाउनलोड करें',
            shortTitle: 'प्रमाण पत्र डाउनलोड',
            description: 'अनुमोदन मिलने पर, 14-अंकीय FSSAI लाइसेंस प्रमाण पत्र डाउनलोड करें और इसे प्रवेश द्वार पर प्रदर्शित करें।',
          },
        },
      },
    },
  },

  ur: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'شہری طریقہ کار کا رہنما',
      featuredRoadmap: 'خاص روڈ میپ',
      aboutUs: 'ہمارے بارے میں',
      directory: 'ڈائریکٹری',
      findGuidance: 'رہنمائی حاصل کریں',
      selectLanguage: 'زبان منتخب کریں',
      themeLight: 'لائٹ موڈ کریں',
      themeDark: 'ڈارک موڈ کریں',
      canvasBtn: 'انٹرایکٹو کینوس',
      menu: 'مینو کھولیں',
      closeMenu: 'مینو بند کریں',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'شہری طریقہ کار کا رہنما',
      findGuidance: 'رہنمائی حاصل کریں',
      title: 'سرکاری دفتری نظام کو آسان بنائیں',
      queryHeading: 'اپنے سوالات پوچھیں',
      viewRoadmaps: 'روڈ میپس کی فہرست دیکھیں',
      helplineTitle: 'قومی سرکاری پورٹل ہیلپ لائن',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'سارتھی پریوہن',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'روڈ میپس دیکھیں',
    },
    heroCategories: {
      business: 'کاروبار',
      businessSub: 'اور لائسنس',
      property: 'جائیداد',
      propertySub: 'اور اراضی',
      idDocs: 'شناختی دستاویزات',
      idDocsSub: 'اور اسناد',
      welfare: 'سماجی بہبود',
      welfareSub: 'اور فوائد',
      tax: 'ٹیکس',
      taxSub: 'اور مالیات',
      education: 'تعلیم',
      educationSub: 'اور وظائف',
      more: 'مزید',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'شہریوں کی رہنمائی',
      servicesCount: '500+',
      servicesLabel: 'سرکاری خدمات',
      languagesCount: '12+',
      languagesLabel: 'زبانیں',
      exploreTitle: 'گائیڈڈ روڈ میپس دیکھیں',
      exploreDesc: 'مشترکہ مقاصد کے لیے مرحلہ وار رہنمائی',
    },
    search: {
      placeholder: 'کسی بھی زبان میں پوچھیں... جیسے ڈرائیونگ لائسنس کیسے رینیو کریں',
      submitBtn: 'تلاش کریں',
      searchBtnAria: 'روڈ میپس تلاش کریں',
      recommendedRoadmaps: 'تجویز کردہ روڈ میپس',
      searchResults: 'تلاش کے نتائج',
      dropdownHeader: 'سرکاری روڈ میپس',
      dropdownEnterHint: 'منتخب کرنے کے لیے Enter دبائیں',
      noResults: 'براہ راست کوئی نتیجہ نہیں ملا۔ متعلقہ روڈ میپس دیکھنے کے لیے Enter دبائیں۔',
      stepsCount: 'مراحل',
      estimatedTime: 'وقت',
      statutoryFee: 'سرکاری فیس',
      officialPortal: 'سرکاری پورٹل',
      clearQuery: 'صاف کریں',
      voiceSearch: 'بول کر تلاش کریں',
      voiceListening: 'سن رہے ہیں... اپنا سوال بولیں',
      voiceStop: 'آواز کا اندراج روکیں',
      voiceUnsupported: 'اس براؤزر میں وائس ان پٹ تعاون یافتہ نہیں ہے۔',
      uploadDoc: 'دستاویز منسلک کریں (PDF, Word, TXT, تصاویر)',
      removeDoc: 'دستاویز ہٹائیں',
      fileLimitError: 'فائل کا سائز 10MB سے کم ہونا چاہیے۔',
      fileFormatError: 'براہ کرم PDF، Word دستاویز، TXT، یا تصویری فائل اپ لوڈ کریں۔',
      supportedFormats: 'تعاون یافتہ: PDF, DOCX, TXT, JPG, PNG, WEBP (10MB تک)',
    },
    about: {
      sectionTitle: 'ہمارے بارے میں',
      sectionSubtitle: 'پیچیدہ عوامی انتظامی طریقہ کار کو شفاف اور قابل عمل روڈ میپس میں تبدیل کرنا۔',
      card1Heading: 'سرکاری پورٹلز سے براہ راست تصدیق شدہ',
      card1Body: 'وزارتی پورٹلز (.gov.in اور .nic.in) سے براہ راست حاصل کردہ تصدیق شدہ طریقہ کار۔ نہ کوئی ایجنٹ، نہ کوئی الجھن، مکمل شفافیت۔',
      card1Tag: 'مرکزی اور ریاستی دائرہ اختیار',
      side1Heading: 'تصدیق شدہ ضروریات',
      side1Text: 'ہر روڈ میپ پر درکار دستاویزات، مجاز فارمز اور سرکاری فیس کا شیڈول دیکھیں۔',
      side1Btn: 'روڈ میپس دیکھیں',
      card2Heading: 'انفرادی درخواست دہندگان اور کاروباری اداروں دونوں کے لیے موزوں',
      card2BodyTeam: 'کمپنیاں قائم کریں، ڈائریکٹرز شامل کریں، تجارتی فوڈ سیفٹی لائسنس حاصل کریں اور ٹیکس رجسٹریشن مکمل کریں۔',
      card2BodySolo: 'ڈرائیونگ لائسنس کی تجدید، شہری اسناد اور انفرادی اجازت نامے بغیر غیر ضروری دستاویزات کے باآسانی حاصل کریں۔',
      withTeam: 'ٹیم کے ساتھ',
      soloApplicant: 'انفرادی درخواست دہندہ',
      scope: '< دائرہ کار >',
      side2Heading: 'آف لائن چیک لسٹ',
      side2Text: 'دفاتر جانے سے پہلے اپنی دستاویزات کو آف لائن چیک کریں یا انٹرایکٹو چیک لسٹ استعمال کریں۔',
      side2Btn: 'چیک لسٹ دیکھیں',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'سارتھی پریوہن',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'قومی پورٹل ↗',
      disclaimer: 'UntangleAI ایک عوامی شہری رہنمائی کا ٹول ہے۔ طریقہ کار، قانونی حدود اور فارمز سرکاری گزٹ اور وزارتوں سے براہ راست حاصل کیے گئے ہیں۔',
      copyright: '© 2026 UntangleAI۔ شفاف عوامی انتظامیہ کے لیے بنایا گیا۔',
    },
    roadmap: {
      backToSearch: 'UntangleAI تلاش پر واپس جائیں',
      search: 'تلاش',
      canvas: 'گراف ویو',
      list: 'فہرست ویو',
      shareRoadmap: 'روڈ میپ شیئر کریں',
      shareSuccess: 'روڈ میپ کا لنک کاپی ہو گیا!',
      resetProgress: 'پیشرفت ری سیٹ کریں',
      toggleTheme: 'تھیم تبدیل کریں',
      stepsProgress: 'مراحل مکمل',
      step: 'مرحلہ',
      of: 'کا',
      status: 'حیثیت',
      action: 'کارروائی',
      document: 'دستاویز',
      prerequisite: 'لازمی شرط',
      info: 'معلومات',
      completed: 'مکمل',
      locked: 'مقفل (Locked)',
      pending: 'تیار',
      inProgress: 'جاری ہے',
      markCompleted: 'مکمل نشان زد کریں',
      markIncomplete: 'نامکمل نشان زد کریں',
      prerequisitesRequired: 'پچھلی شرائط لازمی ہیں',
      officialPortal: 'سرکاری پورٹل پر جائیں',
      department: 'ادارہ / دفتر',
      location: 'مقام',
      statutoryFee: 'قانونی فیس',
      estimatedTimeline: 'متوقع وقت',
      legalBasis: 'باضابطہ قانونی بنیاد',
      requiredDocs: 'درکار دستاویزات اور شرائط',
      mandatory: 'لازمی',
      optional: 'اختیاری',
      selectRoadmap: 'روڈ میپ منتخب کریں',
      close: 'بند کریں',
      interactive: 'انٹرایکٹو',
      canvasTip: 'دستاویزات، فیس اور سرکاری لنکس دیکھنے کے لیے کسی بھی مرحلے پر کلک کریں',
      officialSource: 'سرکاری ویب سائٹ',
      legendAction: 'عملی مرحلہ',
      legendDoc: 'دستاویز / فارم',
      legendPrereq: 'بنیادی شرط',
      legendCompleted: 'مکمل',
      legendLocked: 'شرائط باقی',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'پرائیویٹ لمیٹڈ کمپنی رجسٹر کریں',
        description: 'وزارت کارپوریٹ امور (MCA21 V3 / SPICe+) کے ذریعے مکمل رجسٹریشن کا طریقہ کار',
        category: 'کاروبار اور تجارت',
        steps: {
          'step-dsc': {
            title: 'کلاس 3 ڈیجیٹل دستخطی سرٹیفکیٹ (DSC) حاصل کریں',
            shortTitle: 'کلاس 3 DSC',
            description: 'تمام مجوزہ ڈائریکٹرز کے پاس MCA21 ای فارمز پر ڈیجیٹل دستخط کرنے کے لیے کلاس 3 DSC ہونا ضروری ہے۔',
          },
          'step-spice-name': {
            title: 'منفرد کمپنی کا نام محفوظ کریں (SPICe+ Part A)',
            shortTitle: 'نام کا تحفظ',
            description: 'کمپنی رولز 2014 کے تحت ترجیحی بنیاد پر دو مجوزہ نام جمع کرائیں۔',
          },
          'step-din': {
            title: 'ڈائریکٹر شناختی نمبر (DIN) کی الاٹمنٹ',
            shortTitle: 'DIN الاٹمنٹ',
            description: 'نئے ڈائریکٹرز کے لیے 8 ہندسوں کا منفرد DIN حاصل کریں۔',
          },
          'step-moa-aoa': {
            title: 'الیکٹرانک MOA اور AOA تیار کریں',
            shortTitle: 'e-MOA اور e-AOA',
            description: 'کمپنی کے مقاصد اور اندرونی قواعد کی وضاحت کے لیے e-MOA اور e-AOA تیار کریں۔',
          },
          'step-spice-part-b': {
            title: 'SPICe+ پارٹ B انٹیگریٹڈ رجسٹریشن فائلنگ',
            shortTitle: 'SPICe+ پارٹ B',
            description: 'کمپنی PAN, TAN, EPFO, ESIC اور رجسٹریشن سرٹیفکیٹ کے لیے مشترکہ درخواست۔',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S لازمی رجسٹریشن',
            shortTitle: 'AGILE-PRO-S',
            description: 'GSTIN، EPFO، ESIC، پیشہ ورانہ ٹیکس اور بینک اکاؤنٹ کھولنے کے لیے لازمی فائلنگ۔',
          },
          'step-inc-20a': {
            title: 'کاروبار شروع کرنے کا اعلان (فارم INC-20A)',
            shortTitle: 'INC-20A اعلان',
            description: 'رجسٹریشن کے 180 دنوں کے اندر تصدیق کریں کہ ڈائریکٹرز نے شیئر کیپیٹل جمع کرا دیا ہے۔',
          },
        },
      },
      'driving-license-delhi': {
        title: 'ڈرائیونگ لائسنس کی تجدید کریں (دہلی این سی ٹی)',
        description: 'سارتھی پریوہن (وزارت سڑک ٹرانسپورٹ) کے تحت مرحلہ وار تجدید کا طریقہ کار',
        category: 'ٹرانسپورٹ اور ڈرائیونگ',
        steps: {
          'step-learner-app': {
            title: 'لرنر لائسنس (LL) کے لیے آن لائن درخواست دیں',
            shortTitle: 'LL آن لائن درخواست',
            description: 'سارتھی پورٹل پر آدھار ای-کے وائی سی کے ساتھ فارم 2 جمع کرائیں اور دستاویزات اپ لوڈ کریں۔',
          },
          'step-ll-slot': {
            title: 'ٹریفک قوانین کے ٹیسٹ کے لیے سلاٹ بک کریں',
            shortTitle: 'ٹیسٹ سلاٹ بکنگ',
            description: 'آن لائن یا کمپیوٹر پر مبنی ٹریفک رولز ٹیسٹ کے لیے تاریخ اور وقت منتخب کریں۔',
          },
          'step-dl-training': {
            title: '30 دن کا لازمی تربیتی دورانیہ اور ڈرائیونگ پریکٹس',
            shortTitle: '30 دن پریکٹس',
            description: 'ڈرائیونگ کی مشق کرتے ہوئے LL کے اجراء کی تاریخ سے کم از کم 30 دن کی لازمی مدت مکمل کریں۔',
          },
          'step-dl-test-slot': {
            title: 'مستقل DL ڈرائیونگ ٹیسٹ کا سلاٹ بک کریں',
            shortTitle: 'ڈرائیونگ ٹیسٹ سلاٹ',
            description: 'خودکار ڈرائیونگ ٹیسٹ ٹریک (ADTT) کا انتخاب کریں اور پریکٹیکل ٹیسٹ کا وقت طے کریں۔',
          },
          'step-dl-track-test': {
            title: 'خودکار ڈرائیونگ سکل ٹیسٹ (ADTT) پاس کریں',
            shortTitle: 'ADTT سکل ٹیسٹ',
            description: 'کیمرہ مانیٹرڈ خودکار ٹریک پر گاڑی چلا کر ریورس S، متوازی پارکنگ اور 8 فگر ٹیسٹ پاس کریں۔',
          },
          'step-dl-dispatch': {
            title: 'بائیو میٹرک تصدیق اور بذریعہ ڈاک ترسیل',
            shortTitle: 'بائیو میٹرک اور ترسیل',
            description: 'ڈیجیٹل تصویر اور دستخط کی تصدیق مکمل کریں؛ سمارٹ کارڈ DL اسپیڈ پوسٹ کے ذریعے بھیجا جائے گا۔',
          },
        },
      },
      'fssai-food-license': {
        title: 'فوڈ بزنس لائسنس کے لیے درخواست دیں (FSSAI)',
        description: 'فوڈ بزنس آپریٹرز کے لیے FoSCoS پورٹل کے ذریعے باضابطہ رجسٹریشن اور لائسنسنگ',
        category: 'خوراک اور حفاظت',
        steps: {
          'step-foscos-eligibility': {
            title: 'لائسنس کی اہلیت اور سالانہ آمدنی کا تعین کریں',
            shortTitle: 'اہلیت کا تعین',
            description: 'معلوم کریں کہ کیا آپ کا کاروبار بنیادی رجسٹریشن یا ریاستی/مرکزی لائسنس کے تحت آتا ہے۔',
          },
          'step-foscos-docs': {
            title: 'لازمی دستاویزات اور صفائی کے کاغذات تیار کریں',
            shortTitle: 'دستاویزات کی تیاری',
            description: 'شناختی کارڈ، کرایہ نامہ یا بجلی کا بل، پانی کی ٹیسٹ رپورٹ اور فوڈ سیفٹی پلان تیار کریں۔',
          },
          'step-foscos-form-b': {
            title: 'FoSCoS پورٹل پر فارم B / رجسٹریشن جمع کرائیں',
            shortTitle: 'آن لائن رجسٹریشن',
            description: 'foscos.fssai.gov.in پر اکاؤنٹ بنائیں، متعلقہ کیٹیگری منتخب کریں اور فیس ادا کریں۔',
          },
          'step-fso-inspection': {
            title: 'فوڈ سیفٹی آفیسر (FSO) کی جانب سے معائنہ',
            shortTitle: 'FSO فزیکل معائنہ',
            description: 'متعلقہ افسر کھانے پینے کے ذخیرے، کچن کی صفائی اور ملازمین کے میڈیکل سرٹیفکیٹس کا معائنہ کرتا ہے۔',
          },
          'step-fssai-certificate': {
            title: 'ڈیجیٹل طور پر دستخط شدہ FSSAI لائسنس ڈاؤن لوڈ کریں',
            shortTitle: 'لائسنس ڈاؤن لوڈ',
            description: 'منظوری پر 14 ہندسوں کا باضابطہ سرٹیفکیٹ ڈاؤن لوڈ کریں اور کاروبار کے داخلی دروازے پر چسپاں کریں۔',
          },
        },
      },
    },
  },

  ta: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'குடிமக்கள் நடைமுறை வழிகாட்டி',
      featuredRoadmap: 'சிறப்பு வழிகாட்டி',
      aboutUs: 'எங்களைப் பற்றி',
      directory: 'வழிகாட்டிகள்',
      findGuidance: 'வழிகாட்டுதல் பெறுங்கள்',
      selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
      themeLight: 'லைட் மோட் மாற்றுக',
      themeDark: 'டார்க் மோட் மாற்றுக',
      canvasBtn: 'ஊடாடும் வரைபடம்',
      menu: 'மெனு திறக்க',
      closeMenu: 'மெனு மூடுக',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'குடிமக்கள் நடைமுறை வழிகாட்டி',
      findGuidance: 'வழிகாட்டுதல் பெறுங்கள்',
      title: 'அரசு நடைமுறைகளை எளிதாக்குங்கள்',
      queryHeading: 'உங்கள் கேள்விகளைக் கேளுங்கள்',
      viewRoadmaps: 'வழிகாட்டி பட்டியலைக் காண்க',
      helplineTitle: 'தேசிய அரசு சேவை போர்டல் உதவி எண்',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'சாரதி பரிவாஹன்',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'வழிகாட்டிகளை ஆராய்க',
    },
    heroCategories: {
      business: 'வணிகம்',
      businessSub: '& உரிமங்கள்',
      property: 'சொத்து',
      propertySub: '& நிலம்',
      idDocs: 'அடையாள ஆவணங்கள்',
      idDocsSub: '& சான்றிதழ்கள்',
      welfare: 'சமூக நலம்',
      welfareSub: '& பலன்கள்',
      tax: 'வரி',
      taxSub: '& நிதி',
      education: 'கல்வி',
      educationSub: '& உதவித்தொகை',
      more: 'மேலும்',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'பயனடைந்த குடிமக்கள்',
      servicesCount: '500+',
      servicesLabel: 'இணைக்கப்பட்ட சேவைகள்',
      languagesCount: '12+',
      languagesLabel: 'மொழிகள்',
      exploreTitle: 'வழிகாட்டப்பட்ட பாதைகள்',
      exploreDesc: 'இலக்குகளுக்கான படிப்படியான வழிகாட்டுதல்',
    },
    search: {
      placeholder: 'எந்த மொழியிலும் கேளுங்கள்... எ.கா. ஓட்டுநர் உரிமம் புதுப்பிப்பது எப்படி',
      submitBtn: 'தேடுங்கள்',
      searchBtnAria: 'வழிகாட்டிகளைத் தேடுங்கள்',
      recommendedRoadmaps: 'பரிந்துரைக்கப்பட்ட வழிகாட்டிகள்',
      searchResults: 'தேடல் முடிவுகள்',
      dropdownHeader: 'அதிகாரப்பூர்வ குடிமக்கள் வழிகாட்டிகள்',
      dropdownEnterHint: 'தேர்ந்தெடுக்க Enter அழுத்தவும்',
      noResults: 'நேரடி முடிவு எதுவும் கிடைக்கவில்லை. தொடர்புடைய வழிகாட்டிகளைப் பார்க்க Enter அழுத்தவும்.',
      stepsCount: 'படிகள்',
      estimatedTime: 'கால அளவு',
      statutoryFee: 'அரசு கட்டணம்',
      officialPortal: 'அதிகாரப்பூர்வ போர்டல்',
      clearQuery: 'அழிக்குக',
      voiceSearch: 'குரல் மூலம் தேடுக',
      voiceListening: 'கேட்கிறது... உங்கள் கேள்வியைக் கூறுங்கள்',
      voiceStop: 'குரல் உள்ளீட்டை நிறுத்துக',
      voiceUnsupported: 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.',
      uploadDoc: 'ஆவணத்தை இணைக்குக (PDF, Word, TXT, படங்கள்)',
      removeDoc: 'ஆவணத்தை நீக்குக',
      fileLimitError: 'கோப்பு அளவு 10MB-க்கு குறைவாக இருக்க வேண்டும்.',
      fileFormatError: 'தயவுசெய்து PDF, Word, TXT அல்லது படக் கோப்பை பதிவேற்றவும்.',
      supportedFormats: 'ஆதரிக்கப்படுபவை: PDF, DOCX, TXT, JPG, PNG, WEBP (10MB வரை)',
    },
    about: {
      sectionTitle: 'எங்களைப் பற்றி',
      sectionSubtitle: 'சிக்கலான அரசு நிர்வாக நடைமுறைகளை வெளிப்படையான, தெளிவான வழிகாட்டிகளாக மாற்றுதல்.',
      card1Heading: 'அரசு இணையதளங்களிலிருந்து நேரடி வழிகாட்டுதல்',
      card1Body: 'மத்திய மற்றும் மாநில அமைச்சக போர்டல்களிலிருந்து (.gov.in மற்றும் .nic.in) நேரடியாக பெறப்பட்ட சரிபார்க்கப்பட்ட நடைமுறைகள். இடைத்தரகர்கள் இல்லை, குழப்பமில்லை, முழு வெளிப்படைத்தன்மை.',
      card1Tag: 'மத்திய மற்றும் மாநில அதிகார வரம்புகள்',
      side1Heading: 'சரிபார்க்கப்பட்ட தேவைகள்',
      side1Text: 'ஒவ்வொரு வழிகாட்டியிலும் தேவையான ஆவணங்கள், அங்கீகரிக்கப்பட்ட படிவங்கள் மற்றும் கட்டண அட்டவணையைப் பாருங்கள்.',
      side1Btn: 'வழிகாட்டிகளைப் பார்',
      card2Heading: 'தனிநபர் விண்ணப்பதாரர்கள் மற்றும் நிறுவனங்கள் இருவருக்குமானது',
      card2BodyTeam: 'நிறுவனங்களைத் தொடங்குதல், இயக்குநர்களை நியமித்தல், வணிக உணவுப் பாதுகாப்பு உரிமங்களைப் பெறுதல் மற்றும் வரி பதிவுகளை முடிக்கலாம்.',
      card2BodySolo: 'ஓட்டுநர் உரிமம் புதுப்பித்தல், குடிமக்கள் சான்றிதழ்கள் மற்றும் தனிநபர் அனுமதிகளை தேவையற்ற அலைச்சலின்றி எளிதாகப் பெறலாம்.',
      withTeam: 'குழுவுடன்',
      soloApplicant: 'தனிநபர் விண்ணப்பதாரர்',
      scope: '< வரம்பு >',
      side2Heading: 'ஆஃப்லைன் சரிபார்ப்புப் பட்டியல்',
      side2Text: 'அரசு அலுவலகங்களுக்குச் செல்லும் முன் ஆவணங்களை ஆஃப்லைனில் சரிபார்க்கவும் அல்லது ஊடாடும் பட்டியலைப் பயன்படுத்தவும்.',
      side2Btn: 'சரிபார்ப்பு பட்டியலைப் பார்',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'சாரதி பரிவாஹன்',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'தேசிய போர்ட்டல் ↗',
      disclaimer: 'UntangleAI ஒரு இலவச குடிமக்கள் சேவை வழிகாட்டி கருவி. நடைமுறை வழிகாட்டுதல், காலக்கெடு மற்றும் படிவங்கள் அதிகாரப்பூர்வ அரசிதழ்கள் மற்றும் அமைச்சக போர்டல்களிலிருந்து பெறப்பட்டவை.',
      copyright: '© 2026 UntangleAI. வெளிப்படையான பொது நிர்வாகத்திற்காக உருவாக்கப்பட்டது.',
    },
    roadmap: {
      backToSearch: 'UntangleAI தேடலுக்குத் திரும்பு',
      search: 'தேடு',
      canvas: 'வரைபட காட்சி',
      list: 'பட்டியல் காட்சி',
      shareRoadmap: 'வழிகாட்டியைப் பகிர்',
      shareSuccess: 'வழிகாட்டி இணைப்பு நகலெடுக்கப்பட்டது!',
      resetProgress: 'மீட்டமைக்க',
      toggleTheme: 'தீம் மாற்று',
      stepsProgress: 'படிகள் முடிந்தது',
      step: 'படி',
      of: '/',
      status: 'நிலை',
      action: 'செயல்',
      document: 'ஆவணம்',
      prerequisite: 'முன்தேவை',
      info: 'தகவல்',
      completed: 'முடிந்தது',
      locked: 'பூட்டப்பட்டது (Locked)',
      pending: 'தொடங்க தயார்',
      inProgress: 'செயலில் உள்ளது',
      markCompleted: 'முடிந்ததாகக் குறி',
      markIncomplete: 'முடியாததாகக் குறி',
      prerequisitesRequired: 'முந்தைய படிகளை முடிக்க வேண்டும்',
      officialPortal: 'அதிகாரப்பூர்வ போர்ட்டலுக்குச் செல்',
      department: 'துறை / அலுவலகம்',
      location: 'இடம்',
      statutoryFee: 'சட்டப்பூர்வ கட்டணம்',
      estimatedTimeline: 'மதிப்பிடப்பட்ட நேரம்',
      legalBasis: 'அதிகாரப்பூர்வ சட்ட அடிப்படை',
      requiredDocs: 'தேவையான ஆவணங்கள் மற்றும் தேவைகள்',
      mandatory: 'கட்டாயம்',
      optional: 'விருப்பமானது',
      selectRoadmap: 'வழிகாட்டியைத் தேர்ந்தெடு',
      close: 'மூடு',
      interactive: 'ஊடாடும் வரைபடம்',
      canvasTip: 'ஆவணங்கள், கட்டணம் மற்றும் அதிகாரப்பூர்வ இணைப்புகளைப் பார்க்க எந்த அடியையும் கிளிக் செய்யவும்',
      officialSource: 'அதிகாரப்பூர்வ அரசு மூலம்',
      legendAction: 'செயல் படி',
      legendDoc: 'ஆவணம் / படிவம்',
      legendPrereq: 'முன்தேவை',
      legendCompleted: 'முடிந்தது',
      legendLocked: 'நிலுவையிலுள்ள நிபந்தனைகள்',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'பிரைவேட் லிமிடெட் நிறுவனத்தை பதிவு செய்யுங்கள்',
        description: 'கார்ப்பரேட் விவகார அமைச்சகத்தின் (MCA21 V3 / SPICe+) மூலமான முழுமையான பதிவு வழிகாட்டி',
        category: 'வணிகம் & வர்த்தகம்',
        steps: {
          'step-dsc': {
            title: 'வகுப்பு 3 டிஜிட்டல் கையொப்ப சான்றிதழ் (DSC) பெறுக',
            shortTitle: 'வகுப்பு 3 DSC',
            description: 'MCA21 படிவங்களில் டிஜிட்டல் கையொப்பமிட அனைத்து இயக்குநர்களுக்கும் வகுப்பு-3 DSC கட்டாயமாகும்.',
          },
          'step-spice-name': {
            title: 'தனித்துவமான நிறுவனத்தின் பெயரை முன்பதிவு செய்யவும் (SPICe+ Part A)',
            shortTitle: 'பெயர் முன்பதிவு',
            description: 'நிறுவன விதிகள் 2014 வழிகாட்டுதலின்படி முன்னுரிமை அடிப்படையில் இரண்டு பெயர்களைச் சமர்ப்பிக்கவும்.',
          },
          'step-din': {
            title: 'இயக்குநர் அடையாள எண் (DIN) பெறுதல்',
            shortTitle: 'DIN பெறுதல்',
            description: 'புதிய இயக்குநர்களுக்கான தனித்துவமான 8 இலக்க DIN எண்ணைப் பெறுங்கள்.',
          },
          'step-moa-aoa': {
            title: 'மின்னணு MOA (INC-33) & AOA (INC-34) தயார் செய்தல்',
            shortTitle: 'e-MOA & e-AOA',
            description: 'நிறுவனத்தின் குறிக்கோள்கள் மற்றும் உள் விதிமுறைகளை வரையறுக்கும் மின்-MOA மற்றும் மின்-AOA தயாரிக்கவும்.',
          },
          'step-spice-part-b': {
            title: 'SPICe+ பகுதி B ஒருங்கிணைந்த பதிவு தாக்கல்',
            shortTitle: 'SPICe+ பகுதி B',
            description: 'நிறுவன PAN, TAN, EPFO, ESIC மற்றும் பதிவுச் சான்றிதழுக்கான ஒருங்கிணைந்த விண்ணப்பம்.',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S கட்டாய பதிவுகள்',
            shortTitle: 'AGILE-PRO-S',
            description: 'GSTIN பதிவு, EPFO, ESIC, தொழில் வரி மற்றும் வங்கி கணக்கு திறப்பதற்கான கட்டாய விண்ணப்பம்.',
          },
          'step-inc-20a': {
            title: 'வணிக தொடக்க அறிவிப்பு (படிவம் INC-20A)',
            shortTitle: 'INC-20A அறிவிப்பு',
            description: 'இயக்குநர்கள் தங்களது பங்கு மூலதனத்தை வைப்பு செய்துள்ளதை உறுதிப்படுத்த 180 நாட்களுக்குள் படிவம் INC-20A தாக்கல் செய்யவும்.',
          },
        },
      },
      'driving-license-delhi': {
        title: 'ஓட்டுநர் உரிமம் புதுப்பித்தல் (டெல்லி)',
        description: 'சாரதி பரிவாஹன் போர்ட்டல் மூலமாக படிபடியான புதுப்பித்தல் செயல்முறை',
        category: 'போக்குவரத்து & ஓட்டுநர்',
        steps: {
          'step-learner-app': {
            title: 'பழகுநர் உரிமத்திற்கு (LL) ஆன்லைனில் விண்ணப்பிக்கவும்',
            shortTitle: 'LL விண்ணப்பம்',
            description: 'சாரதி பரிவாஹன் போர்ட்டலில் ஆதார் e-KYC உடன் படிவம் 2-ஐ சமர்ப்பிக்கவும்.',
          },
          'step-ll-slot': {
            title: 'போக்குவரத்து விதிமுறை தேர்வுக்கான முன்பதிவு',
            shortTitle: 'தேர்வு முன்பதிவு',
            description: 'ஆன்லைன் அல்லது நேரடி கணினி வழி போக்குவரத்து விதிமுறை தேர்வுக்கான தேதியை முன்பதிவு செய்யவும்.',
          },
          'step-dl-training': {
            title: 'கட்டாய 30 நாள் பயிற்சி காலம் மற்றும் ஓட்டுநர் பயிற்சி',
            shortTitle: '30 நாள் பயிற்சி',
            description: 'வழிகாட்டுதலின் கீழ் ஓட்டுநர் பயிற்சி மேற்கொள்ளும்போது LL வழங்கப்பட்ட நாளிலிருந்து குறைந்தபட்சம் 30 நாட்கள் காத்திருக்கவும்.',
          },
          'step-dl-test-slot': {
            title: 'நிரந்தர DL ஓட்டுநர் தேர்வுக்கான முன்பதிவு',
            shortTitle: 'ஓட்டுநர் தேர்வு முன்பதிவு',
            description: 'தானியங்கி ஓட்டுநர் தேர்வு தளம் (ADTT) மற்றும் உங்கள் செயல்முறை தேர்வுக்கான தேதியைத் தேர்ந்தெடுக்கவும்.',
          },
          'step-dl-track-test': {
            title: 'தானியங்கி ஓட்டுநர் திறன் தேர்வில் கலந்துகொள்ளுங்கள்',
            shortTitle: 'ADTT திறன் தேர்வு',
            description: 'தானியங்கி சோதனை பாதையில் ரிவர்ஸ் S, பார்க்கிங், 8-வடிவ ஓட்டுதல் போன்ற தேர்வுகளை வெற்றிகரமாக முடிக்கவும்.',
          },
          'step-dl-dispatch': {
            title: 'பயோமெட்ரிக் சரிபார்ப்பு மற்றும் தபால் மூலமாக அனுப்புதல்',
            shortTitle: 'சரிபார்ப்பு & அனுப்புதல்',
            description: 'டிஜிட்டல் புகைப்படம் மற்றும் கையொப்ப பதிவு; ஸ்மார்ட் கார்டு DL ஸ்பீட் போஸ்ட் மூலம் உங்கள் முகவரிக்கு அனுப்பப்படும்.',
          },
        },
      },
      'fssai-food-license': {
        title: 'FSSAI உணவு வணிக உரிமத்திற்கு விண்ணப்பிக்கவும்',
        description: 'FoSCoS போர்டல் வழியாக உணவு வணிக ஆபரேட்டர்களுக்கான அதிகாரப்பூர்வ உரிம செயல்முறை',
        category: 'உணவு & பாதுகாப்பு',
        steps: {
          'step-foscos-eligibility': {
            title: 'உரிமத் தகுதி மற்றும் ஆண்டு வருமானத்தை தீர்மானித்தல்',
            shortTitle: 'தகுதி ஆய்வு',
            description: 'உங்கள் வணிகம் அடிப்படை பதிவு அல்லது மாநில/மத்திய உரிமத்திற்கு தகுதியுடையதா என சரிபார்க்கவும்.',
          },
          'step-foscos-docs': {
            title: 'கட்டாய ஆவணங்கள் மற்றும் சுகாதார சான்றுகளைத் தொகுத்தல்',
            shortTitle: 'ஆவணங்கள் தொகுப்பு',
            description: 'அரசு அடையாள அட்டை, வாடகை ஒப்பந்தம், குடிநீர் பரிசோதனை அறிக்கை மற்றும் FSMS திட்டத்தை தயார் செய்யவும்.',
          },
          'step-foscos-form-b': {
            title: 'FoSCoS போர்ட்டலில் படிவம் B சமர்ப்பித்தல்',
            shortTitle: 'படிவம் B சமர்ப்பிப்பு',
            description: 'போர்ட்டலில் கணக்கை உருவாக்கி, உணவு வகைப்பாட்டைத் தேர்ந்தெடுத்து, ஆவணங்களை பதிவேற்றி கட்டணம் செலுத்துங்கள்.',
          },
          'step-fso-inspection': {
            title: 'உணவு பாதுகாப்பு அதிகாரி (FSO) ஆய்வு',
            shortTitle: 'FSO ஆய்வு',
            description: 'நியமிக்கப்பட்ட அதிகாரி உணவு சேமிப்பு, சமையலறை உபகரணங்கள் மற்றும் ஊழியர்களின் மருத்துவ தகுதி சான்றிதழ்களை ஆய்வு செய்வார்.',
          },
          'step-fssai-certificate': {
            title: 'டிஜிட்டல் கையொப்பமிட்ட FSSAI சான்றிதழைப் பதிவிறக்குங்கள்',
            shortTitle: 'சான்றிதழ் பதிவிறக்கம்',
            description: 'ஒப்புதலுக்குப் பிறகு, 14 இலக்க உரிமச் சான்றிதழைப் பதிவிறக்கி வணிகத்தின் நுழைவாயிலில் காட்சிப்படுத்துங்கள்.',
          },
        },
      },
    },
  },

  bn: {
    nav: {
      brand: 'UNTANGLE',
      tagline: 'নাগরিক প্রক্রিয়া নির্দেশক',
      featuredRoadmap: 'বিশেষ রোডম্যাপ',
      aboutUs: 'আমাদের সম্পর্কে',
      directory: 'ডিরেক্টরি',
      findGuidance: 'নির্দেশিকা পান',
      selectLanguage: 'ভাষা নির্বাচন করুন',
      themeLight: 'লাইট মোড করুন',
      themeDark: 'ডার্ক মোড করুন',
      canvasBtn: 'ইন্টারেক্টিভ ক্যানভাস',
      menu: 'মেনু খুলুন',
      closeMenu: 'মেনু বন্ধ করুন',
    },
    hero: {
      brand: 'UNTANGLE',
      tagline: 'নাগরিক প্রক্রিয়া নির্দেশক',
      findGuidance: 'নির্দেশিকা পান',
      title: 'সরকারি আমলাতান্ত্রিক প্রক্রিয়া সহজ করুন',
      queryHeading: 'আপনার প্রশ্ন জিজ্ঞাসা করুন',
      viewRoadmaps: 'রোডম্যাপ তালিকা দেখুন',
      helplineTitle: 'জাতীয় সরকারি পরিষেবা হেল্পলাইন',
      helplineNumber: '1800 11 2026',
      mcaPill: 'MCA SPICe+',
      sarathiPill: 'সারথী পরিবহন',
      fssaiPill: 'FSSAI FoSCoS',
      exploreRoadmaps: 'রোডম্যাপ অন্বেষণ করুন',
    },
    heroCategories: {
      business: 'ব্যবসা',
      businessSub: '& লাইসেন্স',
      property: 'সম্পত্তি',
      propertySub: '& জমি',
      idDocs: 'পরিচয়পত্র',
      idDocsSub: '& সনদপত্র',
      welfare: 'সামাজিক কল্যাণ',
      welfareSub: '& সুবিধাসমূহ',
      tax: 'কর (Tax)',
      taxSub: '& অর্থ',
      education: 'শিক্ষা',
      educationSub: '& বৃত্তি',
      more: 'আরও',
    },
    heroStats: {
      citizensCount: '10M+',
      citizensLabel: 'নাগরিক সহায়তা',
      servicesCount: '500+',
      servicesLabel: 'সূচীবদ্ধ সেবাসমূহ',
      languagesCount: '12+',
      languagesLabel: 'ভাষাসমূহ',
      exploreTitle: 'নির্দেশিত রোডম্যাপ অন্বেষণ করুন',
      exploreDesc: 'সাধারণ লক্ষ্যের জন্য ধাপে ধাপে নির্দেশনা',
    },
    search: {
      placeholder: 'যেকোনো ভাষায় জিজ্ঞাসা করুন... যেমন ড্রাইভিং লাইসেন্স কীভাবে রিনিউ করবেন',
      submitBtn: 'অনুসন্ধান',
      searchBtnAria: 'রোডম্যাপ খুঁজুন',
      recommendedRoadmaps: 'সুপারিশকৃত রোডম্যাপ',
      searchResults: 'অনুসন্ধানের ফলাফল',
      dropdownHeader: 'অফিসিয়াল নাগরিক রোডম্যাপ',
      dropdownEnterHint: 'নির্বাচন করতে Enter চাপুন',
      noResults: 'সরাসরি কোনো মিল পাওয়া যায়নি। সংশ্লিষ্ট রোডম্যাপ দেখতে Enter চাপুন।',
      stepsCount: 'ধাপ',
      estimatedTime: 'সময়',
      statutoryFee: 'সরকারি ফি',
      officialPortal: 'অফিসিয়াল পোর্টাল',
      clearQuery: 'মুছুন',
      voiceSearch: 'ভয়েস দিয়ে অনুসন্ধান করুন',
      voiceListening: 'শুনছি... আপনার প্রশ্ন বলুন',
      voiceStop: 'ভয়েস ইনপুট বন্ধ করুন',
      voiceUnsupported: 'এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।',
      uploadDoc: 'নথি সংযুক্ত করুন (PDF, Word, TXT, ছবি)',
      removeDoc: 'নথি সরান',
      fileLimitError: 'ফাইলের আকার ১০MB-এর কম হতে হবে।',
      fileFormatError: 'অনুগ্রহ করে PDF, Word নথি, TXT, বা ছবির ফাইল আপলোড করুন।',
      supportedFormats: 'সমর্থিত: PDF, DOCX, TXT, JPG, PNG, WEBP (১০MB পর্যন্ত)',
    },
    about: {
      sectionTitle: 'আমাদের সম্পর্কে',
      sectionSubtitle: 'জটিল সরকারি প্রশাসনকে স্বচ্ছ এবং স্পষ্ট রোডম্যাপে রূপান্তরিত করা।',
      card1Heading: 'সরকারি পোর্টাল থেকে সরাসরি যাচাইকৃত',
      card1Body: 'মন্ত্রণালয়ের পোর্টাল (.gov.in এবং .nic.in) থেকে সরাসরি সংগৃহীত যাচাইকৃত নির্দেশিকা। কোনো দালাল নেই, কোনো বিভ্রান্তিকর পরিভাষা নেই, সম্পূর্ণ স্বচ্ছতা।',
      card1Tag: 'কেন্দ্রীয় ও রাজ্য এক্তিয়ার',
      side1Heading: 'যাচাইকৃত প্রয়োজনীয়তা',
      side1Text: 'প্রতিটি রোডম্যাপে প্রয়োজনীয় কাগজপত্র, অনুমোদিত ফর্ম এবং সরকারি ফি তালিকা দেখুন।',
      side1Btn: 'রোডম্যাপ দেখুন',
      card2Heading: 'একক আবেদনকারী ও ব্যবসা উভয়ের জন্য উপযোগী',
      card2BodyTeam: 'কোম্পানি গঠন, একাধিক পরিচালক নিয়োগ, খাদ্য সুরক্ষা লাইসেন্স এবং ট্যাক্স নিবন্ধন সম্পূর্ণ করুন।',
      card2BodySolo: 'ড্রাইভিং লাইসেন্স নবায়ন, নাগরিক সনদ এবং ব্যক্তিগত অনুমতি অতিরিক্ত কাগজপত্র ছাড়াই সহজে গ্রহণ করুন।',
      withTeam: 'দলের সাথে',
      soloApplicant: 'একক আবেদনকারী',
      scope: '< পরিধি >',
      side2Heading: 'অফলাইন চেকলিস্ট',
      side2Text: 'সরকারি অফিসে যাওয়ার আগে প্রয়োজনীয় নথি অফলাইনে ট্র্যাক করুন বা ইন্টারেক্টিভ চেকলিস্ট ব্যবহার করুন।',
      side2Btn: 'চেকলিস্ট দেখুন',
    },
    footer: {
      brand: 'UNTANGLE',
      mcaLink: 'MCA SPICe+',
      sarathiLink: 'সারথী পরিবহন',
      fssaiLink: 'FSSAI FoSCoS',
      nationalPortal: 'জাতীয় পোর্টাল ↗',
      disclaimer: 'UntangleAI একটি উন্মুক্ত নাগরিক দিকনির্দেশনা প্ল্যাটফর্ম। প্রক্রিয়াগত নির্দেশিকা, সময়সীমা ও ফর্ম সরাসরি সরকারি গেজেট ও পোর্টাল থেকে সংকলিত।',
      copyright: '© 2026 UntangleAI। স্বচ্ছ জনশাসনের জন্য নির্মিত।',
    },
    roadmap: {
      backToSearch: 'UntangleAI অনুসন্ধানে ফিরে যান',
      search: 'অনুসন্ধান',
      canvas: 'গ্রাফ ভিউ',
      list: 'তালিকা ভিউ',
      shareRoadmap: 'রোডম্যাপ শেয়ার করুন',
      shareSuccess: 'রোডম্যাপ লিঙ্ক কপি করা হয়েছে!',
      resetProgress: 'রিসেট করুন',
      toggleTheme: 'থিম পরিবর্তন',
      stepsProgress: 'ধাপ সম্পন্ন',
      step: 'ধাপ',
      of: '/',
      status: 'অবস্থা',
      action: 'পদক্ষেপ',
      document: 'নথি',
      prerequisite: 'পূর্বশর্ত',
      info: 'তথ্য',
      completed: 'সম্পন্ন',
      locked: 'লক করা (Locked)',
      pending: 'প্রস্তুত',
      inProgress: 'চলমান',
      markCompleted: 'সম্পন্ন হিসেবে চিহ্নিত করুন',
      markIncomplete: 'অসম্পন্ন হিসেবে চিহ্নিত করুন',
      prerequisitesRequired: 'পূর্ববর্তী শর্তাবলী প্রয়োজন',
      officialPortal: 'অফিসিয়াল পোর্টালে যান',
      department: 'দপ্তর / অফিস',
      location: 'অবস্থান',
      statutoryFee: 'আইনগত ফি',
      estimatedTimeline: 'আনুমানিক সময়',
      legalBasis: 'সরকারি আইনি ভিত্তি',
      requiredDocs: 'প্রয়োজনীয় নথি ও শর্তাবলী',
      mandatory: 'আবশ্যক',
      optional: 'ঐচ্ছিক',
      selectRoadmap: 'রোডম্যাপ নির্বাচন করুন',
      close: 'বন্ধ করুন',
      interactive: 'ইন্টারেক্টিভ',
      canvasTip: 'নথিপত্র, ফি এবং অফিসিয়াল লিঙ্ক দেখতে যেকোনো ধাপে ক্লিক করুন',
      officialSource: 'অফিসিয়াল সরকারি উৎস',
      legendAction: 'অ্যাকশন ধাপ',
      legendDoc: 'নথি / ফর্ম',
      legendPrereq: 'পূর্বশর্ত',
      legendCompleted: 'সম্পন্ন',
      legendLocked: 'শর্ত বাকি আছে',
    },
    processes: {
      'pvt-ltd-delhi': {
        title: 'প্রাইভেট লিমিটেড কোম্পানি নিবন্ধন করুন',
        description: 'কর্পোরেট বিষয়ক মন্ত্রণালয় (MCA21 V3 / SPICe+) এর মাধ্যমে সম্পূর্ণ নিবন্ধন রোডম্যাপ',
        category: 'ব্যবসা ও বাণিজ্য',
        steps: {
          'step-dsc': {
            title: 'ক্লাস ৩ ডিজিটাল স্বাক্ষর সার্টিফিকেট (DSC) সংগ্রহ করুন',
            shortTitle: 'ক্লাস ৩ DSC',
            description: 'MCA21 ই-ফর্ম ডিজিটালভাবে স্বাক্ষর করার জন্য সকল পরিচালকদের ক্লাস-৩ DSC থাকা আবশ্যক।',
          },
          'step-spice-name': {
            title: 'কোম্পানির অনন্য নাম সংরক্ষণ করুন (SPICe+ Part A)',
            shortTitle: 'নাম সংরক্ষণ',
            description: 'কোম্পানি আইন ২০১৪ অনুযায়ী পছন্দের ক্রমানুসারে দুটি প্রস্তাবিত নাম জমা দিন।',
          },
          'step-din': {
            title: 'পরিচালক সনাক্তকরণ নম্বর (DIN) বরাদ্দ',
            shortTitle: 'DIN বরাদ্দ',
            description: 'প্রস্তাবিত পরিচালকদের জন্য ৮ অঙ্কের অনন্য DIN সংগ্রহ করুন।',
          },
          'step-moa-aoa': {
            title: 'ইলেকট্রনিক MOA (INC-33) এবং AOA (INC-34) খসড়া করুন',
            shortTitle: 'e-MOA ও e-AOA',
            description: 'কোম্পানির উদ্দেশ্য ও অভ্যন্তরীণ নিয়ম নির্ধারণের জন্য ই-MOA ও ই-AOA প্রস্তুত করুন।',
          },
          'step-spice-part-b': {
            title: 'SPICe+ পার্ট B সমন্বিত নিবন্ধন ফাইলিং',
            shortTitle: 'SPICe+ পার্ট B',
            description: 'কোম্পানির PAN, TAN, EPFO, ESIC এবং ইনকর্পোরেশন সার্টিফিকেটের জন্য একীভূত আবেদন।',
          },
          'step-agile-pro': {
            title: 'AGILE-PRO-S বাধ্যতামূলক নিবন্ধন',
            shortTitle: 'AGILE-PRO-S',
            description: 'GSTIN নিবন্ধন, EPFO, ESIC, পেশাগত কর এবং ব্যবসায়িক ব্যাঙ্ক অ্যাকাউন্ট খোলার জন্য আবেদন।',
          },
          'step-inc-20a': {
            title: 'ব্যবসা শুরুর ঘোষণা (ফর্ম INC-20A)',
            shortTitle: 'INC-20A ঘোষণা',
            description: 'নিবন্ধনের ১৮০ দিনের মধ্যে ঘোষণা জমা দিন যে পরিচালকরা তাদের শেয়ার মূলধন জমা দিয়েছেন।',
          },
        },
      },
      'driving-license-delhi': {
        title: 'ড্রাইভিং লাইসেন্স নবায়ন করুন (দিল্লি)',
        description: 'সারথী পরিবহন পোর্টালের মাধ্যমে ধাপে ধাপে নবায়ন প্রক্রিয়া',
        category: 'পরিবহন ও ড্রাইভিং',
        steps: {
          'step-learner-app': {
            title: 'লার্নার লাইসেন্সের (LL) জন্য অনলাইনে আবেদন করুন',
            shortTitle: 'LL আবেদন',
            description: 'সারথী পরিবহন পোর্টালে আধার ই-কেওয়াইসি সহ ফর্ম ২ জমা দিন এবং প্রয়োজনীয় নথি আপলোড করুন।',
          },
          'step-ll-slot': {
            title: 'ট্রাফিক নিয়ম পরীক্ষার জন্য স্লট বুক করুন',
            shortTitle: 'পরীক্ষার স্লট',
            description: 'অনলাইন বা কম্পিউটার ভিত্তিক ট্রাফিক নিয়ম পরীক্ষার জন্য তারিখ ও সময় নির্বাচন করুন।',
          },
          'step-dl-training': {
            title: 'বাধ্যতামূলক ৩০ দিনের প্রশিক্ষণ ও ড্রাইভিং অনুশীলন',
            shortTitle: '৩০ দিনের অনুশীলন',
            description: 'LL ইস্যুর তারিখ থেকে ড্রাইভিং অনুশীলন করার জন্য ন্যূনতম ৩০ দিনের বাধ্যতামূলক সময়কাল পূরণ করুন।',
          },
          'step-dl-test-slot': {
            title: 'স্থায়ী DL ড্রাইভিং পরীক্ষার স্লট বুক করুন',
            shortTitle: 'ড্রাইভিং পরীক্ষার স্লট',
            description: 'স্বয়ংক্রিয় ড্রাইভিং টেস্ট ট্র্যাক (ADTT) অবস্থান নির্বাচন করুন এবং আপনার ব্যবহারিক পরীক্ষার সময় নির্ধারণ করুন।',
          },
          'step-dl-track-test': {
            title: 'স্বয়ংক্রিয় ড্রাইভিং স্কিল পরীক্ষায় অংশ নিন',
            shortTitle: 'ADTT দক্ষতা পরীক্ষা',
            description: 'ক্যামেরা নিয়ন্ত্রিত ট্র্যাকটিতে রিভার্স S, পার্কিং এবং ৮-আকৃতির ড্রাইভিং পরীক্ষা সম্পন্ন করুন।',
          },
          'step-dl-dispatch': {
            title: 'বায়োমেট্রিক যাচাইকরণ এবং ডাকযোগে লাইসেন্স প্রেরণ',
            shortTitle: 'যাচাই ও প্রেরণ',
            description: 'ডিজিটাল ছবি ও স্বাক্ষর সম্পন্ন করুন; স্মার্ট কার্ড DL স্পিড পোস্টের মাধ্যমে আপনার ঠিকানায় পাঠানো হবে।',
          },
        },
      },
      'fssai-food-license': {
        title: 'FSSAI খাদ্য ব্যবসার লাইসেন্সের জন্য আবেদন করুন',
        description: 'খাদ্য ব্যবসায়ীদের জন্য FoSCoS পোর্টালের মাধ্যমে অফিসিয়াল লাইসেন্সিং প্রক্রিয়া',
        category: 'খাদ্য ও নিরাপত্তা',
        steps: {
          'step-foscos-eligibility': {
            title: 'লাইসেন্সের যোগ্যতা এবং বার্ষিক টার্নওভার নির্ধারণ করুন',
            shortTitle: 'যোগ্যতা যাচাই',
            description: 'আপনার ব্যবসা বেসিক রেজিস্ট্রেশন নাকি রাজ্য/কেন্দ্রীয় লাইসেন্সের জন্য যোগ্য তা যাচাই করুন।',
          },
          'step-foscos-docs': {
            title: 'বাধ্যতামূলক প্রাঙ্গণ ও স্বাস্থ্যবিধি নথি সংগ্রহ করুন',
            shortTitle: 'নথি সংকলন',
            description: 'সরকারি ফটো আইডি, প্রাঙ্গণের ভাড়ার চুক্তিপত্র, পানি পরীক্ষা রিপোর্ট এবং FSMS পরিকল্পনা সংগ্রহ করুন।',
          },
          'step-foscos-form-b': {
            title: 'FoSCoS পোর্টালে ফর্ম B / নিবন্ধন জমা দিন',
            shortTitle: 'ফর্ম B জমা',
            description: 'foscos.fssai.gov.in এ অ্যাকাউন্ট তৈরি করুন, খাবারের বিভাগ নির্বাচন করুন, নথি আপলোড করুন এবং ফি পরিশোধ করুন।',
          },
          'step-fso-inspection': {
            title: 'খাদ্য সুরক্ষা কর্মকর্তা (FSO) দ্বারা পরিদর্শন',
            shortTitle: 'FSO পরিদর্শন',
            description: 'নিযুক্ত কর্মকর্তা খাদ্য সংরক্ষণ, রান্নাঘরের সরঞ্জাম, কর্মীদের স্বাস্থ্য সনদ এবং পরিচ্ছন্নতা পরিদর্শন করবেন।',
          },
          'step-fssai-certificate': {
            title: 'ডিজিটাল স্বাক্ষরিত FSSAI সার্টিফিকেট ডাউনলোড করুন',
            shortTitle: 'সার্টিফিকেট ডাউনলোড',
            description: 'অনুমোদনের পর, ১৪ সংখ্যার FSSAI লাইসেন্স সার্টিফিকেট ডাউনলোড করে ব্যবসার প্রবেশদ্বারে প্রদর্শন করুন।',
          },
        },
      },
    },
  },
};

export function getEffectiveLang(lang: LanguageCode): Exclude<LanguageCode, 'auto'> {
  if (lang === 'auto') return 'en';
  return lang;
}

export function getTranslations(lang: LanguageCode): TranslationDictionary {
  const code = getEffectiveLang(lang);
  return TRANSLATIONS[code] || TRANSLATIONS.en;
}
