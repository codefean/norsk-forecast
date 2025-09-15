import React, { useEffect, useState } from "react";
import "./popup.css";
import "./loading.css";

const BetaPopup = ({ loading, progress, title }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show popup if still loading (skip if cached data loads instantly)
    if (loading) {
      setVisible(true);
    }
  }, [loading]);

  const handleClose = () => {
    if (loading) return; // block until finished
    setVisible(false);
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
          An interactive platform for exploring glaciers and glacial lakes across
          Scandinavia. <strong>Click on glaciers</strong> to see their predicted
          weather data and explore nearby glacial lakes.
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
          Created by <strong>Sean Fagan</strong>, in September 2025, as a
          portfolio project for PhD applications.
        </p>

        {/* Loading area */}
        {loading ? (
          <>
            <h3 className="loading-title">{title}</h3>
            <div className="progress-percent">{progress}%</div>
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <button
            className="scandi-popup-close-button"
            onClick={handleClose}
          >
            <strong>OK</strong>
          </button>
        )}
      </div>
    </div>
  );
};

export default BetaPopup;
