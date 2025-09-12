// src/stationPopup.js
import { fetchLatestObservations } from "./frostAPI";
import { processGlacier } from "./glacierModel";
import "./stationPopup.css";

/** Formats the display value, special handling for wind direction */
function formatValue(key, value) {
  if (key === "wind_from_direction" && typeof value?.value === "number") {
    const compass = degreesToCompass(value.value);
    return `${compass} (${value.value.toFixed(0)}°)`; // e.g. "SSE (162°)"
  }
  return value.value;
}

/** Converts degrees → compass (16-point compass) */
function degreesToCompass(deg) {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ];
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return directions[idx];
}

export async function buildStationPopupHTML(station, glacierProps = null) {
  let latestData;
  try {
    latestData = await fetchLatestObservations(station.stationId);
  } catch (err) {
    console.error("❌ Failed to fetch latest observations:", err);
    latestData = { latest: {} };
  }

  const observations = latestData.latest || {};

  // ✅ Weather cards
  const observationHTML = Object.entries(observations)
    .map(([key, val]) => {
      if (!val || typeof val !== "object" || val.value === undefined) return "";

      const label = formatLabel(key);
      const unit = normalizeUnit(val.unit);

      return `
        <div>
          <strong>${formatValue(key, val)}${unit}</strong>
          ${label}
        </div>
      `;
    })
    .join("");

  // ✅ Glacier model cards (only if glacierProps provided)
  let glacierStatsHTML = "";
  if (glacierProps) {
    const airTempObs =
      observations.air_temperature ||
      observations["air_temperature P1D"] ||
      observations["air_temperature PT1H"];

    const precipObs =
      observations.precipitation_amount ||
      observations["precipitation_amount P1D"] ||
      observations["precipitation_amount PT1H"];

    if (airTempObs) {
      try {
        const series = [
          {
            date: new Date().toISOString().split("T")[0],
            T: airTempObs.value,
            P: precipObs?.value || 0,
          },
        ];

        const glacierMeta = {
          glacierId: glacierProps.glims_id,
          glacName: glacierProps.glac_name || glacierProps.GLAC_NAME,
          zGlacier: glacierProps.zmed_m || glacierProps.zmed,
        };

        const stationMeta = {
          stationId: station.stationId,
          zStation: station.z || 0,
        };

        const glacierResult = processGlacier(glacierMeta, stationMeta, series);

        if (glacierResult.today) {
          glacierStatsHTML = `
            <div data-tooltip="Station temperature adjusted to glacier elevation using lapse rate (-0.0065°C/m)">
              <strong>${glacierResult.today.T.toFixed(1)}°C</strong>
              Corrected Temp
            </div>
            <div data-tooltip="Degree-day melt model: melt = max(T-T0,0) × DDF (snow=3, ice=7)">
              <strong>${glacierResult.today.Melt.toFixed(1)} mm</strong>
              Melt Today (est)
            </div>
            <div data-tooltip="Snowpack (SWE) from accumulated snowfall minus melt. Needs precipitation data.">
              <strong>${glacierResult.today.SWE.toFixed(1)} mm</strong>
              Snowpack
            </div>
            <div data-tooltip="Rain-on-snow (ROS) occurs if T > 0.5°C, precipitation > 5 mm, and SWE > 20 mm">
              <strong>${glacierResult.today.ROS ? "Yes" : "No"}</strong>
              ROS Event
            </div>
          `;
        }
      } catch (err) {
        console.error("❌ Glacier model failed:", err);
      }
    }
  }

  return `
    <div class="station-popup">
      <h4>${station.name || "Ukjent stasjon"}</h4>
      <div><em>Land:</em> ${station.country || "Ukjent"}</div>
      <div><em>ID:</em> ${station.stationId || "N/A"}</div>

      <div class="stats" style="margin-top:10px;">
        ${observationHTML || "<em>Ingen tilgjengelige observasjoner</em>"}
        ${glacierStatsHTML}
      </div>

      <div class="footer">
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
