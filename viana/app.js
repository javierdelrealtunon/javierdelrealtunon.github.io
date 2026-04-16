/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM + EMODnet
   app.js — Lógica del mapa, capas y sidebar
   Soporta tres tipos de capa:
     type: "arcgis"  → L.esri.dynamicMapLayer  (DGRM)
     type: "wms"     → L.tileLayer.wms         (EMODnet)
     type: "polygon" → L.polygon               (local)
   ============================================================ */

// ── MAPA ─────────────────────────────────────────────────────
const map = L.map("map", {
  center: [41.694, -8.834],
  zoom: 10,
  zoomControl: true
  // minZoom eliminado temporalmente para verificar contenido de capas
});

const cartoLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
).addTo(map);


const orthoLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19, attribution: "Tiles &copy; Esri" }
);

// ── Panes de superposición — orden garantizado ────────────────
// L.tileLayer.wms usa "tilePane" (z-index 200) por defecto,
// igual que los mapas base. Se necesitan dos panes contiguos:
//   nauticalPane  201  → carta náutica (encima del mapa base)
//   thematicPane  202  → capas WMS/ArcGIS temáticas (encima de la náutica)
// Los polígonos van al overlayPane nativo (400), siempre al frente.
map.createPane("nauticalPane");
map.getPane("nauticalPane").style.zIndex = 201;

map.createPane("thematicPane");
map.getPane("thematicPane").style.zIndex = 202;

const ihptEnc = L.tileLayer.wms("https://enc.hidrografico.pt/?", {
  layers:      "ENC",
  format:      "image/png",
  transparent: true,
  version:     "1.3.0",
  uppercase:   true,
  CSBOOL:      "2183",
  CSVALUE:     ",,,,,3",
  pane:        "nauticalPane",          // ← siempre debajo de temáticas
  attribution: "Instituto Hidrográfico de Portugal (IHPT ENC WMS)"
});

L.control.layers(
  { "Cartografia (CartoDB)": cartoLayer, "Ortofoto (Esri)": orthoLayer },
  { "Carta náutica (IHPT ENC)": ihptEnc },
  { position: "topright", collapsed: true }
).addTo(map);

L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// ── GESTÃO DE CAMADAS ─────────────────────────────────────────
const activeLayers = {}; // id → layer instance

/**
 * Actualiza el badge de estado visual de una capa.
 */
function setLayerStatus(id, status) {
  const badge = document.getElementById("status-" + id);
  if (!badge) return;
  badge.className = status ? "layer-status layer-status--" + status : "layer-status";
  badge.title = status === "loading" ? "A carregar…"
              : status === "ok"      ? "Camada activa"
              : status === "error"   ? "Erro ao carregar (servidor não acessível)"
              : "";
}

/**
 * Activa ou desactiva uma camada no mapa.
 */
function toggleLayer(id) {
  const cfg  = LAYERS.find(l => l.id === id);
  const item = document.getElementById("item-" + id);

  if (activeLayers[id]) {
    map.removeLayer(activeLayers[id]);
    delete activeLayers[id];
    item.classList.remove("active");
    setLayerStatus(id, "");
    return;
  }

  setLayerStatus(id, "loading");

  let newLayer;

  if (cfg.type === "wms") {
    // ── WMS (EMODnet / IH) — pane temático, encima de la náutica ─
    newLayer = L.tileLayer.wms(cfg.url, {
      layers:      cfg.wmsLayers,
      format:      "image/png",
      transparent: true,
      version:     "1.3.0",
      opacity:     0.75,
      pane:        "thematicPane",
      attribution: "© EMODnet"
    });
    newLayer.on("load",      () => setLayerStatus(id, "ok"));
    newLayer.on("tileerror", () => setLayerStatus(id, "error"));

  } else if (cfg.type === "polygon") {
    // ── Polígono local (Leaflet) ──────────────────────────────
    newLayer = L.polygon(cfg.coords, cfg.style);
    setTimeout(() => setLayerStatus(id, "ok"), 100);

  } else {
    // ── ArcGIS REST (DGRM) — pane temático, encima de la náutica ─
    newLayer = L.esri.dynamicMapLayer({
      url:         cfg.url,
      opacity:     0.75,
      f:           "image",
      transparent: true,
      format:      "png32",
      pane:        "thematicPane"
    });
    newLayer.on("load",  () => setLayerStatus(id, "ok"));
    newLayer.on("error", () => setLayerStatus(id, "error"));
  }

  newLayer.addTo(map);
  activeLayers[id] = newLayer;
  item.classList.add("active");
}

/**
 * Altera a opacidade de uma camada activa.
 */
function setOpacity(id, value) {
  if (activeLayers[id]) activeLayers[id].setOpacity(parseFloat(value));
}

// ── SIDEBAR — agrupada por categoría, colapsable ──────────────
const expandedLayers = new Set();
const collapsedCats  = new Set(); // categorías contraídas

function buildSidebar(filterText) {
  const panel = document.getElementById("layerPanel");
  panel.innerHTML = "";

  const q = (filterText || "").toLowerCase().trim();

  const visible = LAYERS.filter(l =>
    !q ||
    l.name.toLowerCase().includes(q) ||
    l.desc.toLowerCase().includes(q) ||
    l.cat.toLowerCase().includes(q)
  );

  document.getElementById("layerCount").textContent = visible.length;

  // ── Agrupar por cat manteniendo el orden de aparición ────────
  const groups = new Map();
  visible.forEach(l => {
    if (!groups.has(l.cat)) groups.set(l.cat, []);
    groups.get(l.cat).push(l);
  });

  groups.forEach((layers, cat) => {
    const isEmodnet   = cat.includes("EMODnet");
    const isCollapsed = collapsedCats.has(cat);

    // ── Cabecera de categoría ─────────────────────────────────
    const catHeader = document.createElement("div");
    catHeader.className = `cat-header ${isEmodnet ? "cat-emodnet" : "cat-dgrm"}`;
    catHeader.innerHTML = `
      <span class="cat-title">${cat}</span>
      <span class="cat-arrow">${isCollapsed ? "▸" : "▾"}</span>
    `;
    catHeader.addEventListener("click", () => {
      if (collapsedCats.has(cat)) collapsedCats.delete(cat);
      else                        collapsedCats.add(cat);
      buildSidebar(filterText);
    });
    panel.appendChild(catHeader);

    if (isCollapsed) return; // omite los items si está contraído

    // ── Items de la categoría ─────────────────────────────────
    layers.forEach(l => {
      const isActive   = !!activeLayers[l.id];
      const srcClass   = isEmodnet ? "src-emodnet" : "src-dgrm";
      const isExpanded = expandedLayers.has(l.id);
      const opVal      = activeLayers[l.id] ? activeLayers[l.id].options.opacity : 0.75;
      const inputId    = "range-" + l.id;

      const item = document.createElement("div");
      item.className = `layer-item ${srcClass}${isActive ? " active" : ""}`;
      item.id = "item-" + l.id;
      item.innerHTML = `
        <div class="layer-toggle"></div>
        <div class="layer-body">
          <div class="layer-name-row">
            <span class="layer-name">
              ${l.name}
              <span class="layer-status" id="status-${l.id}"></span>
            </span>
            <span class="layer-expand-arrow">${isExpanded ? "▾" : "▸"}</span>
          </div>
          <div class="layer-details" id="details-${l.id}" style="display:${isExpanded ? "block" : "none"}">
            <div class="layer-desc">${l.desc}</div>
          </div>
        </div>
      `;

      // Checkbox: activa/desactiva capa en el mapa
      item.querySelector(".layer-toggle").addEventListener("click", e => {
        e.stopPropagation();
        toggleLayer(l.id);
        buildSidebar(filterText);
      });

      // Nombre: expande/colapsa descripción sin reconstruir todo
      item.querySelector(".layer-name-row").addEventListener("click", e => {
        e.stopPropagation();
        if (expandedLayers.has(l.id)) expandedLayers.delete(l.id);
        else                          expandedLayers.add(l.id);
        const details = document.getElementById("details-" + l.id);
        const arrow   = item.querySelector(".layer-expand-arrow");
        const open    = expandedLayers.has(l.id);
        details.style.display = open ? "block" : "none";
        arrow.textContent     = open ? "▾" : "▸";
      });

      const opRow = document.createElement("div");
      opRow.className = "opacity-row";
      opRow.id = "op-" + l.id;
      opRow.innerHTML = `
        <label for="${inputId}">Opacidade</label>
        <input id="${inputId}" type="range" min="0.1" max="1" step="0.05"
          value="${opVal}"
          oninput="setOpacity('${l.id}', this.value)" />
      `;

      panel.appendChild(item);
      panel.appendChild(opRow);

      if (isActive) {
        requestAnimationFrame(() => setLayerStatus(l.id, "ok"));
      }
    });
  });
}

// ── EVENTOS ───────────────────────────────────────────────────
document.getElementById("searchInput").addEventListener("input", e => {
  buildSidebar(e.target.value);
});

buildSidebar();

// ── KML / KMZ — carga interactiva ────────────────────────────
// Pane propio para KML: siempre encima de capas temáticas
map.createPane("kmlPane");
map.getPane("kmlPane").style.zIndex = 310;

const kmlLayers = {}; // id → { layer, name, visible }
let kmlCounter  = 0;

const KML_PALETTE = [
  "#e05252", "#e08c52", "#d4c84a", "#52b052",
  "#52a8e0", "#8052e0", "#e052b8", "#52e0d4"
];

/**
 * Carga un fichero KML o KMZ desde un objeto File y lo añade al mapa.
 */
function loadKmlFile(file) {
  const name = file.name.replace(/\.(kml|kmz)$/i, "");
  const id   = "kml-" + (++kmlCounter);
  const color = KML_PALETTE[(kmlCounter - 1) % KML_PALETTE.length];

  const reader = new FileReader();
  reader.onload = function (e) {
    let kmlString = e.target.result;

    // KMZ es un ZIP — intentar descomprimir si la librería JSZip está presente
    // Si no está disponible se avisa al usuario
    if (file.name.toLowerCase().endsWith(".kmz")) {
      if (typeof JSZip === "undefined") {
        showKmlError(id, name, "KMZ requiere JSZip. Por favor convierte a KML primero.");
        return;
      }
      JSZip.loadAsync(file).then(zip => {
        const kmlFile = Object.values(zip.files).find(f => f.name.endsWith(".kml"));
        if (!kmlFile) { showKmlError(id, name, "No se encontró .kml dentro del KMZ."); return; }
        kmlFile.async("string").then(str => parseAndAddKml(str, name, id, color));
      });
      return;
    }

    parseAndAddKml(kmlString, name, id, color);
  };

  reader.onerror = () => showKmlError(id, name, "Error al leer el fichero.");

  // Registrar entrada en sidebar antes de parsear (feedback inmediato)
  addKmlEntry(id, name, color, "loading");

  if (file.name.toLowerCase().endsWith(".kmz")) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function parseAndAddKml(kmlString, name, id, color) {
  try {
    const layer = omnivore.kml.parse(kmlString, null,
      L.geoJSON(null, {
        pane: "kmlPane",
        style: { color, weight: 2, opacity: 0.9, fillOpacity: 0.25 },
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
          pane:        "kmlPane",
          radius:      6,
          color,
          fillColor:   color,
          fillOpacity: 0.7,
          weight:      2
        }),
        onEachFeature: (feature, featureLayer) => {
          const props = feature.properties || {};
          const label = props.name || props.Name || props.description || name;
          if (label) featureLayer.bindPopup(`<b>${label}</b>`);
        }
      })
    );

    layer.addTo(map);
    if (layer.getBounds && layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds(), { padding: [30, 30] });
    }

    kmlLayers[id] = { layer, name, visible: true };
    updateKmlEntry(id, "ok");

  } catch (err) {
    showKmlError(id, name, "Error al parsear el KML: " + err.message);
  }
}

function addKmlEntry(id, name, color, status) {
  const list = document.getElementById("kmlLayerList");

  const item = document.createElement("div");
  item.className = "kml-item";
  item.id = "kml-item-" + id;
  item.innerHTML = `
    <span class="kml-color-dot" style="background:${color}"></span>
    <span class="kml-name" title="${name}">${name}</span>
    <span class="kml-status" id="kml-status-${id}">${
      status === "loading" ? "⏳" : status === "ok" ? "" : "⚠"
    }</span>
    <button class="kml-toggle-btn" id="kml-toggle-${id}" title="Ocultar/mostrar">👁</button>
    <button class="kml-remove-btn" id="kml-remove-${id}" title="Eliminar">✕</button>
  `;

  item.querySelector("#kml-toggle-" + id).addEventListener("click", () => toggleKmlLayer(id));
  item.querySelector("#kml-remove-" + id).addEventListener("click", () => removeKmlLayer(id));

  list.appendChild(item);
}

function updateKmlEntry(id, status) {
  const statusEl = document.getElementById("kml-status-" + id);
  if (statusEl) statusEl.textContent = status === "ok" ? "" : "⚠";
}

function showKmlError(id, name, msg) {
  const statusEl = document.getElementById("kml-status-" + id);
  if (statusEl) { statusEl.textContent = "⚠"; statusEl.title = msg; }
  console.warn("KML error:", msg);
}

function toggleKmlLayer(id) {
  const entry = kmlLayers[id];
  if (!entry) return;
  const btn = document.getElementById("kml-toggle-" + id);
  const item = document.getElementById("kml-item-" + id);
  if (entry.visible) {
    map.removeLayer(entry.layer);
    entry.visible = false;
    item.classList.add("kml-hidden");
    if (btn) btn.style.opacity = "0.35";
  } else {
    entry.layer.addTo(map);
    entry.visible = true;
    item.classList.remove("kml-hidden");
    if (btn) btn.style.opacity = "";
  }
}

function removeKmlLayer(id) {
  const entry = kmlLayers[id];
  if (!entry) return;
  map.removeLayer(entry.layer);
  delete kmlLayers[id];
  const item = document.getElementById("kml-item-" + id);
  if (item) item.remove();
}

// ── Botón de carga ────────────────────────────────────────────
document.getElementById("kmlUploadBtn").addEventListener("click", () => {
  document.getElementById("kmlFileInput").click();
});

document.getElementById("kmlFileInput").addEventListener("change", e => {
  Array.from(e.target.files).forEach(loadKmlFile);
  e.target.value = ""; // permite cargar el mismo fichero otra vez
});

// ── Drag & drop sobre el mapa ─────────────────────────────────
const mapEl = document.getElementById("map");

mapEl.addEventListener("dragover", e => {
  e.preventDefault();
  mapEl.classList.add("drag-over");
});
mapEl.addEventListener("dragleave", () => mapEl.classList.remove("drag-over"));
mapEl.addEventListener("drop", e => {
  e.preventDefault();
  mapEl.classList.remove("drag-over");
  const files = Array.from(e.dataTransfer.files)
    .filter(f => /\.(kml|kmz)$/i.test(f.name));
  if (files.length) {
    // Abrir el grupo KML en el sidebar si estaba cerrado
    const kmlGroup = document.getElementById("kmlGroup");
    const kmlArrow = document.getElementById("kmlArrow");
    if (!kmlGroup.classList.contains("kml-open")) {
      kmlGroup.classList.add("kml-open");
      kmlArrow.textContent = "▾";
    }
    files.forEach(loadKmlFile);
  }
});

