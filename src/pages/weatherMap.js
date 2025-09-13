import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchStations} from "./frostAPI";
import { frostToGeoJSON } from "./geojsonUtils";
import { useGlacierLayer } from "./glaciers";
import { filterFrostStations } from "./filterFrost";
import Loc from "./loc";
import Citation from "./citation";
import "./weatherMap.css";
import { findClosestGlacier } from "./findClosestGlacier";
import LoadingOverlay from "./loading";
import { getStationDataSummary } from "./frostAPI";
import { buildStationPopupHTML } from "./stationPopup";
import PitchControl from "./PitchControl";
import SearchBar from "./search";



mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbiIsImEiOiJjbTNuOGVvN3cxMGxsMmpzNThzc2s3cTJzIn0.1uhX17BCYd65SeQsW1yibA";

const WeatherStationsMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const DEFAULT_PITCH = 20;
  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [cursorInfo, setCursorInfo] = useState({
    lat: null,
    lng: null,
    elevM: null,
  });
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => setPitch(map.getPitch());
    map.on('pitch', sync);
    map.on('pitchend', sync);

    return () => {
      map.off('pitch', sync);
      map.off('pitchend', sync);
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [logMessages, setLogMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  const updateProgress = (msg, step, totalSteps) => {
    console.log(msg);
    setLogMessages((prev) => [...prev, msg]);
    setProgress(Math.round((step / totalSteps) * 100));
  };

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 7;
      let step = 1;

      updateProgress("🗺️ Initializing Mapbox map...", step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [12.75, 67.91],
        pitch: DEFAULT_PITCH,
        zoom: 3.7,
      });

      await new Promise((resolve) => mapRef.current.on("load", resolve));
      updateProgress("🛰️ Mapbox map fully loaded", step++, totalSteps);

      // Add terrain source if missing
      if (!mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }

      // Fetch stations
      updateProgress("Fetching Frost API stations...", step, totalSteps);
      const stations = await fetchStations();
      updateProgress(`Stations fetched: ${stations.length}`, step++, totalSteps);

      if (stations.length === 0) {
        updateProgress("No stations returned from Frost API", totalSteps, totalSteps);
        setLoading(false);
        return;
      }

      // Filter allowed countries
      const allowedCountries = ["Sverige", "Norge", "Svalbard og Jan Mayen"];
      const filteredStations = stations.filter((station) =>
        allowedCountries.includes(station.country?.trim())
      );
      updateProgress(
        `Showing ${filteredStations.length} stations after filtering by country`,
        step++,
        totalSteps
      );

      // Convert to GeoJSON
      const stationPoints = frostToGeoJSON(filteredStations);
      updateProgress(
        `Converted ${stationPoints.features.length} valid stations into GeoJSON.`,
        step++,
        totalSteps
      );

      // Filter by proximity to glaciers
const stationsOnGlaciers = await filterFrostStations(stationPoints, 12);

// Create a Blob URL for Mapbox to use as the source ✅
const blob = new Blob([JSON.stringify(stationsOnGlaciers)], {
  type: "application/json",
});
const url = URL.createObjectURL(blob);

// Add the weather stations source to Mapbox ✅
if (!mapRef.current.getSource("stations")) {
  mapRef.current.addSource("stations", {
    type: "geojson",
    data: url, // ← Mapbox uses Blob URL here
  });
} else {
  // If the source already exists, update its data
  mapRef.current.getSource("stations").setData(url);
}

// ✅ Store the parsed GeoJSON on the map instance
//    This allows glaciers.js to access it directly later
mapRef.current.__stationsGeoJSON = stationsOnGlaciers;

// ✅ (Optional) Keep a reference to the Blob URL if you ever want to revoke it later
mapRef.current.__stationsBlobURL = url;


      // Add station source if missing
      if (!mapRef.current.getSource("stations")) {
        mapRef.current.addSource("stations", { type: "geojson", data: url });
        updateProgress("📡 Glacier-filtered GeoJSON source added successfully", step, totalSteps);
      }

      // Add station layer if missing
      if (!mapRef.current.getLayer("stations-layer")) {
        mapRef.current.addLayer({
          id: "stations-layer",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 1.5,
              5, 2.5,
              10, 4,
              15, 7
            ],
            "circle-color": "#0062ff",
            "circle-stroke-width": .5,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.5,
          },
        });
        updateProgress("Station layer added successfully", totalSteps, totalSteps);
      }

      // Show elevation under cursor
      mapRef.current.on("mousemove", (e) => {
        const { lng, lat } = e.lngLat;
        const elevation = mapRef.current.queryTerrainElevation(e.lngLat, {
          exaggerated: false,
        });
        setCursorInfo({
          lat,
          lng,
          elevM: elevation !== null ? elevation.toFixed(1) : "N/A",
        });
      });

      mapRef.current.on("mouseleave", () => {
        setCursorInfo({ lat: null, lng: null, elevM: null });
      });

      // Handle station clicks
      mapRef.current.on("click", "stations-layer", async (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["stations-layer"],
        });
        if (!features || !features.length) return;

        const props = features[0].properties;
        const coords = features[0].geometry.coordinates;

        // Find nearest glacier
        const { name: closestGlacier, distanceKm } = findClosestGlacier(
          mapRef.current,
          coords,
          50
        );

const baseHTML = `
  <div style="font-size: 14px;">
    <strong>${props?.name || "Ukjent stasjon"}</strong><br/>
    <em>Land:</em> ${props?.country || "Ukjent"}<br/>
    <em>ID:</em> ${props?.id || "N/A"}<br/><br/>
    <em>Nærmeste isbre:</em> <strong>${closestGlacier || "Ukjent"}</strong><br/>
    <em>Avstand:</em> ${distanceKm ? distanceKm + " km" : "?"}
  </div>
`;

// Initial popup while loading
const popup = new mapboxgl.Popup({ className: "station-popup" })
  .setLngLat(coords)
  .setHTML(`${baseHTML}<div style="margin-top:10px;">Laster værdata...</div>`)
  .addTo(mapRef.current);

try {
  // Fetch station summary with timeout safeguard
  const summary = await Promise.race([
    getStationDataSummary(props.id),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000)
    ),
  ]);

  if (summary) {
    popup.setHTML(`
      ${baseHTML}
      <div style="margin-top:10px;">
        ${await buildStationPopupHTML(summary)}
      </div>
    `);
  } else {
    popup.setHTML(`
      ${baseHTML}
      <div style="margin-top:10px; color: gray;">
        Ingen værdata tilgjengelig.
      </div>
    `);
  }
} catch (err) {
  console.error(`Failed to fetch weather data for station ${props?.id}:`, err);
  popup.setHTML(`
    ${baseHTML}
    <div style="margin-top:10px; color: red;">
      Kunne ikke laste værdata.
    </div>
  `);
}
      });

      setLoading(false);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useGlacierLayer({ mapRef });

  return (
    <div style={{ position: "relative" }}>
<div
  ref={mapContainer}
  style={{
    width: "100%",
    height: "calc(100vh - 43px)", // adjust for header height
    overflow: "hidden",
    zIndex: 1,
  }}
/>

      {loading && (
        <LoadingOverlay
          loading={loading}
          progress={progress}
          logMessages={logMessages}
          title="Loading Glacier & Weather Station Data..."
        />
      )}
      <PitchControl mapRef={mapRef} value={pitch} onChange={(p) => setPitch(p)} />
        <SearchBar mapRef={mapRef} />
      <Loc cursorInfo={cursorInfo} className="loc-readout" />
      <Citation
        className="citation-readout"
        stylePos={{ position: "absolute", zIndex: 2 }}
      />
    </div>
  );
};

export default WeatherStationsMap;
