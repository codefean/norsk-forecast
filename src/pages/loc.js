// src/pages/loc.js
import React from "react";
import './loc.css';

const Loc = ({ cursorInfo }) => {
  // Don't render if on small screen
  if (typeof window !== "undefined" && window.innerWidth <= 768) {
    return null;
  }

  return (
    <div
      className="cursor-readout"
      style={{
        position: "absolute",
        left: 12,
        bottom: 35,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.2,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {cursorInfo.lat !== null && cursorInfo.lng !== null ? (
        <>
          <div>
            <strong>Lat:</strong> {cursorInfo.lat.toFixed(5)} &nbsp;
            <strong>Lng:</strong> {cursorInfo.lng.toFixed(5)}
          </div>
          <div>
            <strong>Elev:</strong>{" "}
            {cursorInfo.elevM === null
              ? "—"
              : `${Math.round(cursorInfo.elevM)} m (${Math.round(
                  cursorInfo.elevM * 3.28084
                )} ft)`}
          </div>
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default Loc;
