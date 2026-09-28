const pendingQueries = new Map();

async function runPendingQuery(key, build) {
  if (pendingQueries.has(key)) return pendingQueries.get(key);
  const pending = Promise.resolve().then(build);
  pendingQueries.set(key, pending);
  try {
    return await pending;
  } finally {
    pendingQueries.delete(key);
  }
}

module.exports = { runPendingQuery };
