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

// ── CUSTOM KML PARSER ─────────────────────────
// No external dependencies — uses fetch + browser DOMParser

function parseKML(kmlText, cfg) {
  const parser = new DOMParser();
  const kml    = parser.parseFromString(kmlText, 'text/xml');
  const layer  = L.layerGroup();

  const placemarks = Array.from(kml.getElementsByTagName('Placemark'));

  placemarks.forEach(pm => {
    const name = pm.querySelector('name')?.textContent?.trim() || '';
    const desc = pm.querySelector('description')?.textContent?.trim() || '';

    // ── Point ──
    const pointEl = pm.querySelector('Point coordinates');
    if (pointEl) {
      const [lng, lat] = pointEl.textContent.trim().split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], { icon: makeIcon(cfg.color) });
        if (name) {
          const tmp = document.createElement('div');
          tmp.innerHTML = desc;
          const cleanDesc = tmp.textContent?.trim() || '';
          marker.bindPopup(
            `<strong style="font-size:0.95rem">${name}</strong>${cleanDesc ? `<br><span style="color:#7a9bbf;font-size:0.82rem">${cleanDesc}</span>` : ''}`,
            { maxWidth: 260 }
          );
        }
        marker.on('click', () => showInfo(cfg, name, desc));
        layer.addLayer(marker);
      }
    }

    // ── LineString / Polygon ──
    ['LineString coordinates', 'Polygon outerBoundaryIs LinearRing coordinates'].forEach(sel => {
      const el = pm.querySelector(sel);
      if (!el) return;
      const coords = el.textContent.trim().split(/\s+/).map(c => {
        const [lng, lat] = c.split(',').map(Number);
        return isNaN(lat) ? null : [lat, lng];
      }).filter(Boolean);
      if (coords.length < 2) return;
      const isPolygon = sel.includes('Polygon');
      const shape = isPolygon
        ? L.polygon(coords, { color: cfg.color, weight: 2, fillOpacity: 0.15 })
        : L.polyline(coords, { color: cfg.color, weight: 2.5, opacity: 0.8 });
      if (name) shape.bindPopup(`<strong>${name}</strong>`, { maxWidth: 260 });
      shape.on('click', () => showInfo(cfg, name, desc));
      layer.addLayer(shape);
    });
  });

  return layer;
}

function showInfo(cfg, name, desc) {
  document.getElementById('info-empty').style.display = 'none';
  const content = document.getElementById('info-content');
  content.style.display = 'block';
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';
  document.getElementById('info-tag').innerHTML  = `<span style="color:${cfg.color}">${cfg.icon}</span> ${cfg.label}`;
  document.getElementById('info-name').textContent = name || '(sin nombre)';
  const tmp = document.createElement('div');
  tmp.innerHTML = desc;
  document.getElementById('info-desc').textContent = tmp.textContent?.trim() || '';
}

// ── LAYER MANAGEMENT ──────────────────────────
const leafletLayers = {};
const bounds = L.latLngBounds();
let loadedCount = 0;
const totalLayers = Object.keys(LAYER_CONFIG).length;

async function loadLayer(key, cfg) {
  console.log(`[kml] Cargando ${cfg.file}…`);
  try {
    const res = await fetch(cfg.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const layer = parseKML(text, cfg);
    leafletLayers[key] = layer;
    layer.addTo(map);

    // Extend bounds
    layer.eachLayer(l => {
      if (l.getLatLng)  bounds.extend(l.getLatLng());
      if (l.getBounds)  bounds.extend(l.getBounds());
    });

    loadedCount++;
    if (loadedCount === totalLayers && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    console.log(`[kml] ✓ ${cfg.file} cargado`);
  } catch (err) {
    console.error(`[kml] Error en ${cfg.file}:`, err);
    loadedCount++;
  }
}

// Load all layers
Object.entries(LAYER_CONFIG).forEach(([key, cfg]) => loadLayer(key, cfg));

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
