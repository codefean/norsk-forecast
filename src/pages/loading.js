// loading.js
import React from "react";
import "./loading.css";

const LoadingOverlay = ({ progress, logMessages }) => {
  return (
    <div className="loading-overlay">
      <h2 className="loading-title">🔄 Loading Glacier & Ski Data...</h2>

      {/* Progress Bar */}
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Progress Percentage */}
      <p className="progress-percent">{progress}% Complete</p>

      {/* Log Messages */}
      <div className="log-messages">
        {logMessages.map((msg, idx) => (
          <div key={idx} className="log-message">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingOverlay;
