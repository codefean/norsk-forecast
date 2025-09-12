// src/glacierModel.js

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
    const Tcorr = d.T + LAPSE_RATE * dz;  // adjust T to glacier elevation
    const P = d.P || 0;

    // Accumulate snow if below threshold
    if (Tcorr < TS_SNOW) {
      SWE += P; // snowfall
    } else {
      const melt = degreeDayMelt(Tcorr, true);
      SWE = Math.max(SWE - melt, 0);
    }

    const Melt = degreeDayMelt(Tcorr, true);
    const ROS = Tcorr > TS_SNOW && P > ROS_P_MIN && SWE > SWE_MIN;

    return { ...d, T: Tcorr, Melt, SWE, ROS };
  });
}

// --- Glacier processor ---
export function processGlacier(glacierMeta, stationMeta, series) {
  const history = snowpackBucket(series, glacierMeta.zGlacier, stationMeta.zStation);
  const today = history.at(-1) || null;

  return {
    glacier: glacierMeta,
    station: stationMeta,
    today,
    history: history.slice(-14),  // return last 14 days
    dataQuality: "full"
  };
}
