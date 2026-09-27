const fetch = require("node-fetch");
const logger = require("./logger");

// 1. Mumbai Municipal HQ / Central Safe Fallback
const DEFAULT_FALLBACK_GEO = {
  wardCode: "MCGM-HQ",
  displayName: "MCGM Head Office, Fort, Mumbai",
  suburb: "Fort",
  postcode: "400001",
  coordinates: {
    lat: "18.9402",
    lon: "72.8356",
  },
  mapUrl: "https://www.openstreetmap.org/?mlat=18.9402&mlon=72.8356",
  source: "default_fallback",
};

/**
 * Live OpenStreetMap / Nominatim Geocoder
 * User ke natural text (e.g. "Bandra West", "Andheri East") ko live coordinates aur details me convert karta hai.
 */
async function getLiveGeoTag(areaQuery, city = "Mumbai") {
  if (!areaQuery || typeof areaQuery !== "string") {
    return DEFAULT_FALLBACK_GEO;
  }

  const cleanQuery = `${areaQuery.trim()} ${city} Maharashtra`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    cleanQuery
  )}&format=json&addressdetails=1&limit=1`;

  try {
    // Controller se 4 second timeout set karein taaki pipeline kabi freeze na ho
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "UntangleAI-CivicNavigator/1.0 (contact: team@untangleai.local)",
        "Accept-Language": "en",
      },
      timeout: 4000, // 4 seconds max
    });

    if (!response.ok) {
      logger.warn(`Nominatim returned status ${response.status}. Using default geo fallback.`);
      return DEFAULT_FALLBACK_GEO;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      logger.info(`No specific geo coordinates found for "${areaQuery}". Using default location.`);
      return DEFAULT_FALLBACK_GEO;
    }

    const place = data[0];
    const address = place.address || {};

    return {
      wardCode: address.suburb || address.city_district || "Mumbai Ward",
      displayName: place.display_name,
      suburb: address.suburb || address.neighbourhood || address.residential || "N/A",
      postcode: address.postcode || "N/A",
      coordinates: {
        lat: place.lat,
        lon: place.lon,
      },
      mapUrl: `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}`,
      source: "live_openstreetmap",
    };
  } catch (error) {
    // Agar API down ho ya internet slow ho, toh error throw kiye bina fallback dega
    logger.error("Live Geocoding safely handled error:", { error: error.message });
    return DEFAULT_FALLBACK_GEO;
  }
}

module.exports = { getLiveGeoTag };