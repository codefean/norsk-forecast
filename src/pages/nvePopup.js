// src/nvePopup.js
import mapboxgl from "mapbox-gl";
import { fetchNveLatest } from "./nveAPI";
import React from "react";
import ReactDOMServer from "react-dom/server";
import "./nvePopup.css"; // ✅ import popup styling

// --- Helpers ---
function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleString("no-NO", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Oslo",
    });
  } catch {
    return isoString || "?";
  }
}

function formatValue(val, unit) {
  return val != null
    ? `${new Intl.NumberFormat("no-NO", {
        maximumFractionDigits: 2,
      }).format(val)} ${unit || ""}`
    : "?";
}

// Parameters of interest
const INTERESTING_PARAMS = [
  "Vannstand",       // water stage
  "Vannføring",      // discharge
  "Snødybde",        // snow depth
  "Nedbør",          // precipitation
  "Vanntemperatur",  // water temperature
  "Lufttemperatur",  // air temperature
];


// --- React components ---
function ObsCard({ name, value, unit, time }) {
  if (value == null || time == null) {
    return (
      <div className="obs-card" data-tooltip="Ingen observasjoner">
        <strong>{name}</strong>
        <div className="value">–</div>
        <div className="time">Ingen data</div>
      </div>
    );
  }
  return (
    <div className="obs-card">
      <strong>{name}</strong>
      <div className="value">{formatValue(value, unit)}</div>
      <div className="time">{formatTime(time)}</div>
    </div>
  );
}

function StationPopup({ stationName, stationId, series }) {
  return (
    <div className="station-popup">
      <h4>{stationName || "Ukjent NVE-stasjon"}</h4>
      <div className="station-id">ID: {stationId}</div>

      {series && series.length > 0 ? (
        <div className="obs-grid">
          {series.map((s) => {
            const obs = s.observations?.[0];
            return (
              <ObsCard
                key={s.parameterName}
                name={s.parameterName}
                value={obs?.value ?? null}
                unit={s.unit}
                time={obs?.time ?? null}
              />
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 10, color: "gray" }}>
          Ingen hydrologiske data tilgjengelig for Vannstand, Snødybde eller
          Nedbør.
        </div>
      )}
    </div>
  );
}

// --- Main popup logic ---
export function attachNvePopup(map) {
  let activeStationId = null;

  map.on("click", "nveStations-layer", async (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["nveStations-layer"],
    });
    if (!features?.length) return;

    const props = features[0].properties;
    const coords = features[0].geometry.coordinates;

    const stationId = props?.StationId || props?.stationId;
    const stationName = props?.StationName || props?.stationName;

    if (!stationId) {
      console.error("[NVE DEBUG] No StationId found in feature props:", props);
      return;
    }

    activeStationId = stationId;

    // Initial loading popup
    const popup = new mapboxgl.Popup({ className: "station-popup" })
      .setLngLat(coords)
      .setHTML(
        ReactDOMServer.renderToString(
          <div className="station-popup">
            <h4>{stationName || "Ukjent NVE-stasjon"}</h4>
            <div className="station-id">ID: {stationId}</div>
            <div style={{ marginTop: 10 }}>Laster hydrologiske data...</div>
          </div>
        )
      )
      .addTo(map);

    try {
      const latestObs = await fetchNveLatest([stationId], {
        resolutionTime: 60,
      });

      if (activeStationId !== stationId) return; // ignore stale clicks

      const filtered = Array.isArray(latestObs)
        ? latestObs.filter((s) =>
            INTERESTING_PARAMS.includes(s.parameterName)
          )
        : [];

      popup.setHTML(
        ReactDOMServer.renderToString(
          <StationPopup
            stationName={stationName}
            stationId={stationId}
            series={filtered}
          />
        )
      );
    } catch (err) {
      console.error("[NVE DEBUG] Popup fetch error:", err);
      if (activeStationId !== stationId) return;

      popup.setHTML(
        ReactDOMServer.renderToString(
          <div className="station-popup">
            <h4>{stationName || "Ukjent NVE-stasjon"}</h4>
            <div className="station-id">ID: {stationId}</div>
            <div style={{ marginTop: 10, color: "red" }}>
              Kunne ikke laste hydrologiske data.
            </div>
          </div>
        )
      );
    }
  });
}
