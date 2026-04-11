/* ─────────────────────────────────────────────
   app.js — Spearfishing map
   Layers loaded from KML files via Leaflet Omnivore.
   Add your KML files to the same folder and update
   the paths in the LAYER CONFIG section below.
───────────────────────────────────────────── */

// ── LAYER CONFIG ──────────────────────────────
// Update these paths when you add your KML files.
const LAYER_CONFIG = {
  sitios: {
    file:  'kml/sitios.kml',
    color: '#5baaff',
    label: 'Sitio de pesca',
    icon:  '🤿',
  },
  parking: {
    file:  'kml/parking.kml',
    color: '#62f0cf',
    label: 'Aparcamiento',
    icon:  '🅿️',
  },
  fotos: {
    file:  'kml/fotos.kml',
    color: '#f0b962',
    label: 'Foto',
    icon:  '📷',
  },
  entrada: {
    file:  'kml/entrada.kml',
    color: '#f06262',
    label: 'Punto de entrada',
    icon:  '🚩',
  },
};

// ── MAP INIT ──────────────────────────────────
const map = L.map('map', {
  center: [43.4, -3.0],   // Default: Cantabrian coast — will auto-fit once KMLs load
  zoom: 10,
  zoomControl: true,
  attributionControl: true,
});

// Base tile layer — dark style matching the UI
// ── BASEMAP DEFINITIONS ───────────────────────
const BASEMAPS = {
  light: {
    label: 'Claro',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/6/24/31',
    layer: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20,
    }),
  },
  osm: {
    label: 'Mapa',
    thumb: 'https://tile.openstreetmap.org/6/31/24.png',
    layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abc', maxZoom: 20,
    }),
  },
  ortho: {
    label: 'Satélite',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/31',
    layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
      maxZoom: 20,
    }),
  },
};

let activeBasemap = 'light';
BASEMAPS.light.layer.addTo(map);

// ── CUSTOM LEAFLET CONTROL ─────────────────────
const BasemapControl = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd() {
    const container = L.DomUtil.create('div', 'basemap-control leaflet-bar');
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    Object.entries(BASEMAPS).forEach(([key, bm]) => {
      const btn = L.DomUtil.create('button', key === activeBasemap ? 'active' : '', container);
      btn.dataset.key = key;

      const thumb = L.DomUtil.create('span', 'bm-thumb', btn);
      const img = L.DomUtil.create('img', '', thumb);
      img.src = bm.thumb;
      img.alt = bm.label;

      const label = L.DomUtil.create('span', 'bm-label', btn);
      label.textContent = bm.label;

      L.DomEvent.on(btn, 'click', () => {
        if (key === activeBasemap) return;
        map.removeLayer(BASEMAPS[activeBasemap].layer);
        BASEMAPS[key].layer.addTo(map);
        // Keep KML layers on top
        Object.values(leafletLayers).forEach(l => l && l.bringToFront && l.bringToFront());
        activeBasemap = key;
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    return container;
  },
});

new BasemapControl().addTo(map);

// ── CUSTOM MARKER ICON ────────────────────────
function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z"
      fill="${color}" fill-opacity="0.92"/>
    <circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  });
}

// ── LAYER MANAGEMENT ──────────────────────────
const leafletLayers = {};
const bounds = L.latLngBounds();
let loadedCount = 0;
const totalLayers = Object.keys(LAYER_CONFIG).length;

function onFeatureClick(e, cfg) {
  const props = e.layer.feature?.properties || {};
  const name  = props.name        || props.Name        || '(sin nombre)';
  const desc  = props.description || props.Description || '';

  // Update sidebar info panel
  document.getElementById('info-empty').style.display   = 'none';
  const content = document.getElementById('info-content');
  content.style.display = 'block';
  content.style.animation = 'none';
  void content.offsetWidth; // reflow to restart animation
  content.style.animation = '';

  document.getElementById('info-tag').innerHTML  = `<span style="color:${cfg.color}">${cfg.icon}</span> ${cfg.label}`;
  document.getElementById('info-name').textContent = name;

  // Strip HTML tags from description if present
  const tmp = document.createElement('div');
  tmp.innerHTML = desc;
  document.getElementById('info-desc').textContent = tmp.textContent || '';
}

function loadLayer(key, cfg) {
  const layer = omnivore.kml(cfg.file, null, L.geoJson(null, {
    pointToLayer(feature, latlng) {
      return L.marker(latlng, { icon: makeIcon(cfg.color) });
    },
    style() {
      return { color: cfg.color, weight: 2, opacity: 0.85, fillOpacity: 0.25 };
    },
    onEachFeature(feature, featureLayer) {
      const props = feature.properties || {};
      const name  = props.name || props.Name || '';
      const desc  = props.description || props.Description || '';

      if (name) {
        featureLayer.bindPopup(
          `<strong style="font-size:0.95rem">${name}</strong>${desc ? `<br><span style="color:#7a9bbf;font-size:0.82rem">${desc}</span>` : ''}`,
          { maxWidth: 260 }
        );
      }

      featureLayer.on('click', (e) => onFeatureClick(e, cfg));
    },
  }))
  .on('ready', function () {
    // Extend global bounds
    if (layer.getBounds && layer.getBounds().isValid()) {
      bounds.extend(layer.getBounds());
    }
    loadedCount++;
    if (loadedCount === totalLayers) {
      // Fit map to all loaded features
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  })
  .on('error', function (e) {
    console.error(`[kml] Error cargando ${cfg.file}:`, e);
    loadedCount++;
  })
  .addTo(map);

  leafletLayers[key] = layer;
}

// Load all layers
Object.entries(LAYER_CONFIG).forEach(([key, cfg]) => {
  console.log(`[kml] Cargando ${cfg.file}…`);
  loadLayer(key, cfg);
});

// ── LAYER TOGGLE CHECKBOXES ───────────────────
document.querySelectorAll('#layer-list input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', function () {
    const key   = this.dataset.layer;
    const layer = leafletLayers[key];
    if (!layer) return;
    if (this.checked) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
});

// ── MOBILE SIDEBAR TOGGLE ─────────────────────
const sidebar       = document.getElementById('sidebar');
const toggleBtn     = document.getElementById('sidebar-toggle');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar on map click (mobile)
map.on('click', () => {
  if (window.innerWidth <= 680) {
    sidebar.classList.remove('open');
  }
});
