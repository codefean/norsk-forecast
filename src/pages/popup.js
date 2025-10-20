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
        <h2 id="scandi-popup-title">Norsk Landslide Forecast</h2>
        <p className="popup-text">
          En interaktiv plattform som formidler informasjon om steinskred- og jordskredrisiko i Norge.
          Dette nettstedet er for øyeblikket i <strong>beta</strong> og viser kun data fra Møre og Romsdal-regionen. 
          Det fungerer som et konsept for å gjøre skredrisikodata mer tilgjengelige og interaktive.
        </p>

        <p className="popup-text small">
          Laget av <strong>Sean Fagan</strong>, som et porteføljeprosjekt for PhD-søknader. 
          Nettstedet er fortsatt under utvikling og forbedres fortløpende. Dataene er hentet fra NVE.
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
