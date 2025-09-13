import React from "react";
import "./About.css";

const About= () => {
  return (
    <>
      {/* About Container */}
      <div className="research-team-container">
        <h2 className="team-title">About This Website</h2>
        <h3 className="research-subheading">Glaciers of Scandinavia</h3>

        <div className="about-research-card">
          <h3>Exploring Glaciers and Weather in Scandinavia</h3>
          <p>
            This website is dedicated to documenting and sharing information
            about the glaciers of Scandinavia, including Norway, Sweden, and
            Iceland. These glaciers are not only stunning natural wonders, but
            also important indicators of climate change. As temperatures rise,
            the glaciers retreat, reshaping landscapes and impacting local
            ecosystems and communities.
          </p>
          <p>
            Here you will find accessible information about major Scandinavian
            glaciers, their size, location, and historical changes. We also
            highlight daily and seasonal weather patterns that influence glacier
            melt and growth, connecting the science of climate and ice to
            everyday experiences.
          </p>
        </div>

        <div className="about-research-card">
          <h3>Why Focus on Scandinavia?</h3>
          <p>
            Scandinavia is home to some of the largest glaciers in Europe,
            including Jostedalsbreen in Norway and Vatnajökull in Iceland. These
            glaciers are central to the region’s geography, culture, and natural
            beauty. Understanding how they respond to weather and long-term
            climate trends is critical for predicting future changes in sea
            levels, water resources, and natural hazards.
          </p>
        </div>
      </div>

      {/* Sources section */}
      <div className="funding-sources">
        <h3>Sources and Inspiration</h3>
        <ul>
          <li>
            <a
              href="https://www.nve.no/hydrology/glaciers/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Norwegian Water Resources and Energy Directorate (NVE) – Glacier Monitoring
            </a>
          </li>
          <li>
            <a
              href="https://en.vedur.is/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Icelandic Meteorological Office – Weather and Climate Data
            </a>
          </li>
          <li>
            <a
              href="https://www.smhi.se/en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Swedish Meteorological and Hydrological Institute (SMHI)
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default About;
