// src/frostAPI.js
// Thin client for your deployed backend (no direct Frost calls from the browser)

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://scandi-backend.onrender.com";

let controller;       // ✅ For aborting stale requests
let stationCache;     // ✅ Cache stations to avoid repeated fetches

/* -----------------------------
   Debug Helpers
-------------------------------- */

function assertValidData(context, data, requiredFields = []) {
  if (!data || typeof data !== "object") {
    throw new Error(`${context}: Invalid response (not an object)`);
  }

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`${context}: Missing expected field "${field}"`);
    }
  }
}

function logSummary(context, data) {
  if (process.env.NODE_ENV === "development") {
    if (Array.isArray(data)) {
      console.log(`🔍 ${context} → received ${data.length} items`);
    } else if (
      typeof data === "object" &&
      data.latest &&
      Object.keys(data.latest).length === 0
    ) {
      console.warn(`⚠️ ${context} → latest observations empty`);
    } else if (
      typeof data === "object" &&
      data.series &&
      Object.keys(data.series).length === 0
    ) {
      console.warn(`⚠️ ${context} → history series empty`);
    } else {
      console.log(`🔍 ${context} →`, data);
    }
  }
}

/* -----------------------------
   Tiny fetch wrapper
-------------------------------- */
async function api(path, context = "API") {
  // ✅ Abort previous request if still in-flight
  if (controller) controller.abort();
  controller = new AbortController();

  const url = `${BACKEND_BASE}${path}`;
  console.log(`🌐 Fetching: ${url}`);

  let res;
  try {
    res = await fetch(url, {
      credentials: "omit",
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`⚠️ ${context}: Request aborted`);
      throw err;
    }
    console.error(`❌ ${context}: Network error →`, err);
    throw new Error(`${context}: Failed to connect to backend`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`❌ ${context} ${res.status} for ${url}: ${text}`);
    throw new Error(`${context} (${res.status}): ${text || res.statusText}`);
  }

  const json = await res.json();
  logSummary(context, json);
  return json;
}

/* -----------------------------
   Stations
-------------------------------- */
export async function fetchStations() {
  if (stationCache) return stationCache; // ✅ Cached stations

  const data = await api(`/api/stations`, "fetchStations");

  if (!Array.isArray(data)) {
    throw new Error("fetchStations: Expected an array of stations");
  }

  stationCache = data; // ✅ Save to cache
  logSummary("Stations", data);
  return data;
}

/* -----------------------------
   Latest Observations
-------------------------------- */
export async function fetchLatestObservations(
  stationId,
  { elements } = {}
) {
  const q = new URLSearchParams();
  if (elements) q.set("elements", elements);

  const data = await api(
    `/api/observations/${encodeURIComponent(stationId)}?${q.toString()}`,
    `fetchLatestObservations(${stationId})`
  );

  assertValidData("fetchLatestObservations", data, [
    "stationId",
    "latest",
  ]);

  return data;
}


/* -----------------------------
   Historical Data
-------------------------------- */
export async function fetchHistory(
  stationId,
  {
    startISO,
    endISO,
    elements,
    availableElements,
    chunkDays = 7,
  } = {}
) {
  if (!startISO || !endISO) {
    throw new Error("fetchHistory: missing startISO or endISO");
  }

  let requestedElements;
  if (elements) {
    requestedElements = elements
      .split(",")
      .filter((el) => !availableElements || availableElements.includes(el));
  } else if (availableElements) {
    requestedElements = availableElements;
  }

  if (!requestedElements || requestedElements.length === 0) {
    console.warn(`⚠️ No supported historical elements for ${stationId}`);
    return { stationId, series: {}, warning: "No supported elements" };
  }

  const q = new URLSearchParams({
    start: startISO,
    end: endISO,
    elements: requestedElements.join(","),
    chunkDays: String(chunkDays),
  });

  const data = await api(
    `/api/history/${encodeURIComponent(stationId)}?${q.toString()}`,
    `fetchHistory(${stationId})`
  );

  if (data.error) {
    console.warn(`⚠️ No history data available for ${stationId}`);
    return { stationId, series: {}, warning: "No history data available" };
  }

  assertValidData("fetchHistory", data, ["stationId", "series"]);

  if (typeof data.series !== "object" || Object.keys(data.series).length === 0) {
    console.warn(`⚠️ fetchHistory: Series data empty for ${stationId}`);
  }

  logSummary("History Series", data.series);
  return data;
}

/* -----------------------------
   Climate Normals
-------------------------------- */
export async function fetchNormalsMonth(stationId, month, elementsCsv) {
  const elements =
    elementsCsv || "mean(air_temperature P1M),sum(precipitation_amount P1M)";
  const q = new URLSearchParams({ elements, months: String(month) });

  const data = await api(
    `/api/normals/${encodeURIComponent(stationId)}?${q.toString()}`,
    `fetchNormalsMonth(${stationId})`
  );

  if (data.error || !data.rows) {
    console.warn(`⚠️ No normals available for ${stationId}`);
    return { stationId, rows: {}, warning: "No normals available" };
  }

  assertValidData("fetchNormalsMonth", data, ["stationId", "rows"]);
  logSummary("Normals Month", data.rows);
  return data;
}

export async function fetchNormalsAvailability(stationId, elementsCsv) {
  const q = new URLSearchParams();
  if (elementsCsv) q.set("elements", elementsCsv);

  const data = await api(
    `/api/normals/available/${encodeURIComponent(stationId)}?${q.toString()}`,
    `fetchNormalsAvailability(${stationId})`
  );

  assertValidData("fetchNormalsAvailability", data, ["data"]);
  logSummary("Normals Availability", data.data);
  return data;
}

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

  const data = await api(
    `/api/normals/${encodeURIComponent(stationId)}?${q.toString()}`,
    `fetchClimateNormals(${stationId})`
  );

  if (data.error || !data.rows) {
    console.warn(`⚠️ No detailed normals available for ${stationId}`);
    return { stationId, rows: {}, warning: "No detailed normals available" };
  }

  assertValidData("fetchClimateNormals", data, ["stationId", "rows"]);
  logSummary("Climate Normals", data.rows);
  return data;
}

/* -----------------------------
   Health Check
-------------------------------- */
export async function checkBackend() {
  try {
    await api(`/api/health`, "checkBackend");
    return true;
  } catch {
    console.error("❌ Backend health check failed");
    return false;
  }
}


/**
 * Fetch a compact summary of station data:
 * Includes name, ID, and latest available observations.
 */
export async function getStationDataSummary(stationId) {
  try {
    const latest = await fetchLatestObservations(stationId);
    return {
      stationId: latest.stationId,
      name: latest.name,
      country: latest.country,
      lastObsTime: latest.latestTime || null,
      latest: latest.latest || {},
    };
  } catch (err) {
    console.error(`❌ Failed to fetch station summary for ${stationId}:`, err);
    return null;
  }
}
