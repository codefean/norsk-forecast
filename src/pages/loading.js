import React, { useEffect, useState } from "react";
import "./loading.css";

const LoadingOverlay = ({ progress, logMessages, title = "Loading Data...", loading }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFadeOut(true);
    }
  }, [loading]);

  return (
    <div className={`loading-overlay ${fadeOut ? "fade-out" : ""}`}>
      {/* Title */}
      <h2 className="loading-title">{title}</h2>

      {/* Spinner */}
      <div className="loading-spinner"></div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Log Messages */}
      <div className="log-messages">
        {logMessages.length > 0 ? (
          logMessages.map((msg, idx) => (
            <div key={idx} className="log-message">
              {msg}
            </div>
          ))
        ) : (
          <div className="log-message">Initializing…</div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
