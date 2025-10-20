// src/LayersToggle.js
import React from "react";
import "./LayersToggle.css";

const LayersToggle = ({
  showLakes,
  setShowLakes,
}) => {
  return (
    <div className="layer-toggle-panel">
      <h4>Layers</h4>


<label>
  <input
    type="checkbox"
    checked={showLakes}
    onChange={() => setShowLakes(!showLakes)}
  />
  {showLakes ? "Hide Glacial Lakes" : "Show Glacial Lakes"}
</label>
    </div>
  );
};

export default LayersToggle;
