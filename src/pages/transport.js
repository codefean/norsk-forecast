import { useEffect } from "react";

// Kartverket WMS services, requested as web-mercator raster tiles.
const wmsTiles = (service, layers) =>
  `https://wms.geonorge.no/skwms1/${service}?service=WMS&request=GetMap&version=1.3.0` +
  `&layers=${layers}&styles=&format=image/png&transparent=true` +
  `&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`;

export const TRANSPORT_LAYERS = [
  {
    id: "roads-nvdb",
    label: "Main roads and ferries (NVDB)",
    tiles: wmsTiles("wms.vegnett2", "europaveg,riksveg,fylkesveg,bilferjestrekning"),
    attribution: "Roads: Kartverket / Statens vegvesen (NVDB)",
  },
  {
    id: "rail-banenor",
    label: "Railway (Bane NOR)",
    tiles: wmsTiles("wms.banenettverk", "banelenke_medium,stasjonsnode"),
    attribution: "Railway: Bane NOR SF (NLOD)",
  },
];

// Draw transport lines above the hazard zones but below the event points.
const BEFORE_LAYER = "avalanche_events";

export function useTransportLayers({ mapRef, visible }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const apply = () => {
      TRANSPORT_LAYERS.forEach((layer) => {
        if (!map.getSource(layer.id)) {
          map.addSource(layer.id, {
            type: "raster",
            tiles: [layer.tiles],
            tileSize: 256,
            attribution: layer.attribution,
          });
        }
        if (!map.getLayer(layer.id)) {
          map.addLayer(
            {
              id: layer.id,
              type: "raster",
              source: layer.id,
              minzoom: 6,
              paint: { "raster-opacity": 0.9 },
            },
            map.getLayer(BEFORE_LAYER) ? BEFORE_LAYER : undefined
          );
        }
        map.setLayoutProperty(
          layer.id,
          "visibility",
          visible[layer.id] ? "visible" : "none"
        );
      });
    };

    try {
      apply();
    } catch {
      // Style not ready yet
      map.once("load", apply);
    }
  }, [mapRef, visible]);
}
