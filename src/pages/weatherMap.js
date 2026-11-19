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
import MarkPlaces from "./MarkPlaces";
import { useTransportLayers } from "./transport";
import { MAPBOX_TOKEN } from "../config";

mapboxgl.accessToken = MAPBOX_TOKEN;

const DEFAULT_CENTER = [7.312, 62.2583];
const DEFAULT_ZOOM = 9.5;
const DEFAULT_PITCH = 20;

const LandslideMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showLakes, setShowLakes] = useState(false);
  const [transport, setTransport] = useState({
    "roads-nvdb": true,
    "rail-banenor": true,
  });
  const [cursorInfo, setCursorInfo] = useState({
    lat: null,
    lng: null,
    elevM: null,
  });

  const updateProgress = (step, totalSteps) => {
    setProgress(Math.round((step / totalSteps) * 100));
  };

  const resetZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      speed: 2.2,
      pitch: DEFAULT_PITCH,
    });
    setPitch(DEFAULT_PITCH);
  };

  // "R" resets the view
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

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 4;
      let step = 1;

      updateProgress(step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        customAttribution:
          "Hazard data: NVE Skredfaresoner (pre-2026 version) and Skredhendelser. Not for planning decisions.",
      });

      await new Promise((resolve) => mapRef.current.on("load", resolve));
      updateProgress(step++, totalSteps);

      if (!mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }

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

  useGlacierLayer({ mapRef });
  useLakeLayer({ mapRef, show: showLakes, visibility: "none" });
  useLandslideLayer({ mapRef });
  useTransportLayers({ mapRef, visible: transport });

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
      <BetaPopup loading={loading} progress={progress} title="Loading map data…" />

      <LayersToggle
        showLakes={showLakes}
        setShowLakes={setShowLakes}
        transport={transport}
        setTransport={setTransport}
      />
      <MarkPlaces mapRef={mapRef} ready={!loading} />
    </div>
  );
};

export default LandslideMap;
