import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";

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

export const FILL_LAYER_ID_1 = "glacier-fill-scandi";
export const FILL_LAYER_ID_2 = "glacier-fill-svalbard";
const HIGHLIGHT_LAYER_ID = "glacier-hover-highlight-scandi";
const HIGHLIGHT_LAYER_ID_2 = "glacier-hover-highlight-svalbard";

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
            "fill-color": "#2ba0ff",
            "fill-opacity": 0.4,
          },
        });
      }
    };

    const onLoad = async () => {
      addTileset({ ...glacierTileset, fillId: FILL_LAYER_ID_1 });
      addTileset({ ...glacierTileset2, fillId: FILL_LAYER_ID_2 });

      map.setLayoutProperty(FILL_LAYER_ID_1, "visibility", "visible");
      map.setLayoutProperty(FILL_LAYER_ID_2, "visibility", "visible");

      if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
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

          const popupHTML = `
            <div class="glacier-label">
              <h4>${glacLabel !== "Ukjent" ? glacLabel : "Ukjent isbre"}</h4>
              <div class="stats">
                <div><strong>${area}</strong> km²</div>
                <div><strong>${slope}°</strong> slope</div>
                <div><strong>${zmax}</strong> max elev</div>
              </div>
            </div>
          `;

          hoverPopup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
        });

        map.on("mouseleave", FILL_LAYER_ID_1, () => {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
          hoverPopup.remove();
        });
        map.on("mouseleave", FILL_LAYER_ID_2, () => {
          map.setFilter(HIGHLIGHT_LAYER_ID_2, ["==", "glims_id", ""]);
          hoverPopup.remove();
        });
      }

      // 🔹 Handle click popups (simplified – no station info)
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
            </div>
          `)
          .addTo(map);
      });

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
