// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
  useDocumentTitle("Glacier Map");
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
           <Route path="/scandi-forecast" element={<WeatherMapPage />} />
            <Route path="/weatherMap" element={<WeatherMapPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
