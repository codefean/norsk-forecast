import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { placeMode } from "./placeMode";
import "./MarkPlaces.css";

const STORAGE_KEY = "norsk-landslide-places-v1";

export const CATEGORIES = [
  { id: "health", label: "Clinic / health", color: "#e41a1c" },
  { id: "school", label: "School / kindergarten", color: "#377eb8" },
  { id: "ferry", label: "Ferry quay", color: "#00a6a6" },
  { id: "route", label: "Alternative route", color: "#4daf4a" },
  { id: "supplies", label: "Shop / supplies", color: "#ff7f00" },
  { id: "other", label: "Other important place", color: "#984ea3" },
];

const HAZARD_LAYERS = [
  { id: "landslide_hazard_100", label: "1/100 hazard zone" },
  { id: "landslide_hazard_1000", label: "1/1000 hazard zone" },
  { id: "landslide_hazard_5000", label: "1/5000 hazard zone" },
];

const categoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const loadPlaces = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const savePlaces = (places) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch {
    // Storage can be unavailable (private mode); places then last for the session only.
  }
};

// Highest NVE hazard class drawn at this point, if any.
const hazardAt = (map, lngLat) => {
  const point = map.project(lngLat);
  const layers = HAZARD_LAYERS.filter((h) => map.getLayer(h.id)).map((h) => h.id);
  if (!layers.length) return null;
  const hits = map.queryRenderedFeatures(point, { layers });
  const match = HAZARD_LAYERS.find((h) => hits.some((f) => f.layer.id === h.id));
  return match ? match.label : null;
};

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);

const MarkPlaces = ({ mapRef, ready }) => {
  const [places, setPlaces] = useState(loadPlaces);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(true);
  const markersRef = useRef([]);

  useEffect(() => savePlaces(places), [places]);

  const removePlace = useCallback((id) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Redraw markers whenever the list changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = places.map((place) => {
      const cat = categoryById(place.category);
      const el = document.createElement("div");
      el.className = "place-pin";
      el.style.background = cat.color;
      el.title = cat.label;

      const body = document.createElement("div");
      body.className = "place-popup";
      body.innerHTML = `
        <strong style="color:${cat.color}">${cat.label}</strong>
        ${place.note ? `<p>${escapeHtml(place.note)}</p>` : ""}
        <p class="place-hazard">${
          place.hazard ? `Inside NVE ${place.hazard}` : "Outside mapped NVE hazard zones"
        }</p>
      `;
      const del = document.createElement("button");
      del.textContent = "Remove";
      del.className = "place-remove";
      del.onclick = () => removePlace(place.id);
      body.appendChild(del);

      return new mapboxgl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .setPopup(new mapboxgl.Popup({ offset: 14 }).setDOMContent(body))
        .addTo(map);
    });

    return () => markersRef.current.forEach((m) => m.remove());
  }, [places, mapRef, ready, removePlace]);

  // While adding, the next map click picks the location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !adding) return;

    placeMode.active = true;
    const canvas = map.getCanvas();
    canvas.style.cursor = "crosshair";

    const onClick = (e) => {
      setPending({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        hazard: hazardAt(map, e.lngLat),
      });
      setAdding(false);
    };
    map.once("click", onClick);

    return () => {
      map.off("click", onClick);
      canvas.style.cursor = "";
      // Let the click that placed the pin finish before re-enabling other popups.
      setTimeout(() => {
        placeMode.active = false;
      }, 0);
    };
  }, [adding, mapRef]);

  const startAdding = () => {
    setPending(null);
    setNote("");
    setAdding(true);
    setOpen(true);
  };

  const cancel = () => {
    setAdding(false);
    setPending(null);
  };

  const save = () => {
    if (!pending) return;
    setPlaces((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        ...pending,
        category,
        note: note.trim().slice(0, 200),
        created: new Date().toISOString(),
      },
    ]);
    setPending(null);
    setNote("");
  };

  const download = () => {
    const geojson = {
      type: "FeatureCollection",
      features: places.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          category: categoryById(p.category).label,
          note: p.note,
          nve_hazard: p.hazard || "none",
          created: p.created,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-important-places.geojson";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (window.confirm("Remove all places you have marked in this browser?")) {
      setPlaces([]);
    }
  };

  const inHazard = places.filter((p) => p.hazard).length;

  return (
    <div className={`mark-places ${open ? "" : "collapsed"}`}>
      <button className="mark-places-header" onClick={() => setOpen(!open)}>
        <span>Mark places you depend on</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mark-places-body">
          <p className="mark-places-intro">
            Which places would you lose access to if a landslide closed the road?
            Mark them on the map.
          </p>

          {!adding && !pending && (
            <button className="mark-places-primary" onClick={startAdding}>
              + Mark a place
            </button>
          )}

          {adding && (
            <div className="mark-places-hint">
              Click on the map to place a pin.
              <button className="mark-places-link" onClick={cancel}>
                Cancel
              </button>
            </div>
          )}

          {pending && (
            <div className="mark-places-form">
              <div className="mark-places-cats">
                {CATEGORIES.map((c) => (
                  <label key={c.id} className={category === c.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="place-category"
                      value={c.id}
                      checked={category === c.id}
                      onChange={() => setCategory(c.id)}
                    />
                    <span className="swatch" style={{ background: c.color }} />
                    {c.label}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="Name or note (optional)"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="place-hazard">
                {pending.hazard
                  ? `This spot is inside the NVE ${pending.hazard}.`
                  : "This spot is outside mapped NVE hazard zones."}
              </p>
              <div className="mark-places-actions">
                <button className="mark-places-primary" onClick={save}>
                  Save
                </button>
                <button className="mark-places-link" onClick={cancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {places.length > 0 && (
            <div className="mark-places-summary">
              <p>
                {places.length} {places.length === 1 ? "place" : "places"} marked
                {inHazard > 0 && `, ${inHazard} inside a hazard zone`}.
              </p>
              <div className="mark-places-actions">
                <button className="mark-places-link" onClick={download}>
                  Download (GeoJSON)
                </button>
                <button className="mark-places-link" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            </div>
          )}

          <p className="mark-places-note">
            Prototype for participatory mapping. Pins are saved only in this
            browser and are not sent anywhere.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarkPlaces;
