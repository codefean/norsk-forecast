import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navigation.css";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <span className="menu-toggle" onClick={toggleMenu}>
        ☰
      </span>
      <ul className={isMenuOpen ? "open" : ""}>
        <li>
          <NavLink
            to="/weatherMap"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Map
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/About"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;

