// src/frostAPI.js
// Thin client for your deployed backend (no direct Frost calls from the browser)

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://scandi-backend.onrender.com";

// --- tiny fetch wrapper
async function api(path) {
  const res = await fetch(`${BACKEND_BASE}${path}`, { credentials: "omit" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/* -----------------------------
   Stations & Observations
-------------------------------- */

export async function fetchStations() {
  return api(`/api/stations`);
}

export async function fetchLatestObservations(
  stationId,
  { since = "now-6h/now", elements = undefined } = {}
) {
  const q = new URLSearchParams({ since });
  if (elements) q.set("elements", elements);
  return api(`/api/observations/${encodeURIComponent(stationId)}?${q.toString()}`);
}

/* -----------------------------
   Historical Data
-------------------------------- */

export async function fetchHistory(
  stationId,
  {
    startISO,
    endISO,
    elements = "air_temperature,wind_speed,wind_from_direction,relative_humidity,precipitation_amount,snow_depth",
    chunkDays = 7,
  } = {}
) {
  if (!startISO || !endISO)
    throw new Error("fetchHistory: missing startISO or endISO");
  const q = new URLSearchParams({
    start: startISO,
    end: endISO,
    elements,
    chunkDays: String(chunkDays),
  });
  return api(`/api/history/${encodeURIComponent(stationId)}?${q.toString()}`);
}

/* -----------------------------
   Climate Normals
-------------------------------- */

/**
 * Fetch monthly normals for a station.
 */
export async function fetchNormalsMonth(stationId, month, elementsCsv) {
  const elements =
    elementsCsv || "mean(air_temperature P1M),sum(precipitation_amount P1M)";
  const q = new URLSearchParams({ elements, months: String(month) });
  return api(`/api/normals/${encodeURIComponent(stationId)}?${q.toString()}`);
}

/**
 * Fetch available normals metadata for a station.
 */
export async function fetchNormalsAvailability(stationId, elementsCsv) {
  const q = new URLSearchParams();
  if (elementsCsv) q.set("elements", elementsCsv);
  return api(`/api/normals/available/${encodeURIComponent(stationId)}?${q.toString()}`);
}

/**
 * Fetch detailed normals, optionally specifying period/months/days.
 */
export async function fetchClimateNormals(
  stationId,
  { elements, period, months, days, offset } = {}
) {
  if (!stationId || !elements) {
    throw new Error("fetchClimateNormals: stationId and elements are required");
  }

  const q = new URLSearchParams({ elements });
  if (period) q.set("period", period);
  if (months) q.set("months", months);
  if (days) q.set("days", days);
  if (offset) q.set("offset", offset);

  return api(`/api/normals/${encodeURIComponent(stationId)}?${q.toString()}`);
}
