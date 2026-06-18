import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import './App.css';

const SECTORS = {
  'Data Center': '#0c2340',
  'Industrial': '#4a7b99',
  'Environment': '#2d7a3e',
  'Life Sciences': '#4db8a8',
  'Logistique': '#5a7a8a',
  'Real Estate': '#a08968',
  'Other': '#888888'
};

const DATA = [
  { name: 'Dunkerque', lat: 51.0344, lng: 2.3756, capex: 75, client: 'SoftBank', sector: 'Data Center', existing: true },
  { name: 'Cambrai', lat: 50.1769, lng: 3.2258, capex: 30, client: 'Brookfield', sector: 'Data Center', existing: true },
  { name: 'Béthune', lat: 50.5306, lng: 2.6448, capex: 8, client: 'Nebius', sector: 'Data Center', existing: true },
  { name: 'Fouju', lat: 48.6036, lng: 2.2231, capex: 7.5, client: 'MGX / Bpifrance', sector: 'Data Center', existing: true },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, capex: 3.1, client: 'Salesforce', sector: 'Real Estate', existing: true },
  { name: 'Île-de-France', lat: 48.8, lng: 2.3, capex: 5.3, client: 'Verne / Ardian', sector: 'Data Center', existing: false },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357, capex: 4.2, client: 'Phoenix Group', sector: 'Data Center', existing: false },
  { name: 'Grenoble', lat: 45.1885, lng: 5.7245, capex: 0.55, client: 'HPE', sector: 'Data Center', existing: true },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442, capex: 0.4, client: 'Venturi Space', sector: 'Industrial', existing: true },
  { name: 'Fos-sur-Mer', lat: 43.4481, lng: 4.9394, capex: 0.7, client: 'Marcegaglia', sector: 'Industrial', existing: false },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5795, capex: 0.25, client: 'Tessalia', sector: 'Industrial', existing: false },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698, capex: 0.2, client: 'Workday', sector: 'Other', existing: true },
  { name: 'Angers', lat: 47.4711, lng: -0.5541, capex: 0.19, client: 'Foxconn / Bull', sector: 'Industrial', existing: true },
  { name: 'Lacq', lat: 43.3625, lng: -0.6667, capex: 0.175, client: 'USA Rare Earth', sector: 'Industrial', existing: false },
  { name: 'Colmar', lat: 48.0735, lng: 7.3597, capex: 0.09, client: 'Liebherr', sector: 'Industrial', existing: true },
];

function App() {
  const [activeSectors, setActiveSectors] = useState(new Set(Object.keys(SECTORS)));
  const [selectedProject, setSelectedProject] = useState(null);
  const mapRef = useRef();

  const filtered = DATA.filter(p => activeSectors.has(p.sector));
  const totalCapex = filtered.reduce((sum, p) => sum + p.capex, 0);

  const toggleSector = (sector) => {
    const newSet = new Set(activeSectors);
    if (newSet.has(sector)) {
      newSet.delete(sector);
    } else {
      newSet.add(sector);
    }
    setActiveSectors(newSet);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="header">
          <h1>Choose France 2026</h1>
          <p>Investissements étrangers annoncés</p>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">CAPEX AFFICHÉ</span>
            <span className="stat-value">{totalCapex.toFixed(1)} Md€</span>
          </div>
          <div className="stat">
            <span className="stat-label">PROJETS</span>
            <span className="stat-value">{filtered.length}</span>
          </div>
        </div>

        <div className="filters">
          <div className="filters-title">Filtrer par secteur</div>
          {Object.entries(SECTORS).map(([sector, color]) => (
            <button
              key={sector}
              className={`filter-btn ${activeSectors.has(sector) ? 'active' : ''}`}
              style={{ '--color': color }}
              onClick={() => toggleSector(sector)}
            >
              <span className="dot" style={{ backgroundColor: color }}></span>
              {sector}
            </button>
          ))}
        </div>

        <div className="projects-list">
          <div className="list-title">Projets ({filtered.length})</div>
          {filtered.map((p, i) => (
            <div
              key={i}
              className={`project-item ${selectedProject?.name === p.name ? 'selected' : ''}`}
              onClick={() => handleProjectClick(p)}
            >
              <div className="project-dot" style={{ backgroundColor: SECTORS[p.sector] }}></div>
              <div className="project-info">
                <div className="project-name">{p.name}</div>
                <div className="project-client">{p.client}</div>
              </div>
              <div className="project-capex">{p.capex.toFixed(1)}M€</div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          Cartographie par <b>Karim Nait-Kaci</b> pour Turner & Townsend
          <br />
          <a href="mailto:kmnaitkaci@gmail.com">kmnaitkaci@gmail.com</a>
        </div>
      </div>

      <div className="map-container">
        <MapContainer center={[46.5, 2.5]} zoom={5} ref={mapRef}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
          />

          {filtered.map((project, i) => (
            <CircleMarker
              key={i}
              center={[project.lat, project.lng]}
              radius={Math.sqrt(project.capex) * 4}
              fillColor={SECTORS[project.sector]}
              color={SECTORS[project.sector]}
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
              eventHandlers={{
                click: () => handleProjectClick(project)
              }}
            >
              <Popup>
                <div className="popup">
                  <div className="popup-title">{project.name}</div>
                  <div className="popup-client">{project.client}</div>
                  <div className="popup-capex">{project.capex.toFixed(1)} Md€</div>
                  <div className="popup-existing">
                    {project.existing ? '✓ Existant en France' : '✗ Nouveau'}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {selectedProject && (
          <div className="details-panel">
            <button className="close-btn" onClick={() => setSelectedProject(null)}>✕</button>
            <div className="details-title">{selectedProject.name}</div>
            <div className="details-client">{selectedProject.client}</div>
            <div className="details-capex">{selectedProject.capex.toFixed(1)} Md€</div>
            <div className="details-sector">{selectedProject.sector}</div>
            <div className="details-existing">
              {selectedProject.existing ? '✓ Existant en France' : '✗ Nouveau en France'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
