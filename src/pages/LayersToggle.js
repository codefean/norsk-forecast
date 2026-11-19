import React from "react";
import { TRANSPORT_LAYERS } from "./transport";
import "./LayersToggle.css";

const LayersToggle = ({ showLakes, setShowLakes, transport, setTransport }) => {
  const toggleTransport = (id) =>
    setTransport((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="layer-toggle-panel">
      <h4>Layers</h4>

      {TRANSPORT_LAYERS.map((layer) => (
        <label key={layer.id}>
          <input
            type="checkbox"
            checked={!!transport[layer.id]}
            onChange={() => toggleTransport(layer.id)}
          />
          {layer.label}
        </label>
      ))}

      <label>
        <input
          type="checkbox"
          checked={showLakes}
          onChange={() => setShowLakes(!showLakes)}
        />
        Glacial lakes
      </label>
    </div>
  );
};

export default LayersToggle;
