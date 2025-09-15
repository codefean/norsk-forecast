// --- Constants ---
const LAPSE_RATE = -0.0065;    // Temperature lapse rate (°C per meter)
const T0 = 0.0;                // Melt threshold (°C)
const DDF_SNOW = 3.0;          // Degree-day factor for snow (mm w.e./°C/day)
const DDF_ICE = 7.0;           // Degree-day factor for ice (mm w.e./°C/day)
const TS_SNOW = 0.5;           // Threshold for snow accumulation (°C)
const ROS_P_MIN = 5.0;         // Minimum precipitation for rain-on-snow (mm)
const SWE_MIN = 20.0;          // Minimum snowpack for ROS to be relevant (mm)

// --- Degree-day melt ---
export function degreeDayMelt(T, snowCover = true) {
  const ddf = snowCover ? DDF_SNOW : DDF_ICE;
  return Math.max(T - T0, 0) * ddf;
}

// --- Snowpack bucket model ---
function snowpackBucket(series, zGlacier, zStation) {
  let SWE = 0.0;
  const dz = zGlacier - zStation;

  return series.map((d) => {
    const Tcorr = d.T + LAPSE_RATE * dz; // adjust T to glacier elevation

    // ✅ Precipitation preference: daily > hourly > fallback
    const P =
      d.P24 !== undefined
        ? d.P24
        : d.P1 !== undefined
        ? d.P1
        : d.P !== undefined
        ? d.P
        : 0;

    // --- Partition precipitation into snow vs. rain ---
    const fSnow = Math.max(0, Math.min(1, (TS_SNOW + 2 - Tcorr) / 4));
    const snowfall = P * fSnow;
    const rainfall = P * (1 - fSnow);

    // --- Update snowpack ---
    SWE += snowfall;

    // --- Compute melt (snow vs. ice) ---
    const isSnowCovered = SWE > 1.0;
    const melt = degreeDayMelt(Tcorr, isSnowCovered);
    SWE = Math.max(SWE - melt, 0);

    // --- Runoff ---
    let runoff = melt + rainfall;

    // --- Simple refreezing ---
    if (Tcorr < 0 && SWE > 0 && runoff > 0) {
      const refreeze = Math.min(2.0, runoff);
      SWE += refreeze;
      runoff -= refreeze;
    }

    // --- Rain-on-snow severity ---
    const ROS =
      Tcorr > TS_SNOW && SWE > SWE_MIN && P > ROS_P_MIN
        ? Math.min(P / 10, 1)
        : 0;

    return {
      ...d,
      T: Tcorr,
      Melt: melt,
      SWE,
      Runoff: runoff,
      ROS,           // 0–1
      snowFraction: fSnow,
    };
  });
}

// --- Glacier processor ---
export function processGlacier(glacierMeta, stationMeta, series) {
  const history = snowpackBucket(series, glacierMeta.zGlacier, stationMeta.zStation);
  const today = history.at(-1) || null;

  // --- Compute 24h aggregates (last 24 entries if available) ---
  const last24 = history.slice(-24);
  const melt24h   = last24.reduce((s, r) => s + (r.Melt   ?? 0), 0);
  const runoff24h = last24.reduce((s, r) => s + (r.Runoff ?? 0), 0);
  const rosMax24  = last24.reduce((m, r) => Math.max(m, r.ROS ?? 0), 0);

  return {
    glacier: glacierMeta,
    station: stationMeta,
    today,
    history: history.slice(-14 * 24), // keep last 14 days (hourly or daily depending on input)
    aggregates24h: { melt24h, runoff24h, rosMax24 },
    dataQuality: "full",
  };
}