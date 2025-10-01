// src/pages/findClosestStationToGlacier.js
import * as turf from "@turf/turf";

/**
 * Finds the closest weather station to a given glacier (by point).
 * If lngLat is provided, uses that directly; otherwise falls back to glacier centroid.
 */
export function findClosestStationToGlacier(
  stationsGeoJSON,
  glacierFeature,
  searchRadiusKm = 12,
  lngLat = null
) {
  if (!stationsGeoJSON?.features?.length) {
    return { name: "Ingen stasjoner tilgjengelig", id: null, distanceKm: null };
  }
  if (!(lngLat && typeof lngLat.lng === "number" && typeof lngLat.lat === "number") && !glacierFeature?.geometry) {
    return { name: "Ukjent isbre", id: null, distanceKm: null };
  }

  // ✅ Use the event location (reliable lon/lat) if available; else centroid
  const glacierCoords = lngLat
    ? [lngLat.lng, lngLat.lat]
    : turf.centroid(glacierFeature).geometry.coordinates;

  // Optional: normalize to Scandinavia bounds if something looks off
  const withinScand = ([lon, lat]) => lon > -30 && lon < 50 && lat > 54 && lat < 85;
  const norm = (xy) => withinScand(xy) ? xy : withinScand([xy[1], xy[0]]) ? [xy[1], xy[0]] : xy;

  const ref = norm(glacierCoords);

  let closest = null;
  let bestDist = Infinity;

  for (const station of stationsGeoJSON.features) {
    if (!station.geometry?.coordinates) continue;

    // Stations are already correct (you use them to place popups), but normalize just in case
    const s = norm(station.geometry.coordinates);

    let d = turf.distance(ref, s, { units: "kilometers" });

    // If something went wildly wrong, try a swap fallback once
    if (d > 1000) {
      const dSwap = turf.distance(ref, [s[1], s[0]], { units: "kilometers" });
      if (dSwap < d) d = dSwap;
    }

    if (d < bestDist) {
      bestDist = d;
      closest = station;
    }
  }

  if (!closest || bestDist > searchRadiusKm) {
    console.warn("No station within radius", { bestDist });
    return { name: "Ingen stasjon innen 12 km", id: null, distanceKm: null };
  }

  return {
    name: closest.properties.name || "Ukjent stasjon",
    id: closest.properties.stationId || closest.properties.id || null,
    country: closest.properties.country || null,
    z: closest.properties.z || 0,
    distanceKm: bestDist.toFixed(2),
  };
}
