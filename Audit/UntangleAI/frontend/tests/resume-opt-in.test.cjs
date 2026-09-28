const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function setup() {
  const data = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
    dispatchEvent() {},
  };
  global.CustomEvent = class {};
  const filename = path.resolve(__dirname, '../src/lib/storage.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const loaded = new Module(filename, module);
  loaded._compile(compiled.outputText, filename);
  return { data, storage: loaded.exports };
}

test('browsing a roadmap does not save a resume session or replace a tracked roadmap', () => {
  const { data, storage } = setup();
  try {
    storage.saveLastVisitedSession({ id: 'tracked', hasStartedTracking: true });
    storage.saveLastVisitedSession({ id: 'browsed', isTrackingMode: false });
    assert.equal(storage.getLastVisitedSession().id, 'tracked');
    assert.deepEqual(storage.getRecentRoadmapSessions().map((item) => item.id), ['tracked']);
    assert.equal(JSON.parse(data.get('untangle_last_session')).id, 'tracked');
  } finally {
    delete global.window;
    delete global.CustomEvent;
  }
});

test('old automatically saved sessions stay hidden while an opted-in roadmap can be resumed', () => {
  const { data, storage } = setup();
  try {
    data.set('untangle_last_session', JSON.stringify({ id: 'browsed', isTrackingMode: true }));
    data.set('untangle_recent_roadmaps', JSON.stringify([
      { id: 'browsed' },
      { id: 'tracked', hasStartedTracking: true, isTrackingMode: false },
    ]));
    assert.equal(storage.getLastVisitedSession().id, 'tracked');
    assert.deepEqual(storage.getRecentRoadmapSessions().map((item) => item.id), ['tracked']);
    data.set('untangle_recent_roadmaps', JSON.stringify([{ id: 'browsed' }]));
    assert.equal(storage.getLastVisitedSession(), null);
  } finally {
    delete global.window;
    delete global.CustomEvent;
  }
});
