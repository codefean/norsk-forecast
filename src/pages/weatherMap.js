import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useGlacierLayer } from "./glaciers";
import Loc from "./loc";
import "./weatherMap.css";
import PitchControl from "./PitchControl";
import SearchBar from "./search";
import { useLakeLayer } from "./lakes";
import Hotkey from "./Hotkey";
import MapLegend from "./MapLegend";
import LayersToggle from "./LayersToggle";
import BetaPopup from "./popup";
import { useLandslideLayer } from "./landslide";

// cd /Users/seanfagan/Desktop/norsk-forecast
//

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbjIiLCJhIjoiY21pcW15czFtMDBwMjNkcTVnMGhhYjR5dyJ9.VgAM8pGsqn--nTvsiWn9NQ";

const WeatherStationsMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const DEFAULT_PITCH = 20;
  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [loading, setLoading] = useState(true);
  const [, setLogMessages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showLakes, setShowLakes] = useState(false);
  const [cursorInfo, setCursorInfo] = useState({
    lat: null,
    lng: null,
    elevM: null,
  });

  

  const updateProgress = (msg, step, totalSteps) => {
    console.log(msg);
    setLogMessages((prev) => [...prev, msg]);
    setProgress(Math.round((step / totalSteps) * 100));
  };

  const resetZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [7.312, 62.2583],
        zoom: 9.5,
      speed: 2.2,
      pitch: DEFAULT_PITCH,
    });
    setPitch(DEFAULT_PITCH);
  };

  // Reset zoom on “R”
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key.toLowerCase() === "r") resetZoom();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  // Sync pitch with Mapbox map
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

  // Initialize Map
  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 4;
      let step = 1;

      updateProgress("Initializing Mapbox map...", step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [7.312, 62.2583],
        zoom: 9.5,
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

      const lakeMarkers = document.querySelectorAll(".marker, .place-marker");
      lakeMarkers.forEach((el) => (el.style.display = "none"));

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

  // Toggle lakes visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [showLakes]);

  // Always mount glaciers + lakes
  useGlacierLayer({ mapRef });
  useLakeLayer({ mapRef, show: showLakes, visibility: "none" });
  useLandslideLayer({ mapRef });

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
      <Hotkey resetZoom={resetZoom} />
      <MapLegend />
      <BetaPopup loading={loading} progress={progress} title="Loading Data..." />

      <LayersToggle showLakes={showLakes} setShowLakes={setShowLakes} />
    </div>
  );
};

export default WeatherStationsMap;
