import React from "react";
import "./citation.css";

const Citation = ({ stylePos }) => {
  return (
    <div className="citation-readout" style={stylePos}>
      <div className="citation-entry">
        HELCOM (2020). <em>Baltic Sea Eutrophication Assessment 2017–2021.</em> 
        Baltic Sea Environment Proceedings No. 164.
      </div>

      <div className="citation-entry">
        Website created by Sean Fagan (2025)
      </div>
    </div>
  );
};

export default Citation;
