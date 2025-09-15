import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchStations, getStationDataSummary } from "./frostAPI";
import { frostToGeoJSON } from "./geojsonUtils";
import { useGlacierLayer } from "./glaciers";
import { filterFrostStations } from "./filterFrost";
import Loc from "./loc";
import Citation from "./citation";
import "./weatherMap.css";
import { findClosestGlacier } from "./findClosestGlacier";
import LoadingOverlay from "./loading";
import { buildStationPopupHTML } from "./stationPopup";
import PitchControl from "./PitchControl";
import SearchBar from "./search";
import { useLakeLayer } from "./lakes";
import Hotkey from "./Hotkey";
import MapLegend from "./MapLegend";
import LayersToggle from "./LayersToggle";
import BetaPopup from "./popup";


// cd /Users/seanfagan/Desktop/scandi-forecast

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
  const [logMessages, setLogMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  const updateProgress = (msg, step, totalSteps) => {
    console.log(msg);
    setLogMessages((prev) => [...prev, msg]);
    setProgress(Math.round((step / totalSteps) * 100));
  };

  // Toggle state for stations and lakes
  const [showStations, setShowStations] = useState(false);
  const [showLakes, setShowLakes] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 7;
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

      // Add terrain
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

      // Filter by country
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

      // Keep glaciers under lakes
      if (
        mapRef.current.getLayer("glacier-fill") &&
        mapRef.current.getLayer("lake-outline")
      ) {
        mapRef.current.moveLayer("glacier-fill", "lake-outline");
      }

      // Filter stations near glaciers
      const stationsOnGlaciers = await filterFrostStations(stationPoints, 12);

      const blob = new Blob([JSON.stringify(stationsOnGlaciers)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      // Add stations source
      if (!mapRef.current.getSource("stations")) {
        mapRef.current.addSource("stations", { type: "geojson", data: url });
        updateProgress(
          "📡 Glacier-filtered GeoJSON source added successfully",
          step,
          totalSteps
        );
      } else {
        mapRef.current.getSource("stations").setData(url);
      }

      mapRef.current.__stationsGeoJSON = stationsOnGlaciers;
      mapRef.current.__stationsBlobURL = url;

      // Add stations layer
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
              0, 2,
              5, 3,
              10, 5,
              15, 9,
            ],
            "circle-color": "#8a2be2",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.8,
          },
        });
        updateProgress("Station layer added successfully", totalSteps, totalSteps);
      }

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

      // Station clicks
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

        const popup = new mapboxgl.Popup({ className: "station-popup" })
          .setLngLat(coords)
          .setHTML(`${baseHTML}<div style="margin-top:10px;">Laster værdata...</div>`)
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
        } catch (err) {
          console.error(
            `Failed to fetch weather data for station ${props?.id}:`,
            err
          );
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

  // Sync toggles with map + DOM markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Stations
    if (map.getLayer("stations-layer")) {
      map.setLayoutProperty(
        "stations-layer",
        "visibility",
        showStations ? "visible" : "none"
      );
    }

    // Lakes (outline + markers from lakes.js)
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
  }, [showStations, showLakes]);

  // Glaciers + lakes always mounted
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

      {loading && (
        <LoadingOverlay
          loading={loading}
          progress={progress}
          logMessages={logMessages}
          title="Loading Data..."
        />
      )}

      <PitchControl mapRef={mapRef} value={pitch} onChange={(p) => setPitch(p)} />
      <SearchBar mapRef={mapRef} />
      <Loc cursorInfo={cursorInfo} className="loc-readout" />
      <Citation className="citation-readout" stylePos={{}} />
      <Hotkey resetZoom={resetZoom} />
      <MapLegend />
      <BetaPopup/>

      {/* Toggle Panel */}
      <LayersToggle
        showStations={showStations}
        setShowStations={setShowStations}
        showLakes={showLakes}
        setShowLakes={setShowLakes}
      />
    </div>
  );
};

export default WeatherStationsMap;
