import React, { useEffect, useState } from "react";
import "./popup.css";

const BetaPopup = ({ autoClose = false, autoCloseDelay = 8000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => setVisible(false), autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, visible]);

  if (!visible) return null;

  return (
    <div
      className="scandi-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scandi-popup-title"
    >
      <div className="scandi-popup-box">
        <h2 id="scandi-popup-title">Scandi Glacier Forecast (Beta)</h2>

        <p className="popup-text">
          <strong>Scandi Glacier Forecast</strong> is a lightweight, interactive
          platform for exploring glaciers and weather data across Scandinavia.
        </p>

        <p className="popup-text">
          This website is currently in <strong>beta</strong> and serves as a
          concept to show how glacial data can be made more accessible and
          interactive. Data and calculations — including the implemented{" "}
          <em>temperature-index glacier melt model with snowpack dynamics</em> —
          are still being tuned.
        </p>

        <p className="popup-text">
          Any input or assistance is appreciated. Contact:{" "}
          <a href="mailto:sfagan2@alaska.edu">sfagan2@alaska.edu</a>.
        </p>

        <p className="popup-text small">
          Created by <strong>Sean Fagan</strong>, Sept 1–14, 2025, as a portfolio
          project. Sean is applying for PhD positions on cryospheric climate
          impacts while researching glacial lake outburst floods at the
          University of Alaska.
        </p>

        <button
          className="scandi-popup-close-button"
          onClick={() => setVisible(false)}
        >
          <strong>OK</strong>
        </button>
      </div>
    </div>
  );
};

export default BetaPopup;
