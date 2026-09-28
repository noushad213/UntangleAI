const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const filename = path.resolve(__dirname, '../src/components/roadmap/RoadmapReviewNotice.tsx');
const loaded = new Module(filename, module);
loaded.require = (id) => id.endsWith('.module.css') ? {} : module.require(id);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const { RoadmapReviewNotice } = loaded.exports;

test('source gaps and conflicts are named explicitly without a blanket verification warning', () => {
  const html = renderToStaticMarkup(RoadmapReviewNotice({ review: {
    status: 'needs_review', missingInformation: ['Application fee not published', 'Processing time not stated'],
    conflicts: ['Two official pages list different fees'],
  } }));
  assert.match(html, /Application fee not published/);
  assert.match(html, /Processing time not stated/);
  assert.match(html, /Two official pages list different fees/);
  assert.match(html, /<details/);
  assert.doesNotMatch(html, /Check each official source|missing detail\(s\)|awaiting review/);
});

test('complete generated guidance is not represented as reviewed by a human', () => {
  const html = renderToStaticMarkup(RoadmapReviewNotice({ review: { status: 'needs_review', missingInformation: [], conflicts: [] } }));
  assert.match(html, /Roadmap from official sources/);
  assert.match(html, /Human review pending/);
  assert.doesNotMatch(html, /Details still unconfirmed|<details/);
});
