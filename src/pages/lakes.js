import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./lakes.css";

// ✅ Glacial lakes tileset config
export const lakeTileset = {
  url: "mapbox://mapfean.64gel3ni", // your Mapbox tileset ID
  sourceLayer: "GLO_2019_WGS84",    // ✅ must match layer name in Mapbox Studio
  sourceId: "GLO_2019_WGS84",       // unique internal source ID
};

export const FILL_LAYER_ID = "lake-fill";
export const HIGHLIGHT_LAYER_ID = "lake-highlight";

export function useLakeLayer({ mapRef }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    let clickPopup = null;

    const addTileset = () => {
      if (!map.getSource(lakeTileset.sourceId)) {
        map.addSource(lakeTileset.sourceId, {
          type: "vector",
          url: lakeTileset.url,
        });
      }

      if (!map.getLayer(FILL_LAYER_ID)) {
        map.addLayer({
          id: FILL_LAYER_ID,
          type: "fill",
          source: lakeTileset.sourceId,
          "source-layer": lakeTileset.sourceLayer,
          paint: {
            "fill-color": "#2ba0ff",
            "fill-opacity": 0.5,
          },
        });
      }

      if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: "line",
          source: lakeTileset.sourceId,
          "source-layer": lakeTileset.sourceLayer,
          paint: {
            "line-color": "#004d80",
            "line-width": 2,
          },
          filter: ["==", "id", ""],
        });
      }
    };

    const onLoad = () => {
      addTileset();

      // Safety check
      if (!map.getLayer(FILL_LAYER_ID) || !map.getLayer(HIGHLIGHT_LAYER_ID)) {
        console.warn("Lake layers not ready yet, skipping event binding.");
        return;
      }

      // Hover popup
      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
        className: "lake-popup",
      });

      map.on("mousemove", (e) => {
        if (!map.getLayer(FILL_LAYER_ID)) return;

        const features = map.queryRenderedFeatures(e.point, {
          layers: [FILL_LAYER_ID],
        });

        if (!features.length) {
          if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "id", ""]);
          }
          hoverPopup.remove();
          return;
        }

        const feature = features[0];
        const props = feature.properties;

        // Highlight
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "id", props.id]);
        }

        const area =
          props?.areal_km2 && !isNaN(props.areal_km2)
            ? parseFloat(props.areal_km2).toFixed(2)
            : "N/A";

        const firstObs = props?.forsteData || "Unknown";

        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div>
              <strong>Lake ID:</strong> ${props.id}<br/>
              <strong>Area:</strong> ${area} km²<br/>
              <strong>First Observed:</strong> ${firstObs}
            </div>`
          )
          .addTo(map);
      });

      // Click popup
      map.on("click", FILL_LAYER_ID, (e) => {
        if (!map.getLayer(FILL_LAYER_ID)) return;

        const features = map.queryRenderedFeatures(e.point, {
          layers: [FILL_LAYER_ID],
        });
        if (!features.length) return;

        const feature = features[0];
        const props = feature.properties;

        const area =
          props?.areal_km2 && !isNaN(props.areal_km2)
            ? parseFloat(props.areal_km2).toFixed(2)
            : "N/A";

        const firstObs = props?.forsteData || "Unknown";

        if (clickPopup) clickPopup.remove();

        clickPopup = new mapboxgl.Popup({
          className: "lake-popup lake-click-popup",
          closeButton: true,
          closeOnClick: false,
          anchor: "top",
          offset: [0, -10],
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="lake-label">
              <h4>Glacial Lake</h4>
              <div class="stats">
                <div><strong>ID:</strong> ${props.id}</div>
                <div><strong>${area}</strong> km²</div>
                <div><strong>First Observed:</strong> ${firstObs}</div>
              </div>
            </div>
          `)
          .addTo(map);
      });

      // Remove highlight on mouse leave
      map.on("mouseleave", FILL_LAYER_ID, () => {
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", "id", ""]);
        }
        hoverPopup.remove();
      });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      if (map) {
        map.off("load", onLoad);
      }
    };
  }, [mapRef]);
}
