import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./landslide.css";

// ===============================
// DATASETS
// ===============================
export const landslideTileset100 = {
  url: "mapbox://mapfean.93jc9gj8",
  sourceLayer: "hazard_zone_100_v",
  sourceId: "hazard_zone_100_v",
  color: "#d73027",
  opacity: 0.5,
  label: "Høy risikosone",
};

export const landslideTileset100_v = {
  url: "mapbox://mapfean.93jc9gj8",
  sourceLayer: "hazard_zone_100",
  sourceId: "landslide_hazard_100",
  color: "#d73027",
  opacity: 0.5,
  label: "Høy risikosone",
};

export const landslideTileset1000 = {
  url: "mapbox://mapfean.cvo7tf77",
  sourceLayer: "hazard_zone_1000",
  sourceId: "landslide_hazard_1000",
  color: "#fc8d59",
  opacity: 0.5,
  label: "Moderat risikosone",
};

export const landslideTileset1000_v = {
  url: "mapbox://mapfean.djpd346u",
  sourceLayer: "hazard_zone_1000_v",
  sourceId: "hazard_zone_1000_v",
  color: "#fc8d59",
  opacity: 0.4,
  label: "Moderat risikosone",
};

export const landslideTileset5000 = {
  url: "mapbox://mapfean.08wlzd44",
  sourceLayer: "hazard_zone_5000",
  sourceId: "landslide_hazard_5000",
  color: "#fee090",
  opacity: 0.4,
  label: "Lav risikosone",
};

export const landslideTileset5000_v = {
  url: "mapbox://mapfean.9e4ypxph",
  sourceLayer: "hazard_zone_5000_v",
  sourceId: "hazard_zone_5000_v",
  color: "#fee090",
  opacity: 0.4,
  label: "Lav risikosone",
};

export const historicalEvents = {
  url: "mapbox://mapfean.7ofhn7xh",
  sourceLayer: "historical_events",
  sourceId: "avalanche_events",
  color: "#f781bf",
  opacity: 1.0,
  label: "Historiske hendelser",
  description:
    "NVE Skredhendelser – registrerte snøskred, steinsprang, jordskred og flomskredhendelser.",
};

export const historicalEvents_v = {
  url: "mapbox://mapfean.cmnr4xfd",
  sourceLayer: "avalanche_event_v",
  sourceId: "avalanche_event_v",
  color: "#f781bf",
  opacity: 1.0,
  label: "Historiske hendelser",
  description:
    "NVE Skredhendelser – registrerte snøskred, steinsprang, jordskred og flomskredhendelser.",
};

// ===============================
// MAP HOOK
// ===============================
export function useLandslideLayer({ mapRef }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    let clickPopup = null;

    const tilesets = [
  // Main
  landslideTileset100,
  landslideTileset1000,
  landslideTileset5000,
  historicalEvents,

  // Regional (_v)
  landslideTileset100_v,
  landslideTileset1000_v,
  landslideTileset5000_v,
  historicalEvents_v,
];

    // Norwegian skredType mapping
    const typeMap = {
      // 🪨 Steinskred / Fjellskred / Steinsprang
      110: "Steinskred, uspesifisert",
      111: "Steinsprang",
      112: "Steinskred",
      113: "Fjellskred",

      // 🌊 Undervann / teknisk
      120: "Undervannsskred",
      160: "Utglidning av veg",
      171: "Bygningskollaps / teknisk konstruksjon",

      // 🌧️ Jord-, leire- og flomskred
      121: "Jordskred",
      122: "Flomskred",
      123: "Leirskred",
      124: "Kvikkleireskred",
      125: "Utglidning i fylling",
      126: "Erosjon / elveskjæring",
      127: "Overvannsskred",
      140: "Løsmasseskred, uspesifisert",
      141: "Leirskred",
      142: "Flomskred",
      143: "Kvikkleireskred",
      144: "Jordskred",

      // ❄️ Snøskred og is
      130: "Snøskred, uspesifisert",
      133: "Sørpeskred",
      134: "Løssnøskred, uspesifisert",
      135: "Vått løssnøskred",
      136: "Tørt løssnøskred",
      137: "Flakskred, uspesifisert",
      138: "Vått flakskred",
      139: "Tørt flakskred",
      150: "Isnedfall",
      151: "Is-/snøras fra tak",

      // 🌋 Annet / ukjent
      190: "Ikke angitt",
      199: "Annen / ny skredtype",
      300: "Ukjent skredtype",
      310: "Kombinert skredtype",
      320: "Annen massetransport",
    };

const addHazardLayer = ({ url, sourceId, sourceLayer, color, opacity }) => {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "vector", url });
  }

  const isPoints = color === "#f781bf"; // Historical events layer

  if (!map.getLayer(sourceId)) {
    const layerConfig = {
      id: sourceId,
      type: isPoints ? "circle" : "fill",
      source: sourceId,
      "source-layer": sourceLayer,
      paint: isPoints
        ? {
            "circle-color": color,
            "circle-radius": 4,
            "circle-opacity": opacity,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1,
          }
        : {
            "fill-color": color,
            "fill-opacity": opacity,
            "fill-outline-color": "#555",
          },
    };

    // ✅ Add filter for historical events only (landslide, rockfall, slope failures)
    if (isPoints) {
      layerConfig.filter = [
        "in",
        ["get", "skredType"],
        ["literal", [111, 112, 113, 121, 122, 123, 124, 125, 126, 127, 140, 141, 142, 143, 144]],
      ];
    }

    map.addLayer(layerConfig);
  }
};


    const onLoad = async () => {
      tilesets.forEach(addHazardLayer);

      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "landslide-popup",
      });

      // Helper for building conditional stat boxes
const statBox = (label, value) => {
  if (
    !value ||
    typeof value !== "string" ||
    value.trim() === "" ||
    value === "-" ||
    value.toLowerCase().includes("ukjent") ||
    value.toLowerCase().includes("unknown") ||
    value.toLowerCase().includes("not specified") ||
    value.toLowerCase().includes("null")
  ) {
    return "";
  }
  return `<div><strong>${label}:</strong> ${value}</div>`;
};

      // Unified popup renderer
      const showPopup = (e, isClick = false) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: tilesets.map((t) => t.sourceId),
        });
        if (!features.length) {
          hoverPopup.remove();
          if (!isClick && clickPopup) clickPopup.remove();
          return;
        }

        const feature = features[0];
        const { sourceLayer } = feature;
        const props = feature.properties || {};

        let label = "";
        let description = "";
        let riskClass = "";

        // Hazard Zones
        if (sourceLayer.includes("100")) {
          label = "Høy risikosone";
          description =
            "Hyppige skredhendelser. Årlig sannsynlighet ≈ 1 % (S1). Unngå ny bebyggelse og kritisk infrastruktur.";
          riskClass = "high-risk";
        } else if (sourceLayer.includes("1000")) {
          label = "Moderat risikosone";
          description =
            "Av og til forekommende skred. Årlig sannsynlighet ≈ 0,1 % (S2).";
          riskClass = "moderate-risk";
        } else if (sourceLayer.includes("5000")) {
          label = "Lav risikosone";
          description =
            "Svært sjeldne, ekstreme hendelser. Årlig sannsynlighet ≈ 0,02 % (S3).";
          riskClass = "low-risk";
        }

        // Historical Events
        else if (sourceLayer.includes("historical")) {
          const name = props.skredNavn?.trim() || props.stedsnavn || "Ukjent sted";
          const date = props.skredTidspunkt
            ? props.skredTidspunkt.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
            : "Ukjent dato";
          const type = typeMap[props.skredType] || props.skredType || "Ukjent";
          const kommune = props.kommune || "Ukjent kommune";
          const persons = props.personBerort || "Ukjent";
          const building = props.bygningSkadet || "Ukjent";
          const road = props.vegSkadet || "Ukjent";
          const fatalities = props.totAntPersOmkommet ?? "0";
          const evac = props.evakuering || "Ukjent";
          const desc =
            props.beskrivelse?.substring(0, 240) || "Ingen beskrivelse tilgjengelig.";
          const source = props.kilde || "NVE";

          const statsHTML = `
            <div class="stats">
              ${statBox("Type", type)}
              ${statBox("Kommune", kommune)}
              ${statBox("Personer berørt", persons)}
              ${statBox("Bygg skadet", building)}
              ${statBox("Vei skadet", road)}
              ${statBox("Omkomne", fatalities)}
              ${statBox("Evakuering", evac)}
            </div>
          `;

          label = `${name} (${date})`;
          description = `
            ${statsHTML}
            <p>${desc}</p>
            <p><em>Kilde: ${source} – NVE Skredhendelser</em></p>
          `;
          riskClass = "historical-event";
        }

        // Render popup
        const popupHTML = `
          <div class="landslide-label ${riskClass}">
            <h4>${label}</h4>
            ${description}
            ${
              !sourceLayer.includes("historical")
                ? "<p><em>Kilde: NVE faresonekart</em></p>"
                : ""
            }
          </div>
        `;

        if (isClick) {
          if (clickPopup) clickPopup.remove();
          clickPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: "top",
            offset: [0, -10],
            className: `landslide-popup ${riskClass}`,
          })
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map);
        } else {
          hoverPopup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
        }
      };

      map.on("mousemove", (e) => showPopup(e, false));
      map.on("click", (e) => showPopup(e, true));
      map.on("mouseleave", tilesets.map((t) => t.sourceId), () => hoverPopup.remove());
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
    };
  }, [mapRef]);
}
