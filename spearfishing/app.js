/* app.js — Spearfishing map */

// ── API GOOGLE SHEET ───────────────────────────
const SHEET_API = 'https://script.google.com/macros/s/AKfycbx3X-3Io3jJ4KnUa7iqXldw9U95Bb-IQhcK1mt2sU-f_zDn25OgT56cZmbBwPnk5HJyGg/exec';

// ── CONFIG DE TIPOS ───────────────────────────
const TIPOS = {
  'Sitio de pesca':   { color: '#5baaff', icon: '🤿' },
  'Aparcamiento':     { color: '#62f0cf', icon: '🅿️' },
  'Punto de entrada': { color: '#f06262', icon: '🚩' },
};

// ── LAYER CONFIG KML ──────────────────────────
const LAYER_CONFIG = {
  sitios:  { file: 'kml/sitios.kml',  color: '#5baaff', label: 'Sitio de pesca',  icon: '🤿' },
  parking: { file: 'kml/parking.kml', color: '#62f0cf', label: 'Aparcamiento',     icon: '🅿️' },
  entrada: { file: 'kml/entrada.kml', color: '#f06262', label: 'Punto de entrada', icon: '🚩' },
};

// ── MAP INIT ──────────────────────────────────
const map = L.map('map', { center: [43.4633, -8.2389], zoom: 13 });

// ── BASEMAPS ──────────────────────────────────
const BASEMAPS = {
  light: {
    label: 'Claro',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/6/24/31',
    layer: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 20 }),
  },
  osm: {
    label: 'Mapa',
    thumb: 'https://tile.openstreetmap.org/6/31/24.png',
    layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', subdomains: 'abc', maxZoom: 20, maxNativeZoom: 19 }),
  },
  ortho: {
    label: 'Satélite',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/31',
    layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri', maxZoom: 20 }),
  }
};

let activeBasemap = 'light';
BASEMAPS.light.layer.addTo(map);

const BasemapControl = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd() {
    const container = L.DomUtil.create('div', 'basemap-control leaflet-bar');
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    Object.entries(BASEMAPS).forEach(([key, bm]) => {
      const btn = L.DomUtil.create('button', key === activeBasemap ? 'active' : '', container);
      const thumb = L.DomUtil.create('span', 'bm-thumb', btn);
      const img = L.DomUtil.create('img', '', thumb);
      img.src = bm.thumb; img.alt = bm.label;
      const lbl = L.DomUtil.create('span', 'bm-label', btn);
      lbl.textContent = bm.label;
      L.DomEvent.on(btn, 'click', () => {
        if (key === activeBasemap) return;
        const prev = BASEMAPS[activeBasemap].layer;
        if (prev.getLayers) { prev.eachLayer(l => map.removeLayer(l)); } else { map.removeLayer(prev); }
        const next = BASEMAPS[key].layer;
        if (next.getLayers) { next.eachLayer(l => l.addTo(map)); } else { next.addTo(map); }
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

// ── NAUTICAL TOGGLE ───────────────────────────
const NauticalControl = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd() {
    const btn = L.DomUtil.create('button', 'nautical-toggle-btn active');
    btn.innerHTML = '⚓ Náutico';
    btn.title = 'Activar/desactivar capa náutica';
    L.DomEvent.disableClickPropagation(btn);
    L.DomEvent.on(btn, 'click', () => {
      const active = btn.classList.toggle('active');
      active ? NAUTICAL_OVERLAY.addTo(map) : map.removeLayer(NAUTICAL_OVERLAY);
    });
    return btn;
  },
});
new NauticalControl().addTo(map);

// ── NAUTICAL OVERLAY ──────────────────────────
const ENC_LAYER = L.tileLayer(
  'https://ideihm.covam.es/ihmcache/wmts/1.0.0/RasterENC/default/googlemapscompatible/{z}/{y}/{x}.png',
  { attribution: '&copy; <a href="https://ideihm.covam.es">IHM</a>', opacity: 0.85, maxZoom: 21 }
);
const SEAMARKS_LAYER = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a>', maxZoom: 20,
});
const NAUTICAL_OVERLAY = L.layerGroup([ENC_LAYER, SEAMARKS_LAYER]);
NAUTICAL_OVERLAY.addTo(map);

// ── MARKER ICON ───────────────────────────────
function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z"
      fill="${color}" fill-opacity="0.92"/>
    <circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [26,34], iconAnchor: [13,34], popupAnchor: [0,-36] });
}

// ── SIDEBAR INFO ──────────────────────────────
function showInfo(cfg, name, desc) {
  document.getElementById('info-empty').style.display = 'none';
  const content = document.getElementById('info-content');
  content.style.display = 'block';
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';
  document.getElementById('info-tag').innerHTML = `<span style="color:${cfg.color}">${cfg.icon}</span> ${cfg.label}`;
  document.getElementById('info-name').textContent = name || '(sin nombre)';
  const tmp = document.createElement('div');
  tmp.innerHTML = desc;
  document.getElementById('info-desc').textContent = tmp.textContent?.trim() || '';
}

// ── KML PARSER ───────────────────────────────
function parseKML(xmlDoc, cfg) {
  const layer = L.layerGroup();
  const bounds = [];
  const NS = 'http://www.opengis.net/kml/2.2';

  function getText(el, tagName) {
    const ns = el.getElementsByTagNameNS(NS, tagName);
    if (ns.length) return ns[0].textContent.trim();
    const plain = el.getElementsByTagName(tagName);
    if (plain.length) return plain[0].textContent.trim();
    if (tagName === 'name') {
      const nNS = el.getElementsByTagNameNS(NS, 'n');
      if (nNS.length) return nNS[0].textContent.trim();
      const nPlain = el.getElementsByTagName('n');
      if (nPlain.length) return nPlain[0].textContent.trim();
    }
    return '';
  }

  function parseCoords(str) {
    return str.trim().split(/\s+/).map(c => {
      const p = c.split(',').map(Number);
      return (p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1])) ? [p[1], p[0]] : null;
    }).filter(Boolean);
  }

  let placemarks = Array.from(xmlDoc.getElementsByTagNameNS(NS, 'Placemark'));
  if (placemarks.length === 0) placemarks = Array.from(xmlDoc.getElementsByTagName('Placemark'));

  placemarks.forEach(pm => {
    const name = getText(pm, 'name');
    const desc = getText(pm, 'description');
    const popup = name
      ? `<strong style="font-size:.95rem">${name}</strong>${desc ? `<br><span style="color:#7a9bbf;font-size:.82rem">${desc}</span>` : ''}`
      : null;

    let pts = Array.from(pm.getElementsByTagNameNS(NS, 'Point'));
    if (!pts.length) pts = Array.from(pm.getElementsByTagName('Point'));
    if (pts.length) {
      const coords = parseCoords(getText(pts[0], 'coordinates'));
      if (coords.length) {
        const [lat, lng] = coords[0];
        const m = L.marker([lat, lng], { icon: makeIcon(cfg.color) });
        if (popup) m.bindPopup(popup, { maxWidth: 260 });
        m.on('click', () => showInfo(cfg, name, desc));
        layer.addLayer(m);
        bounds.push([lat, lng]);
      }
      return;
    }

    let lss = Array.from(pm.getElementsByTagNameNS(NS, 'LineString'));
    if (!lss.length) lss = Array.from(pm.getElementsByTagName('LineString'));
    if (lss.length) {
      const coords = parseCoords(getText(lss[0], 'coordinates'));
      if (coords.length >= 2) {
        const l = L.polyline(coords, { color: cfg.color, weight: 2.5, opacity: 0.85 });
        if (popup) l.bindPopup(popup, { maxWidth: 260 });
        l.on('click', () => showInfo(cfg, name, desc));
        layer.addLayer(l);
        coords.forEach(c => bounds.push(c));
      }
      return;
    }

    let pgs = Array.from(pm.getElementsByTagNameNS(NS, 'Polygon'));
    if (!pgs.length) pgs = Array.from(pm.getElementsByTagName('Polygon'));
    if (pgs.length) {
      const coords = parseCoords(getText(pgs[0], 'coordinates'));
      if (coords.length >= 3) {
        const p = L.polygon(coords, { color: cfg.color, weight: 2, fillOpacity: 0.15 });
        if (popup) p.bindPopup(popup, { maxWidth: 260 });
        p.on('click', () => showInfo(cfg, name, desc));
        layer.addLayer(p);
        coords.forEach(c => bounds.push(c));
      }
    }
  });

  return { layer, bounds };
}

// ── LOAD KML FILES ────────────────────────────
const leafletLayers = {};
const allBounds = [];
const keys = Object.keys(LAYER_CONFIG);
let loaded = 0;

keys.forEach(key => {
  const cfg = LAYER_CONFIG[key];
  fetch(cfg.file)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(text => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'application/xml');
      const parseErr = xmlDoc.querySelector('parsererror');
      if (parseErr) throw new Error('XML inválido');
      const { layer, bounds } = parseKML(xmlDoc, cfg);
      leafletLayers[key] = layer;
      layer.addTo(map);
      bounds.forEach(b => allBounds.push(b));
    })
    .catch(err => console.error(`[kml] ${cfg.file}:`, err.message))
    .finally(() => loaded++);
});

// ── CARGAR SITIOS DE LA SHEET ─────────────────
const sheetLayer = L.layerGroup().addTo(map);

function loadSheetMarkers() {
  fetch(SHEET_API)
    .then(r => r.json())
    .then(rows => {
      sheetLayer.clearLayers();
      rows.forEach(row => {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        const tipo = TIPOS[row.tipo] || { color: '#aaaaaa', icon: '📍' };
        const m = L.marker([lat, lng], { icon: makeIcon(tipo.color) });
        const popupHTML = `
          <strong style="font-size:.95rem">${row.nombre || '(sin nombre)'}</strong><br>
          <span style="color:#7a9bbf;font-size:.82rem">${tipo.icon} ${row.tipo || ''}</span>
          ${row.notas ? `<br><span style="font-size:.82rem">${row.notas}</span>` : ''}
          ${row.autor ? `<br><span style="font-size:.75rem;color:#999">por ${row.autor}</span>` : ''}
          ${row.foto_url ? `<br><a href="${row.foto_url}" target="_blank" style="font-size:.8rem">📷 Ver foto</a>` : ''}
        `;
        m.bindPopup(popupHTML, { maxWidth: 260 });
        sheetLayer.addLayer(m);
      });
    })
    .catch(err => console.warn('[sheet]', err.message));
}

loadSheetMarkers();

// ── FORMULARIO AÑADIR SITIO ───────────────────
const modal = document.getElementById('add-modal');
const fabBtn = document.getElementById('fab-add');
const formClose = document.getElementById('form-close');
const addForm = document.getElementById('add-form');
const gpsBtn = document.getElementById('btn-gps');
const latInput = document.getElementById('form-lat');
const lngInput = document.getElementById('form-lng');
const gpsStatus = document.getElementById('gps-status');

fabBtn.addEventListener('click', () => {
  modal.classList.add('open');
  // Intentar GPS automáticamente al abrir
  obtenerGPS();
});

formClose.addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

gpsBtn.addEventListener('click', obtenerGPS);

function obtenerGPS() {
  if (!navigator.geolocation) {
    gpsStatus.textContent = 'GPS no disponible en este dispositivo';
    return;
  }
  gpsStatus.textContent = '📡 Obteniendo posición...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      latInput.value = pos.coords.latitude.toFixed(6);
      lngInput.value = pos.coords.longitude.toFixed(6);
      gpsStatus.textContent = `✓ Posición obtenida (±${Math.round(pos.coords.accuracy)}m)`;
    },
    err => {
      gpsStatus.textContent = '⚠ No se pudo obtener el GPS. Introduce las coordenadas manualmente.';
      console.warn('[gps]', err.message);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const submitBtn = addForm.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Guardando...';
  submitBtn.disabled = true;

  const data = {
    nombre:   document.getElementById('form-nombre').value.trim(),
    tipo:     document.getElementById('form-tipo').value,
    lat:      latInput.value,
    lng:      lngInput.value,
    notas:    document.getElementById('form-notas').value.trim(),
    autor:    document.getElementById('form-autor').value.trim(),
    foto_url: '',
  };

  const params = new URLSearchParams({
    action:   'write',
    nombre:   data.nombre,
    tipo:     data.tipo,
    lat:      data.lat,
    lng:      data.lng,
    notas:    data.notas,
    autor:    data.autor,
    foto_url: '',
  });

  fetch(`${SHEET_API}?${params}`)
    .then(r => r.json())
    .then(result => {
      if (!result.ok) throw new Error('respuesta not ok');
      modal.classList.remove('open');
      addForm.reset();
      gpsStatus.textContent = '';
      submitBtn.textContent = 'Guardar sitio';
      submitBtn.disabled = false;
      setTimeout(loadSheetMarkers, 2000);
      alert('✓ Sitio guardado correctamente');
    })
  .catch(err => {
    console.error('[save]', err);
    submitBtn.textContent = 'Guardar sitio';
    submitBtn.disabled = false;
    alert('Error al guardar. Comprueba tu conexión.');
  });
});

// ── LAYER TOGGLES ─────────────────────────────
document.querySelectorAll('#layer-list input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', function() {
    if (this.dataset.layer === 'nautico') {
      this.checked ? NAUTICAL_OVERLAY.addTo(map) : map.removeLayer(NAUTICAL_OVERLAY);
      return;
    }
    const layer = leafletLayers[this.dataset.layer];
    if (!layer) return;
    this.checked ? map.addLayer(layer) : map.removeLayer(layer);
  });
});

// ── MOBILE SIDEBAR ────────────────────────────
const sidebar   = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
map.on('click', () => { if (window.innerWidth <= 680) sidebar.classList.remove('open'); });
