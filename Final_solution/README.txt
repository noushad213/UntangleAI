UntangleAI audit fixes

This ZIP contains only the files changed for the reliability audit, preserving their repository-relative paths. Copy/merge these files into the current UntangleAI checkout.

Changes:
- Validate generated evidence quotes against retrieved source text and mark unsupported structured details uncertain.
- Restrict searches and extraction to gov.in/nic.in when a municipality has no configured allowlist.
- Show retry guidance when generated roadmap retrieval fails.
- Ignore local OCR .env secrets.

Tests: the audit-specific backend checks and focused existing workflow tests pass (15 total). The full backend suite currently has 2 failing OCR route tests because multer is not installed; frontend checks could not run because frontend dependencies are absent. See docs/HACKATHON_AUDIT.md.

No commit or push is included.
