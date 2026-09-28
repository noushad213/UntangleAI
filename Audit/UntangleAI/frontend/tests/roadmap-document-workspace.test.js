const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('document drawer provides checklist and uploaded-document views', () => {
  const source = read('src/components/roadmap/DocumentVaultDrawer.tsx');

  assert.match(source, /Checklist/);
  assert.match(source, /My documents/);
  assert.match(source, /documentsByStep/);
  assert.match(source, /No documents added yet/);
});

test('roadmap header exposes documents and groups secondary actions', () => {
  const source = read('src/components/roadmap/RoadmapHeader.tsx');

  assert.match(source, /id="roadmap-documents-btn"/);
  assert.match(source, /id="roadmap-more-actions-btn"/);
  assert.match(source, /onOpenDocuments/);
});
