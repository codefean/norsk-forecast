import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";
import { findClosestStationToGlacier } from "./findClosestStationToGlacier";
import { buildStationPopupHTML } from "./stationPopup";

// ✅ Export glacier tilesets so other files can use them
export const glacierTileset = {
  url: "mapbox://mapfean.bmdn0gwv",
  sourceLayer: "scandi_glaciers2",
  sourceId: "glaciers_scandi",
};

export const glacierTileset2 = {
  url: "mapbox://mapfean.38aaq5bo",
  sourceLayer: "svallbard_glaciers2",
  sourceId: "glaciers_svalbard",
};

// ✅ Export layer IDs so we can reuse them
export const FILL_LAYER_ID_1 = "glacier-fill-scandi";
export const FILL_LAYER_ID_2 = "glacier-fill-svalbard";
const HIGHLIGHT_LAYER_ID = "glacier-hover-highlight-scandi";
const HIGHLIGHT_LAYER_ID_2 = "glacier-hover-highlight-svalbard";

// 🔹 Helper: Get glacier name or fallback to GLIMS ID
const getGlacierLabel = (props = {}) => {
  if (props?.glac_name && props.glac_name.trim() !== "") {
    return props.glac_name.trim();
  }
  if (props?.GLAC_NAME && props.GLAC_NAME.trim() !== "") {
    return props.GLAC_NAME.trim();
  }
  if (props?.glims_id && props.glims_id.trim() !== "") {
    return `GLIMS ${props.glims_id.trim()}`;
  }
  return "Ukjent";
};

export function useGlacierLayer({ mapRef }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    let clickPopup = null;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const addTileset = ({ url, sourceId, sourceLayer, fillId }) => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "vector", url });
      }

      if (!map.getLayer(fillId)) {
        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          "source-layer": sourceLayer,
          paint: {
            "fill-color": "#2ba0ff", // base color (light blue)
            "fill-opacity": 0.4,
          },
        });
      }
    };

    const onLoad = async () => {
      // Add both glacier tilesets
      addTileset({ ...glacierTileset, fillId: FILL_LAYER_ID_1 });
      addTileset({ ...glacierTileset2, fillId: FILL_LAYER_ID_2 });

      map.setLayoutProperty(FILL_LAYER_ID_1, "visibility", "visible");
      map.setLayoutProperty(FILL_LAYER_ID_2, "visibility", "visible");

      // 🔹 Add highlight layer on top
      if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
        // Highlight for Scandinavia
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: "fill",
          source: glacierTileset.sourceId,
          "source-layer": glacierTileset.sourceLayer,
          paint: {
            "fill-color": "#004d80",
            "fill-opacity": 0.7,
          },
          filter: ["==", "glims_id", ""],
        });

        // Highlight for Svalbard
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID_2,
          type: "fill",
          source: glacierTileset2.sourceId,
          "source-layer": glacierTileset2.sourceLayer,
          paint: {
            "fill-color": "#004d80",
            "fill-opacity": 0.7,
          },
          filter: ["==", "glims_id", ""],
        });
      }

      // 🔹 Shade glaciers that have a station within 12 km darker
      const shadeGlaciersWithStations = async (radiusKm = 12) => {
        const stations = map.__stationsGeoJSON;
        if (!stations) {
          console.warn("⚠️ No stations loaded yet");
          return;
        }

        const allGlaciers = [
          ...map.querySourceFeatures(glacierTileset.sourceId, {
            sourceLayer: glacierTileset.sourceLayer,
          }),
          ...map.querySourceFeatures(glacierTileset2.sourceId, {
            sourceLayer: glacierTileset2.sourceLayer,
          }),
        ];

        const coveredIds = [];

        console.log(`Checking ${allGlaciers.length} glaciers for nearby stations…`);

        for (const glacier of allGlaciers) {
          const nearby = findClosestStationToGlacier(stations, glacier, radiusKm);
          if (nearby && nearby.id) {
            coveredIds.push(glacier.properties.glims_id);
          }
        }

        console.log(
          `✅ ${coveredIds.length} glaciers have a station within ${radiusKm} km`
        );

        // Add overlay for glaciers with nearby stations
        if (!map.getLayer("glaciers-with-stations")) {
          map.addLayer({
            id: "glaciers-with-stations",
            type: "fill",
            source: glacierTileset.sourceId,
            "source-layer": glacierTileset.sourceLayer,
            paint: {
              "fill-color": "#005b99", // darker blue
              "fill-opacity": 0.6,
            },
            filter: ["in", "glims_id", ...coveredIds],
          });
        }

        // Add for Svalbard too
        if (!map.getLayer("glaciers-with-stations-svalbard")) {
          map.addLayer({
            id: "glaciers-with-stations-svalbard",
            type: "fill",
            source: glacierTileset2.sourceId,
            "source-layer": glacierTileset2.sourceLayer,
            paint: {
              "fill-color": "#005b99",
              "fill-opacity": 0.6,
            },
            filter: ["in", "glims_id", ...coveredIds],
          });
        }
      };

      // Run after map + stations ready
      setTimeout(() => shadeGlaciersWithStations(12), 1500);

      // 🔹 Hover popups only on desktop (no touch)
      if (!isTouchDevice) {
        const hoverPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "glacier-popup",
        });

        map.on("mousemove", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
          });

          if (!features.length) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
            map.setFilter(HIGHLIGHT_LAYER_ID_2, ["==", "glims_id", ""]);
            hoverPopup.remove();
            return;
          }

          const feature = features[0];
          const props = feature.properties;

          if (props?.glims_id) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", props.glims_id]);
            map.setFilter(HIGHLIGHT_LAYER_ID_2, ["==", "glims_id", props.glims_id]);
          }

          const glacLabel = getGlacierLabel(props);
          const area =
            props?.area_km2 && !isNaN(props.area_km2)
              ? parseFloat(props.area_km2).toFixed(2)
              : "N/A";
          const slope =
            props?.slope_deg && !isNaN(props.slope_deg)
              ? parseFloat(props.slope_deg).toFixed(1)
              : "N/A";
          const zmax =
            props?.zmax_m && !isNaN(props.zmax_m)
              ? `${parseInt(props.zmax_m, 10)} m`
              : "N/A";

          const stationsGeoJSON = map.__stationsGeoJSON;
          const closestStation = stationsGeoJSON
            ? findClosestStationToGlacier(stationsGeoJSON, feature, 12, e.lngLat)
            : null;

          const popupHTML = `
            <div class="glacier-label">
              <h4>${glacLabel !== "Ukjent" ? glacLabel : "Ukjent isbre"}</h4>
              <div class="stats">
                <div><strong>${area}</strong> km²</div>
                <div><strong>${slope}°</strong> slope</div>
                <div><strong>${zmax}</strong> max elev</div>
              </div>
              ${
                closestStation
                  ? `<div class="closest-station" style="margin-top:6px;">
                      Nærmeste værstasjon:
                      <strong>${closestStation.name}</strong>
                      (${closestStation.distanceKm} km unna)
                    </div>`
                  : `<div class="closest-station" style="margin-top:6px; color: gray;">
                      Ingen stasjon innen 12 km
                    </div>`
              }
            </div>
          `;

          hoverPopup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
        });

        // On leaving glacier area → remove highlight + popup
        map.on("mouseleave", FILL_LAYER_ID_1, () => {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
          hoverPopup.remove();
        });
        map.on("mouseleave", FILL_LAYER_ID_2, () => {
          map.setFilter(HIGHLIGHT_LAYER_ID_2, ["==", "glims_id", ""]);
          hoverPopup.remove();
        });
      }

      // 🔹 Handle click popups (works everywhere)
      map.on("click", [FILL_LAYER_ID_1, FILL_LAYER_ID_2], async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
        });
        if (!features.length) return;

        const feature = features[0];
        const props = feature.properties;
        const glacLabel = getGlacierLabel(props);
        const area =
          props?.area_km2 && !isNaN(props.area_km2)
            ? parseFloat(props.area_km2).toFixed(2)
            : "N/A";
        const slope =
          props?.slope_deg && !isNaN(props.slope_deg)
            ? parseFloat(props.slope_deg).toFixed(1)
            : "N/A";
        const zmax =
          props?.zmax_m && !isNaN(props.zmax_m)
            ? `${parseInt(props.zmax_m, 10)} m`
            : "N/A";

        const stationsGeoJSON = map.__stationsGeoJSON;
        const closestStation = stationsGeoJSON
          ? findClosestStationToGlacier(stationsGeoJSON, feature, 12, e.lngLat)
          : null;

        // Remove existing click popup if open
        if (clickPopup) {
          clickPopup.remove();
          clickPopup = null;
        }

        clickPopup = new mapboxgl.Popup({
          className: "glacier-popup glacier-click-popup",
          closeButton: true,
          closeOnClick: false,
          anchor: "top",
          offset: [0, -10],
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="glacier-label">
              <h4>${glacLabel !== "Ukjent" ? glacLabel : "Ukjent isbre"}</h4>
              <div class="stats">
                <div><strong>${area}</strong> km²</div>
                <div><strong>${slope}°</strong> slope</div>
                <div><strong>${zmax}</strong> max elev</div>
              </div>
              ${
                closestStation
                  ? `<div class="closest-station" style="margin-top:6px;">
                      Nærmeste værstasjon:
                      <strong>${closestStation.name}</strong>
                      (${closestStation.distanceKm} km unna)
                    </div>`
                  : `<div class="closest-station" style="margin-top:6px; color: gray;">
                      Ingen stasjon innen 12 km
                    </div>`
              }
              <div class="station-popup" style="margin-top:12px;">
                Laster værdata...
              </div>
            </div>
          `)
          .addTo(map);

        // Fetch weather + glacier model data
        if (closestStation && closestStation.id) {
          try {
            const stationSummary = {
              stationId: closestStation.id,
              name: closestStation.name,
              country: closestStation.country,
              z: closestStation.z || 0,
            };

            const weatherHTML = await buildStationPopupHTML(
              stationSummary,
              props
            );

            if (clickPopup) {
              const content = clickPopup
                .getElement()
                .querySelector(".station-popup");
              if (content) content.innerHTML = weatherHTML;
            }
          } catch (err) {
            console.error("Failed to fetch station/glacier data:", err);
            if (clickPopup) {
              const content = clickPopup
                .getElement()
                .querySelector(".station-popup");
              if (content) {
                content.innerHTML = `
                  <div class="error">
                    Kunne ikke laste vær- eller bredata.
                  </div>
                `;
              }
            }
          }
        }
      });

      // 🔹 Close click popup when clicking outside
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
        });

        if (!features.length && clickPopup) {
          clickPopup.remove();
          clickPopup = null;
        }
      });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      map.off("load", onLoad);
    };
  }, [mapRef]);
}
