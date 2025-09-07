// skiData.js
export async function fetchSkiResorts() {
  try {
    // Fetch full ski resorts GeoJSON dataset
    const response = await fetch("https://openskimap.org/geojson/resorts.geojson");
    if (!response.ok) {
      throw new Error(`Failed to fetch ski resort data: ${response.status}`);
    }

    const data = await response.json();

    // Filter to Norway & Sweden only
    const filtered = data.features.filter((f) =>
      ["NO", "SE"].includes(f.properties.country)
    );

    // Return cleaned dataset
    return filtered.map((resort) => ({
      name: resort.properties.name || "Unknown Resort",
      country: resort.properties.country,
      coordinates: resort.geometry.coordinates, // [lng, lat]
    }));
  } catch (err) {
    console.error("Error fetching ski resorts:", err);
    return [];
  }
}
