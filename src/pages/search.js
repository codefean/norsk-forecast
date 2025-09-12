// search.js
import React, { useState } from "react";
import mapboxgl from "mapbox-gl";
import { FILL_LAYER_ID_1, FILL_LAYER_ID_2 } from "./glaciers";
import "./search-bar.css";  // ✅ apply styles

// ✅ Initialize Mapbox token here
mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbiIsImEiOiJjbTNuOGVvN3cxMGxsMmpzNThzc2s3cTJzIn0.1uhX17BCYd65SeQsW1yibA";

const SearchBar = ({ mapRef }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🔹 Central search logic
  const handleSearch = async () => {
    const map = mapRef.current;
    if (!map) return;
    const query = searchQuery.trim().toLowerCase();

    // 1️⃣ Try glacier search
    const glacierFeatures = map.queryRenderedFeatures({
      layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
    });
    const foundGlacier = glacierFeatures.find((f) => {
      const props = f.properties || {};
      return (
        (props.glac_name && props.glac_name.toLowerCase() === query) ||
        (props.GLAC_NAME && props.GLAC_NAME.toLowerCase() === query) ||
        (props.glims_id && props.glims_id.toLowerCase() === query)
      );
    });
    if (foundGlacier) {
      const [minX, minY, maxX, maxY] =
        foundGlacier.bbox || foundGlacier.geometry.bbox || [];
      if (minX && minY && maxX && maxY) {
        map.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          { padding: 40 }
        );
      } else {
        const [lon, lat] = foundGlacier.geometry.coordinates[0][0];
        map.flyTo({ center: [lon, lat], zoom: 10, speed: 2 });
      }
      return;
    }

    // 2️⃣ Try geocoding (addresses in NO/SE)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?country=no,se&limit=1&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lon, lat] = data.features[0].center;
        map.flyTo({ center: [lon, lat], zoom: 12, speed: 2 });
        return;
      }
    } catch (err) {
      console.error("❌ Geocoding failed:", err);
    }

    alert("No results found.");
  };

  // 🔹 Handle live suggestions
  const updateSuggestions = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    const lowerValue = value.toLowerCase();

    // Glacier suggestions
    const glacierFeatures = map.queryRenderedFeatures({
      layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
    });
    const glacierMatches = glacierFeatures
      .map((f) => f.properties || {})
      .filter(
        (props) =>
          (props.glac_name &&
            props.glac_name.toLowerCase().includes(lowerValue)) ||
          (props.GLAC_NAME &&
            props.GLAC_NAME.toLowerCase().includes(lowerValue)) ||
          (props.glims_id &&
            props.glims_id.toLowerCase().includes(lowerValue))
      )
      .slice(0, 3)
      .map((props) => ({
        type: "glacier",
        label: props.glac_name || props.GLAC_NAME || props.glims_id,
        feature: props,
      }));

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
          label: f.place_name,
          coords: f.center,
        })) || [];
    } catch (err) {
      console.error("❌ Geocoding suggestion failed:", err);
    }

    setSuggestions([...glacierMatches, ...addressMatches]);
  };

  return (
    <div className="search-bar-container">
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder="Search glaciers or addresses (NO/SE)..."
          value={searchQuery}
          onChange={(e) => updateSuggestions(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {suggestions.length > 0 && (
          <ul className="dropdown-suggestions">
            {suggestions.map((s, index) => (
              <li
                key={index}
                onClick={() => {
                  setSearchQuery(s.label);
                  setSuggestions([]);
                  const map = mapRef.current;
                  if (!map) return;

                  if (s.type === "glacier") {
                    handleSearch(); // fallback to search
                  } else if (s.type === "address" && s.coords) {
                    map.flyTo({
                      center: s.coords,
                      zoom: 12,
                      speed: 2,
                    });
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
