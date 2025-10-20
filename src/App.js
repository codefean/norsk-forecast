// src/App.js
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import WeatherMap from "./pages/weatherMap";
import About from "./pages/About";
import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

// Custom hook for setting the document title
const useDocumentTitle = (title) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
};

// Page wrappers to handle title updates
const WeatherMapPage = () => {
  useDocumentTitle("Norsk Landslide Forecast");
  return <WeatherMap />;
};

const AboutPage = () => {
  useDocumentTitle("About");
  return <About />;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Default home route */}
            <Route path="/" element={<WeatherMapPage />} />
            <Route path="/norsk-forecast" element={<WeatherMapPage />} />
            <Route path="/weatherMap" element={<WeatherMapPage />} />
            <Route path="/about" element={<AboutPage />} />
            {/* Fallback for 404 */}
            <Route path="*" element={<WeatherMapPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
