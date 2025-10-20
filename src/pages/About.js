import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About</h1>
      <div className="about-content">
        <p>
          <strong>Norsk Landslide Forecast</strong> is a lightweight, interactive
          platform designed to help you explore landslide and glacial hazards
          across Norway.  
        </p>

        <p>
          This website is currently in <strong>beta</strong> and serves as a
          concept to showcase how rock avalanche, landslide, and glacial data can be made more accessible and
          interactive.  
        </p>
        <p> 
          Any input or assistance is greatly appreciated. Please reach out to{" "}
          <a href="mailto:sfagan2@alaska.edu">sfagan2@alaska.edu</a>.
        </p>
        <p>
          This website was created by <strong>Sean Fagan</strong> between Oct 19
          – Oct 21st, 2025 as a portfolio project. Sean is currently applying for
          PhD positions related to hazards and climate change while doing work
          on glacial lake outburst floods at the University of Alaska.
        </p>
      </div>


      {/* Citations Section */}
      <div className="about-citations">
        <h2>Citations</h2>
        <div>
          Andreassen LM, Nagy T, Kjøllmoen B, Leigh JR (2022) — An inventory of
          Norway’s glaciers and ice-marginal lakes from 2018–19 Sentinel-2 data.
          <i> Journal of Glaciology</i>, 68(272), 1085–1106.
          doi:10.1017/jog.2022.20
        </div>
        <div>
          RGI Consortium (2023) — Randolph Glacier Inventory (RGI) – A dataset of
          global glacier outlines, version 7.0. <i>Technical Report</i>.{" "}
          <a
            href="https://www.glims.org/RGI/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.glims.org/RGI/
          </a>
        </div>
        <div>
          Norwegian Meteorological Institute (2025){" "}
          <a
            href="https://frost.met.no/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://frost.met.no/
          </a>
        </div>
        <div>
          Norwegian Water Resources and Energy Directorate (NVE) (2025) — Glacial
          lake outburst flood (GLOF) page.{" "}
          <a
            href="https://glacier.nve.no/Glacier/viewer/GLOF/en/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://glacier.nve.no/Glacier/viewer/GLOF/en/
          </a>
        </div>
                <div>
          Norwegian Water Resources and Energy Directorate (NVE) (2025) — Map Services{" "}
          <a
            href="http://nve.no/map-services/"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://nve.no/map-services/
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
