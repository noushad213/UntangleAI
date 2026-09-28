const CITY_NAMES: Record<string, string> = {
  pune: 'Pune', mumbai: 'Mumbai', nagpur: 'Nagpur', nashik: 'Nashik',
  delhi: 'Delhi', bengaluru: 'Bengaluru', chennai: 'Chennai', hyderabad: 'Hyderabad',
};

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
  const cities = Object.keys(CITY_NAMES).filter((city) => normalized.split(/\s+/).includes(city));
  if (municipalitySlug && cities.length && !cities.includes(municipalitySlug)) {
    return `Your request mentions ${cities.map((city) => CITY_NAMES[city]).join(', ')}, but your service city is ${CITY_NAMES[municipalitySlug] || municipalitySlug}. Change the city or correct your request before continuing.`;
  }
  return null;
}
