const fetch = require("node-fetch");
const { makeError } = require("../utils/errors");

// Adapted from divya-work's geo_tags module. Cache only public office searches.
function createGeocoder({ fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map();
  let nextRequestAt = 0;

  return async function resolveOfficeLocation(query) {
    if (typeof query !== "string" || !query.trim() || query.length > 300) {
      throw makeError("INVALID_REQUEST", "Enter an office name and city under 300 characters.");
    }
    const key = query.trim().toLowerCase();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.data;
    if (now() < nextRequestAt) {
      throw makeError("RATE_LIMITED", "Office lookup is busy. Wait a moment and try again.");
    }
    nextRequestAt = now() + 1100;

    const base = process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
    const url = new URL("search", `${base.replace(/\/$/, "")}/`);
    url.search = new URLSearchParams({ q: query.trim(), format: "jsonv2", addressdetails: "1", countrycodes: "in", limit: "3" }).toString();
    let places;
    try {
      const response = await fetchImpl(url.toString(), {
        headers: { "User-Agent": process.env.GEOCODING_USER_AGENT || "UntangleAI/1.0 (https://github.com/noushad213/UntangleAI)", "Accept-Language": "en" },
        timeout: 5000,
        size: 100000,
      });
      if (!response.ok) throw new Error("Geocoder unavailable");
      places = await response.json();
      if (!Array.isArray(places)) throw new Error("Invalid geocoder response");
    } catch {
      throw makeError("SERVICE_UNAVAILABLE", "Office maps are unavailable. Retry or use the official service page.");
    }
    const matches = places.flatMap((place) => {
      if (!place || typeof place !== 'object' ||
          !['string', 'number'].includes(typeof place.lat) ||
          !['string', 'number'].includes(typeof place.lon) ||
          String(place.lat).trim() === '' || String(place.lon).trim() === '') return [];
      const lat = Number(place.lat);
      const lng = Number(place.lon);
      if (typeof place.display_name !== 'string' || !place.display_name || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
      // A neighbourhood coordinate must never become a fictional office address.
      if (!['office', 'building', 'amenity'].includes(place.category || place.class)) return [];
      return [{ name: place.name || place.display_name, address: place.display_name, coordinates: { lat, lng }, navigationUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` }];
    });
    const data = { matches, attribution: "© OpenStreetMap contributors", sourceUrl: "https://www.openstreetmap.org/copyright" };
    if (cache.size >= 500) cache.delete(cache.keys().next().value);
    cache.set(key, { data, expiresAt: now() + 86400000 });
    return data;
  };
}

module.exports = { createGeocoder, resolveOfficeLocation: createGeocoder() };
