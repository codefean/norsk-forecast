import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import LandslideMap from "./pages/weatherMap";
import About from "./pages/About";
import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

const useDocumentTitle = (title) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
};

const MapPage = () => {
  useDocumentTitle("Norsk Landslide Map – Landslide hazard explorer");
  return <LandslideMap />;
};

const AboutPage = () => {
  useDocumentTitle("About · Norsk Landslide Map");
  return <About />;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/norsk-forecast" element={<MapPage />} />
            <Route path="/weatherMap" element={<MapPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<MapPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
