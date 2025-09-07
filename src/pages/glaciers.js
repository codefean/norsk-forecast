import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";

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
const HIGHLIGHT_LAYER_ID = "glacier-hover-highlight";

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

    const onLoad = () => {
      // Add both glacier tilesets
      addTileset({ ...glacierTileset, fillId: FILL_LAYER_ID_1 });
      addTileset({ ...glacierTileset2, fillId: FILL_LAYER_ID_2 });

      map.setLayoutProperty(FILL_LAYER_ID_1, "visibility", "visible");
      map.setLayoutProperty(FILL_LAYER_ID_2, "visibility", "visible");

      // 🔹 Add highlight layer on top
      if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: "fill",
          source: glacierTileset.sourceId,
          "source-layer": glacierTileset.sourceLayer,
          paint: {
            "fill-color": "#004d80", // darker blue
            "fill-opacity": 0.7,
          },
          filter: ["==", "glims_id", ""], // initially, no glacier highlighted
        });
      }

      // Styled popup on hover
      const popup = new mapboxgl.Popup({
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
          // Clear highlight if no glacier under cursor
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
          popup.remove();
          return;
        }

        const feature = features[0];
        const props = feature.properties;

        // ✅ Highlight hovered glacier
        if (props?.glims_id) {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", props.glims_id]);
        }

        // ✅ Use glacier name OR fall back to GLIMS ID
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
            ${glacLabel !== "Ukjent" ? `<h4>${glacLabel}</h4>` : "<h4>Ukjent isbre</h4>"}
            <div class="stats">
              <div><strong>${area}</strong> km²</div>
              <div><strong>${slope}°</strong> slope</div>
              <div><strong>${zmax}</strong> max elev</div>
            </div>
          </div>
        `;

        popup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
      });

      // On leaving glacier area → remove highlight + popup
      map.on("mouseleave", FILL_LAYER_ID_1, () => {
        map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
        popup.remove();
      });
      map.on("mouseleave", FILL_LAYER_ID_2, () => {
        map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "glims_id", ""]);
        popup.remove();
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
