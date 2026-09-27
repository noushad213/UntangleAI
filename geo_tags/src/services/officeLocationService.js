import { geocodeAddress, reverseGeocode } from "./geocodingService.js";
import Office from "../models/Office.js";

// Dwumadie a ɛyi nsɛmfua hunu fi mu na ɛhwehwɛ beae din ankasa
function cleanLocationQuery(query) {
  if (!query) return "";
  
  // Yi nsɛmfua a ɛfa aban adwumayɛbea ho a ebetumi asɛe search no
  const noiseWords = [
    /munciple/gi,
    /municipal/gi,
    /coorperation/gi,
    /corporation/gi,
    /ward\s*office/gi,
    /office/gi,
    /near/gi,
    /kahan\s*hai/gi,
    /address/gi
  ];

  let cleaned = query;
  noiseWords.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, " ");
  });

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : query;
}

export async function resolveOfficeLocation(input) {
  if (!input) throw new Error("Location query is required");

  let lat, lng, placeDetails;
  const isCoord = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(
    input.trim()
  );

  if (isCoord) {
    [lat, lng] = input.split(",").map((v) => parseFloat(v.trim()));
    placeDetails = await reverseGeocode(lat, lng);
  } else {
    // 1. Yɛsɔ cleaned query no hwɛ ansa
    const extractedPlace = cleanLocationQuery(input);
    placeDetails = await geocodeAddress(extractedPlace);

    // 2. Sɛ anka annya a, yɛsɔ deɛ ɛwɔ hɔ dedaw no nso hwɛ
    if (!placeDetails) {
      placeDetails = await geocodeAddress(input);
    }

    if (!placeDetails) {
      return { success: false, message: "Location could not be identified" };
    }
    lat = placeDetails.lat;
    lng = placeDetails.lon;
  }

  const addr = placeDetails?.address || {};
  const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || "";
  const city = addr.city || addr.town || addr.city_district || addr.county || "Pune";
  const state = addr.state || "Maharashtra";

  const localTarget = suburb ? `${suburb} ${city}` : city;

  const office = new Office({
    name: `${city} Municipal Corporation Office`,
    type: "Municipal Authority",
    address: placeDetails?.display_name,
    city,
    state,
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    navigationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `Municipal Corporation Office ${localTarget}`
    )}`,
  });

  return {
    success: true,
    userQuery: input,
    extractedTarget: cleanLocationQuery(input),
    userLocation: {
      address: placeDetails?.display_name || input,
      suburb: suburb || city,
      city,
      state,
      pincode: addr.postcode || "N/A",
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    },
    office,
  };
}