import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About</h1>
      <div className="about-content">
        <p>
          <strong>Norsk Landslide Map</strong> is a lightweight, interactive
          platform for exploring landslide hazard in Norway. It shows NVE hazard
          zones and registered landslide events, and lets visitors mark the
          places they depend on, such as clinics, schools, ferry quays and detour
          routes, to see which of them sit inside a hazard zone.  
        </p>

        <p>
          This website is currently in <strong>beta</strong> and covers Møre og
          Romsdal. It is a concept for making hazard data more accessible, and a
          prototype for participatory mapping: combining official hazard maps
          with local knowledge of which roads, services and places communities
          cannot do without. Marked places are stored only in your own browser.
        </p>
        <p>
          Hazard zones come from the NVE Skredfaresoner dataset (pre-2026
          version), which NVE has since replaced with "Faresonekart for skred i
          bratt terreng". Hazard zones should be read together with NVE's
          reports, and this map is not suitable for planning decisions.
        </p>
        <p> 
          Any input or assistance is greatly appreciated. Please reach out to{" "}
          <a href="mailto:sean.fagan@su.se">sean.fagan@su.se</a>.
        </p>
        <p>
          This website was created by <strong>Sean Fagan</strong> as a portfolio project. Sean is currently applying for
          PhD positions while doing work on glacial lake outburst floods at the University of Alaska and researching social-ecological 
          regime shifts at Stockholm Resilience Centre. 
        </p>
      </div>


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
          Kartverket / Statens vegvesen — Vegnett2 WMS (road network from the
          National Road Database, NVDB).{" "}
          <a
            href="https://kartkatalog.geonorge.no/metadata/vegnett2-wms/302fcb0e-a7dc-44f4-a336-8c9ee9709d73"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geonorge
          </a>
        </div>
        <div>
          Inneheld data under Norsk lisens for offentlige data (NLOD) gjort
          tilgjengeleg av Bane NOR SF — Jernbane - Banenettverk.
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
