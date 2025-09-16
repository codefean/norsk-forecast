// src/LayersToggle.js
import React from "react";
import "./LayersToggle.css";

const LayersToggle = ({
  showStations,
  setShowStations,
  showNveStations,
  setShowNveStations,
  showLakes,
  setShowLakes,
}) => {
  return (
    <div className="layer-toggle-panel">
      <h4>Layers</h4>

      <label>
        <input
          type="checkbox"
          checked={showStations}
          onChange={() => setShowStations(!showStations)}
        />
        Frost Weather Stations
      </label>

      <label>
        <input
          type="checkbox"
          checked={showNveStations}
          onChange={() => setShowNveStations(!showNveStations)}
        />
        NVE Glacier Stations
      </label>

      <label>
        <input
          type="checkbox"
          checked={showLakes}
          onChange={() => setShowLakes(!showLakes)}
        />
        Lakes
      </label>
    </div>
  );
};

export default LayersToggle;
