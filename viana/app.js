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

// ── HERRAMIENTAS DE DIBUJO ────────────────────────────────────
// Pane para features dibujadas: encima de todo lo demás
map.createPane("drawPane");
map.getPane("drawPane").style.zIndex = 400;

// FeatureGroup donde Leaflet.draw almacena los objetos
const drawnItems  = new L.FeatureGroup([], { pane: "drawPane" }).addTo(map);
let   drawCounter = 0;
const drawFeatures = {}; // id → { layer, name, type }

// Colores por defecto para elementos dibujados
const DRAW_STYLE = {
  color:       "#f59e0b",
  fillColor:   "#f59e0b",
  weight:      2.5,
  opacity:     1,
  fillOpacity: 0.25
};
const DRAW_STYLE_CIRCLE = { ...DRAW_STYLE, fillOpacity: 0.2 };

// ── Handlers de los botones del sidebar ──────────────────────
let activeDrawHandler = null;

function activateDrawTool(handler, btnId) {
  if (activeDrawHandler) {
    activeDrawHandler.disable();
    document.querySelectorAll(".draw-tool-btn").forEach(b => b.classList.remove("active"));
  }
  if (activeDrawHandler && activeDrawHandler === handler) {
    activeDrawHandler = null;
    setDrawHint("Selecciona una herramienta para empezar");
    return;
  }
  activeDrawHandler = handler;
  handler.enable();
  document.getElementById(btnId).classList.add("active");
}

document.getElementById("drawMarker").addEventListener("click", () => {
  activateDrawTool(new L.Draw.Marker(map, { icon: L.divIcon({ className: "draw-marker-icon", html: "📍", iconSize: [24,24], iconAnchor: [12,24] }) }), "drawMarker");
  setDrawHint("Haz clic en el mapa para colocar un punto");
});

document.getElementById("drawLine").addEventListener("click", () => {
  activateDrawTool(new L.Draw.Polyline(map, { shapeOptions: DRAW_STYLE }), "drawLine");
  setDrawHint("Clic para añadir vértices · doble clic para terminar");
});

document.getElementById("drawPolygon").addEventListener("click", () => {
  activateDrawTool(new L.Draw.Polygon(map, { shapeOptions: DRAW_STYLE }), "drawPolygon");
  setDrawHint("Clic para añadir vértices · clic en el primero para cerrar");
});

document.getElementById("drawRect").addEventListener("click", () => {
  activateDrawTool(new L.Draw.Rectangle(map, { shapeOptions: DRAW_STYLE }), "drawRect");
  setDrawHint("Arrastra para dibujar el rectángulo");
});

document.getElementById("drawCircle").addEventListener("click", () => {
  activateDrawTool(new L.Draw.Circle(map, { shapeOptions: DRAW_STYLE_CIRCLE }), "drawCircle");
  setDrawHint("Clic y arrastra para definir el radio");
});

document.getElementById("drawClear").addEventListener("click", () => {
  if (!Object.keys(drawFeatures).length) return;
  if (!confirm("¿Eliminar todos los elementos dibujados?")) return;
  drawnItems.clearLayers();
  Object.keys(drawFeatures).forEach(id => delete drawFeatures[id]);
  document.getElementById("drawFeatureList").innerHTML = "";
  document.getElementById("drawExportRow").style.display = "none";
  setDrawHint("Selecciona una herramienta para empezar");
});

function setDrawHint(text) {
  document.getElementById("drawHint").textContent = text;
}

// ── Evento: objeto dibujado ───────────────────────────────────
map.on(L.Draw.Event.CREATED, e => {
  const layer = e.layer;
  const type  = e.layerType;
  const id    = "draw-" + (++drawCounter);
  const name  = typeLabel(type) + " " + drawCounter;

  // Estilo consistente
  if (layer.setStyle) layer.setStyle(DRAW_STYLE);

  drawnItems.addLayer(layer);
  drawFeatures[id] = { layer, name, type };

  // Popup editable con el nombre
  layer.bindPopup(makePopupHtml(name, id));
  layer.openPopup();

  addDrawFeatureRow(id, name, type);
  document.getElementById("drawExportRow").style.display = "flex";

  // Desactivar herramienta tras dibujar
  if (activeDrawHandler) {
    activeDrawHandler.disable();
    document.querySelectorAll(".draw-tool-btn").forEach(b => b.classList.remove("active"));
    activeDrawHandler = null;
    setDrawHint("Elemento añadido. Elige otra herramienta o exporta.");
  }
});

function typeLabel(type) {
  return { marker:"Ponto", polyline:"Linha", polygon:"Polígono",
           rectangle:"Rectângulo", circle:"Círculo" }[type] || "Feature";
}

function makePopupHtml(name, id) {
  return `<div style="min-width:160px">
    <input id="popup-name-${id}" value="${name}"
      style="width:100%;padding:3px 6px;border:1px solid #ccc;border-radius:4px;font-size:0.85rem;margin-bottom:5px"
      onchange="renameDrawFeature('${id}', this.value)" />
    <div style="font-size:0.72rem;color:#888">Edita el nombre y pulsa Enter</div>
  </div>`;
}

function renameDrawFeature(id, newName) {
  if (!drawFeatures[id] || !newName.trim()) return;
  drawFeatures[id].name = newName.trim();
  const row = document.getElementById("draw-row-" + id);
  if (row) row.querySelector(".draw-feat-name").textContent = newName.trim();
}

// ── Lista de features en el sidebar ──────────────────────────
function addDrawFeatureRow(id, name, type) {
  const list = document.getElementById("drawFeatureList");
  const icon = { marker:"📍", polyline:"📏", polygon:"⬡", rectangle:"⬜", circle:"◯" }[type] || "●";
  const row  = document.createElement("div");
  row.className = "draw-feat-row";
  row.id = "draw-row-" + id;
  row.innerHTML = `
    <span class="draw-feat-icon">${icon}</span>
    <span class="draw-feat-name">${name}</span>
    <button class="kml-toggle-btn" title="Centrar" onclick="zoomToDrawFeature('${id}')">🎯</button>
    <button class="kml-remove-btn" title="Eliminar" onclick="removeDrawFeature('${id}')">✕</button>
  `;
  list.appendChild(row);
}

function zoomToDrawFeature(id) {
  const entry = drawFeatures[id];
  if (!entry) return;
  const l = entry.layer;
  if (l.getBounds) map.fitBounds(l.getBounds(), { padding: [40, 40] });
  else if (l.getLatLng) map.setView(l.getLatLng(), 14);
}

function removeDrawFeature(id) {
  const entry = drawFeatures[id];
  if (!entry) return;
  drawnItems.removeLayer(entry.layer);
  delete drawFeatures[id];
  const row = document.getElementById("draw-row-" + id);
  if (row) row.remove();
  if (!Object.keys(drawFeatures).length) {
    document.getElementById("drawExportRow").style.display = "none";
    setDrawHint("Selecciona una herramienta para empezar");
  }
}

// ── KML / KMZ export ─────────────────────────────────────────
function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function geomToKml(layer, type) {
  if (type === "marker") {
    const { lat, lng } = layer.getLatLng();
    return `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
  }
  if (type === "circle") {
    // Aproximar círculo como polígono de 64 puntos
    const { lat, lng } = layer.getLatLng();
    const R = layer.getRadius(); // metros
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * 2 * Math.PI;
      const dLat = (R * Math.cos(a)) / 111320;
      const dLng = (R * Math.sin(a)) / (111320 * Math.cos(lat * Math.PI / 180));
      pts.push(`${(lng + dLng).toFixed(7)},${(lat + dLat).toFixed(7)},0`);
    }
    return `<Polygon><outerBoundaryIs><LinearRing>` +
           `<coordinates>${pts.join(' ')}</coordinates>` +
           `</LinearRing></outerBoundaryIs></Polygon>`;
  }
  if (type === "polyline") {
    const coords = layer.getLatLngs().map(p => `${p.lng.toFixed(7)},${p.lat.toFixed(7)},0`).join(' ');
    return `<LineString><coordinates>${coords}</coordinates></LineString>`;
  }
  // polygon / rectangle
  const ring = layer.getLatLngs()[0];
  const coords = [...ring, ring[0]].map(p => `${p.lng.toFixed(7)},${p.lat.toFixed(7)},0`).join(' ');
  return `<Polygon><outerBoundaryIs><LinearRing>` +
         `<coordinates>${coords}</coordinates>` +
         `</LinearRing></outerBoundaryIs></Polygon>`;
}

function buildKmlString(docName) {
  const placemarks = Object.values(drawFeatures).map(({ layer, name, type }) => `
  <Placemark>
    <name>${escXml(name)}</name>
    <Style>
      <LineStyle><color>ff0b9ef5</color><width>2</width></LineStyle>
      <PolyStyle><color>400b9ef5</color></PolyStyle>
      <IconStyle><color>ff0b9ef5</color></IconStyle>
    </Style>
    ${geomToKml(layer, type)}
  </Placemark>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${escXml(docName)}</name>
${placemarks}
</Document>
</kml>`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

document.getElementById("exportKml").addEventListener("click", () => {
  if (!Object.keys(drawFeatures).length) return;
  const kml  = buildKmlString("Desenho Viana");
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  downloadBlob(blob, "viana_desenho.kml");
});

document.getElementById("exportKmz").addEventListener("click", async () => {
  if (!Object.keys(drawFeatures).length) return;
  const kml = buildKmlString("Desenho Viana");
  const zip = new JSZip();
  zip.file("doc.kml", kml);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(blob, "viana_desenho.kmz");
});
