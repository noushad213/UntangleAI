import { CivicProcess, ProcessStep } from '@/types/roadmap';

export interface LocationOption {
  id: string;
  name: string;
  stateCode: string;
  tier: 'metro' | 'state';
  rtoCode?: string;
  rocOffice?: string;
  landPortal?: string;
}

export const INDIAN_LOCATIONS: LocationOption[] = [
  { id: 'delhi', name: 'Delhi NCT', stateCode: 'DL', tier: 'metro', rtoCode: 'DL-01 to DL-13', rocOffice: 'ROC Delhi & Haryana', landPortal: 'revenue.delhi.gov.in' },
  { id: 'maharashtra', name: 'Maharashtra (Mumbai / Pune)', stateCode: 'MH', tier: 'metro', rtoCode: 'MH-01 to MH-14', rocOffice: 'ROC Mumbai', landPortal: 'bhulekh.mahabhumi.gov.in' },
  { id: 'karnataka', name: 'Karnataka (Bengaluru)', stateCode: 'KA', tier: 'metro', rtoCode: 'KA-01 to KA-05', rocOffice: 'ROC Bangalore', landPortal: 'bhoomi.karnataka.gov.in' },
  { id: 'telangana', name: 'Telangana (Hyderabad)', stateCode: 'TS', tier: 'metro', rtoCode: 'TS-07 to TS-14', rocOffice: 'ROC Hyderabad', landPortal: 'dharani.telangana.gov.in' },
  { id: 'odisha', name: 'Odisha (Bhubaneswar / Cuttack)', stateCode: 'OR', tier: 'state', rtoCode: 'OD-02 / OD-05', rocOffice: 'ROC Cuttack', landPortal: 'bhulekh.ori.nic.in' },
  { id: 'uttar-pradesh', name: 'Uttar Pradesh (Lucknow / Noida)', stateCode: 'UP', tier: 'state', rtoCode: 'UP-16 / UP-32', rocOffice: 'ROC Kanpur', landPortal: 'upbhulekh.gov.in' },
  { id: 'tamil-nadu', name: 'Tamil Nadu (Chennai)', stateCode: 'TN', tier: 'metro', rtoCode: 'TN-01 to TN-10', rocOffice: 'ROC Chennai', landPortal: 'eservices.tn.gov.in' },
  { id: 'west-bengal', name: 'West Bengal (Kolkata)', stateCode: 'WB', tier: 'metro', rtoCode: 'WB-01 to WB-08', rocOffice: 'ROC Kolkata', landPortal: 'banglarbhumi.gov.in' },
  { id: 'gujarat', name: 'Gujarat (Ahmedabad / Gandhinagar)', stateCode: 'GJ', tier: 'state', rtoCode: 'GJ-01 / GJ-18', rocOffice: 'ROC Ahmedabad', landPortal: 'anyror.gujarat.gov.in' },
  { id: 'all-india', name: 'All India / Central Jurisdiction', stateCode: 'IN', tier: 'state' },
];

export interface ApplicantProfileOption {
  id: string;
  name: string;
  description: string;
}

export const APPLICANT_PROFILES: ApplicantProfileOption[] = [
  { id: 'individual', name: 'Individual Citizen', description: 'Standard individual adult applicant' },
  { id: 'female', name: 'Woman Applicant', description: 'Priority schemes, property stamp duty rebates & subsidies' },
  { id: 'senior', name: 'Senior Citizen (60+)', description: 'Priority counters, expedited processing & pensions' },
  { id: 'farmer', name: 'Farmer / Agriculturalist', description: 'Direct DBT, zero fee exemptions & land linkage' },
  { id: 'msme', name: 'MSME / Small Enterprise', description: 'Udyam benefits, subsidized filing & fast-track clearance' },
  { id: 'student', name: 'Student / Scholar', description: 'Tuition reimbursements & institutional fee waivers' },
];

export interface ServiceModeOption {
  id: string;
  name: string;
  description: string;
}

export const SERVICE_MODES: ServiceModeOption[] = [
  { id: 'online', name: 'Online (Faceless / Aadhaar e-KYC)', description: 'Direct digital submission without visiting government offices' },
  { id: 'assisted', name: 'Assisted (CSC / Mo Seva Kendra)', description: 'Facilitated submission via authorized village or municipal kiosks' },
  { id: 'in_person', name: 'In-Person (Office / Counter)', description: 'Traditional submission directly at RTO, Sub-Registrar, or Bank counter' },
];

export interface RoadmapFilters {
  location: string;
  applicantProfile: string;
  serviceMode: string;
}

export interface AdaptationResult {
  adaptedProcess: CivicProcess;
  appliedContexts: string[];
}

/**
 * Contextually adapts a CivicProcess roadmap based on the citizen's selected
 * state/city jurisdiction, applicant profile, and service delivery mode.
 */
export function adaptRoadmapForContext(
  process: CivicProcess,
  filters: RoadmapFilters
): AdaptationResult {
  const locObj =
    INDIAN_LOCATIONS.find((l) => l.id === filters.location) ||
    INDIAN_LOCATIONS.find((l) => l.name.toLowerCase().includes(filters.location.toLowerCase())) ||
    INDIAN_LOCATIONS[0];

  const profileObj =
    APPLICANT_PROFILES.find((p) => p.id === filters.applicantProfile) || APPLICANT_PROFILES[0];

  const modeObj =
    SERVICE_MODES.find((m) => m.id === filters.serviceMode) || SERVICE_MODES[0];

  const appliedContexts: string[] = [];

  // Deep clone to avoid mutating raw catalog
  const clonedSteps: ProcessStep[] = process.steps.map((s) => ({
    ...s,
    requirements: s.requirements ? s.requirements.map((r) => ({ ...r })) : [],
  }));

  const adaptedProcess: CivicProcess = {
    ...process,
    location: locObj.name,
    steps: clonedSteps,
  };

  // 1. Location-Specific Adaptations for Driving License
  if (process.id === 'driving-license-delhi' || process.id.includes('driving-license')) {
    if (locObj.id === 'maharashtra') {
      appliedContexts.push('Maharashtra Motor Vehicles Dept (RTO MH-01 to MH-14) rules applied');
      adaptedProcess.title = 'Renew Driving License (Maharashtra)';
      adaptedProcess.estimatedTotalCost = '₹1,000 (Maharashtra State Motor Vehicle Rules)';
      adaptedProcess.estimatedTotalTime = '35 - 50 Days';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-learner-app') {
          step.office = 'Motor Vehicles Department, Govt of Maharashtra';
          step.officeLocation = 'Sarathi Parivahan Maharashtra Portal';
          step.description = 'Submit Form 2 on Sarathi Parivahan with Aadhaar e-KYC for automated scrutiny by Maharashtra Transport Dept.';
        } else if (step.id === 'step-dl-track-test' || step.id === 'step-dl-test-slot') {
          step.office = 'Regional Transport Office (RTO MH-01 to MH-14)';
          step.officeLocation = 'Designated RTO Ground — Andheri (West) / Tardeo / Pune Regional RTO';
          step.description = 'Schedule practical driving skill test on camera-monitored automated test tracks at your regional Maharashtra RTO.';
        }
      });
    } else if (locObj.id === 'karnataka') {
      appliedContexts.push('Karnataka State Transport Authority jurisdiction applied');
      adaptedProcess.title = 'Renew Driving License (Karnataka)';
      adaptedProcess.estimatedTotalCost = '₹900 (Karnataka Transport Schedule)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-learner-app') {
          step.office = 'Transport Department, Government of Karnataka';
          step.officeLocation = 'Sarathi Karnataka / Bangalore Transport Portal';
        } else if (step.id === 'step-dl-track-test' || step.id === 'step-dl-test-slot') {
          step.office = 'RTO Bangalore Central & Regional RTOs';
          step.officeLocation = 'Koramangala / Jayanagar / Indiranagar Automated Test Tracks';
        }
      });
    } else if (locObj.id === 'telangana') {
      appliedContexts.push('Telangana State Road Transport Authority & T-App Folio configured');
      adaptedProcess.title = 'Renew Driving License (Telangana)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-learner-app') {
          step.office = 'Telangana State Transport Authority (TSRTA)';
          step.officeLocation = 'T-App Folio & Sarathi Telangana Portal';
        } else if (step.id === 'step-dl-track-test') {
          step.officeLocation = 'RTA Hyderabad (Khairatabad / Kondapur / Secunderabad)';
        }
      });
    } else if (locObj.id === 'odisha') {
      appliedContexts.push('State Transport Authority Odisha & Mo Seva Kendra integration active');
      adaptedProcess.title = 'Renew Driving License (Odisha)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-learner-app') {
          step.office = 'Commerce & Transport Department, Govt of Odisha';
          step.officeLocation = 'Sarathi Odisha Portal / Mo Seva Kendra';
        } else if (step.id === 'step-dl-track-test') {
          step.officeLocation = 'RTO Bhubaneswar-1 (Saheed Nagar) Automated Driving Track';
        }
      });
    } else if (locObj.id === 'uttar-pradesh') {
      appliedContexts.push('Uttar Pradesh Parivahan Vibhag automated driving track schedule active');
      adaptedProcess.title = 'Renew Driving License (Uttar Pradesh)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-dl-track-test') {
          step.office = 'UP Transport Department (Parivahan Vibhag)';
          step.officeLocation = 'RTO Sector 32 Noida / Transport Nagar Lucknow';
        }
      });
    } else if (locObj.id === 'tamil-nadu') {
      appliedContexts.push('Tamil Nadu State Transport Authority regulations active');
      adaptedProcess.title = 'Renew Driving License (Tamil Nadu)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-dl-track-test') {
          step.office = 'Tamil Nadu State Transport Authority';
          step.officeLocation = 'RTO Chennai Central (Ayanavaram) / Chennai South (Thiruvanmiyur)';
        }
      });
    } else if (locObj.id === 'west-bengal') {
      appliedContexts.push('West Bengal Public Vehicles Department (PVD) jurisdiction active');
      adaptedProcess.title = 'Renew Driving License (West Bengal)';

      clonedSteps.forEach((step) => {
        if (step.id === 'step-dl-track-test') {
          step.office = 'Public Vehicles Department (PVD), West Bengal';
          step.officeLocation = 'PVD Beltala / Salt Lake Automated Track';
        }
      });
    } else {
      appliedContexts.push('Delhi NCT Transport Dept automated faceless driving tracks active');
    }
  }

  // 2. Location-Specific Adaptations for Company Incorporation (MCA SPICe+)
  if (process.id === 'pvt-ltd-delhi' || process.id.includes('pvt-ltd')) {
    if (locObj.rocOffice) {
      appliedContexts.push(`Jurisdiction mapped to ${locObj.rocOffice}`);
      adaptedProcess.title = `Register a Private Limited Company (${locObj.name})`;

      clonedSteps.forEach((step) => {
        if (step.id === 'step-spice-name' || step.id === 'step-spice-part-b') {
          step.office = `Central Registration Centre (CRC) & ${locObj.rocOffice}`;
        }
        if (step.id === 'step-spice-part-b') {
          if (locObj.id === 'maharashtra') {
            step.description += ' Automatically includes Maharashtra Stamp Duty (₹1,000 on MOA/AOA) and BMC Gumasta Shop Act registration.';
          } else if (locObj.id === 'karnataka') {
            step.description += ' Automatically includes Karnataka Stamp Duty and BBMP Professional Tax Registration integration.';
          } else if (locObj.id === 'telangana') {
            step.description += ' Automatically integrated with TS-iPASS single-window system for Telangana commercial clearance.';
          }
        }
      });
    }
  }

  // 3. Location-Specific Adaptations for PMAY Housing
  if (process.id === 'pmay-housing') {
    if (locObj.id === 'maharashtra') {
      appliedContexts.push('Integrated with Maharashtra Housing (MHADA) & Ramai Awas Gharkul guidelines');
    } else if (locObj.id === 'odisha') {
      appliedContexts.push('Aligned with Odisha Panchayati Raj & Biju Pucca Ghar technical norms');
    } else if (locObj.id === 'telangana') {
      appliedContexts.push('Aligned with Telangana 2BHK Dignity Housing Scheme criteria');
    } else {
      appliedContexts.push('Ministry of Rural Development PMAY-G sovereign schedule active');
    }
  }

  // 4. Location-Specific Adaptations for PM-Kisan
  if (process.id === 'pm-kisan-welfare') {
    if (locObj.landPortal) {
      appliedContexts.push(`Revenue record authentication routed to ${locObj.landPortal}`);

      clonedSteps.forEach((step) => {
        if (step.id === 'step-kisan-land') {
          step.officeLocation = `State Revenue Department (${locObj.landPortal})`;
          step.sourceUrl = `https://${locObj.landPortal}`;
        }
      });
    }
  }

  // 5. Location-Specific Adaptations for Ayushman Bharat (PM-JAY)
  if (process.id === 'ayushman-bharat') {
    if (locObj.id === 'maharashtra') {
      appliedContexts.push('Co-branded with Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)');
      adaptedProcess.title = 'Ayushman Bharat - MJPJAY Health Protection';
    } else if (locObj.id === 'odisha') {
      appliedContexts.push('Co-branded with Biju Swasthya Kalyan Yojana (BSKY) universal health cover');
      adaptedProcess.title = 'Ayushman Bharat - BSKY Health Protection';
    } else if (locObj.id === 'telangana') {
      appliedContexts.push('Integrated with Aarogyasri Health Care Trust network');
      adaptedProcess.title = 'Ayushman Bharat - Aarogyasri Health Protection';
    } else if (locObj.id === 'west-bengal') {
      appliedContexts.push('Co-branded with Swasthya Sathi state healthcare network');
      adaptedProcess.title = 'Ayushman Bharat - Swasthya Sathi Health Cover';
    }
  }

  // 6. Applicant Profile Adaptations
  if (profileObj.id === 'female') {
    appliedContexts.push('Women applicant concessions & priority quota applied');
    if (process.id === 'pmay-housing') {
      clonedSteps.forEach((step) => {
        if (step.id === 'step-pmay-check') {
          step.description += ' Note: PMAY-G mandates female head-of-household or joint ownership on the land deed.';
        }
      });
    }
    if (process.id === 'sukanya-samriddhi') {
      appliedContexts.push('Triple Tax Exemption (EEE) under Section 80C confirmed');
    }
  } else if (profileObj.id === 'senior') {
    appliedContexts.push('Senior citizen priority slot & assisted verification active');
    clonedSteps.forEach((step) => {
      if (step.id === 'step-dl-track-test') {
        step.description += ' (Special senior citizen test queue and medical fitness Form 1-A priority scrutiny applies).';
      }
    });
  } else if (profileObj.id === 'msme') {
    appliedContexts.push('Udyam MSME 50% statutory fee concessions applied');
  }

  // 7. Service Delivery Mode Adaptations
  if (modeObj.id === 'online') {
    appliedContexts.push('Faceless digital mode: No physical office visits required');
  } else if (modeObj.id === 'assisted') {
    appliedContexts.push('Assisted mode: CSC / Mo Seva Kendra biometric token generated');
    clonedSteps.forEach((step) => {
      if (step.nodeType === 'action' && step.office) {
        step.office += ' (Assisted by Kendra Operator)';
      }
    });
  } else if (modeObj.id === 'in_person') {
    appliedContexts.push('Physical mode: Hardcopy document submission at designated counter');
  }

  return {
    adaptedProcess,
    appliedContexts,
  };
}

/**
 * AI Adaptation Extension Interface for teammates.
 * This function can query an LLM / AI backend service for advanced multi-modal
 * or jurisdictional adaptations, gracefully falling back to deterministic rules.
 */
export async function requestAIRoadmapAdaptation(
  processId: string,
  filters: RoadmapFilters
): Promise<AdaptationResult | null> {
  try {
    const aiApiUrl = process.env.NEXT_PUBLIC_AI_ADAPTER_URL || '/api/v1/adapt-roadmap';
    const response = await fetch(aiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId, ...filters }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.adaptedProcess) {
        return data as AdaptationResult;
      }
    }
  } catch {
    // Graceful fallback to deterministic local adaptation
  }
  return null;
}
