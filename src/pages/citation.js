import React from "react";
import "./citation.css";

const Citation = ({ stylePos }) => {
  return (
    <div className="citation-readout" style={stylePos}>
      <div>
        Andreassen LM, Nagy T, Kjøllmoen B, Leigh JR (2022)
      </div>
      <div>
        RGI Consortium (2023) — Randolph Glacier Inventory v7.0.{" "}
      </div>
      <div>
        Norwegian Meteorological Institute (2025) — Frost API.{" "}
      </div>
      <div>
        Norwegian Water Resources and Energy Directorate (NVE) (2025){" "}
      </div>
            <div>
        Website Created by Sean Fagan (2025){" "}
      </div>
    </div>
  );
};

export default Citation;
