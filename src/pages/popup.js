import React, { useEffect, useState } from "react";
import "./popup.css";

const BetaPopup = ({ autoClose = false, autoCloseDelay = 8000 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if the popup was already dismissed
    const dismissed = localStorage.getItem("betaPopupDismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => handleClose(), autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, visible]);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem("betaPopupDismissed", "true"); // Remember dismissal
  };

  if (!visible) return null;

  return (
    <div
      className="scandi-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scandi-popup-title"
    >
      <div className="scandi-popup-box">
        <h2 id="scandi-popup-title">Scandi Glacier Forecast</h2>

        <p className="popup-text">
          An interactive platform
          for exploring glaciers and glacial lakes across Scandinavia. 
          <strong> Click on glaciers</strong> to see their predicted weather
          data and explore nearby glacial lakes.
        </p>

        <p className="popup-text">
          Weather data is pulled from Norwegian Meteorological Institute
          stations located within 12&nbsp;km of each glacier. A{" "}
          <em>temperature-index glacier melt model with temperature adjustments</em>{" "}
          then predicts melt rates and near-surface glacier temperatures.
        </p>

        <p className="popup-text">
          This website is currently in <strong>beta</strong> and serves as a
          concept for making cryospheric data more accessible and interactive.
          The models and calculations are still being refined.
        </p>

        <p className="popup-text small">
          Created by <strong>Sean Fagan</strong>, Sept 1–14, 2025, as a portfolio
          project for PhD applications.
        </p>

        <button
          className="scandi-popup-close-button"
          onClick={handleClose}
        >
          <strong>OK</strong>
        </button>
      </div>
    </div>
  );
};

export default BetaPopup;
