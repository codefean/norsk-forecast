// src/attachNvePopup.js
import mapboxgl from "mapbox-gl";
import { fetchNveLatest } from "./frostAPI"; // ✅ wrapper you wrote

/**
 * Attach click handler for NVE stations popup.
 *
 * @param {object} map - Mapbox map instance (mapRef.current)
 */
export function attachNvePopup(map) {
  map.on("click", "nveStations-layer", async (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["nveStations-layer"],
    });
    if (!features || !features.length) return;

    const props = features[0].properties;
    const coords = features[0].geometry.coordinates;

    // 🔹 Base info: station name + ID
    const baseHTML = `
      <div style="font-size: 14px;">
        <strong>${props?.StationName || "Ukjent NVE-stasjon"}</strong><br/>
        <em>ID:</em> ${props?.StationId || "N/A"}
      </div>
    `;

    const popup = new mapboxgl.Popup({ className: "station-popup" })
      .setLngLat(coords)
      .setHTML(`${baseHTML}<div style="margin-top:10px;">Laster hydrologiske data...</div>`)
      .addTo(map);

    try {
      // 📡 Fetch data — no parameter passed = auto-detect from backend
      const latestObs = await fetchNveLatest(null, [props.StationId], 60);

      if (Array.isArray(latestObs) && latestObs.length > 0) {
        // Build a list of available parameter observations
        const rows = latestObs.map((series) => {
          const obs = series.observations?.[0];
          return `
            <div style="margin-bottom:6px;">
              <em>Parameter:</em> ${series.parameterName || "?"}<br/>
              <em>Verdi:</em> ${obs?.value ?? "?"} ${series.unit || ""}<br/>
              <em>Tid:</em> ${obs?.time ?? "?"}
            </div>
          `;
        });

        popup.setHTML(`
          ${baseHTML}
          <div style="margin-top:10px;">
            ${rows.join("")}
          </div>
        `);
      } else {
        popup.setHTML(`
          ${baseHTML}
          <div style="margin-top:10px; color: gray;">
            Ingen hydrologiske data tilgjengelig.
          </div>
        `);
      }
    } catch (err) {
      console.error("[NVE DEBUG] Popup fetch error:", err);
      popup.setHTML(`
        ${baseHTML}
        <div style="margin-top:10px; color: red;">
          Kunne ikke laste hydrologiske data.
        </div>
      `);
    }
  });
}
