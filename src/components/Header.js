import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      {/* Mobile hamburger */}
      <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>

      {/* Nav links */}
      <nav className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        <NavLink to="/weatherMap" className={({ isActive }) => (isActive ? "active-link" : "")}>
          Map
        </NavLink>
        <NavLink to="/About" className={({ isActive }) => (isActive ? "active-link" : "")}>
          About
        </NavLink>
      </nav>

      {/* Title in center */}
      <div className="header-title">
        <h1>Scandi Glacier Forecast</h1>
      </div>
    </header>
  );
};

export default Header;
