const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", msg, ...meta })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ ts: new Date().toISOString(), level: "warn", msg, ...meta })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", msg, ...meta })),
};

module.exports = logger;