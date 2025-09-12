import React, { forwardRef } from "react";
import "./PitchControl.css";

const PitchControl = forwardRef(
  ({ mapRef, value, onChange, min = 10, max = 70, step = 1 }, ref) => {
    const handlePitchChange = (e) => {
      const newPitch = parseInt(e.target.value, 10);
      if (mapRef.current) mapRef.current.setPitch(newPitch);
      if (onChange) onChange(newPitch); // tell parent to update its pitch state
    };

    return (
      <div ref={ref} className="pitch-control">
        <label htmlFor="pitch-slider">3D</label>
        <input
          id="pitch-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.round(Number(value) || 0)} // CONTROLLED value
          onChange={handlePitchChange}
        />
      </div>
    );
  }
);

export default PitchControl;
