/**
 * Civic Query Guardrail
 * Identifies vague, abstract, or wild out-of-scope queries before triggering expensive search pipelines.
 */

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

const OUT_OF_SCOPE_PATTERNS = [
  /\b(rocket\s+in\s+my\s+backyard|build\s+a\s+rocket|launch\s+a\s+missile)\b/i,
  /\b(alien\s+registration|ufo\s+sighting|area\s+51)\b/i,
  /\b(adopt\s+a\s+dinosaur|buy\s+a\s+dinosaur|pet\s+dinosaur)\b/i,
  /\b(time\s+machine|travel\s+in\s+time|teleportation)\b/i,
  /\b(superhero\s+registration|avengers\s+license)\b/i,
  /\b(tame\s+a\s+(lion|tiger|bear)|domesticate\s+a\s+shark)\b/i,
  /\b(hack\s+a\s+bank|robbing\s+a\s+bank|make\s+fake\s+money)\b/i,
];

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

  // Check out-of-scope non-government queries
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        type: "OUT_OF_SCOPE",
        code: "OUT_OF_SCOPE",
        message: "This request is outside the scope of Maharashtra civic and government statutory services.",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }
  }

  // Check vague queries without a concrete civic domain
  for (const pattern of VAGUE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        type: "CLARIFICATION_REQUIRED",
        code: "CLARIFICATION_REQUIRED",
        message: "Your request is too broad. Please specify which civic service you need — for example: food quality testing, trade license, driving license, or commercial kitchen approval.",
        suggestions: SUGGESTIONS.slice(0, 4),
      };
    }
  }

  return { type: "VALID" };
}

module.exports = {
  evaluateQueryGuardrail,
  SUGGESTIONS,
};
