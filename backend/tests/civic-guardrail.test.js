const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateQueryGuardrail, hasCivicIntent } = require("../src/utils/civic-query-guardrail");

test("civic guardrail rejects greetings and salutations upfront", () => {
  for (const query of [
    "hello",
    "hi",
    "hey",
    "namaste",
    "good morning",
    "hello untangle",
    "hi there",
    "namaste sir",
    "salaam",
    "namaskar",
  ]) {
    const result = evaluateQueryGuardrail(query);
    assert.equal(result.type, "CLARIFICATION_REQUIRED", `Failed for query: "${query}"`);
    assert.equal(result.code, "CLARIFICATION_REQUIRED");
    assert.match(result.message, /service you need help with/i);
    assert.ok(Array.isArray(result.suggestions) && result.suggestions.length > 0);
  }
});

test("civic guardrail rejects gibberish, keyboard mash, and test noise", () => {
  for (const query of [
    "asdf",
    "test",
    "12345",
    "qwerty",
    "aaaa",
    "sdfsdf",
    "blah blah",
    "???",
    "testing",
  ]) {
    const result = evaluateQueryGuardrail(query);
    assert.equal(result.type, "CLARIFICATION_REQUIRED", `Failed for query: "${query}"`);
    assert.match(result.message, /valid government service/i);
  }
});

test("civic guardrail rejects bot small talk and AI queries", () => {
  for (const query of [
    "who are you",
    "how are you",
    "what can you do",
    "tell me a joke",
    "are you an ai",
    "who is untangle",
  ]) {
    const result = evaluateQueryGuardrail(query);
    assert.equal(result.type, "CLARIFICATION_REQUIRED", `Failed for query: "${query}"`);
    assert.match(result.message, /Untangle is a guide/i);
  }
});

test("civic guardrail rejects out-of-scope non-civic topics", () => {
  for (const query of [
    "order pizza",
    "weather in pune",
    "write a python code",
    "buy shoes online",
    "best restaurants in mumbai",
    "recipe for biryani",
    "build a rocket in my backyard",
  ]) {
    const result = evaluateQueryGuardrail(query);
    assert.equal(result.type, "OUT_OF_SCOPE", `Failed for query: "${query}"`);
    assert.equal(result.code, "OUT_OF_SCOPE");
    assert.match(result.message, /civic and government procedures/i);
  }
});

test("civic guardrail accepts valid civic queries even with polite greeting prefixes", () => {
  for (const query of [
    "hello, how to renew driving license",
    "hi I want to open a restaurant",
    "namaste, mujhe birth certificate chahiye",
    "good morning, property tax payment in pune",
    "birth certificate",
    "property tax payment",
    "garbage complaint",
    "water connection",
    "7/12 extract",
    "shop and establishment license",
    "मुझे पुणे में प्रॉपर्टी टैक्स भरना है।",
  ]) {
    const result = evaluateQueryGuardrail(query);
    assert.equal(result.type, "VALID", `Expected valid query for: "${query}"`);
  }
});
