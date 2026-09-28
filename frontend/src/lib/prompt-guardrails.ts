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

const NON_WORD_CHARACTERS = new RegExp('[^\\p{L}\\p{M}\\p{N}\\s]', 'gu');

const CIVIC_INTENT_PATTERNS = [
  /\b(licen[sc]e|parivahan|sarathi|rto|driving|learner|commercial\s+vehicle)\b/i,
  /\b(certificate|cert|pramanpatra|dakhla|daakhla)\b/i,
  /\b(birth|death|marriage|caste|income|domicile|non[\s-]creamy|disability|legal\s+heir|character)\b/i,
  /\b(tax|taxes|property\s+tax|house\s+tax|water\s+tax|professional\s+tax|stamp\s+duty|assessment)\b/i,
  /\b(bill|water\s+bill|electricity\s+bill|meter|connection|pipeline|sewer|sewage|water\s+supply)\b/i,
  /\b(restaurant|food|fssai|foscos|kitchen|dhaba|cafe|canteen|bakery|gumasta|trade\s+licen[sc]e|shop|establishment)\b/i,
  /\b(company|pvt\s+ltd|private\s+limited|llp|incorporat|mca|spice|firm|partnership|udyam|msme)\b/i,
  /\b(complaint|grievance|pothole|garbage|trash|street\s+light|drainage|leakage|illegal\s+construction|encroachment|stray\s+dog)\b/i,
  /\b(7\/12|satbara|ferfar|mutation|land\s+record|patta|khasra|khata|khatauni|deed|registry|bhulekh|mahabhumi)\b/i,
  /\b(ration\s+card|rashan|voter|epic|election\s+card|aadhaar|uidai|pan\s+card|passport|visa)\b/i,
  /\b(pmay|awas|housing|pm[\s-]kisan|kisan|samman\s+nidhi|ayushman|pmjay|aarogya|pension|scholarship|subsidy|yojana|scheme|welfare|ladki\s+bahin|sanjay\s+gandhi)\b/i,
  /\b(fir|police|verification|challan|fine|noc|fire\s+noc|factory\s+licen[sc]e|arms\s+licen[sc]e|gun\s+licen[sc]e)\b/i,
  /\b(building\s+plan|occupancy\s+certificate|commencement\s+certificate|sanction\s+plan|tree\s+cutting|borewell)\b/i,
  /(जन्म|मृत्यु|विवाह|जाती|उत्पन्न|रहिवासी|दाखला|प्रमाणपत्र)/,
  /(ड्रायव्हिंग|लायसन्स|परवाना|गाडी|वाहन)/,
  /(कर|मालमत्ता|पाणी|पट्टी|घरपट्टी|विज|मीटर)/,
  /(सातबारा|फेरफार|जमीन|नोंदणी|दस्तऐवज|रेशन|आधार)/,
  /(तक्रार|कचरा|खड्डे|दिवाबत्ती|पाणीपुरवठा)/,
  /(योजना|पेन्शन|अनुदान|शेतकरी|आवास)/,
  /(टैक्स|प्रॉपर्टी|संपत्ति|लाइसेंस|ड्राइविंग|जाति|आय|प्रमाण\s*पत्र|दाखिला|बिजली|सड़क|शिकायत|पेंशन|भरना|भुगतान)/,
];

export function hasCivicIntent(text: string): boolean {
  return CIVIC_INTENT_PATTERNS.some((pattern) => pattern.test(text));
}

const GREETING_WORDS = new Set([
  'hello', 'hi', 'hey', 'helo', 'hlo', 'hii', 'hiii', 'heyy', 'howdy', 'hola',
  'greetings', 'namaste', 'namaskar', 'namaskara', 'namaskaram', 'salaam', 'salam',
  'pranam', 'adaab', 'vanakkam', 'nomoshkar', 'welcome',
  'नमस्ते', 'नमस्कार', 'प्रणाम', 'सलाम', 'शुभ प्रभात',
]);

const GREETING_PHRASES = [
  'good morning', 'good afternoon', 'good evening', 'good day', 'good night',
  'sat sri akal', 'sat shri akal', 'kem cho', 'kasa kay', 'kasa ahes',
  'radhe radhe', 'ram ram', 'jai shri ram', 'jai bhim',
  'just saying hi', 'checking in', 'testing hello',
];

const GREETING_RECIPIENTS = new Set([
  'untangle', 'bot', 'ai', 'assistant', 'sir', 'maam', 'madam', 'there',
  'team', 'friend', 'bro', 'bhai', 'everyone', 'all', 'dear', 'admin',
]);

const BOT_CONVERSATION_PATTERNS = [
  /^(who|what)\s+(are|r)\s+(you|u)\b/i,
  /^(what\s+is|whats|what's)\s+your\s+name\b/i,
  /^(who|what)\s+(made|created|built)\s+you\b/i,
  /^are\s+you\s+(an?\s+)?(ai|bot|robot|human|chatgpt|gemini|claude|real)\b/i,
  /^(who|what)\s+is\s+untangle\b/i,
  /^tell\s+me\s+about\s+(yourself|untangle|you)\b/i,
  /^(what\s+can|what\s+do)\s+you\s+do\b/i,
  /^how\s+do\s+you\s+work\b/i,
  /^what\s+is\s+this\s+(website|web\s*site|app|application|page|tool|system|service)\b/i,
  /^how\s+are\s+you(\s+doing)?\b/i,
  /^how\s+do\s+you\s+do\b/i,
  /^(what's|whats)\s+up\b/i,
  /^sup\b/i,
  /^what\s+are\s+you\s+doing\b/i,
  /^nice\s+to\s+meet\s+you\b/i,
  /^(thank\s+you|thanks|thx|thank\s*u)(\s+(so\s+much|very\s+much|a\s+lot))?\b/i,
  /^(ok|okay|k|alright|cool|fine|yes|no|yep|nope|bye|goodbye|cya|see\s+you)(\s+(untangle|bot|sir))?$/i,
  /^tell\s+me\s+a\s+(joke|story|poem|riddle)\b/i,
  /^(write|generate|compose)\s+(a\s+)?(poem|story|song|essay|joke)\b/i,
  /^sing\s+(a\s+)?song\b/i,
  /^entertain\s+me\b/i,
  /^can\s+you\s+talk\b/i,
  /^kya\s+haal\s+hai\b/i,
  /^aap\s+kaun\s+ho\b/i,
  /^kashi\s+ahes\b/i,
];

const TEST_PLACEHOLDER_WORDS = new Set([
  'test', 'testing', 'tested', 'trial', 'dummy', 'sample', 'demo',
  'temp', 'foo', 'bar', 'baz', 'check', 'checking',
]);

const KEYBOARD_SMASH_PATTERNS = [
  /^(asdf|asdfg|asdfgh|asdfghjkl|qwerty|qwertyuiop|zxcvbnm|qweqwe|asdasd|zxczxc|12345|123456|abcde|abcdef|xyz123|test123)$/i,
  /^(blah|blah\s+blah|haha|hahaha|hehe|hehehe|lala|lalala)$/i,
];

const KNOWN_CIVIC_ACRONYMS = new Set([
  'dl', 'rto', 'fir', 'gst', 'pan', 'rti', 'noc', 'llp', 'fssai', 'pmay',
  'pmjay', 'mca', 'msme', 'uidai', 'bdo', 'crpc', 'ipc', 'mla', 'mp',
  'pwd', 'cidco', 'mmrda', 'pmc', 'mcgm', 'bmc', 'ncl', 'pvt', 'ltd',
  'oc', 'cc', 'ec', '712',
]);

const OUT_OF_SCOPE_TOPIC_PATTERNS = [
  /\b(python|javascript|typescript|react|html|css|sql|github|npm|write\s+(a\s+)?code|debug\s+(my\s+)?code|fix\s+(my\s+)?code|programming)\b/i,
  /\b(what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+|solve\s+(this\s+)?(equation|math)|capital\s+of\s+[a-z]+|who\s+won\s+the\s+(match|world\s+cup|ipl)|history\s+of\s+world\s+war)\b/i,
  /\b(weather|temperature|forecast|climate|raining)\b/i,
  /\b(order\s+(a\s+)?pizza|pizza|buy\s+(shoes|iphone|clothes|laptop|car)|book\s+(a\s+)?flight|flight\s+tickets?|hotel\s+booking|movie\s+tickets?|flipkart|amazon|zomato|swiggy|best\s+phone)\b/i,
  /\b(best\s+(restaurants|cafes|bars|hotels|places\s+to\s+visit|street\s+food)\s+(in|near|around))\b/i,
  /\b(recipe\s+for|how\s+to\s+(make|cook|bake)\s+(biryani|pizza|cake|tea|coffee|pasta))\b/i,
  /\b(rocket\s+in\s+my\s+backyard|build\s+a\s+rocket|launch\s+a\s+missile)\b/i,
  /\b(alien\s+registration|ufo\s+sighting|area\s+51)\b/i,
  /\b(adopt\s+a\s+dinosaur|buy\s+a\s+dinosaur|pet\s+dinosaur)\b/i,
  /\b(time\s+machine|travel\s+in\s+time|teleportation)\b/i,
  /\b(superhero\s+registration|avengers\s+license)\b/i,
  /\b(tame\s+a\s+(lion|tiger|bear)|domesticate\s+a\s+shark)\b/i,
  /\b(hack\s+a\s+bank|robbing\s+a\s+bank|make\s+fake\s+money)\b/i,
];

const FILLER_WORDS = new Set([
  'i', 'we', 'a', 'an', 'the', 'my', 'me', 'us', 'please', 'help', 'need', 'want',
  'get', 'have', 'with', 'for', 'in', 'at', 'to', 'how', 'do', 'can', 'you', 'some',
  'information', 'info', 'guidance', 'service', 'services', 'government', 'apply',
  'application', 'urgent', 'urgently', 'assistance', 'about', 'on', 'is', 'it',
  'tell', 'give', 'show', 'process', 'procedure', 'rules', 'details', 'steps',
  'portal', 'website', 'online', 'offline', 'form', 'status', 'check', 'query', 'question',
  'mujhe', 'karna', 'karni', 'hai', 'karein', 'batao', 'madat', 'chahiye', 'kaise', 'kya',
  'mala', 'pahije', 'kase', 'ahe',
  ...Object.keys(CITY_NAMES),
]);

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
  const rawTrimmed = query.trim();
  if (!rawTrimmed) {
    return 'Which service do you need? Name the task, for example: “pay property tax” or “apply for a birth certificate”.';
  }

  const normalized = query.toLowerCase().replace(NON_WORD_CHARACTERS, ' ').trim();
  const padded = ` ${normalized.replace(/\s+/g, ' ')} `;

  if (municipalitySlug === '__other__' || OUTSIDE_MAHARASHTRA.some((place) => padded.includes(` ${place} `))) {
    return UNSUPPORTED_LOCATION_MESSAGE;
  }

  const hasCivic = hasCivicIntent(query);

  if (!hasCivic) {
    // 1. Check for greetings and pleasantries
    let withoutPhrases = normalized;
    for (const phrase of GREETING_PHRASES) {
      withoutPhrases = withoutPhrases.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), ' ');
    }
    const greetingTokens = withoutPhrases.split(/\s+/).filter(Boolean);
    const hasGreetingWord = greetingTokens.some((t) => GREETING_WORDS.has(t)) || withoutPhrases !== normalized;
    const isOnlyGreetingsAndFiller = greetingTokens.length === 0 || greetingTokens.every(
      (token) => GREETING_WORDS.has(token) || GREETING_RECIPIENTS.has(token) || FILLER_WORDS.has(token)
    );

    if (hasGreetingWord && isOnlyGreetingsAndFiller) {
      return 'Please name the government or civic service you need help with (e.g. “renew driving license”, “birth certificate”, or “pay property tax”).';
    }

    // 2. Check for bot conversation / small talk
    if (BOT_CONVERSATION_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return 'Untangle is a guide for official government procedures and paperwork. Enter the civic task you want to complete, such as “register a company” or “water connection”.';
    }

    // 3. Check for gibberish, keyboard mash, pure numbers/symbols, repetition
    const isPureDigitsOrSymbols = !/[a-zA-Z\u0900-\u097F]/.test(rawTrimmed);
    const hasRepeatedChars = /(.)\1{2,}/.test(normalized);
    const isKeyboardSmash = KEYBOARD_SMASH_PATTERNS.some((pattern) => pattern.test(normalized));
    const isTestWord = TEST_PLACEHOLDER_WORDS.has(normalized) || /^test\s*\d*$/i.test(normalized);
    const hasUnvoweledCluster = normalized.split(/\s+/).some(
      (w) => /^[a-z]{4,}$/i.test(w) && !/[aeiouy]/i.test(w) && !KNOWN_CIVIC_ACRONYMS.has(w.toLowerCase())
    );
    const isShortMeaningless = /^[a-z]{1,2}$/i.test(normalized) && !KNOWN_CIVIC_ACRONYMS.has(normalized.toLowerCase());

    if (isPureDigitsOrSymbols || hasRepeatedChars || isKeyboardSmash || isTestWord || hasUnvoweledCluster || isShortMeaningless) {
      return 'Please enter a valid government service or procedure (e.g. “food license for restaurant”, “caste certificate”, or “7/12 extract”).';
    }

    // 4. Check for out-of-scope non-civic topics
    if (OUT_OF_SCOPE_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return 'Untangle guides official civic and government procedures in Maharashtra. Search for a civic service like a license, certificate, tax payment, or permit.';
    }
  }

  // 5. Evaluate actionable terms after filtering filler words
  const terms = normalized.split(/\s+/).filter((word) => word && !FILLER_WORDS.has(word));
  if (!terms.length) {
    const loc = classifyPromptLocation(query);
    if (loc.municipalitySlug || loc.districts.length > 0) {
      return 'Name the civic service you need in this city, for example: “apply for a birth certificate” or “trade license”.';
    }
    return 'Which service do you need? Name the task, for example: “pay property tax” or “apply for a birth certificate”.';
  }

  if (terms.every((word) => ['certificate', 'certificates', 'document', 'documents', 'daakhla', 'pramanpatra'].includes(word))) {
    return 'Which certificate or document do you need? For example, a birth certificate, death certificate or income certificate.';
  }

  if (terms.every((word) => ['tax', 'taxes', 'pay', 'payment', 'bill', 'kar', 'patti'].includes(word))) {
    return 'Which tax do you need help with? Specify property tax, income tax or GST, and whether you want to pay, register or correct a bill.';
  }

  // 6. Check location constraints
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
