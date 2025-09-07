/**
 * Convert Frost API station data into valid GeoJSON
 * Filters invalid stations and logs a summary instead of spamming warnings.
 */
export const frostToGeoJSON = (stations) => {
  let skippedCount = 0;

  const features = stations
    .filter((station) => {
      const coords = station.geometry?.coordinates;
      const valid =
        coords &&
        Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number";

      if (!valid) {
        skippedCount++;
      }
      return valid;
    })
    .map((station) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: station.geometry.coordinates,
      },
      properties: {
        id: station.id,
        name: station.name || "Unnamed Station",
        shortName: station.shortName || "Unknown",
        country: station.country || "Norway",

        // ✅ Include glacier metadata if available
        closestGlacier: station.closestGlacier || null,
        distanceToGlacierKm: station.distanceToGlacierKm ?? null,
      },
    }));

  console.log(
    `✅ Converted ${features.length} valid stations into GeoJSON. ` +
    (skippedCount > 0 ? `(${skippedCount} skipped)` : "")
  );

  return {
    type: "FeatureCollection",
    features,
  };
};
