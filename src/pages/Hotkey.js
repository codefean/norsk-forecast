import React from "react";
import "./Hotkey.css";

const Hotkey = ({ resetZoom }) => {
  return (
    <div className="hotkey-table">
      <table>
        <tbody>
          <tr>
            <td><strong>R</strong></td>
            <td>
              <button className="hotkey-btn" onClick={resetZoom}>
                Reset Zoom
              </button>
            </td>
          </tr>
          <tr>
            <td><strong>+</strong></td>
            <td>Zoom in</td>
          </tr>
          <tr>
            <td><strong>-</strong></td>
            <td>Zoom out</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Hotkey;
