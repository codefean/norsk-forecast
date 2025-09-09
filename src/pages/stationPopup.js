// stationPopup.js
// Builds the HTML content for a station's popup based on summary data `s`.

// Tiny helpers for formatting
const pct = (v) => (v == null ? "—" : `${Math.round(v)}%`);

const badge = (text, tone = "neutral") =>
  `<span style="
    display:inline-block;
    padding:2px 6px;
    border-radius:999px;
    font-size:12px;
    line-height:1;
    background:${
      tone === "good"
        ? "#e6f4ea"
        : tone === "warn"
        ? "#fef3c7"
        : tone === "bad"
        ? "#fee2e2"
        : "#eef2f7"
    };
    color:${
      tone === "good"
        ? "#05603a"
        : tone === "warn"
        ? "#92400e"
        : tone === "bad"
        ? "#991b1b"
        : "#334155"
    };
    border:1px solid ${
      tone === "good"
        ? "#b7e4c7"
        : tone === "warn"
        ? "#fde68a"
        : tone === "bad"
        ? "#fecaca"
        : "#e5e7eb"
    };
  ">${text}</span>`;

/**
 * Builds station popup HTML.
 * @param {object} s - Station data summary
 * @returns {string} HTML markup
 */
export function buildStationPopupHTML(s) {
  const normalsBasisLabel = s.display.normalsBasis || "—"; // e.g. "Daily normals"

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <div><strong>Nåværende temperatur</strong><br>${s.display.currentTemp}</div>
      <div><strong>Nåværende nedbør</strong><br>${s.display.currentPrecip}</div>
      <div><strong>5-års snitt (måned) – temp</strong><br>${s.display.avgTempThisMonth5yr}</div>
      <div><strong>5-års sum (måned) – nedbør</strong><br>${s.display.avgPrecipThisMonth5yr}</div>
    </div>

    <div style="border-top:1px solid #eee;margin:10px 0"></div>

    <!-- MTD block simplified -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><strong>${s.year} MTD snitt-temp</strong><br>${s.display.avgTempThisMonthThisYear}</div>
      <div><strong>Normal MTD temp</strong><br>${s.display.normalTempThisMonth || "—"}
        <div style="margin-top:2px;font-size:12px;color:#64748b">${normalsBasisLabel}</div>
      </div>
      <div><strong>${s.year} MTD nedbør</strong><br>${s.display.avgPrecipThisMonthThisYear}
        <div style="margin-top:4px">
          <span style="margin-right:6px"><em>Normal MTD:</em> ${s.display.normalPrecipThisMonth || "—"}</span>
        </div>
      </div>
    </div>

    <div style="border-top:1px solid #eee;margin:10px 0"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><strong>Vind</strong><br>${s.display.wind}</div>
      <div><strong>Følt temperatur</strong><br>${s.display.windChill}</div>
      <div><strong>Luftfuktighet</strong><br>${s.display.humidity}</div>
      <div><strong>Snødybde</strong><br>${s.display.snowDepth}</div>
      <div><strong>Nedbør (24 t)</strong><br>${s.display.precip24h}</div>
      <div><strong>Min / maks i dag</strong><br>${s.display.todayTempMin} / ${s.display.todayTempMax}</div>
      <div style="grid-column:1/3;color:#666;margin-top:4px">
        Siste observasjon: ${s.lastObsTime ? new Date(s.lastObsTime).toISOString() : "—"}
      </div>
    </div>
  `;
}
