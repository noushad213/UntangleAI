const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeQuery, matchCivicQuery } = require("../src/services/queryRouter.service");
const CivicQuery = require("../src/models/CivicQuery");
const mongoose = require("mongoose");

test("normalizeQuery cleans punctuation, Devanagari characters, and collapses spaces", () => {
  assert.equal(
    normalizeQuery("  How to apply for baby's birth certificate?! "),
    "how to apply for baby s birth certificate"
  );
  assert.equal(
    normalizeQuery("जन्म दाखला कसा काढायचा?"),
    "जन्म दाखला कसा काढायचा"
  );
  assert.equal(normalizeQuery(""), "");
  assert.equal(normalizeQuery(null), "");
});

test("matchCivicQuery returns null safely when database is disconnected", async () => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  try {
    const result = await matchCivicQuery("birth certificate", "pune");
    assert.equal(result, null);
  } finally {
    mongoose.connection.readyState = originalState;
  }
});

test("matchCivicQuery performs exact normalized match when connected", async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  try {
    t.mock.method(CivicQuery, "findOne", async () => ({
      _id: "query1",
      issueKey: "birth_certificate",
      intentLabel: "Birth Certificate Application",
      keywords: ["birth", "certificate"],
    }));
    t.mock.method(CivicQuery, "updateOne", async () => ({}));

    const res = await matchCivicQuery("How to apply for birth certificate", "pune");
    assert.deepEqual(res, {
      issueKey: "birth_certificate",
      intent: "Birth Certificate Application",
      keywords: ["birth", "certificate"],
      confidence: 1.0,
      classifier: "civic_query_exact",
    });
  } finally {
    mongoose.connection.readyState = originalState;
  }
});

test("matchCivicQuery falls back to text score match when exact match misses", async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  try {
    t.mock.method(CivicQuery, "findOne", async () => null);
    t.mock.method(CivicQuery, "find", () => ({
      sort: () => ({
        limit: async () => [
          {
            _id: "query2",
            queryText: "pay property tax bill online",
            normalizedQuery: "pay property tax bill online",
            issueKey: "property_tax_payment",
            intentLabel: "Property Tax Payment & Assessment",
            keywords: ["property", "tax"],
            score: 2.5,
            get: (field) => (field === "score" ? 2.5 : undefined),
          },
        ],
      }),
    }));
    t.mock.method(CivicQuery, "updateOne", async () => ({}));

    const res = await matchCivicQuery("pay tax bill online", "pune");
    assert.ok(res);
    assert.equal(res.issueKey, "property_tax_payment");
    assert.equal(res.classifier, "civic_query_text");
    assert.ok(res.confidence > 0.5);
  } finally {
    mongoose.connection.readyState = originalState;
  }
});
