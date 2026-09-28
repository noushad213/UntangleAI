/**
 * Minimal structured logger.
 * Never pass API keys, Mongo URIs, or full source documents into `meta`.
 */
function base(level, msg, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (msg, meta) => base("info", msg, meta),
  warn: (msg, meta) => base("warn", msg, meta),
  error: (msg, meta) => base("error", msg, meta),
};
