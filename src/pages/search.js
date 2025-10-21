// search.js
import React, { useState } from "react";
import mapboxgl from "mapbox-gl";
import "./search-bar.css";

// ✅ Mapbox token
mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbiIsImEiOiJjbTNuOGVvN3cxMGxsMmpzNThzc2s3cTJzIn0.1uhX17BCYd65SeQsW1yibA";

// ✅ Glacier sources present in the map style (must match your map.addSource IDs)
const GLACIER_SOURCES = [
  { sourceID: "glaciers_scandi", sourceLayer: "scandi_glaciers2" },
  { sourceID: "glaciers_svalbard", sourceLayer: "svallbard_glaciers2" },
];

const SearchBar = ({ mapRef }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // --- utils ---------------------------------------------------------------

  const labelFor = (props = {}) =>
    props.glac_name || props.GLAC_NAME || props.name || props.glims_id || "Unknown glacier";

  const normalizeKey = (props = {}) =>
    (props.glims_id || props.glac_name || props.GLAC_NAME || props.name || "")
      .toString()
      .trim()
      .toLowerCase();

  // Ranking: prioritize exact ID > exact name > partial name > partial ID
  const rankMatches = (props, q) => {
    const gid = props.glims_id?.toLowerCase();
    const gname =
      props.glac_name?.toLowerCase() ||
      props.GLAC_NAME?.toLowerCase() ||
      props.name?.toLowerCase();

    if (gid === q) return 0;
    if (gname === q) return 1;
    if (gname?.startsWith(q)) return 2;
    if (gname?.includes(q)) return 3;
    if (gid?.startsWith(q)) return 4;
    if (gid?.includes(q)) return 5;
    return 6;
  };

  const getFeatureBounds = (feature) => {
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

  const queryAllGlacierFeatures = (map) => {
    let feats = [];
    for (const { sourceID, sourceLayer } of GLACIER_SOURCES) {
      try {
        const part = map.querySourceFeatures(sourceID, { sourceLayer });
        if (Array.isArray(part)) feats = feats.concat(part);
      } catch {
        // Source might not be loaded yet — skip
      }
    }
    return feats;
  };

  const dedupeGlaciers = (features) => {
    const byKey = new Map();
    for (const f of features) {
      const key = normalizeKey(f.properties);
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, f);
    }
    return Array.from(byKey.values());
  };

  // --- main actions --------------------------------------------------------

  const handleSearch = async () => {
    const map = mapRef.current;
    if (!map) return;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    // 1) Try glacier match
    const all = dedupeGlaciers(queryAllGlacierFeatures(map));
    const glacier = all
      .filter((f) => rankMatches(f.properties || {}, q) < 6)
      .sort((a, b) => rankMatches(a.properties, q) - rankMatches(b.properties, q))[0];

    if (glacier) {
      const bounds = getFeatureBounds(glacier);
      if (bounds) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 12 });
        return;
      }
    }

    // 2) Fallback: address search (NO/SE)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?country=no,se&limit=1&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lon, lat] = data.features[0].center;
        map.flyTo({ center: [lon, lat], zoom: 13.3, speed: 2 });
        return;
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }

    alert("No results found.");
  };

  const updateSuggestions = async (value) => {
    setSearchQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    // Glacier suggestions
    const uniqueGlaciers = dedupeGlaciers(queryAllGlacierFeatures(map));
    const glacierMatches = uniqueGlaciers
      .map((f) => ({
        feature: f,
        score: rankMatches(f.properties || {}, q),
      }))
      .filter((m) => m.score < 6)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((m) => {
        const key = normalizeKey(m.feature.properties);
        const bounds = getFeatureBounds(m.feature);
        let center = null;
        if (bounds && !bounds.isEmpty()) {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          center = [(sw.lng + ne.lng) / 2, (sw.lat + ne.lat) / 2];
        }
        return {
          type: "glacier",
          key: `g:${key}`,
          label: labelFor(m.feature.properties),
          bounds,
          center,
        };
      });

    // Address suggestions
    let addressMatches = [];
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?country=no,se&limit=3&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      addressMatches =
        data.features?.map((f) => ({
          type: "address",
          key: `a:${f.id}`,
          label: f.place_name,
          coords: f.center,
        })) || [];
    } catch (err) {
      console.error("Geocoding suggestion failed:", err);
    }

    setSuggestions([...glacierMatches, ...addressMatches]);
  };

  // --- ui ------------------------------------------------------------------

  return (
    <div className="search-bar-container">
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder="Search glaciers or addresses (NO/SE)…"
          value={searchQuery}
          onChange={(e) => updateSuggestions(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {suggestions.length > 0 && (
          <ul className="dropdown-suggestions">
            {suggestions.map((s) => (
              <li
                key={s.key}
                onClick={() => {
                  setSearchQuery(s.label);
                  setSuggestions([]);
                  const map = mapRef.current;
                  if (!map) return;

                  if (s.type === "glacier") {
                    if (s.bounds && !s.bounds.isEmpty()) {
                      map.fitBounds(s.bounds, { padding: 40, maxZoom: 12 });
                    } else if (s.center) {
                      map.flyTo({ center: s.center, zoom: 9, speed: 2 });
                    } else {
                      handleSearch();
                    }
                  } else if (s.type === "address" && s.coords) {
                    map.flyTo({ center: s.coords, zoom: 9, speed: 2 });
                  }
                }}
              >
                {s.type === "glacier" ? `🧊 ${s.label}` : `📍 ${s.label}`}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;
