import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import "./lakes.css";

// Lake centroids with GLOF history
export const LAKE_CSV_URL = `${process.env.PUBLIC_URL}/GLO_2019_WGS84.csv`;

// Lake outline polygons
export const lakeTileset = {
  url: "mapbox://mapfean.64gel3ni",
  sourceLayer: "GLO_2019_WGS84",
  sourceId: "GLO_2019_WGS84",
};

export const OUTLINE_LAYER_ID = "lake-outline";

export function useLakeLayer({ mapRef }) {
  const markersRef = useRef([]);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const addTileset = () => {
      if (!map.getSource(lakeTileset.sourceId)) {
        map.addSource(lakeTileset.sourceId, {
          type: "vector",
          url: lakeTileset.url,
        });
      }

      if (!map.getLayer(OUTLINE_LAYER_ID)) {
        map.addLayer({
          id: OUTLINE_LAYER_ID,
          type: "line",
          source: lakeTileset.sourceId,
          "source-layer": lakeTileset.sourceLayer,
          paint: {
            "line-color": "blue",
            "line-width": 1.5,
          },
            layout: {
    visibility: "none",
  },
        });
      }
    };

    const addCentroidMarkers = async () => {
      try {
        const response = await fetch(LAKE_CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().replace(/|\]/g, ""),
          complete: (result) => {
            const lakes = result.data
              .map((row) => ({
                id: row.bresjoID,
                lat: parseFloat(row.centroid_lat),
                lon: parseFloat(row.centroid_lon),
                glof: String(row.GLOF).toLowerCase() === "true",
                glof_years: row.glof_years,
              }))
              .filter((lake) => !isNaN(lake.lat) && !isNaN(lake.lon));

            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];

            lakes.forEach(({ lat, lon, glof, glof_years, id }) => {
              const el = document.createElement("div");
              el.className = glof ? "place-marker" : "marker circle";
              el.style.display = "none";

              const marker = new mapboxgl.Marker(el, { anchor: "center" })
                .setLngLat([lon, lat])
                .addTo(map);

              markersRef.current.push(marker);

              if (glof) {
                const popupContent = document.createElement("div");
                popupContent.className = "glacier-popup";
                popupContent.innerHTML = `
                  <h4>Lake ${id}</h4>
                  <div class="stats">
                    <div>
                      <strong>GLOF Years</strong>
                      ${glof_years && String(glof_years).trim() !== ""
                        ? String(glof_years)
                            .replace(/[\]]/g, "")
                            .split(",")
                            .map((y) => y.trim())
                            .filter((y) => y)
                            .join(", ")
                        : "Unknown"}
                    </div>
                  </div>
                `;

                const popup = new mapboxgl.Popup({
                  closeButton: false,
                  closeOnClick: false,
                  className: "glacier-popup",
                  offset: 12,
                }).setDOMContent(popupContent);

                el.addEventListener("mouseenter", () => {
                  popup.setLngLat([lon, lat]).addTo(map);
                });
                el.addEventListener("mouseleave", () => {
                  popup.remove();
                });
              }

              el.addEventListener("click", (e) => {
                e.stopPropagation();
                map.flyTo({
                  center: [lon, lat],
                  zoom: 15.5,
                  speed: 2,
                });
              });
            });
          },
        });
      } catch (err) {
        console.error("Failed to load lake CSV:", err);
      }
    };

    const onLoad = () => {
      addTileset();
      addCentroidMarkers();
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

return () => {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  if (map && typeof map.getLayer === "function" && typeof map.getSource === "function") {
    try {
      if (map.getLayer(OUTLINE_LAYER_ID)) {
        map.removeLayer(OUTLINE_LAYER_ID);
      }
      if (map.getSource(lakeTileset.sourceId)) {
        map.removeSource(lakeTileset.sourceId);
      }
    } catch (err) {
      console.warn("Cleanup skipped, map already disposed:", err);
    }
  }
};

  }, [mapRef]);
}
