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

const CITY_ALIASES: Record<string, string[]> = {
  mumbai: ['मुंबई'], pune: ['पुणे'], nagpur: ['नागपुर', 'नागपूर'],
  nashik: ['नाशिक'], 'navi-mumbai': ['Navi Mumbai', 'नवी मुंबई'],
};

export function resolvePromptMunicipality(
  query: string,
  municipalities: Array<{ slug: string; name: string }>
): string | null {
  const normalize = (value: string) => value.toLowerCase().replace(NON_WORD_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
  const text = ` ${normalize(query)} `;
  const names = new Map(Object.entries(CITY_NAMES));
  names.set('navi-mumbai', 'Navi Mumbai');
  for (const city of municipalities) names.set(city.slug, city.name);
  const matches = Array.from(names).flatMap(([slug, name]) =>
    [name, slug.replace(/-/g, ' '), ...(CITY_ALIASES[slug] || [])]
      .map(normalize)
      .filter((alias) => alias && text.includes(` ${alias} `))
      .map((alias) => ({ slug, alias }))
  );
  // A longer city name takes precedence over a name contained inside it.
  const slugs = new Set(matches.filter((match) => !matches.some((other) =>
    other.slug !== match.slug && ` ${other.alias} `.includes(` ${match.alias} `)
  )).map((match) => match.slug));
  const [slug] = Array.from(slugs);
  return slugs.size === 1 && municipalities.some((city) => city.slug === slug) ? slug : null;
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
  const cities = Object.keys(CITY_NAMES).filter((city) => normalized.split(/\s+/).includes(city));
  if (cities.length > 1) {
    return 'Your request mentions more than one city. Keep the city where you need this service in your request.';
  }
  if (municipalitySlug && cities.length && !cities.includes(municipalitySlug)) {
    return `Your request mentions ${cities.map((city) => CITY_NAMES[city]).join(', ')}, but your service city is ${CITY_NAMES[municipalitySlug] || municipalitySlug}. Change the city or correct your request before continuing.`;
  }
  return null;
}
