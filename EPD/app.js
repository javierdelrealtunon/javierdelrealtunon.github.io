// ─── Constantes de configuración ───────────────────────────────────────────
const REQUIRED_KEYS = ["name", "lat", "lon"];
const RESERVED_KEYS = ["id", "name", "lat", "lon"];

const INITIAL_CENTER = [20, 0];
const INITIAL_ZOOM = 2;
const PDF_BASE_PATH = "./pdffiles/";

const CATEGORY_COLORS = [
  "#4dc9f6", "#f67019", "#f53794", "#537bc4", "#acc236", "#166a8f",
  "#00a950", "#58595b", "#8549ba", "#ffb000", "#00bcd4", "#ff7043",
  "#7e57c2", "#66bb6a", "#ef5350", "#26a69a", "#ab47bc", "#ffa726",
  "#8d6e63", "#42a5f5"
];

// ─── Traducciones ───────────────────────────────────────────────────────────
const I18N = {
  es: {
    pageTitle: "EPD geolocalizadas",
    pageSubtitle: 'Mapa de declaraciones ambientales de producto (EPD) georreferenciadas a partir del archivo <strong>datos.csv</strong>, con filtro por producto asignado y gráfico de reciclaje vs emisiones.',
    back: "← Volver al índice",
    available: "EPD disponibles",
    loading: "Cargando datos...",
    productFilter: "Producto asignado",
    all: "Todos",
    searchPlaceholder: "Buscar EPD...",
    legendNote: 'El color representa el <strong>producto asignado</strong> y se mantiene igual en mapa, lista y gráfico.',
    distributionTitle: "Distribución por tipo de acero",
    distributionStatus: "El punto resaltado muestra la EPD seleccionada dentro de la distribución de su categoría.",
    gwpBoxTitle: "GWP-total",
    gwpBoxSubtitle: "Distribución por producto asignado",
    recycledBoxTitle: "Contenido reciclado",
    recycledBoxSubtitle: "Distribución por producto asignado",
    scatterPanelTitle: "Reciclaje vs emisiones",
    preparingChart: "Preparando gráfico...",
    noMatch: "No hay EPD que coincidan con el filtro actual.",
    noExtraData: "Sin datos complementarios",
    geolocatedEPD: "EPD geolocalizada",
    location: "Ubicación",
    openPdf: "Abrir PDF",
    viewLocation: "Ver ubicación",
    latitude: "Lat",
    longitude: "Lon",
    loadedData: (visible, total) => `Datos cargados desde datos.csv · ${visible} / ${total} EPD visibles`,
    loadedAllData: total => `Datos cargados desde datos.csv · ${total} EPD`,
    chartPoints: (valid, total) => `Puntos representados: ${valid} de ${total} EPD filtradas.`,
    noValidChartData: "No hay registros con valores numéricos válidos en contenido reciclado y GWP-total.",
    errorReadingCsv: msg => `Error al leer datos.csv: ${msg}`,
    chartBuildError: "No se pudo construir el gráfico.",
    noValidRecords: "No hay registros válidos",
    fileNotFound: "No se encontró datos.csv",
    emptyCsv: "CSV vacío o sin filas de datos",
    requiredColumnsMissing: missing => `Faltan columnas obligatorias: ${missing.join(", ")}`,
    trendLabel: "Tendencia",
    refs: n => `n=${n}`,
    metrics: {
      name: "Nombre",
      lat: "Latitud",
      lon: "Longitud",
      codigo_epd: "Código EPD",
      producto: "Producto",
      producto_asignado: "Producto asignado",
      pais_produccion: "País producción",
      ciudad_produccion: "Ciudad producción",
      centro_produccion: "Centro de producción",
      titular: "Titular",
      compania_verificadora: "Compañía verificadora",
      referencia: "Referencia",
      ruta_de_produccion: "Ruta de producción",
      contenido_reciclado_pct: "Contenido reciclado %",
      gwp_total_kg_co2e_t: "GWP-total (kg CO₂e/t)",
      archivo: "Archivo PDF",
      pdf_url: "PDF",
      caracteristicas_funcionales: "Características funcionales"
    },
    assignedProduct: "Producto asignado",
    recycledContentAxis: "Contenido reciclado (%)",
    gwpAxis: "GWP-total (kg CO₂e/t)",
    recycledTooltip: "Reciclaje",
    gwpTooltip: "CO₂",
    epdCode: "Código EPD",
    selectedCategory: "Categoría",
    googleMapsLabel: "Ver ubicación"
  },
  en: {
    pageTitle: "Geolocated EPDs",
    pageSubtitle: 'Map of Environmental Product Declarations (EPDs) georeferenced from <strong>datos.csv</strong>, with assigned-product filter and recycled-content-vs-emissions chart.',
    back: "← Back to index",
    available: "Available EPDs",
    loading: "Loading data...",
    productFilter: "Assigned product",
    all: "All",
    searchPlaceholder: "Search EPD...",
    legendNote: 'Color represents the <strong>assigned product</strong> and is kept consistent across map, list, and chart.',
    distributionTitle: "Distribution by steel type",
    distributionStatus: "The highlighted point shows the selected EPD within the distribution of its category.",
    gwpBoxTitle: "GWP-total",
    gwpBoxSubtitle: "Distribution by assigned product",
    recycledBoxTitle: "Recycled content",
    recycledBoxSubtitle: "Distribution by assigned product",
    scatterPanelTitle: "Recycled content vs emissions",
    preparingChart: "Preparing chart...",
    noMatch: "No EPDs match the current filter.",
    noExtraData: "No additional data",
    geolocatedEPD: "Geolocated EPD",
    location: "Location",
    openPdf: "Open PDF",
    viewLocation: "View location",
    latitude: "Lat",
    longitude: "Lon",
    loadedData: (visible, total) => `Data loaded from datos.csv · ${visible} / ${total} visible EPDs`,
    loadedAllData: total => `Data loaded from datos.csv · ${total} EPDs`,
    chartPoints: (valid, total) => `Displayed points: ${valid} out of ${total} filtered EPDs.`,
    noValidChartData: "There are no records with valid numeric values for recycled content and GWP-total.",
    errorReadingCsv: msg => `Error reading datos.csv: ${msg}`,
    chartBuildError: "The chart could not be built.",
    noValidRecords: "No valid records",
    fileNotFound: "datos.csv was not found",
    emptyCsv: "Empty CSV or no data rows",
    requiredColumnsMissing: missing => `Missing required columns: ${missing.join(", ")}`,
    trendLabel: "Trend",
    refs: n => `n=${n}`,
    metrics: {
      name: "Name",
      lat: "Latitude",
      lon: "Longitude",
      codigo_epd: "EPD code",
      producto: "Product",
      producto_asignado: "Assigned product",
      pais_produccion: "Production country",
      ciudad_produccion: "Production city",
      centro_produccion: "Production facility",
      titular: "Owner",
      compania_verificadora: "Verifying company",
      referencia: "Reference",
      ruta_de_produccion: "Production route",
      contenido_reciclado_pct: "Recycled content %",
      gwp_total_kg_co2e_t: "GWP-total (kg CO₂e/t)",
      archivo: "PDF file",
      pdf_url: "PDF",
      caracteristicas_funcionales: "Functional characteristics"
    },
    assignedProduct: "Assigned product",
    recycledContentAxis: "Recycled content (%)",
    gwpAxis: "GWP-total (kg CO₂e/t)",
    recycledTooltip: "Recycled content",
    gwpTooltip: "CO₂",
    epdCode: "EPD code",
    selectedCategory: "Category",
    googleMapsLabel: "View location"
  }
};

// ─── Estado global ──────────────────────────────────────────────────────────
let currentLang = localStorage.getItem("epd_lang") || "es";

let allSites = [];
let filteredSites = [];
let selectedId = null;

let map;
let cartoLayer;
let orthoLayer;
let markers = [];
let markerById = new Map();

let scatterChart = null;
const categoryColorMap = new Map();

// ─── Referencias al DOM ─────────────────────────────────────────────────────
const statusEl        = document.getElementById("status");
const chartStatusEl   = document.getElementById("chartStatus");
const siteListEl      = document.getElementById("siteList");
const searchInput     = document.getElementById("searchInput");
const productFilterEl = document.getElementById("productFilter");
const langSwitchEl    = document.getElementById("langSwitch");

// ─── Utilidades de traducción ───────────────────────────────────────────────
function t(key) {
  return I18N[currentLang]?.[key] ?? key;
}

function tm(key) {
  return I18N[currentLang]?.metrics?.[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Aplicar textos estáticos según idioma ──────────────────────────────────
function applyStaticLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  document.getElementById("backLink").textContent           = t("back");
  document.getElementById("pageTitle").textContent          = t("pageTitle");
  document.getElementById("pageSubtitle").innerHTML         = t("pageSubtitle");
  document.getElementById("availableTitle").textContent     = t("available");
  document.getElementById("productFilterLabel").textContent = t("productFilter");
  document.getElementById("searchInput").placeholder        = t("searchPlaceholder");
  document.getElementById("legendNote").innerHTML           = t("legendNote");
  document.getElementById("distributionTitle").textContent  = t("distributionTitle");
  document.getElementById("distributionStatus").textContent = t("distributionStatus");
  document.getElementById("gwpBoxTitle").textContent        = t("gwpBoxTitle");
  document.getElementById("gwpBoxSubtitle").textContent     = t("gwpBoxSubtitle");
  document.getElementById("recycledBoxTitle").textContent   = t("recycledBoxTitle");
  document.getElementById("recycledBoxSubtitle").textContent= t("recycledBoxSubtitle");
  document.getElementById("scatterPanelTitle").textContent  = t("scatterPanelTitle");

  if (!allSites.length) {
    statusEl.textContent    = t("loading");
    chartStatusEl.textContent = t("preparingChart");
  }
}

// ─── Parseo de CSV ──────────────────────────────────────────────────────────
function detectDelimiter(headerLine) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas     = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function splitCSVLine(line, delimiter) {
  const result = [];
  let current  = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCoordinate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return NaN;

  if (/[.,]/.test(raw)) return parseFloat(raw.replace(",", "."));

  const sign   = raw.startsWith("-") ? -1 : 1;
  const digits = raw.replace(/^[+-]/, "");

  if (!/^\d+$/.test(digits)) return NaN;

  if (digits.length >= 3) {
    const whole   = digits.slice(0, digits.length - 2);
    const decimal = digits.slice(-2);
    return sign * parseFloat(`${whole}.${decimal}`);
  }

  return sign * parseFloat(digits);
}

function parseLocaleNumber(value) {
  let raw = String(value ?? "").trim();
  if (!raw) return NaN;

  raw = raw.replace(/\s+/g, "").replace(/[%‰]/g, "").replace(/[^\d,.\-]/g, "");
  if (!raw) return NaN;

  const hasComma = raw.includes(",");
  const hasDot   = raw.includes(".");

  if (hasComma && hasDot) {
    raw = raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  } else if (hasComma) {
    raw = raw.replace(",", ".");
  }

  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : NaN;
}

// ─── Datos y categorías ─────────────────────────────────────────────────────
function getAssignedProduct(site) {
  const value = site?.raw?.producto_asignado;
  return value && String(value).trim() !== ""
    ? String(value).trim()
    : (currentLang === "es" ? "Sin asignar" : "Unassigned");
}

function getColorForCategory(category) {
  const key = category || (currentLang === "es" ? "Sin asignar" : "Unassigned");
  if (!categoryColorMap.has(key)) {
    categoryColorMap.set(key, CATEGORY_COLORS[categoryColorMap.size % CATEGORY_COLORS.length]);
  }
  return categoryColorMap.get(key);
}

function getCategoryCounts(sites) {
  const counts = new Map();
  sites.forEach(site => {
    const key = site.productAssigned;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function formatCategoryWithCount(category, count) {
  return `${category} (${t("refs")(count)})`;
}

function labelFromKey(key) {
  return tm(key);
}

// ─── Rutas de PDF ───────────────────────────────────────────────────────────
function getPdfSubdir(site) {
  const explicitFolder = String(site?.raw?.pdf_subdir || site?.raw?.pdf_folder || "").trim();
  if (explicitFolder) {
    return explicitFolder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  }

  const productAssigned = String(site?.productAssigned || "").trim();
  const normalized = productAssigned
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("b500sd")) return "B500SD";
  if (normalized.includes("y1860") && normalized.includes("s7")) return "Y1860_S7";
  if (normalized.includes("s355") && normalized.includes("offshore")) return "S355_Offshore";

  return slugify(productAssigned).replace(/-/g, "_");
}

function buildPdfHref(site) {
  const archivoRaw = String(site?.raw?.archivo || "").trim();
  if (!archivoRaw) {
    const pdfUrl = String(site?.raw?.pdf_url || "").trim();
    return pdfUrl || "";
  }

  const fileName = archivoRaw.split(/[\\/]/).pop().trim();
  const subdir   = getPdfSubdir(site);

  const safeFileName = fileName.split("/").filter(Boolean)
    .map(part => encodeURIComponent(part)).join("/");
  const safeSubdir   = String(subdir || "").split("/").filter(Boolean)
    .map(part => encodeURIComponent(part)).join("/");

  return safeSubdir
    ? `${PDF_BASE_PATH}${safeSubdir}/${safeFileName}`
    : `${PDF_BASE_PATH}${safeFileName}`;
}

// ─── Subtítulos de lista y popup ────────────────────────────────────────────
function getListSubtitle(site) {
  const candidates = ["pais_produccion", "ciudad_produccion", "producto_asignado", "producto"];
  const parts = candidates
    .map(k => site.raw[k])
    .filter(v => v && String(v).trim() !== "");
  return parts.join(" · ") || t("noExtraData");
}

function getPopupSubtitle(site) {
  const producto = String(site.raw.producto || "").trim();
  return producto || t("geolocatedEPD");
}

// ─── Parseo del CSV ─────────────────────────────────────────────────────────
function parseCSV(text) {
  const cleanedText = text.replace(/^\uFEFF/, "").trim();
  const lines       = cleanedText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error(t("emptyCsv"));

  const delimiter = detectDelimiter(lines[0]);
  const headers   = splitCSVLine(lines[0], delimiter).map(h => h.trim());
  const missing   = REQUIRED_KEYS.filter(k => !headers.includes(k));

  if (missing.length) throw new Error(t("requiredColumnsMissing")(missing));

  return lines.slice(1).map((line, idx) => {
    const values = splitCSVLine(line, delimiter);
    const raw    = {};
    headers.forEach((header, i) => { raw[header] = (values[i] || "").trim(); });

    const site = {
      id:   raw.id || slugify(raw.name) || `epd-${idx + 1}`,
      name: raw.name || `EPD ${idx + 1}`,
      lat:  parseCoordinate(raw.lat),
      lon:  parseCoordinate(raw.lon),
      raw
    };

    if (Number.isNaN(site.lat) || Number.isNaN(site.lon)) return null;

    site.productAssigned = getAssignedProduct(site);
    site.recycledPct     = parseLocaleNumber(site.raw.contenido_reciclado_pct);
    site.gwp             = parseLocaleNumber(site.raw.gwp_total_kg_co2e_t);

    return site;
  }).filter(Boolean);
}

// ─── Lista lateral ──────────────────────────────────────────────────────────
function populateProductFilter() {
  const currentValue = productFilterEl.value;
  const products = Array.from(new Set(allSites.map(site => site.productAssigned)))
    .sort((a, b) => a.localeCompare(b, currentLang, { sensitivity: "base" }));

  productFilterEl.innerHTML =
    `<option value="">${escapeHtml(t("all"))}</option>` +
    products.map(product =>
      `<option value="${escapeHtml(product)}">${escapeHtml(product)}</option>`
    ).join("");

  if (products.includes(currentValue)) productFilterEl.value = currentValue;
}

function renderList() {
  siteListEl.innerHTML = "";

  if (!filteredSites.length) {
    siteListEl.innerHTML = `<div class="empty">${escapeHtml(t("noMatch"))}</div>`;
    return;
  }

  filteredSites.forEach(site => {
    const btn = document.createElement("button");
    btn.className = "site-btn" + (site.id === selectedId ? " active" : "");
    btn.innerHTML = `
      <strong>
        <span class="dot" style="background:${escapeHtml(getColorForCategory(site.productAssigned))};"></span>
        ${escapeHtml(site.name)}
      </strong>
      <span>${escapeHtml(getListSubtitle(site))}</span>
    `;
    btn.addEventListener("click", () => selectSite(site.id, true, true));
    siteListEl.appendChild(btn);
  });
}

// ─── Popup del mapa ─────────────────────────────────────────────────────────
function buildPopupHtml(site) {
  const popupKeys = ["contenido_reciclado_pct", "gwp_total_kg_co2e_t"]
    .filter(key => site.raw[key] && String(site.raw[key]).trim() !== "");

  const popupItems = popupKeys.length
    ? popupKeys.map(key => `
        <div class="popup-item">
          <span class="k">${escapeHtml(labelFromKey(key))}</span>
          <span class="v">${escapeHtml(site.raw[key])}</span>
        </div>
      `).join("")
    : `
        <div class="popup-item">
          <span class="k">${escapeHtml(t("location"))}</span>
          <span class="v">${escapeHtml(t("latitude"))} ${site.lat.toFixed(4)}, ${escapeHtml(t("longitude"))} ${site.lon.toFixed(4)}</span>
        </div>
      `;

  const pdfHref = buildPdfHref(site);

  return `
    <div class="popup-shell">
      <div class="popup-head">
        <div class="popup-title">${escapeHtml(site.name)}</div>
        <div class="popup-subtitle">${escapeHtml(getPopupSubtitle(site))}</div>
      </div>
      <div class="popup-grid">${popupItems}</div>
      <div class="popup-links">
        ${pdfHref ? `<a class="popup-link" href="${escapeHtml(pdfHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("openPdf"))}</a>` : ""}
        <a class="popup-link" href="https://www.google.com/maps?q=${site.lat},${site.lon}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("googleMapsLabel"))}</a>
      </div>
    </div>
  `;
}

// ─── Mapa ───────────────────────────────────────────────────────────────────
function initMap() {
  cartoLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  });

  orthoLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles &copy; Esri" }
  );

  map = L.map("map", { center: INITIAL_CENTER, zoom: INITIAL_ZOOM, layers: [cartoLayer] });

  L.control.layers(
    { "Cartografía / Map": cartoLayer, "Ortofoto / Imagery": orthoLayer },
    {},
    { collapsed: false }
  ).addTo(map);
}

function getMarkerStyle(site, isSelected = false) {
  return {
    radius:      isSelected ? 10 : 7,
    fillColor:   getColorForCategory(site.productAssigned),
    color:       isSelected ? "#ffffff" : "rgba(255,255,255,0.72)",
    weight:      isSelected ? 3 : 1.5,
    opacity:     1,
    fillOpacity: isSelected ? 1 : 0.88
  };
}

function updateMarkerStyles() {
  markerById.forEach((marker, id) => {
    const site = allSites.find(s => s.id === id);
    if (!site) return;
    marker.setStyle(getMarkerStyle(site, id === selectedId));
  });
}

function renderMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers    = [];
  markerById = new Map();

  if (!filteredSites.length) {
    map.setView(INITIAL_CENTER, INITIAL_ZOOM);
    return;
  }

  const bounds = [];

  filteredSites.forEach(site => {
    const marker = L.circleMarker([site.lat, site.lon], getMarkerStyle(site, site.id === selectedId))
      .addTo(map);

    marker.bindPopup(buildPopupHtml(site), { maxWidth: 580, minWidth: 320, autoPan: true });

    marker.on("click", () => {
      selectedId = site.id;
      renderList();
      updateMarkerStyles();
      renderScatterPlot();
      renderBoxplots();
    });

    markers.push(marker);
    markerById.set(site.id, marker);
    bounds.push([site.lat, site.lon]);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 6);
  } else {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

// ─── Gráfico de dispersión ──────────────────────────────────────────────────
function computeTrendLine(points) {
  if (!points || points.length < 2) return null;

  const xs  = points.map(p => p.x);
  const ys  = points.map(p => p.y);
  const n   = points.length;
  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = (n * sumXX) - (sumX * sumX);

  if (!Number.isFinite(denom) || denom === 0) return null;

  const slope     = ((n * sumXY) - (sumX * sumY)) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const minX      = Math.min(...xs);
  const maxX      = Math.max(...xs);

  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept }
  ];
}

function renderScatterPlot() {
  const chartCanvas  = document.getElementById("scatterChart");
  const validSites   = filteredSites.filter(site =>
    Number.isFinite(site.recycledPct) && Number.isFinite(site.gwp)
  );

  if (scatterChart) { scatterChart.destroy(); scatterChart = null; }

  if (!validSites.length) {
    chartStatusEl.textContent = t("noValidChartData");
    return;
  }

  const grouped       = new Map();
  const categoryCounts = getCategoryCounts(validSites);

  validSites.forEach(site => {
    const category = site.productAssigned;
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push({
      x: site.recycledPct, y: site.gwp,
      siteId: site.id, label: site.name,
      productAssigned: site.productAssigned,
      codigo: site.raw.codigo_epd || "",
      archivo: site.raw.archivo || ""
    });
  });

  const datasets = [];

  Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0], currentLang, { sensitivity: "base" }))
    .forEach(([category, data]) => {
      const color         = getColorForCategory(category);
      const count         = categoryCounts.get(category) || data.length;
      const categoryLabel = formatCategoryWithCount(category, count);

      datasets.push({
        label: categoryLabel, data,
        showLine: false,
        borderColor: color, backgroundColor: color,
        pointRadius:      ctx => ctx.raw.siteId === selectedId ? 8 : 5,
        pointHoverRadius: 9,
        pointBorderColor: "#ffffff",
        pointBorderWidth: ctx => ctx.raw.siteId === selectedId ? 2.5 : 1.2,
        order: 2
      });

      const trendLine = computeTrendLine(data);
      if (trendLine) {
        datasets.push({
          label: `${categoryLabel} · ${t("trendLabel")}`,
          data: trendLine, type: "line",
          showLine: true, parsing: false,
          borderColor: color, backgroundColor: color,
          borderWidth: 2, borderDash: [6, 4],
          pointRadius: 0, pointHoverRadius: 0,
          fill: false, tension: 0, order: 1
        });
      }
    });

  scatterChart = new Chart(chartCanvas, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false, parsing: false,
      plugins: {
        legend: {
          labels: {
            color: "#eaf1ff",
            filter(item, chartData) {
              return !!chartData.datasets[item.datasetIndex].label;
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(10,16,29,0.95)",
          borderColor: "rgba(102,179,255,0.35)", borderWidth: 1,
          titleColor: "#ffffff", bodyColor: "#eaf1ff",
          callbacks: {
            label(context) {
              const raw = context.raw;
              if (!raw?.siteId) return context.dataset?.label || "";
              return [
                raw.label,
                `${t("assignedProduct")}: ${raw.productAssigned}`,
                `${t("recycledTooltip")}: ${raw.x} %`,
                `${t("gwpTooltip")}: ${raw.y} kg CO₂e/t`,
                raw.codigo ? `${t("epdCode")}: ${raw.codigo}` : null
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        x: {
          min: 0, max: 100,
          title: { display: true, text: t("recycledContentAxis"), color: "#eaf1ff" },
          ticks: { color: "#9db0d1" },
          grid:  { color: "rgba(157,176,209,0.15)" }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: t("gwpAxis"), color: "#eaf1ff" },
          ticks: { color: "#9db0d1" },
          grid:  { color: "rgba(157,176,209,0.15)" }
        }
      },
      onClick(event, elements, chart) {
        if (!elements.length) return;
        const first = elements[0];
        const raw   = chart.data.datasets[first.datasetIndex].data[first.index];
        if (raw?.siteId) selectSite(raw.siteId, true, true);
      }
    }
  });

  chartStatusEl.textContent = t("chartPoints")(validSites.length, filteredSites.length);
}

// ─── Boxplots ───────────────────────────────────────────────────────────────
function getPlotlyBaseLayout(yTitle) {
  return {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 56, r: 12, t: 8, b: 92 },
    autosize: true, showlegend: false,
    font: { color: "#eaf1ff", family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    xaxis: { title: "", tickangle: -24, automargin: true, color: "#9db0d1", gridcolor: "rgba(157,176,209,0.08)", zeroline: false },
    yaxis: { title: yTitle, automargin: true, color: "#9db0d1", gridcolor: "rgba(157,176,209,0.15)", zeroline: false }
  };
}

function renderSingleBoxplot(targetId, accessor, yTitle) {
  const validSites = filteredSites.filter(site => Number.isFinite(accessor(site)));
  const targetEl   = document.getElementById(targetId);

  if (!validSites.length) {
    Plotly.purge(targetEl);
    targetEl.innerHTML = "";
    return;
  }

  const categoryCounts  = getCategoryCounts(validSites);
  const categories      = Array.from(new Set(validSites.map(site => site.productAssigned)))
    .sort((a, b) => a.localeCompare(b, currentLang, { sensitivity: "base" }));
  const categoryLabelMap = new Map(
    categories.map(cat => [cat, formatCategoryWithCount(cat, categoryCounts.get(cat) || 0)])
  );

  const traces = categories.map(category => {
    const sitesInCategory = validSites.filter(s => s.productAssigned === category);
    const color = getColorForCategory(category);
    return {
      type: "box", name: categoryLabelMap.get(category),
      y: sitesInCategory.map(s => accessor(s)),
      boxpoints: false,
      line: { color, width: 1.8 },
      fillcolor: "rgba(102,179,255,0.14)",
      marker: { color },
      hovertemplate:
        `<b>${escapeHtml(categoryLabelMap.get(category))}</b><br>` +
        `${escapeHtml(yTitle)}: %{y}<extra></extra>`
    };
  });

  const selectedSite = validSites.find(s => s.id === selectedId);
  if (selectedSite) {
    traces.push({
      type: "scatter", mode: "markers",
      x: [categoryLabelMap.get(selectedSite.productAssigned)],
      y: [accessor(selectedSite)],
      marker: { size: 12, color: "#ffffff", line: { color: "#111827", width: 2 } },
      hovertemplate:
        `<b>${escapeHtml(selectedSite.name)}</b><br>` +
        `${escapeHtml(t("selectedCategory"))}: ${escapeHtml(categoryLabelMap.get(selectedSite.productAssigned))}<br>` +
        `${escapeHtml(yTitle)}: ${accessor(selectedSite)}<extra></extra>`
    });
  }

  Plotly.react(targetEl, traces, getPlotlyBaseLayout(yTitle), {
    responsive: true, displayModeBar: false
  });
}

function renderBoxplots() {
  renderSingleBoxplot("boxplotGwp",      site => site.gwp,         t("gwpAxis"));
  renderSingleBoxplot("boxplotRecycled", site => site.recycledPct, t("recycledContentAxis"));
}

// ─── Filtros y selección ────────────────────────────────────────────────────
function applyFilter() {
  const q               = searchInput.value.trim().toLowerCase();
  const selectedProduct = productFilterEl.value.trim();

  filteredSites = allSites.filter(site => {
    const matchesProduct = !selectedProduct || site.productAssigned === selectedProduct;
    const haystack       = Object.values(site.raw).join(" ").toLowerCase();
    const matchesSearch  = !q || haystack.includes(q);
    return matchesProduct && matchesSearch;
  });

  if (!filteredSites.some(s => s.id === selectedId)) {
    selectedId = filteredSites.length ? filteredSites[0].id : null;
  }

  statusEl.textContent = t("loadedData")(filteredSites.length, allSites.length);

  renderList();
  renderMarkers();
  renderScatterPlot();
  renderBoxplots();
}

function selectSite(id, centerMap, openPopup) {
  selectedId = id;
  renderList();
  updateMarkerStyles();
  renderScatterPlot();
  renderBoxplots();

  if (!map) return;

  const site   = allSites.find(s => s.id === id);
  const marker = markerById.get(id);

  if (site && centerMap)    map.setView([site.lat, site.lon], Math.max(map.getZoom(), 5));
  if (marker && openPopup)  marker.openPopup();
}

// ─── Carga de datos ─────────────────────────────────────────────────────────
async function loadData() {
  try {
    const response = await fetch("./datos.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(t("fileNotFound"));

    const text = await response.text();
    allSites   = parseCSV(text);

    if (!allSites.length) throw new Error(t("noValidRecords"));

    populateProductFilter();

    filteredSites = [...allSites];
    selectedId    = filteredSites.length ? filteredSites[0].id : null;

    statusEl.textContent = t("loadedAllData")(allSites.length);
    renderList();
    renderMarkers();
    renderScatterPlot();
    renderBoxplots();

    setTimeout(() => {
      map.invalidateSize();
      window.dispatchEvent(new Event("resize"));
    }, 80);
  } catch (error) {
    statusEl.textContent    = t("errorReadingCsv")(error.message);
    chartStatusEl.textContent = t("chartBuildError");
    allSites      = [];
    filteredSites = [];
    selectedId    = null;
    renderList();
    Plotly.purge("boxplotGwp");
    Plotly.purge("boxplotRecycled");
  }
}

// ─── Cambio de idioma ───────────────────────────────────────────────────────
function rerenderLanguage() {
  applyStaticLanguage();
  populateProductFilter();

  if (allSites.length) {
    applyFilter();
  } else {
    statusEl.textContent      = t("loading");
    chartStatusEl.textContent = t("preparingChart");
  }
}

// ─── Inicialización ─────────────────────────────────────────────────────────
searchInput.addEventListener("input", applyFilter);
productFilterEl.addEventListener("change", applyFilter);

langSwitchEl.value = currentLang;
langSwitchEl.addEventListener("change", (e) => {
  currentLang = e.target.value;
  localStorage.setItem("epd_lang", currentLang);
  rerenderLanguage();
});

applyStaticLanguage();
initMap();
loadData();

window.addEventListener("resize", () => {
  if (map) setTimeout(() => map.invalidateSize(), 50);
});
