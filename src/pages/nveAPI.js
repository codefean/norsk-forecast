// Thin client for your deployed NVE backend (no direct HydAPI calls from the browser)

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_NVE_BACKEND_BASE ||
  "https://scandi-backend-2.onrender.com";

let controller;

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
      console.log(`${context} → received ${data.length} items`);
    } else if (typeof data === "object") {
      console.log(`${context} →`, data);
    } else {
      console.log(`${context}:`, data);
    }
  }
}

/* -----------------------------
   Tiny fetch wrapper
-------------------------------- */
async function api(path, context = "NVE API") {
  if (controller) controller.abort();
  controller = new AbortController();

  const url = `${BACKEND_BASE}${path}`;
  console.log(`Fetching: ${url}`);

  let res;
  try {
    res = await fetch(url, { credentials: "omit", signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`${context}: Request aborted`);
      throw err;
    }
    console.error(`${context}: Network error →`, err);
    throw new Error(`${context}: Failed to connect to backend`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`${context} ${res.status} for ${url}: ${text}`);
    throw new Error(`${context} (${res.status}): ${text || res.statusText}`);
  }

  const json = await res.json();
  logSummary(context, json);
  return json;
}

/* -----------------------------
   NVE Stations
-------------------------------- */
export async function fetchNveStations() {
  const data = await api(`/api/nve/stations`, "fetchNveStations");

  if (!Array.isArray(data)) {
    throw new Error("fetchNveStations: Expected an array of stations");
  }

  logSummary("NVE Stations", data);
  return data;
}

/* -----------------------------
   NVE Latest Observations
-------------------------------- */
export async function fetchNveLatest(
  stationIds = [],
  { parameter = "1000", resolutionTime = 60, referenceTime = null } = {}
) {
  if (!stationIds || stationIds.length === 0) {
    const stations = await fetchNveStations();
    stationIds = stations.map((s) => s.stationId);
  }

  const q = new URLSearchParams({
    stationId: stationIds.join(","),
    parameter,
    resolutionTime: String(resolutionTime),
  });
  if (referenceTime) q.set("referenceTime", referenceTime);

  const data = await api(
    `/api/nve/observations?${q.toString()}`,
    "fetchNveLatest"
  );

  if (!Array.isArray(data)) {
    console.warn("fetchNveLatest: Unexpected response format", data);
    return [];
  }

  logSummary("NVE Latest", data);
  return data;
}

/* -----------------------------
   NVE Series (metadata about what’s available)
-------------------------------- */
export async function fetchNveSeries(stationId) {
  if (!stationId) throw new Error("fetchNveSeries: stationId required");

  const data = await api(
    `/api/nve/series?stationId=${encodeURIComponent(stationId)}`,
    `fetchNveSeries(${stationId})`
  );

  if (!data || !Array.isArray(data.data)) {
    throw new Error("fetchNveSeries: Expected array under data.data");
  }

  logSummary("NVE Series", data.data);
  return data.data;
}

/* -----------------------------
   NVE Summary (Station + Latest Obs)
-------------------------------- */
export async function getNveStationDataSummary(stationId) {
  try {
    const [series, obs] = await Promise.all([
      fetchNveSeries(stationId),
      fetchNveLatest([stationId], { parameter: "1000", resolutionTime: 60 }),
    ]);

    return {
      stationId,
      name: series?.[0]?.stationName || null,
      parameter: series?.[0]?.parameterName || null,
      latest: obs?.[0]?.observations?.[0] || null,
    };
  } catch (err) {
    console.error(`Failed to fetch NVE summary for ${stationId}:`, err);
    return null;
  }
}
