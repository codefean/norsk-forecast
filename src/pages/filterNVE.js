// filterNveStations.js
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import centerOfMass from "@turf/center-of-mass";
import { fetchNveStations } from "./nveAPI"; 

/**
 * Load glacier polygons from public folder.
 */
async function loadGlaciers() {
  const response = await fetch(
    `${process.env.PUBLIC_URL}/scandi_glaciers3.geojson`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to load glaciers GeoJSON: ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Convert NVE station list into a GeoJSON FeatureCollection.
 * NVE uses lowercase `latitude`/`longitude` keys.
 */
function toGeoJSON(stations) {
  return {
    type: "FeatureCollection",
    features: stations
      .filter((st) => st.latitude != null && st.longitude != null)
      .map((st) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [st.longitude, st.latitude],
        },
        properties: { ...st },
      })),
  };
}

/**
 * Filters NVE stations to those inside glacier polygons OR within 5 km of glacier center.
 */
export async function filterNveStations(stations) {
  if (!stations || !Array.isArray(stations)) {
    console.warn("⚠️ No station data provided to filterNveStations()");
    return { type: "FeatureCollection", features: [] };
  }

  const glaciers = await loadGlaciers();

  const glacierCenters = glaciers.features.map((glacier) => ({
    glacier,
    center: centerOfMass(glacier),
  }));

  const stationGeoJSON = toGeoJSON(stations);

  const filtered = stationGeoJSON.features.filter((station) =>
    glacierCenters.some(({ glacier, center }) => {
      if (booleanPointInPolygon(station, glacier)) return true;
      return distance(station, center, { units: "kilometers" }) <= 12;
    })
  );

  console.log(
    `✅ Filtered ${filtered.length} NVE stations inside glaciers or within 12 km out of ${stationGeoJSON.features.length}`
  );

  return { type: "FeatureCollection", features: filtered };
}

/**
 * Main entrypoint: fetch NVE stations and return filtered GeoJSON for Mapbox.
 */
export async function loadNveStationsForMap() {
  const stations = await fetchNveStations();
  return await filterNveStations(stations);
}
