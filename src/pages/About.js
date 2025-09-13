import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About</h1>
      <div className="about-content">
        <p>
          <strong>Scandi Glacier Forecast</strong> is a lightweight, interactive
          platform designed to help you explore glacier and weather patterns
          across Scandinavia.  
        </p>
        <p>
          Our goal is to make complex environmental data simple, visual, and
          accessible — whether you’re a researcher, an outdoor enthusiast, or
          just curious about how climate shapes the region.
        </p>
        <p>
          With live mapping tools, forecasts, and clean design, we aim to give
          you insights into the changing Arctic landscape.
        </p>
      </div>
    </div>
  );
};

export default About;
