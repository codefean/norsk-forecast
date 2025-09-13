import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      {/* Footer Logos */}
      <div className="footer-logos">
        <a
          href="https://www.iarc.uaf.edu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/IARC.png`}
            alt="IARC Logo"
            className="footer-logo"
          />
        </a>

        <a
          href="https://uas.alaska.edu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/UAS.png`}
            alt="University of Alaska Southeast Logo"
            className="footer-logo"
          />
        </a>

        <a
          href="https://usgs.gov/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/USGS.png`}
            alt="USGS Logo"
            className="footer-logo"
          />
        </a>

        <a
          href="https://nsf.gov/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/NSF.png`}
            alt="National Science Foundation Logo"
            className="footer-logo"
          />
        </a>

        <a
          href="https://cmu.edu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/CMU.png`}
            alt="Carnegie Mellon University Logo"
            className="footer-logo"
          />
        </a>

        <a
          href="https://akcasc.gov/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.PUBLIC_URL}/ACASC2.png`}
            alt="Alaska Climate Adaptation Science Center Logo"
            className="footer-logo"
          />
        </a>
      </div>

      {/* Footer Text */}
      <p>
        The{" "}
        <a
          href="https://www.alaska.edu/alaska"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>University of Alaska</strong>
        </a>{" "}
        is an Equal Opportunity/Equal Access Employer and Educational Institution.
      </p>
      <p>
        The University is committed to a{" "}
        <a
          href="https://www.alaska.edu/nondiscrimination"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>policy of nondiscrimination</strong>
        </a>{" "}
        against individuals on the basis of any legally protected status.
      </p>
      <p>
        UA is committed to providing accessible websites.{" "}
        <a
          href="https://www.alaska.edu/webaccessibility"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>Learn more about UA’s notice of web accessibility.</strong>
        </a>
      </p>
    </footer>
  );
};

export default Footer;
