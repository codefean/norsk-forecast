// src/pages/filterFrost.js
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import centerOfMass from "@turf/center-of-mass";

/**
 * Fetches glacier polygons dynamically from the /public folder.
 */
async function loadGlaciers() {
  const response = await fetch(`${process.env.PUBLIC_URL}/scandi_glaciers3.geojson`);
  if (!response.ok) {
    throw new Error(`❌ Failed to load glaciers GeoJSON: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Filters Frost API weather stations to those located on or near glaciers.
 *
 * @param {Object} stationGeoJSON - Frost API stations as GeoJSON FeatureCollection
 * @param {number} [bufferKm=20] - Distance buffer in kilometers around glaciers
 * @returns {Promise<Object>} Filtered GeoJSON FeatureCollection
 */
export async function filterFrostStations(stationGeoJSON, bufferKm = 12) {
  if (!stationGeoJSON || !stationGeoJSON.features) {
    console.warn("⚠️ No station data provided to filterFrostStations()");
    return { type: "FeatureCollection", features: [] };
  }


  const glaciers = await loadGlaciers();


  const glacierCenters = glaciers.features.map((glacier) => ({
    glacier,
    center: centerOfMass(glacier),
  }));


  const filtered = stationGeoJSON.features.filter((station) => {
    const pt = station; // GeoJSON Point Feature

    return glacierCenters.some(({ glacier, center }) => {

      if (booleanPointInPolygon(pt, glacier)) return true;


      const dist = distance(pt, center, { units: "kilometers" });
      return dist <= bufferKm;
    });
  });

  console.log(
    `Filtered ${filtered.length} stations within ${bufferKm} km of glaciers out of ${stationGeoJSON.features.length}`
  );

  return {
    type: "FeatureCollection",
    features: filtered,
  };
}
