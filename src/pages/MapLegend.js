import React, { useEffect, useRef, useState } from "react";
import "./MapLegend.css";

const MapLegend = () => {
  const [expanded, setExpanded] = useState(false);
  const legendRef = useRef(null);

  // Collapse when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (legendRef.current && !legendRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`map-legend ${expanded ? "expanded" : ""}`}
      ref={legendRef}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Glacial Lake */}
      <div className="map-legend-item">
        <div className="map-legend-square glacial-lake" />
        <div className="map-legend-label">
          <strong>Glacial Lake</strong>
          {expanded && (
            <div className="legend-description">
              Lake formed by glacier meltwater, potential flood source.
            </div>
          )}
        </div>
      </div>

      {/* Glacial Lake with GLOFs */}
      <div className="map-legend-item">
        <div className="map-legend-square glacial-lake-glof" />
        <div className="map-legend-label">
          <strong>Glacial Lake w/ Known Floods</strong>
          {expanded && (
            <div className="legend-description">
              Lake with documented glacial lake outburst floods.
            </div>
          )}
        </div>
      </div>

      {/* Weather Station */}
      <div className="map-legend-item">
        <div className="map-legend-circle weather-station" />
        <div className="map-legend-label">
          <strong>Weather Station</strong>
          {expanded && (
            <div className="legend-description">
              Norwegian Meteorological Institute site for weather & climate data.
            </div>
          )}
        </div>
      </div>

      {/* Glacier */}
<div className="map-legend-item glacier-item">
  <div className="map-legend-circle glacier" />
  <div className="map-legend-label">
    <strong>Glacier</strong>
    {expanded && (
      <div className="legend-description">
        Ice mass flowing downhill, feeding glacial lakes.
      </div>
    )}
  </div>
      </div>
    </div>
  );
};

export default MapLegend;
