const test = require("node:test");
const assert = require("node:assert");
const { assertSafeUrl, isPrivateOrReservedIp } = require("../src/utils/urlSecurity");

test("rejects non-HTTPS URLs", async () => {
  await assert.rejects(() => assertSafeUrl("http://example.com"));
});

test("rejects localhost", async () => {
  await assert.rejects(() => assertSafeUrl("https://localhost/"));
});

test("rejects a URL not in the allowed domain list", async () => {
  await assert.rejects(() => assertSafeUrl("https://evil.com/", ["good.gov.in"]));
});

test("identifies private IPv4 ranges", () => {
  assert.strictEqual(isPrivateOrReservedIp("10.0.0.5"), true);
  assert.strictEqual(isPrivateOrReservedIp("127.0.0.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("169.254.169.254"), true); // cloud metadata
  assert.strictEqual(isPrivateOrReservedIp("192.168.1.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("8.8.8.8"), false);
});
