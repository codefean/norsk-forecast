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


{/* Isbre */}
<div className="map-legend-item glacier-item">
  <div className="map-legend-circle glacier" />
  <div className="map-legend-label">
    <strong>Isbre</strong>
    {expanded && (
      <div className="legend-description">
        Ismasse som beveger seg nedover i terrenget og forsyner brevatn og innsjøer.
      </div>
    )}
  </div>
</div>


<div className="map-legend-item">
  <div className="historical-event-dot" />
  <div className="map-legend-label">
    <strong>Historiske hendelser</strong>
    {expanded && (
      <div className="legend-description">
        Registrerte skredhendelser som steinsprang, jordskred og flomskred fra NVE Skredhendelser-databasen.
      </div>
    )}
  </div>
</div>

<div className="map-legend-item">
  <div className="map-legend-square hazard-100" />
  <div className="map-legend-label">
    <strong>Høy risikosone</strong>
    {expanded && (
      <div className="legend-description">
        Område med høy fare (100-årssone, årlig sannsynlighet ≈ 1 %). Hyppige skredhendelser – unngå ny bebyggelse og kritisk infrastruktur.
      </div>
    )}
  </div>
</div>

<div className="map-legend-item">
  <div className="map-legend-square hazard-1000" />
  <div className="map-legend-label">
    <strong>Moderat risikosone</strong>
    {expanded && (
      <div className="legend-description">
        Område med moderat fare (1000-årssone, årlig sannsynlighet ≈ 0,1 %). Av og til forekommende skred – vurdering kreves ved varige bygg og infrastruktur.
      </div>
    )}
  </div>
</div>

<div className="map-legend-item">
  <div className="map-legend-square hazard-5000" />
  <div className="map-legend-label">
    <strong>Lav risikosone</strong>
    {expanded && (
      <div className="legend-description">
        Område med lav fare (5000-årssone, årlig sannsynlighet ≈ 0,02 %). Svært sjeldne og ekstreme hendelser – egnet for vanlig utbygging med overvåking.
      </div>



          )}

          
        </div>
        
      </div>
    </div>
  );
};

export default MapLegend;
