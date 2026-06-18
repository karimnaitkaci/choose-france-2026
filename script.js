// État global
let allProjects = [];
let filteredProjects = [];
let map;
let markers = {};
let markerCluster = {};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les données
    allProjects = await loadProjects();
    filteredProjects = [...allProjects];

    // Initialiser la carte
    initMap();

    // Populer les filtres
    populateFilters();

    // Configurer les écouteurs d'événements
    setupEventListeners();

    // Afficher les données initiales
    updateDisplay();
});

// Charger les projets depuis JSON
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        return [];
    }
}

// Initialiser la carte Leaflet
function initMap() {
    // Créer la carte centrée sur la France
    map = L.map('map').setView([46.5, 2.5], 6);

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Ajouter les marqueurs
    updateMarkers();
}

// Populer les listes déroulantes de filtres
function populateFilters() {
    const sectors = [...new Set(allProjects.map(p => p.sector))].filter(Boolean).sort();
    const regions = [...new Set(allProjects.map(p => p.region))].filter(Boolean).sort();

    const sectorSelect = document.getElementById('sector-filter');
    const regionSelect = document.getElementById('region-filter');

    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorSelect.appendChild(option);
    });

    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
    document.getElementById('sector-filter').addEventListener('change', applyFilters);
    document.getElementById('region-filter').addEventListener('change', applyFilters);
    document.getElementById('capex-filter').addEventListener('input', updateCapexDisplay);
    document.getElementById('capex-filter').addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Modal
    const modal = document.getElementById('project-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Mettre à jour l'affichage du CAPEX
function updateCapexDisplay() {
    const value = document.getElementById('capex-filter').value;
    document.getElementById('capex-value').textContent = value;
}

// Appliquer les filtres
function applyFilters() {
    const sector = document.getElementById('sector-filter').value;
    const region = document.getElementById('region-filter').value;
    const capexMin = parseFloat(document.getElementById('capex-filter').value);

    filteredProjects = allProjects.filter(project => {
        const sectorMatch = !sector || project.sector === sector;
        const regionMatch = !region || project.region === region;
        const capexMatch = project.capex >= capexMin;

        return sectorMatch && regionMatch && capexMatch;
    });

    updateDisplay();
}

// Réinitialiser les filtres
function resetFilters() {
    document.getElementById('sector-filter').value = '';
    document.getElementById('region-filter').value = '';
    document.getElementById('capex-filter').value = '0';
    document.getElementById('capex-value').textContent = '0';

    filteredProjects = [...allProjects];
    updateDisplay();
}

// Mettre à jour l'affichage
function updateDisplay() {
    updateMarkers();
    updateStatistics();
    updateProjectsList();
}

// Mettre à jour les marqueurs sur la carte
function updateMarkers() {
    // Supprimer les anciens marqueurs
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    // Ajouter les nouveaux marqueurs
    filteredProjects.forEach(project => {
        const marker = L.circleMarker([project.lat, project.lng], {
            radius: 8,
            fillColor: getColorByCapex(project.capex),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        marker.bindPopup(createPopupContent(project));

        marker.on('click', () => {
            showProjectModal(project);
        });

        markers[project.id] = marker;
        map.addLayer(marker);
    });
}

// Obtenir la couleur en fonction du CAPEX
function getColorByCapex(capex) {
    if (capex >= 50) return '#d32f2f';
    if (capex >= 20) return '#f57c00';
    if (capex >= 10) return '#fbc02d';
    return '#558b2f';
}

// Créer le contenu de la popup
function createPopupContent(project) {
    const div = document.createElement('div');
    div.className = 'popup-content';

    div.innerHTML = `
        <div class="popup-client">${project.client}</div>
        <div class="popup-section">
            <span class="popup-section-label">Localisation:</span>
            <span class="popup-section-value">${project.location}</span>
        </div>
        <div class="popup-section">
            <span class="popup-section-label">Région:</span>
            <span class="popup-section-value">${project.region}</span>
        </div>
        <div class="popup-section">
            <span class="popup-section-label">Secteur:</span>
            <span class="popup-section-value">${project.sector}</span>
        </div>
        <div class="popup-section">
            <span class="popup-section-label">CAPEX:</span>
            <span class="popup-section-value">${project.capex_display}</span>
        </div>
        <div class="popup-description">
            ${project.description}
        </div>
    `;

    return div;
}

// Afficher le modal du projet
function showProjectModal(project) {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <h2>${project.client}</h2>
        <div class="detail-section">
            <div class="detail-label">Secteur</div>
            <div class="detail-value">${project.sector}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Localisation</div>
            <div class="detail-value">${project.location}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Région</div>
            <div class="detail-value">${project.region}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Nationalité du client</div>
            <div class="detail-value">${project.citizenship}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">CAPEX</div>
            <div class="detail-value">${project.capex_display}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Description du projet</div>
            <div class="detail-value">${project.description}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Projets existants en France</div>
            <div class="detail-value">${project.existing}</div>
        </div>
    `;

    modal.classList.add('show');
}

// Mettre à jour les statistiques
function updateStatistics() {
    const projectsCount = filteredProjects.length;
    const capexTotal = filteredProjects.reduce((sum, p) => sum + p.capex, 0).toFixed(1);
    const regionsCount = new Set(filteredProjects.map(p => p.region)).size;

    document.getElementById('projects-count').textContent = projectsCount;
    document.getElementById('capex-total').textContent = capexTotal;
    document.getElementById('regions-count').textContent = regionsCount;
}

// Mettre à jour la liste des projets
function updateProjectsList() {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '';

    filteredProjects
        .sort((a, b) => b.capex - a.capex)
        .forEach(project => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.innerHTML = `
                <div class="client">${project.client}</div>
                <div class="location">📍 ${project.location}</div>
                <div class="capex">${project.capex_display}</div>
            `;

            item.addEventListener('click', () => {
                showProjectModal(project);
                // Centrer la carte sur le marqueur
                const marker = markers[project.id];
                if (marker) {
                    map.setView([project.lat, project.lng], 10);
                }
            });

            projectsList.appendChild(item);
        });
}
