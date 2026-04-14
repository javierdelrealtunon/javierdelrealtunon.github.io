/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM + EMODnet
   app.js — Lógica del mapa, capas y sidebar
   Soporta dos tipos de capa:
     type: "arcgis"  → L.esri.dynamicMapLayer  (DGRM)
     type: "wms"     → L.tileLayer.wms         (EMODnet)
   ============================================================ */

// ── MAPA ─────────────────────────────────────────────────────
const map = L.map("map", {
  center: [39.5, -9.0],
  zoom: 6,
  zoomControl: true
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

const ihptEnc = L.tileLayer.wms("https://enc.hidrografico.pt/?", {
  layers:      "ENC",
  format:      "image/png",
  transparent: true,
  version:     "1.3.0",
  uppercase:   true,
  CSBOOL:      "2183",
  CSVALUE:     ",,,,,3",
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
    // ── WMS (EMODnet) ─────────────────────────────────────────
    newLayer = L.tileLayer.wms(cfg.url, {
      layers:      cfg.wmsLayers,
      format:      "image/png",
      transparent: true,
      version:     "1.3.0",
      opacity:     0.75,
      attribution: "© EMODnet"
    });
    newLayer.on("load",      () => setLayerStatus(id, "ok"));
    newLayer.on("tileerror", () => setLayerStatus(id, "error"));

  } else {
    // ── ArcGIS REST (DGRM) ────────────────────────────────────
    newLayer = L.esri.dynamicMapLayer({
      url:         cfg.url,
      opacity:     0.75,
      f:           "image",
      transparent: true,
      format:      "png32"
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

// ── SIDEBAR — lista plana con indicador de origen ─────────────
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

  visible.forEach(l => {
    const isActive  = !!activeLayers[l.id];
    const isEmodnet = l.type === "wms";
    const srcClass  = isEmodnet ? "src-emodnet" : "src-dgrm";
    const srcLabel  = isEmodnet ? "EMODnet" : "DGRM";
    const opVal     = activeLayers[l.id] ? activeLayers[l.id].options.opacity : 0.75;
    const inputId   = "range-" + l.id;

    const item = document.createElement("div");
    item.className = `layer-item ${srcClass}${isActive ? " active" : ""}`;
    item.id = "item-" + l.id;
    item.innerHTML = `
      <div class="layer-toggle"></div>
      <div class="layer-info">
        <div class="layer-name">
          ${l.name}
          <span class="layer-status" id="status-${l.id}"></span>
        </div>
        <div class="layer-cat-tag">${l.cat}</div>
        <div class="layer-desc">${l.desc}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      toggleLayer(l.id);
      buildSidebar(filterText);
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
}

// ── EVENTOS ───────────────────────────────────────────────────
document.getElementById("searchInput").addEventListener("input", e => {
  buildSidebar(e.target.value);
});

buildSidebar();
