// mapUtils.js
import mapboxgl from "mapbox-gl";

// Get bounding box for polygons/multipolygons/points
export const getFeatureBounds = (feature) => {
  try {
    const { geometry } = feature || {};
    const bounds = new mapboxgl.LngLatBounds();

    const extend = (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) bounds.extend([coord[0], coord[1]]);
    };
    const walkRing = (ring) => ring.forEach(extend);
    const walkPoly = (poly) => poly.forEach(walkRing);

    if (!geometry) return null;

    if (geometry.type === "Polygon") {
      walkPoly(geometry.coordinates || []);
    } else if (geometry.type === "MultiPolygon") {
      (geometry.coordinates || []).forEach(walkPoly);
    } else if (geometry.type === "Point") {
      extend(geometry.coordinates);
    } else if (geometry.type === "MultiPoint") {
      (geometry.coordinates || []).forEach(extend);
    }

    return bounds.isEmpty() ? null : bounds;
  } catch {
    return null;
  }
};

// Universal "zoom to feature"
export const flyToFeature = (map, feature, { padding = 40, maxZoom = 12, pointZoom = 9 } = {}) => {
  const bounds = getFeatureBounds(feature);

  if (bounds && !bounds.isEmpty()) {
    map.fitBounds(bounds, { padding, maxZoom });
  } else if (feature?.geometry?.coordinates) {
    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: pointZoom,
      speed: 2,
    });
  } else {
    console.warn("No valid geometry found for feature", feature);
  }
};
