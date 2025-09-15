import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About</h1>
      <div className="about-content">
        <p>
          <strong>Scandi Glacier Forecast</strong> is a lightweight, interactive
          platform designed to help you explore glaciers and their weather data
          across Scandinavia.  
        </p>

        <p>
          This website is currently in <strong>beta</strong> and serves as a
          concept to showcase how glacial data can be made more accessible and
          interactive.  
        </p>
        <p>
          Data and calculations around glacial temperatures, melt, and related
          processes — including the implemented{" "}
          <em>temperature-index glacier melt model with snowpack dynamics</em> to
          estimate runoff and mass balance — are still being tuned.  
          Any input or assistance is greatly appreciated. Please reach out to{" "}
          <a href="mailto:sfagan2@alaska.edu">sfagan2@alaska.edu</a>.
        </p>
        <p>
          This website was created by <strong>Sean Fagan</strong> between Sept 1
          – Sept 14, 2025 as a portfolio project. Sean is currently applying for
          PhD positions related to cryospheric climate impacts while doing work
          on glacial lake outburst floods at the University of Alaska.
        </p>
      </div>

      {/* Glacier Model Section */}
      <div className="about-content">
        <h2>Glacier Temperature Index Model</h2>
        <p>
          The glacier model is a <strong>beta-stage temperature-index (degree-day) snow–ice melt 
          and runoff model</strong>. It pulls weather data from the closest available station to the glacier and adjusts 
          temperature to glacier elevation using a lapse rate. Melt is calculated directly from temperature, while 
          precipitation (when available) is partitioned into snowfall and rainfall to update the snowpack and runoff.  
        </p>
        <p>
          If precipitation data is missing, the model can still run in a 
          <strong> temperature-only mode</strong>, which means melt is simulated but snow accumulation and rain-on-snow 
          events are not captured as realistically. Because it depends on station data that may be incomplete, the outputs are 
          <strong> not fully accurate and should be considered experimental</strong>, but the model is continuously being tuned 
          and improved.
        </p>

        {/* Math section */}
        <h3>Model Calculations</h3>
        <div className="about-math">
          <div data-tooltip="Station temperature adjusted to glacier elevation using lapse rate (-0.0065°C/m)">
            <strong>Corrected Temp:</strong> T<sub>glacier</sub> = T<sub>station</sub> + lapse × Δz
          </div>
          <div data-tooltip="Degree-day melt model. Melt = max(T - 0°C, 0) × DDF. Snow DDF = 3, Ice DDF = 7">
            <strong>Melt:</strong> max(T − 0 °C, 0) × DDF  
            <em> (3 mm w.e./°C/day for snow, 7 mm w.e./°C/day for ice)</em>
          </div>
          <div data-tooltip="Snow Water Equivalent (SWE). Snowpack from accumulated snowfall minus melt.">
            <strong>Snowpack (SWE):</strong> SWE<sub>t</sub> = SWE<sub>t−1</sub> + snowfall − melt
          </div>
          <div data-tooltip="Liquid water leaving the snowpack (melt + rain, minus refreeze)">
            <strong>Runoff:</strong> runoff = melt + rain − refreeze
          </div>
          <div data-tooltip="Rain-on-snow severity. 0% = none, 100% = high risk. Triggered if Temp > 0.5°C, precip > 5 mm, SWE > 20 mm">
            <strong>ROS Severity:</strong> triggered if T {'>'} 0.5 °C, P {'>'} 5 mm, SWE {'>'} 20 mm
          </div>
        </div>
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
          Norwegian Meteorological Institute (2025) — Frost API: Access to
          Norwegian meteorological and climatological data.{" "}
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
      </div>
    </div>
  );
};

export default About;
