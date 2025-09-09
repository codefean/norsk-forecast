import { fetchLatestObservations } from "./frostAPI";
import "./stationPopup.css";

/**
 * Dynamically builds popup HTML for a weather station.
 * Shows whatever latest observations are available.
 */
export async function buildStationPopupHTML(station) {
  let latestData;
  try {
    latestData = await fetchLatestObservations(station.stationId);
  } catch (err) {
    console.error("❌ Failed to fetch latest observations:", err);
    latestData = { latest: {} };
  }

  const observations = latestData.latest || {};

  const observationHTML = Object.entries(observations)
    .map(([key, val]) => {
      if (!val || typeof val !== "object" || val.value === undefined) return "";

      const label = formatLabel(key);
      const unit = normalizeUnit(val.unit);

      return `
        <div>
          <strong>${val.value}${unit}</strong>
          ${label}
        </div>
      `;
    })
    .join("");

  return `
    <div class="station-popup">
      <h4>${station.name || "Ukjent stasjon"}</h4>
      <div><em>Land:</em> ${station.country || "Ukjent"}</div>
      <div><em>ID:</em> ${station.stationId || "N/A"}</div>

      <!-- Latest available observations -->
      <div class="stats" style="margin-top:10px;">
        ${observationHTML || "<em>Ingen tilgjengelige observasjoner</em>"}
      </div>

      <!-- Last updated timestamp -->
      <div class="footer" style="margin-top:12px; font-size:0.8rem; color:#ccc;">
        <em>Siste observasjon:</em>
        ${getLastObsTime(observations) || "—"}
      </div>
    </div>
  `;
}

/** Normalizes Frost's units into pretty symbols */
function normalizeUnit(unit) {
  if (!unit) return "";
  const map = {
    degC: "°C",
    celsius: "°C",
    mps: " m/s",
    "m/s": " m/s",
    degrees: "°",
    percent: "%",
    mm: " mm",
    cm: " cm",
    kgm2: " kg/m²",
  };
  return map[unit] ?? ` ${unit}`;
}

/** Formats labels like "air_temperature" → "Air Temperature" */
function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns the most recent observation timestamp */
function getLastObsTime(observations) {
  const times = Object.values(observations)
    .map((v) => v?.time)
    .filter(Boolean);

  if (times.length === 0) return null;

  const latestTime = times.sort().reverse()[0];
  return new Date(latestTime).toLocaleString("no-NO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
