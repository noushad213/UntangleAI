import { MAHARASHTRA_PLACES, MAHARASHTRA_DISTRICTS, normalizeLocation } from './maharashtra-locations';

const CITY_NAMES: Record<string, string> = Object.fromEntries(MAHARASHTRA_PLACES
  .filter(place => place.kind === 'city').map(place => [place.slug, place.name]));

const OUTSIDE_MAHARASHTRA = [
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa',
  'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala',
  'madhya pradesh', 'madhya prades', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
  'odisha', 'orissa', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana',
  'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal', 'andaman', 'chandigarh',
  'dadra', 'daman', 'delhi', 'jammu', 'kashmir', 'ladakh', 'lakshadweep', 'puducherry',
  'pondicherry', 'bhopal', 'indore', 'bangalore', 'bengaluru', 'chennai', 'hyderabad',
  'kolkata', 'jaipur', 'lucknow', 'ahmedabad', 'surat', 'kochi', 'thiruvananthapuram',
  'मध्य प्रदेश', 'मध्यप्रदेश', 'कर्नाटक', 'दिल्ली', 'गुजरात', 'राजस्थान', 'उत्तर प्रदेश',
];

export const UNSUPPORTED_LOCATION_MESSAGE = 'Live roadmaps for this location are not supported yet. Generation currently covers configured Maharashtra cities. Browse sample guides and check the official service portal for your state or city.';

const FILLER_WORDS = new Set([
  'i', 'we', 'a', 'an', 'the', 'my', 'me', 'us', 'please', 'help', 'need', 'want',
  'get', 'have', 'with', 'for', 'in', 'at', 'to', 'how', 'do', 'can', 'you', 'some',
  'information', 'info', 'guidance', 'service', 'services', 'government', 'apply',
  'application', 'urgent', 'urgently', 'assistance', 'about', 'on', 'is', 'it',
  ...Object.keys(CITY_NAMES),
]);

const NON_WORD_CHARACTERS = new RegExp('[^\\p{L}\\p{M}\\p{N}\\s]', 'gu');

interface LocationClassification {
  region: 'mumbai' | 'maharashtra' | 'outside-maharashtra' | 'ambiguous' | 'unknown';
  municipalitySlug: string | null;
  names: string[];
  districts: string[];
}

export function classifyPromptLocation(query: string): LocationClassification {
  const text = ` ${normalizeLocation(query)} `;
  if (OUTSIDE_MAHARASHTRA.some(place => text.includes(` ${normalizeLocation(place)} `))) {
    return { region: 'outside-maharashtra', municipalitySlug: null, names: [], districts: [] };
  }
  const matches = MAHARASHTRA_PLACES.flatMap(place => place.aliases.flatMap(alias => {
    const token = ` ${normalizeLocation(alias)} `;
    const found = [];
    let start = text.indexOf(token);
    while (start !== -1) {
      const end = start + token.length - 1;
      const districtQualified = /^(district|जिल्हा|जिल्ह्यात)(?: |$)/.test(text.slice(end + 1)) || /(?:district|जिल्हा) $/.test(text.slice(0, start + 1));
      if (!districtQualified || place.kind === 'district') found.push({ place, start, end, districtQualified });
      start = text.indexOf(token, start + 1);
    }
    return found;
  }));
  // Suppress only overlapping names: separate mentions of Mumbai and Navi Mumbai remain distinct.
  let specific = matches.filter(match => !matches.some(other => other.start <= match.start && other.end >= match.end && other.end - other.start > match.end - match.start));
  const districtContext = new Set(specific.filter(match => match.place.kind === 'district' && match.districtQualified).map(match => match.place.district));
  const anchors = new Set(specific.filter(match => match.place.municipalitySlug && !specific.some(other => other.start === match.start && other.end === match.end && other.place.municipalitySlug && other.place.municipalitySlug !== match.place.municipalitySlug)).map(match => match.place.municipalitySlug));
  specific = specific.filter(match => {
    const alternatives = specific.filter(other => other.start === match.start && other.end === match.end && other.place.municipalitySlug && other.place.municipalitySlug !== match.place.municipalitySlug);
    if (!alternatives.length || match.place.kind === 'district') return true;
    if (districtContext.size) return districtContext.has(match.place.district);
    if (anchors.size === 1 && alternatives.some(other => anchors.has(other.place.municipalitySlug))) return anchors.has(match.place.municipalitySlug);
    return true;
  });
  // A district with the same name as its capital is a city only when a district wasn't requested.
  specific = specific.filter(match => match.place.kind !== 'district' || match.districtQualified || !specific.some(other => other.place.kind !== 'district' && other.start === match.start && other.end === match.end));
  const cities = new Map(specific.filter(match => match.place.municipalitySlug).map(match => [match.place.municipalitySlug!, match.place]));
  const districts = Array.from(new Set(specific.map(match => match.place.district)));
  const names = Array.from(cities.values()).map(place => CITY_NAMES[place.municipalitySlug!] || place.name);
  if (cities.size > 1 || districtContext.size > 1 || (cities.size === 1 && specific.some(match => match.place.kind === 'district' && match.place.district !== Array.from(cities.values())[0].district))) {
    return { region: 'ambiguous', municipalitySlug: null, names, districts };
  }
  const municipalitySlug = Array.from(cities.keys())[0] || null;
  const isMumbai = municipalitySlug === 'mumbai' || (!municipalitySlug && districts.length > 0 && districts.every(district => district.startsWith('mumbai-')));
  return { region: isMumbai ? 'mumbai' : specific.length || text.includes(' maharashtra ') || text.includes(' महाराष्ट्र ') ? 'maharashtra' : 'unknown', municipalitySlug: isMumbai ? 'mumbai' : municipalitySlug, names, districts };
}

export function resolvePromptMunicipality(
  query: string,
  municipalities: Array<{ slug: string; name: string }>
): string | null {
  const location = classifyPromptLocation(query);
  if (!location.municipalitySlug || location.region === 'ambiguous') return null;
  return municipalities.find(city => city.slug === location.municipalitySlug || classifyPromptLocation(city.name).municipalitySlug === location.municipalitySlug)?.slug || null;
}

export function getPromptAlert(query: string, municipalitySlug?: string): string | null {
  const normalized = query.toLowerCase().replace(NON_WORD_CHARACTERS, ' ').trim();
  const padded = ` ${normalized.replace(/\s+/g, ' ')} `;
  if (municipalitySlug === '__other__' || OUTSIDE_MAHARASHTRA.some((place) => padded.includes(` ${place} `))) {
    return UNSUPPORTED_LOCATION_MESSAGE;
  }
  const terms = normalized.split(/\s+/).filter((word) => word && !FILLER_WORDS.has(word));
  if (!terms.length) {
    return 'Which service do you need? Name the task, for example: “pay property tax” or “apply for a birth certificate”.';
  }
  if (terms.every((word) => ['certificate', 'certificates', 'document', 'documents'].includes(word))) {
    return 'Which certificate or document do you need? For example, a birth certificate, death certificate or income certificate.';
  }
  if (terms.every((word) => ['tax', 'taxes', 'pay', 'payment', 'bill'].includes(word))) {
    return 'Which tax do you need help with? Specify property tax, income tax or GST, and whether you want to pay, register or correct a bill.';
  }
  const location = classifyPromptLocation(query);
  if (location.region === 'ambiguous') {
    return 'Your request mentions more than one city. Keep the city where you need this service in your request.';
  }
  const selected = municipalitySlug ? classifyPromptLocation(municipalitySlug.replace(/-/g, ' ')) : null;
  if (selected?.region === 'outside-maharashtra' || (municipalitySlug && selected?.region === 'unknown')) return UNSUPPORTED_LOCATION_MESSAGE;
  if (municipalitySlug && location.municipalitySlug && location.municipalitySlug !== selected?.municipalitySlug) {
    return `Your request mentions ${location.names.join(', ') || 'Mumbai'}, but your service city is ${CITY_NAMES[selected?.municipalitySlug || ''] || municipalitySlug}. Change the city or correct your request before continuing.`;
  }
  if (municipalitySlug && location.districts.length && !location.municipalitySlug && !location.districts.some(district => selected?.districts.includes(district))) {
    const districtNames = location.districts.map(slug => MAHARASHTRA_DISTRICTS.find(district => district.slug === slug)?.name || slug);
    return `Your request mentions ${districtNames.join(', ')}, but your service city is ${CITY_NAMES[selected?.municipalitySlug || ''] || municipalitySlug}. Choose a municipality in that district.`;
  }
  return null;
}
