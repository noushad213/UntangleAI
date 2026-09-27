const fetch = globalThis.fetch || require("node-fetch");

async function geocodeAddress(queryText) {
  if (!queryText || typeof queryText !== "string") return null;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    queryText.trim() + ", India"
  )}&format=json&addressdetails=1&countrycodes=in&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "UntangleAI-CivicNavigator/1.0" },
      timeout: 5000,
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("Geocoding Service Error:", err.message);
    return null;
  }
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "UntangleAI-CivicNavigator/1.0" },
      timeout: 5000,
    });
    return await res.json();
  } catch (err) {
    console.error("Reverse Geocoding Error:", err.message);
    return null;
  }
}

module.exports = { geocodeAddress, reverseGeocode };