// src/pages/findClosestStationToGlacier.js
import * as turf from "@turf/turf";

/**
 * Finds the closest weather station to a given glacier feature.
 *
 * @param {GeoJSON} stationsGeoJSON - GeoJSON FeatureCollection of filtered weather stations.
 * @param {object} glacierFeature - Glacier polygon feature from Mapbox vector tiles.
 * @param {number} searchRadiusKm - Maximum distance to consider stations (default 10km).
 *
 * @returns {{name: string, id: string|null, distanceKm: string|null}}
 */
export function findClosestStationToGlacier(stationsGeoJSON, glacierFeature, searchRadiusKm = 12) {
  if (!stationsGeoJSON || !stationsGeoJSON.features || !stationsGeoJSON.features.length) {
    return { name: "Ingen stasjoner tilgjengelig", id: null, distanceKm: null };
  }

  if (!glacierFeature?.geometry) {
    return { name: "Ukjent isbre", id: null, distanceKm: null };
  }

  // Use glacier centroid to calculate distances
  const glacierCenter = turf.centroid(glacierFeature);
  const glacierCoords = glacierCenter.geometry.coordinates;

  let closest = null;
  let bestDist = Infinity;

  for (const station of stationsGeoJSON.features) {
    const stationCoords = station.geometry.coordinates;

    let d = Infinity;
    try {
      d = turf.distance(glacierCoords, stationCoords, { units: "kilometers" });
    } catch (err) {
      console.warn("⚠️ Distance calculation failed for station:", station, err);
      continue;
    }

    if (d < bestDist) {
      bestDist = d;
      closest = station;
    }
  }

  // If no station within range → fallback
  if (!closest || bestDist > searchRadiusKm) {
    return { name: "Ingen stasjon innen 12 km", id: null, distanceKm: null };
  }

  return {
    name: closest.properties.name || "Ukjent stasjon",
    id: closest.properties.id || null,
    distanceKm: bestDist.toFixed(2),
  };
}