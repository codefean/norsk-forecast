// src/WeatherStationsMap.js
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { fetchStations, getStationDataSummary } from "./frostAPI";
import { frostToGeoJSON } from "./geojsonUtils";
import { useGlacierLayer } from "./glaciers";
import { filterFrostStations } from "./filterFrost";
import { loadNveStationsForMap } from "./filterNVE.js";

import Loc from "./loc";
import Citation from "./citation";
import "./weatherMap.css";
import { findClosestGlacier } from "./findClosestGlacier";
import { buildStationPopupHTML } from "./stationPopup";
import PitchControl from "./PitchControl";
import SearchBar from "./search";
import { useLakeLayer } from "./lakes";
import Hotkey from "./Hotkey";
import MapLegend from "./MapLegend";
import LayersToggle from "./LayersToggle";
import BetaPopup from "./popup";
import { attachNvePopup } from "./nvePopup";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbiIsImEiOiJjbTNuOGVvN3cxMGxsMmpzNThzc2s3cTJzIn0.1uhX17BCYd65SeQsW1yibA";

const WeatherStationsMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const DEFAULT_PITCH = 20;
  const [pitch, setPitch] = useState(DEFAULT_PITCH);

  const resetZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [10.395, 63.4305],
      zoom: 4.5,
      speed: 2.2,
      pitch: DEFAULT_PITCH,
    });
    setPitch(DEFAULT_PITCH);
  };

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key.toLowerCase() === "r") resetZoom();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const [cursorInfo, setCursorInfo] = useState({
    lat: null,
    lng: null,
    elevM: null,
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => setPitch(map.getPitch());
    map.on("pitch", sync);
    map.on("pitchend", sync);

    return () => {
      map.off("pitch", sync);
      map.off("pitchend", sync);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [, setLogMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  const updateProgress = (msg, step, totalSteps) => {
    console.log(msg);
    setLogMessages((prev) => [...prev, msg]);
    setProgress(Math.round((step / totalSteps) * 100));
  };

  // Toggle states
  const [showStations, setShowStations] = useState(true);       // Frost
  const [showNveStations, setShowNveStations] = useState(true); // NVE
  const [showLakes, setShowLakes] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 10; // adjusted
      let step = 1;

      updateProgress("Initializing Mapbox map...", step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [10.395, 63.4305],
        zoom: 4.5,
        pitch: DEFAULT_PITCH,
      });

      await new Promise((resolve) => mapRef.current.on("load", resolve));
      updateProgress("Mapbox map fully loaded", step++, totalSteps);

      // Terrain DEM
      if (!mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }

      // 🌡️ Fetch Frost stations
      updateProgress("Fetching Frost API stations...", step, totalSteps);
      const frostStations = await fetchStations();
      updateProgress(
        `Frost stations fetched: ${frostStations.length}`,
        step++,
        totalSteps
      );

      const allowedCountries = ["Sverige", "Norge", "Svalbard og Jan Mayen"];
      const filteredFrost = frostStations.filter((st) =>
        allowedCountries.includes(st.country?.trim())
      );
      const frostPoints = frostToGeoJSON(filteredFrost);
      const frostOnGlaciers = await filterFrostStations(frostPoints, 12);

      const frostBlob = new Blob([JSON.stringify(frostOnGlaciers)], {
        type: "application/json",
      });
      const frostUrl = URL.createObjectURL(frostBlob);

      if (!mapRef.current.getSource("stations")) {
        mapRef.current.addSource("stations", { type: "geojson", data: frostUrl });
      }
      if (!mapRef.current.getLayer("stations-layer")) {
        mapRef.current.addLayer({
          id: "stations-layer",
          type: "circle",
          source: "stations",
          layout: { visibility: "visible" },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 2,
              5, 3,
              10, 5,
              15, 9,
            ],
            "circle-color": "#8a2be2", // Frost = purple
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.8,
          },
        });
      }

      updateProgress("Frost stations layer added", step++, totalSteps);

      // 💧 Fetch NVE stations
      updateProgress("Fetching NVE stations...", step, totalSteps);
      const nveGeoJSON = await loadNveStationsForMap();

      if (!mapRef.current.getSource("nveStations")) {
        mapRef.current.addSource("nveStations", {
          type: "geojson",
          data: nveGeoJSON,
        });
      }

      if (!mapRef.current.getLayer("nveStations-layer")) {
        mapRef.current.addLayer({
          id: "nveStations-layer",
          type: "circle",
          source: "nveStations",
          layout: { visibility: "visible" },
          paint: {
            "circle-radius": 5,
            "circle-color": "#1f78b4", // blue for NVE
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }

      updateProgress("NVE stations layer added", step++, totalSteps);

      // ✅ Enable popups
      attachNvePopup(mapRef.current);

      // Cursor elevation
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

      // Frost station popups
      mapRef.current.on("click", "stations-layer", async (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["stations-layer"],
        });
        if (!features || !features.length) return;

        const props = features[0].properties;
        const coords = features[0].geometry.coordinates;

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

        const popup = new mapboxgl.Popup({ className: "station-popup" })
          .setLngLat(coords)
          .setHTML(
            `${baseHTML}<div style="margin-top:10px;">Laster værdata...</div>`
          )
          .addTo(mapRef.current);

        try {
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
        } catch {
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

  // 🔄 Sync toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("stations-layer")) {
      map.setLayoutProperty(
        "stations-layer",
        "visibility",
        showStations ? "visible" : "none"
      );
    }

    if (map.getLayer("nveStations-layer")) {
      map.setLayoutProperty(
        "nveStations-layer",
        "visibility",
        showNveStations ? "visible" : "none"
      );
    }

    if (map.getLayer("lake-outline")) {
      map.setLayoutProperty(
        "lake-outline",
        "visibility",
        showLakes ? "visible" : "none"
      );
    }

    const lakeMarkers = document.querySelectorAll(".marker, .place-marker");
    lakeMarkers.forEach((el) => {
      el.style.display = showLakes ? "block" : "none";
    });
  }, [showStations, showNveStations, showLakes]);

  // Always mount glaciers + lakes
  useGlacierLayer({ mapRef });
  useLakeLayer({ mapRef });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "calc(100vh - 43px)",
          overflow: "hidden",
          zIndex: 1,
        }}
      />

      <PitchControl mapRef={mapRef} value={pitch} onChange={(p) => setPitch(p)} />
      <SearchBar mapRef={mapRef} />
      <Loc cursorInfo={cursorInfo} className="loc-readout" />
      <Citation className="citation-readout" stylePos={{}} />
      <Hotkey resetZoom={resetZoom} />
      <MapLegend />
      <BetaPopup loading={loading} progress={progress} title="Loading Data..." />

      {/* Toggle Panel */}
      <LayersToggle
        showStations={showStations}
        setShowStations={setShowStations}
        showNveStations={showNveStations}
        setShowNveStations={setShowNveStations}
        showLakes={showLakes}
        setShowLakes={setShowLakes}
      />
    </div>
  );
};

export default WeatherStationsMap;
