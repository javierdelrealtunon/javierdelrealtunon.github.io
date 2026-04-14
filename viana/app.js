/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM
   app.js — Lógica del mapa, capas y sidebar
   ============================================================ */

// ── MAPA ─────────────────────────────────────────────────────
const map = L.map("map", {
  center: [39.5, -8.5],
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
const activeLayers = {}; // id → L.tileLayer.wms

/**
 * Activa ou desactiva uma camada WMS no mapa.
 * @param {string} id - identificador da camada
 */
function toggleLayer(id) {
  const cfg  = LAYERS.find(l => l.id === id);
  const item = document.getElementById("item-" + id);

  if (activeLayers[id]) {
    map.removeLayer(activeLayers[id]);
    delete activeLayers[id];
    item.classList.remove("active");
  } else {
    const wmsLayer = L.tileLayer.wms(cfg.url, {
      layers:      cfg.layer,
      format:      "image/png",
      transparent: true,
      version:     "1.1.1",
      opacity:     0.75,
      attribution: "DGRM / PSOEM Geoportal"
    });
    wmsLayer.addTo(map);
    activeLayers[id] = wmsLayer;
    item.classList.add("active");
  }
}

/**
 * Altera a opacidade de uma camada activa.
 * @param {string} id    - identificador da camada
 * @param {number} value - valor de opacidade (0.1 – 1)
 */
function setOpacity(id, value) {
  if (activeLayers[id]) activeLayers[id].setOpacity(parseFloat(value));
}

// ── SIDEBAR ───────────────────────────────────────────────────
/**
 * Constrói (ou reconstrói) o painel lateral de camadas,
 * opcionalmente filtrando por texto.
 * @param {string} [filterText] - texto de pesquisa
 */
function buildSidebar(filterText) {
  const panel = document.getElementById("layerPanel");
  panel.innerHTML = "";

  const q = (filterText || "").toLowerCase().trim();

  // Agrupar por categoria
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

    // Grupo de categoria
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

      // Item de camada
      const item = document.createElement("div");
      item.className = "layer-item" + (isActive ? " active" : "");
      item.id = "item-" + l.id;
      item.innerHTML = `
        <div class="layer-toggle"></div>
        <div class="layer-info">
          <div class="layer-name">${l.name}</div>
          <div class="layer-desc">${l.desc}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        toggleLayer(l.id);
        buildSidebar(filterText);
      });

      // Controlo de opacidade (aparece quando activo)
      const opRow = document.createElement("div");
      opRow.className = "opacity-row";
      opRow.id = "op-" + l.id;
      opRow.innerHTML = `
        <label>Opacidade</label>
        <input type="range" min="0.1" max="1" step="0.05"
          value="${activeLayers[l.id] ? activeLayers[l.id].options.opacity : 0.75}"
          oninput="setOpacity('${l.id}', this.value)" />
      `;

      body.appendChild(item);
      body.appendChild(opRow);
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

// Arranque
buildSidebar();
