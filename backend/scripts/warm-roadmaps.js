const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function parseArgs(argv = process.argv.slice(2)) {
  const result = {
    execute: false,
    limit: 10,
    municipality: null,
    issues: [],
    help: false,
  };

  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift();

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--execute') {
      result.execute = true;
    } else if (arg === '--municipality') {
      const val = args.shift();
      if (!val || val.startsWith('--')) {
        throw new Error('Missing value for --municipality');
      }
      result.municipality = val.trim();
    } else if (arg === '--issue') {
      const val = args.shift();
      if (!val || val.startsWith('--')) {
        throw new Error('Missing value for --issue');
      }
      result.issues.push(val.trim());
    } else if (arg === '--limit') {
      const val = args.shift();
      if (!val || val.startsWith('--')) {
        throw new Error('Missing value for --limit');
      }
      if (!/^\d+$/.test(val)) {
        throw new Error(`Invalid limit: ${val}`);
      }
      const num = parseInt(val, 10);
      if (num < 1 || num > 50) {
        throw new Error(`Limit out of bounds (1-50): ${num}`);
      }
      result.limit = num;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return result;
}

function selectTargets(municipalities, options = {}) {
  const limit = typeof options.limit === 'number' ? options.limit : 10;
  const targetMunicipality = options.municipality || null;
  const targetIssues = Array.isArray(options.issues) && options.issues.length > 0 ? options.issues : null;

  const activeMunicipalities = municipalities.filter((m) => {
    if (!m.isActive) return false;
    if (targetMunicipality && m.slug !== targetMunicipality) return false;
    return true;
  });

  const targets = [];
  const seen = new Set();

  // Sort municipalities stably by slug
  const sortedMunicipalities = [...activeMunicipalities].sort((a, b) => a.slug.localeCompare(b.slug));

  for (const m of sortedMunicipalities) {
    const catalog = Array.isArray(m.issueCatalog) ? m.issueCatalog : [];
    // Sort issues stably by issueKey
    const sortedCatalog = [...catalog].sort((a, b) => a.issueKey.localeCompare(b.issueKey));

    for (const issue of sortedCatalog) {
      if (targetIssues && !targetIssues.includes(issue.issueKey)) {
        continue;
      }

      const dedupeKey = `${m.slug}:${issue.issueKey}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      targets.push({
        municipalitySlug: m.slug,
        issueKey: issue.issueKey,
        query: issue.label || issue.issueKey,
      });
    }
  }

  return targets.slice(0, limit);
}

async function warmRoadmaps(targets, options = {}) {
  const isExecute = Boolean(options.execute);
  const resolveWorkflow = options.resolveWorkflow || (async (query, municipalitySlug) => {
    const { resolveWorkflowForQuery } = require('../src/services/workflow.service');
    return resolveWorkflowForQuery(query, municipalitySlug);
  });

  if (!isExecute) {
    return {
      selected: targets.length,
      cached: 0,
      generated: 0,
      failed: 0,
      dryRun: true,
    };
  }

  let cached = 0;
  let generated = 0;
  let failed = 0;

  for (const target of targets) {
    try {
      const res = await resolveWorkflow(target.query, target.municipalitySlug);
      const wasCached = Boolean(res?.fromCache);

      if (wasCached) {
        cached++;
      } else {
        generated++;
      }

      if (typeof options.onResult === 'function') {
        options.onResult({
          municipalitySlug: target.municipalitySlug,
          issueKey: target.issueKey,
          status: wasCached ? 'cached' : 'generated',
        });
      }
    } catch (err) {
      failed++;
      if (typeof options.onResult === 'function') {
        options.onResult({
          municipalitySlug: target.municipalitySlug,
          issueKey: target.issueKey,
          status: 'failed',
          code: err.code || err.message,
          error: err.message,
        });
      }
    }
  }

  return {
    selected: targets.length,
    cached,
    generated,
    failed,
    dryRun: false,
  };
}

module.exports = {
  parseArgs,
  selectTargets,
  warmRoadmaps,
};
