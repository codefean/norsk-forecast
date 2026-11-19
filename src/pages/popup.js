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
    if (loading) return;
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
        <h2 id="scandi-popup-title">Norsk Landslide Map</h2>
        <p className="popup-subtitle">Landslide hazard explorer · Beta</p>

        <p className="popup-text">
          This map shows where landslides and rockfalls can reach in{" "}
          <strong>Møre og Romsdal</strong>: NVE hazard zones with an annual
          probability of 1/100, 1/1000 and 1/5000, together with registered
          landslide events.
        </p>

        <p className="popup-text">
          <strong>New:</strong> mark the places you depend on, such as a clinic,
          school, ferry quay or detour route, and see whether they sit inside a
          hazard zone. This is a prototype for participatory mapping of the
          everyday infrastructure that landslides can cut off.
        </p>

        <p className="popup-text small">
          Data: NVE Skredfaresoner (pre-2026 version) and NVE Skredhendelser.
          Read hazard zones together with NVE's reports; this map is not for
          planning decisions. Made by Sean Fagan.
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
            <strong>Explore the map</strong>
          </button>
        )}
      </div>
    </div>
  );
};

export default BetaPopup;
