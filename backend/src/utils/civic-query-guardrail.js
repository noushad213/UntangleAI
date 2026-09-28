/**
 * Civic Query Guardrail
 * Identifies vague, abstract, conversational, gibberish, or wild out-of-scope queries
 * before triggering expensive search or LLM pipelines.
 */

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

function hasCivicIntent(text) {
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

const OUT_OF_SCOPE_PATTERNS = [
  /\b(rocket\s+in\s+my\s+backyard|build\s+a\s+rocket|launch\s+a\s+missile)\b/i,
  /\b(alien\s+registration|ufo\s+sighting|area\s+51)\b/i,
  /\b(adopt\s+a\s+dinosaur|buy\s+a\s+dinosaur|pet\s+dinosaur)\b/i,
  /\b(time\s+machine|travel\s+in\s+time|teleportation)\b/i,
  /\b(superhero\s+registration|avengers\s+license)\b/i,
  /\b(tame\s+a\s+(lion|tiger|bear)|domesticate\s+a\s+shark)\b/i,
  /\b(hack\s+a\s+bank|robbing\s+a\s+bank|make\s+fake\s+money)\b/i,
  /\b(python|javascript|typescript|react|html|css|sql|github|npm|write\s+(a\s+)?code|debug\s+(my\s+)?code|fix\s+(my\s+)?code|programming)\b/i,
  /\b(what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+|solve\s+(this\s+)?(equation|math)|capital\s+of\s+[a-z]+|who\s+won\s+the\s+(match|world\s+cup|ipl)|history\s+of\s+world\s+war)\b/i,
  /\b(weather|temperature|forecast|climate|raining)\b/i,
  /\b(order\s+(a\s+)?pizza|pizza|buy\s+(shoes|iphone|clothes|laptop|car)|book\s+(a\s+)?flight|flight\s+tickets?|hotel\s+booking|movie\s+tickets?|flipkart|amazon|zomato|swiggy|best\s+phone)\b/i,
  /\b(best\s+(restaurants|cafes|bars|hotels|places\s+to\s+visit|street\s+food)\s+(in|near|around))\b/i,
  /\b(recipe\s+for|how\s+to\s+(make|cook|bake)\s+(biryani|pizza|cake|tea|coffee|pasta))\b/i,
];

const VAGUE_PATTERNS = [
  /^(how\s+to\s+)?(see|get|find|view|check|look\s+at)\s+(anyth(?:ing|ig|n)?s?|everything|stuff|all\s+things?|something|things)$/i,
  /^(i\s+want\s+to\s+)?(get|see|find|view|check)\s+(anyth(?:ing|ig|n)?s?|everything|stuff|all\s+things?|something)$/i,
  /^(how\s+to\s+)?(get|apply\s+for|take)\s+license\s+of\s+(anyth(?:ing|ig|n)?s?|everything|something|all(\s+things?)?)$/i,
  /^(license\s+of\s+)(anyth(?:ing|ig|n)?s?|all(\s+things?)?|everything|something)$/i,
  /^(how\s+to\s+)?(test|check)\s+qualit(y|ies)$/i,
  /^(testing\s+qualities)$/i,
  /^(how\s+to\s+)?(do|start)\s+(anyth(?:ing|ig|n)?s?|something|anything\s+new)$/i,
  /^(where\s+is\s+)?(anyth(?:ing|ig|n)?s?|everything|stuff)$/i,
  /^(see\s+(anyth(?:ing|ig|n)?s?|things))$/i,
  /^(check\s+(anyth(?:ing|ig|n)?s?|everything|stuff))$/i,
  /^(view\s+(stuff|anything|anythings))$/i,
  /^(apply\s+for\s+all)$/i,
  /^(start\s+anything\s+new)$/i,
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
]);

const SUGGESTIONS = [
  "How to get FSSAI license for food stall or Vada Pav",
  "How to get approval for a cloud kitchen or dhaba",
  "How to start and register a SaaS company in Maharashtra",
  "How to apply for or renew a driving license",
  "How to apply for a birth or death certificate",
  "How to obtain a Shop and Establishment (Gumasta) license",
  "How to download 7/12 land records extract",
  "How to apply for a passport or foreign visa",
];

function evaluateQueryGuardrail(query) {
  if (typeof query !== "string") {
    return { type: "INVALID" };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return {
      type: "CLARIFICATION_REQUIRED",
      code: "CLARIFICATION_REQUIRED",
      message: "Which service do you need? Name the task, for example: “pay property tax” or “apply for a birth certificate”.",
      suggestions: SUGGESTIONS.slice(0, 4),
    };
  }

  const normalized = trimmed.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').trim();

  // Check out-of-scope non-government queries
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        type: "OUT_OF_SCOPE",
        code: "OUT_OF_SCOPE",
        message: "Untangle guides official civic and government procedures in Maharashtra. Search for a civic service like a license, certificate, tax payment, or permit.",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }
  }

  // Check vague patterns
  for (const pattern of VAGUE_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(normalized)) {
      return {
        type: "CLARIFICATION_REQUIRED",
        code: "CLARIFICATION_REQUIRED",
        message: "Your request is too broad. Please specify which civic service you need — for example: food quality testing, trade license, driving license, or commercial kitchen approval.",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }
  }

  const hasCivic = hasCivicIntent(query);

  if (!hasCivic) {
    // 1. Check greetings
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
      return {
        type: "CLARIFICATION_REQUIRED",
        code: "CLARIFICATION_REQUIRED",
        message: "Please name the government or civic service you need help with (e.g. “renew driving license”, “birth certificate”, or “pay property tax”).",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }

    // 2. Check bot conversation
    if (BOT_CONVERSATION_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return {
        type: "CLARIFICATION_REQUIRED",
        code: "CLARIFICATION_REQUIRED",
        message: "Untangle is a guide for official government procedures and paperwork. Enter the civic task you want to complete, such as “register a company” or “water connection”.",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }

    // 3. Check gibberish / keyboard mash
    const isPureDigitsOrSymbols = !/[a-zA-Z\u0900-\u097F]/.test(trimmed);
    const hasRepeatedChars = /(.)\1{2,}/.test(normalized);
    const isKeyboardSmash = KEYBOARD_SMASH_PATTERNS.some((pattern) => pattern.test(normalized));
    const isTestWord = TEST_PLACEHOLDER_WORDS.has(normalized) || /^test\s*\d*$/i.test(normalized);
    const hasUnvoweledCluster = normalized.split(/\s+/).some(
      (w) => /^[a-z]{4,}$/i.test(w) && !/[aeiouy]/i.test(w) && !KNOWN_CIVIC_ACRONYMS.has(w.toLowerCase())
    );
    const isShortMeaningless = /^[a-z]{1,2}$/i.test(normalized) && !KNOWN_CIVIC_ACRONYMS.has(normalized.toLowerCase());

    if (isPureDigitsOrSymbols || hasRepeatedChars || isKeyboardSmash || isTestWord || hasUnvoweledCluster || isShortMeaningless) {
      return {
        type: "CLARIFICATION_REQUIRED",
        code: "CLARIFICATION_REQUIRED",
        message: "Please enter a valid government service or procedure (e.g. “food license for restaurant”, “caste certificate”, or “7/12 extract”).",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }
  }

  // 4. Actionable terms after filtering filler words
  const terms = normalized.split(/\s+/).filter((word) => word && !FILLER_WORDS.has(word));
  if (!terms.length) {
    return {
      type: "CLARIFICATION_REQUIRED",
      code: "CLARIFICATION_REQUIRED",
      message: "Which service do you need? Name the task, for example: “pay property tax” or “apply for a birth certificate”.",
      suggestions: SUGGESTIONS.slice(0, 4),
    };
  }

  return { type: "VALID" };
}

module.exports = {
  evaluateQueryGuardrail,
  hasCivicIntent,
  SUGGESTIONS,
};
