// src/pages/findClosestGlacier.js
import * as turf from "@turf/turf";
import {
  glacierTileset,
  glacierTileset2,
  FILL_LAYER_ID_1,
  FILL_LAYER_ID_2,
} from "./glaciers";

const SOURCES = [
  { sourceId: glacierTileset.sourceId, sourceLayer: glacierTileset.sourceLayer, layerId: FILL_LAYER_ID_1 },
  { sourceId: glacierTileset2.sourceId, sourceLayer: glacierTileset2.sourceLayer, layerId: FILL_LAYER_ID_2 },
];

// Common property keys that may contain glacier names
const NAME_KEYS = ["glac_name"];

/**
 * Pick the best "name" for the glacier:
 *  1. Try known name keys first.
 *  2. If none exist, fall back to glims_id.
 *  3. If that's also missing, return "Ukjent".
 */
function getGlacierLabel(props = {}) {
  for (const k of NAME_KEYS) {
    const v = props[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // ✅ Fallback to glims_id if no name is found
  if (props.glims_id && props.glims_id.trim()) {
    return `GLIMS ${props.glims_id.trim()}`;
  }

  return "Ukjent";
}

function areaKm2(feature) {
  const a = parseFloat(feature?.properties?.area_km2);
  if (!Number.isNaN(a)) return a;
  try {
    return turf.area(feature) / 1e6; // m² -> km²
  } catch {
    return Infinity;
  }
}

export function findClosestGlacier(map, stationCoords, searchRadiusKm = 50) {
  if (!map) {
    return { name: "Kart ikke lastet", distanceKm: null };
  }

  if (!Array.isArray(stationCoords) || stationCoords.length !== 2) {
    return { name: "Ugyldige koordinater", distanceKm: null };
  }

  const pt = turf.point(stationCoords);
  let candidates = [];

  // 1) Gather glacier polygons from MBTiles
  for (const s of SOURCES) {
    if (!map.getSource(s.sourceId)) {
      continue;
    }

    let feats = [];
    try {
      feats = map.querySourceFeatures(s.sourceId, { sourceLayer: s.sourceLayer }) || [];
    } catch (e) {
      console.warn(`querySourceFeatures failed for '${s.sourceId}':`, e);
    }

    // Fallback: small bbox around clicked station
    if (!feats.length) {
      const p = map.project(stationCoords);
      const px = 80;
      feats = map.queryRenderedFeatures([[p.x - px, p.y - px], [p.x + px, p.y + px]], {
        layers: [s.layerId],
      }) || [];
    }

    feats.forEach(f => {
      if (f?.geometry?.type && f.geometry.type.includes("Polygon")) {
        candidates.push(f);
      }
    });
  }

  if (!candidates.length) {
    return { name: "Ingen isbreer i nærheten", distanceKm: null };
  }

  // 2) If station lies inside any glacier → choose the smallest-area polygon (outlet tongue)
  const containing = candidates.filter(f => {
    try { return turf.booleanPointInPolygon(pt, f); } catch { return false; }
  });

  if (containing.length) {
    let best = containing[0];
    let bestArea = areaKm2(best);
    for (const f of containing.slice(1)) {
      const a = areaKm2(f);
      if (a < bestArea) {
        best = f;
        bestArea = a;
      }
    }
    const name = getGlacierLabel(best.properties);
    return { name, distanceKm: "0.00" };
  }

  // 3) Otherwise, compute edge distance to nearest glacier
  let best = null;
  let bestDist = Infinity;

  for (const f of candidates) {
    let d = Infinity;
    try {
      const line = turf.polygonToLine(f);
      d = turf.pointToLineDistance(pt, line, { units: "kilometers" });
    } catch {
      try {
        d = turf.distance(pt, turf.centroid(f), { units: "kilometers" });
      } catch {}
    }
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }

  if (!best || bestDist > searchRadiusKm) {
    return { name: "Ingen isbreer i nærheten", distanceKm: null };
  }

  const name = getGlacierLabel(best.properties);
  return { name, distanceKm: bestDist.toFixed(2) };
}
