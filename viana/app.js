/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM
   app.js — Lógica del mapa, capas y sidebar
   Usa ArcGIS REST /MapServer/export (esri-leaflet) en lugar de
   WMS, evitando el bloqueo del servidor DGRM al endpoint /services/
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

L.control.layers(
  { "Cartografia (CartoDB)": cartoLayer, "Ortofoto (Esri)": orthoLayer },
  {},
  { position: "topright", collapsed: true }
).addTo(map);

// ── GESTÃO DE CAMADAS ─────────────────────────────────────────
const activeLayers = {}; // id → L.esri.dynamicMapLayer

/**
 * Actualiza el badge de estado visual de una capa.
 * @param {string} id
 * @param {'loading'|'ok'|'error'|''} status
 */
function setLayerStatus(id, status) {
  const badge = document.getElementById("status-" + id);
  if (!badge) return;
  badge.className = status ? "layer-status layer-status--" + status : "layer-status";
  badge.title = status === "loading" ? "Carregando…"
              : status === "ok"      ? "Camada activa"
              : status === "error"   ? "Erro ao carregar (servidor não acessível)"
              : "";
}

/**
 * Activa ou desactiva uma camada ArcGIS REST no mapa.
 * Usa L.esri.dynamicMapLayer que llama al endpoint /MapServer/export,
 * accesible desde dominios externos (a diferencia del endpoint WMS).
 * @param {string} id
 */
function toggleLayer(id) {
  const cfg  = LAYERS.find(l => l.id === id);
  const item = document.getElementById("item-" + id);

  if (activeLayers[id]) {
    map.removeLayer(activeLayers[id]);
    delete activeLayers[id];
    item.classList.remove("active");
    setLayerStatus(id, "");
  } else {
    setLayerStatus(id, "loading");

    const dynLayer = L.esri.dynamicMapLayer({
      url:         cfg.url,
      opacity:     0.75,
      f:           "image",
      transparent: true,
      format:      "png32",
      // No establecer useCors — esri-leaflet gestiona esto correctamente
      // con el endpoint /export que sí permite CORS desde dominios externos
    });

    dynLayer.on("load", () => setLayerStatus(id, "ok"));
    dynLayer.on("error", () => setLayerStatus(id, "error"));

    dynLayer.addTo(map);
    activeLayers[id] = dynLayer;
    item.classList.add("active");
  }
}

/**
 * Altera a opacidade de uma camada activa.
 * @param {string} id
 * @param {number} value
 */
function setOpacity(id, value) {
  if (activeLayers[id]) activeLayers[id].setOpacity(parseFloat(value));
}

// ── SIDEBAR ───────────────────────────────────────────────────
function buildSidebar(filterText) {
  const panel = document.getElementById("layerPanel");
  panel.innerHTML = "";

  const q = (filterText || "").toLowerCase().trim();

  const cats = {};
  LAYERS.forEach(l => {
    if (!cats[l.cat]) cats[l.cat] = [];
    cats[l.cat].push(l);
  });

  let visCount = 0;

  Object.entries(cats).forEach(([cat, layers]) => {
    const visible = layers.filter(l =>
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.desc.toLowerCase().includes(q)
    );
    if (!visible.length) return;
    visCount += visible.length;

    const group = document.createElement("div");
    group.className = "cat-group open";

    const header = document.createElement("div");
    header.className = "cat-header";
    header.innerHTML = `<span>${cat}</span><span class="cat-arrow">▶</span>`;
    header.addEventListener("click", () => group.classList.toggle("open"));

    const body = document.createElement("div");
    body.className = "cat-body";

    visible.forEach(l => {
      const isActive = !!activeLayers[l.id];
      const opVal    = activeLayers[l.id] ? activeLayers[l.id].options.opacity : 0.75;
      const inputId  = "range-" + l.id;

      const item = document.createElement("div");
      item.className = "layer-item" + (isActive ? " active" : "");
      item.id = "item-" + l.id;
      item.innerHTML = `
        <div class="layer-toggle"></div>
        <div class="layer-info">
          <div class="layer-name">
            ${l.name}
            <span class="layer-status" id="status-${l.id}"></span>
          </div>
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

      body.appendChild(item);
      body.appendChild(opRow);

      if (isActive) {
        requestAnimationFrame(() => setLayerStatus(l.id, "ok"));
      }
    });

    group.appendChild(header);
    group.appendChild(body);
    panel.appendChild(group);
  });

  document.getElementById("layerCount").textContent = visCount;
}

// ── EVENTOS ───────────────────────────────────────────────────
document.getElementById("searchInput").addEventListener("input", e => {
  buildSidebar(e.target.value);
});

buildSidebar();
