import { ProcessStep } from '@/types/roadmap';

export interface ApplicantDetails { name: string; address: string; phone: string }

export function buildOfficeMapUrls(address: string, coordinates?: { lat: number; lng: number }) {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const validCoordinates = coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)
    && Math.abs(coordinates.lat) <= 90 && Math.abs(coordinates.lng) <= 180;
  const target = validCoordinates ? `${coordinates.lat},${coordinates.lng}` : trimmed;
  const embedParams = new URLSearchParams({ q: target, output: 'embed', z: '16' });
  const directionsParams = new URLSearchParams({ api: '1', destination: target });
  return {
    embedUrl: `https://www.google.com/maps?${embedParams}`,
    directionsUrl: `https://www.google.com/maps/dir/?${directionsParams}`,
  };
}

export function safeWebUrl(value?: string): string | undefined {
  try {
    const url = new URL(value || '');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

// Ported from divya-work's cover-letter template; requirements come from the roadmap.
export function buildCoverLetter(step: ProcessStep, location: string, applicant: ApplicantDetails, date = new Date()): string {
  return [
    'APPLICATION COVER LETTER — DRAFT',
    'Review before signing. Obtain the prescribed form from the official service page.',
    '', `Date: ${date.toLocaleDateString('en-IN')}`, '', 'To,',
    step.office || 'The designated service officer', step.officeLocation || location,
    '', `Subject: ${step.title}`, '',
    `I, ${applicant.name.trim() || '____________________'}, residing at ${applicant.address.trim() || '____________________'}, request assistance with the following service:`,
    step.title, `Contact: ${applicant.phone.trim() || '____________________'}`, '',
    'Documents to check before submission:',
    ...(step.requirements.length ? step.requirements.map((req, index) => `${index + 1}. ${req.title}${req.isMandatory ? '' : ' (optional)'}`) : ['Confirm the required documents with the service office.']),
    '', 'Please confirm the required form and documents and provide an acknowledgement on submission.',
    '', 'Applicant signature: ____________________',
    `Official service page: ${safeWebUrl(step.sourceUrl) || 'Confirm with the service office.'}`,
  ].join('\n');
}

const HELPLINES = {
  pune: { authority: 'PMC CARE call centre', phone: '18001030222', sourceUrl: 'https://opendata.pmc.gov.in/opendata/PMCReports/PMC-CARE-Booklet.pdf' },
  nagpur: { authority: 'Nagpur citizen call centre', phone: '18001208040', sourceUrl: 'https://www.nmcnagpur.gov.in/RTI/ws/user/contact.do' },
  mumbai: { authority: 'BMC central helpline', phone: '1916', sourceUrl: 'https://health.mcgm.gov.in/' },
  delhi: { authority: 'MCD central control room', phone: '155305', sourceUrl: 'https://mcdonline.nic.in/ptrmcd/web/citizen/property/downloadPdfFile/Central_zone_detail' },
  bengaluru: { authority: 'Greater Bengaluru Authority helpline', phone: '1533', sourceUrl: 'https://bbmp.gov.in/' },
};

export function getCivicHelpline(city: string) {
  // Broad state labels can include multiple cities with different authorities.
  const key = city.trim().toLowerCase().replace(/\s+nct$/, '').replace(/^bangalore$/, 'bengaluru');
  return key === 'pune' || key === 'nagpur' || key === 'mumbai' || key === 'delhi' || key === 'bengaluru' ? HELPLINES[key] : null;
}
