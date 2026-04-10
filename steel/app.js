// ─── Constantes de configuración ───────────────────────────────────────────
const REQUIRED_KEYS = ["name", "lat", "lon"];
const INITIAL_CENTER = [20, 0];
const INITIAL_ZOOM   = 2;
const PDF_BASE_PATH  = "./pdffiles/";

const CATEGORY_COLORS = [
  "#4dc9f6", "#f67019", "#f53794", "#537bc4", "#acc236", "#166a8f",
  "#00a950", "#58595b", "#8549ba", "#ffb000", "#00bcd4", "#ff7043",
  "#7e57c2", "#66bb6a", "#ef5350", "#26a69a", "#ab47bc", "#ffa726",
  "#8d6e63", "#42a5f5"
];

// Mapa de país (en minúsculas) → continente
const COUNTRY_TO_CONTINENT = {
  // Europa
  "españa": "Europa",        "spain": "Europa",
  "alemania": "Europa",      "germany": "Europa",
  "francia": "Europa",       "france": "Europa",
  "italia": "Europa",        "italy": "Europa",
  "reino unido": "Europa",   "united kingdom": "Europa",
  "suecia": "Europa",        "sweden": "Europa",
  "noruega": "Europa",       "norway": "Europa",
  "finlandia": "Europa",     "finland": "Europa",
  "dinamarca": "Europa",     "denmark": "Europa",
  "países bajos": "Europa",  "netherlands": "Europa",
  "holanda": "Europa",
  "bélgica": "Europa",       "belgium": "Europa",
  "austria": "Europa",
  "suiza": "Europa",         "switzerland": "Europa",
  "portugal": "Europa",
  "polonia": "Europa",       "poland": "Europa",
  "república checa": "Europa", "czech republic": "Europa",
  "eslovaquia": "Europa",    "slovakia": "Europa",
  "hungría": "Europa",       "hungary": "Europa",
  "rumanía": "Europa",       "romania": "Europa",
  "bulgaria": "Europa",
  "grecia": "Europa",        "greece": "Europa",
  "turquía": "Europa",       "turkey": "Europa",
  "ucrania": "Europa",       "ukraine": "Europa",
  "rusia": "Europa",         "russia": "Europa",
  "luxemburgo": "Europa",    "luxembourg": "Europa",
  "croacia": "Europa",       "croatia": "Europa",
  "eslovenia": "Europa",     "slovenia": "Europa",
  "serbia": "Europa",
  "lituania": "Europa",      "lithuania": "Europa",
  "letonia": "Europa",       "latvia": "Europa",
  "estonia": "Europa",

  // América del Norte
  "estados unidos": "América del Norte", "united states": "América del Norte", "usa": "América del Norte",
  "canadá": "América del Norte",         "canada": "América del Norte",
  "méxico": "América del Norte",         "mexico": "América del Norte",

  // América del Sur
  "brasil": "América del Sur",  "brazil": "América del Sur",
  "argentina": "América del Sur",
  "chile": "América del Sur",
  "colombia": "América del Sur",
  "perú": "América del Sur",    "peru": "América del Sur",
  "venezuela": "América del Sur",
  "ecuador": "América del Sur",

  // Asia
  "china": "Asia",
  "japón": "Asia",          "japan": "Asia",
  "corea del sur": "Asia",  "south korea": "Asia",
  "india": "Asia",
  "taiwán": "Asia",         "taiwan": "Asia",
  "vietnam": "Asia",
  "indonesia": "Asia",
  "tailandia": "Asia",      "thailand": "Asia",
  "malasia": "Asia",        "malaysia": "Asia",
  "singapur": "Asia",       "singapore": "Asia",

  // Oriente Medio
  "emiratos árabes": "Oriente Medio", "uae": "Oriente Medio",
  "arabia saudí": "Oriente Medio",    "saudi arabia": "Oriente Medio",
  "qatar": "Oriente Medio",
  "irán": "Oriente Medio",            "iran": "Oriente Medio",

  // África
  "sudáfrica": "África",    "south africa": "África",
  "egipto": "África",       "egypt": "África",
  "marruecos": "África",    "morocco": "África",

  // Oceanía
  "australia": "Oceanía",
  "nueva zelanda": "Oceanía", "new zealand": "Oceanía",
};

// ─── Traducciones ───────────────────────────────────────────────────────────
const I18N = {
  es: {
    pageTitle: "Steel EPDs for Offshore Wind",
    pageSubtitle: "",
    back: "← Volver al índice",
    loading: "Cargando datos...",
    continentFilter: "Continente",
    countryFilter: "País de producción",
    productFilter: "Tipo de acero",
    searchLabel: "Buscar",
    searchPlaceholder: "Nombre, código…",
    allContinents: "Todos los continentes",
    allCountries: "Todos los países",
    all: "Todos",
    distributionTitle: "Distribución por tipo de acero",
    distributionStatus: "El punto resaltado muestra la EPD seleccionada dentro de la distribución de su categoría.",
    gwpBoxTitle: "GWP-total",
    gwpBoxSubtitle: "Distribución por producto asignado",
    recycledBoxTitle: "Contenido reciclado",
    recycledBoxSubtitle: "Distribución por producto asignado",
    scatterPanelTitle: "Reciclaje vs emisiones",
    preparingChart: "Preparando gráfico...",
    noValidChartData: "No hay registros con valores numéricos válidos en contenido reciclado y GWP-total.",
    errorReadingCsv: msg => `Error al leer datos.csv: ${msg}`,
    chartBuildError: "No se pudo construir el gráfico.",
    noValidRecords: "No hay registros válidos",
    fileNotFound: "No se encontró datos.csv",
    emptyCsv: "CSV vacío o sin filas de datos",
    requiredColumnsMissing: missing => `Faltan columnas obligatorias: ${missing.join(", ")}`,
    trendLabel: "Tendencia",
    globalTrendLabel: "Tendencia global",
    refs: n => `n=${n}`,
    loadedData: (visible, total) => `${visible} / ${total} EPD visibles`,
    loadedAllData: total => `${total} EPD cargadas`,
    chartPoints: (valid, total) => `Puntos representados: ${valid} de ${total} EPD filtradas.`,
    noExtraData: "Sin datos complementarios",
    geolocatedEPD: "EPD geolocalizada",
    location: "Ubicación",
    openPdf: "Abrir PDF",
    latitude: "Lat",
    longitude: "Lon",
    googleMapsLabel: "Ver ubicación",
    assignedProduct: "Producto asignado",
    recycledContentAxis: "Contenido reciclado (%)",
    gwpAxis: "GWP-total (kg CO₂e/t)",
    recycledTooltip: "Reciclaje",
    gwpTooltip: "CO₂",
    epdCode: "Código EPD",
    selectedCategory: "Categoría",
    unknownContinent: "Sin datos",
    expandMap: "Ampliar mapa",
    closeMap: "Cerrar mapa",
    metrics: {
      name: "Nombre", lat: "Latitud", lon: "Longitud",
      codigo_epd: "Código EPD", producto: "Producto",
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
      archivo: "Archivo PDF", pdf_url: "PDF",
      caracteristicas_funcionales: "Características funcionales"
    }
  },
  en: {
    pageTitle: "Steel EPDs for Offshore Wind",
    pageSubtitle: "",
    back: "← Back to index",
    loading: "Loading data...",
    continentFilter: "Continent",
    countryFilter: "Production country",
    productFilter: "Steel type",
    searchLabel: "Search",
    searchPlaceholder: "Name, code…",
    allContinents: "All continents",
    allCountries: "All countries",
    all: "All",
    distributionTitle: "Distribution by steel type",
    distributionStatus: "The highlighted point shows the selected EPD within the distribution of its category.",
    gwpBoxTitle: "GWP-total",
    gwpBoxSubtitle: "Distribution by assigned product",
    recycledBoxTitle: "Recycled content",
    recycledBoxSubtitle: "Distribution by assigned product",
    scatterPanelTitle: "Recycled content vs emissions",
    preparingChart: "Preparing chart...",
    noValidChartData: "There are no records with valid numeric values for recycled content and GWP-total.",
    errorReadingCsv: msg => `Error reading datos.csv: ${msg}`,
    chartBuildError: "The chart could not be built.",
    noValidRecords: "No valid records",
    fileNotFound: "datos.csv was not found",
    emptyCsv: "Empty CSV or no data rows",
    requiredColumnsMissing: missing => `Missing required columns: ${missing.join(", ")}`,
    trendLabel: "Trend",
    globalTrendLabel: "Global trend",
    refs: n => `n=${n}`,
    loadedData: (visible, total) => `${visible} / ${total} visible EPDs`,
    loadedAllData: total => `${total} EPDs loaded`,
    chartPoints: (valid, total) => `Displayed points: ${valid} out of ${total} filtered EPDs.`,
    noExtraData: "No additional data",
    geolocatedEPD: "Geolocated EPD",
    location: "Location",
    openPdf: "Open PDF",
    latitude: "Lat",
    longitude: "Lon",
    googleMapsLabel: "View location",
    assignedProduct: "Assigned product",
    recycledContentAxis: "Recycled content (%)",
    gwpAxis: "GWP-total (kg CO₂e/t)",
    recycledTooltip: "Recycled content",
    gwpTooltip: "CO₂",
    epdCode: "EPD code",
    selectedCategory: "Category",
    unknownContinent: "No data",
    expandMap: "Expand map",
    closeMap: "Close map",
    metrics: {
      name: "Name", lat: "Latitude", lon: "Longitude",
      codigo_epd: "EPD code", producto: "Product",
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
      archivo: "PDF file", pdf_url: "PDF",
      caracteristicas_funcionales: "Functional characteristics"
    }
  }
};

// ─── Estado global ──────────────────────────────────────────────────────────
let currentLang   = localStorage.getItem("epd_lang") || "es";
let allSites      = [];
let filteredSites = [];
let selectedId    = null;

let map, cartoLayer, orthoLayer;
let markers = [];
let markerById = new Map();
let scatterChart = null;
const categoryColorMap = new Map();

// ─── Referencias al DOM ─────────────────────────────────────────────────────
const statusEl          = document.getElementById("status");
const chartStatusEl     = document.getElementById("chartStatus");
const searchInput       = document.getElementById("searchInput");
const continentFilterEl = document.getElementById("continentFilter");
const countryFilterEl   = document.getElementById("countryFilter");
const productFilterEl   = document.getElementById("productFilter");
const langSwitchEl      = document.getElementById("langSwitch");
const mapPanelEl        = document.getElementById("mapPanel");
const mapExpandBtn      = document.getElementById("mapExpandBtn");

// ─── Utilidades ─────────────────────────────────────────────────────────────
function t(key) {
  return I18N[currentLang]?.[key] ?? key;
}

function tm(key) {
  return I18N[currentLang]?.metrics?.[key]
    ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(text) {
  return String(text || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Idioma ─────────────────────────────────────────────────────────────────
function applyStaticLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  document.getElementById("backLink").textContent = t("back");
  document.getElementById("pageTitle").textContent = t("pageTitle");
  const subtitleEl = document.getElementById("pageSubtitle");
  if (subtitleEl) subtitleEl.innerHTML = t("pageSubtitle");
  document.getElementById("continentFilterLabel").textContent = t("continentFilter");
  document.getElementById("countryFilterLabel").textContent = t("countryFilter");
  document.getElementById("productFilterLabel").textContent = t("productFilter");
  document.getElementById("searchLabel").textContent = t("searchLabel");
  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("distributionTitle").textContent = t("distributionTitle");
  document.getElementById("distributionStatus").textContent = t("distributionStatus");
  document.getElementById("gwpBoxTitle").textContent = t("gwpBoxTitle");
  document.getElementById("gwpBoxSubtitle").textContent = t("gwpBoxSubtitle");
  document.getElementById("recycledBoxTitle").textContent = t("recycledBoxTitle");
  document.getElementById("recycledBoxSubtitle").textContent = t("recycledBoxSubtitle");
  document.getElementById("scatterPanelTitle").textContent = t("scatterPanelTitle");

  if (!allSites.length) {
    statusEl.textContent = t("loading");
    chartStatusEl.textContent = t("preparingChart");
  }

  if (mapExpandBtn) {
    const isExpanded = mapPanelEl?.classList.contains("map-fullscreen");
    mapExpandBtn.textContent = isExpanded ? t("closeMap") : t("expandMap");
    mapExpandBtn.setAttribute("aria-label", isExpanded ? t("closeMap") : t("expandMap"));
  }
}

// ─── Mapa de normalización: valor CSV → etiqueta de visualización ────────────
const CONTINENT_DISPLAY = {
  "europa":        "Europa",
  "europa / asia": "Europa / Asia",
  "asia":          "Asia",
  "america":       "América",
  "africa":        "África",
  "medio oriente": "Medio Oriente",
  "oceania":       "Oceanía",
};

// ─── Continente ─────────────────────────────────────────────────────────────
function getContinentForSite(site) {
  // 1. Usar directamente la columna Continente del CSV
  const raw = String(site?.raw?.Continente || "").trim();
  if (raw) {
    const key = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (CONTINENT_DISPLAY[key]) return CONTINENT_DISPLAY[key];
    // Si el valor existe pero no está en el mapa, devolverlo en title case
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  // 2. Fallback: buscar por país (para registros sin columna Continente)
  const country = String(site?.raw?.pais_produccion || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, continent] of Object.entries(COUNTRY_TO_CONTINENT)) {
    const keyNorm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (country === keyNorm) return continent;
  }
  return t("unknownContinent");
}

// ─── Parseo de CSV ──────────────────────────────────────────────────────────
function detectDelimiter(headerLine) {
  const sc = (headerLine.match(/;/g) || []).length;
  const co = (headerLine.match(/,/g) || []).length;
  return sc > co ? ";" : ",";
}

function splitCSVLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

function parseCoordinate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return NaN;
  if (/[.,]/.test(raw)) return parseFloat(raw.replace(",", "."));

  const sign = raw.startsWith("-") ? -1 : 1;
  const digits = raw.replace(/^[+-]/, "");
  if (!/^\d+$/.test(digits)) return NaN;

  if (digits.length >= 3) {
    return sign * parseFloat(`${digits.slice(0, digits.length - 2)}.${digits.slice(-2)}`);
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
  sites.forEach(site => counts.set(site.productAssigned, (counts.get(site.productAssigned) || 0) + 1));
  return counts;
}

function formatCategoryWithCount(category, count) {
  return `${category} (${t("refs")(count)})`;
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error(t("emptyCsv"));

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delimiter).map(h => h.trim());
  const missing = REQUIRED_KEYS.filter(k => !headers.includes(k));
  if (missing.length) throw new Error(t("requiredColumnsMissing")(missing));

  return lines.slice(1).map((line, idx) => {
    const values = splitCSVLine(line, delimiter);
    const raw = {};
    headers.forEach((h, i) => { raw[h] = (values[i] || "").trim(); });

    const site = {
      id: raw.id || slugify(raw.name) || `epd-${idx + 1}`,
      name: raw.name || `EPD ${idx + 1}`,
      lat: parseCoordinate(raw.lat),
      lon: parseCoordinate(raw.lon),
      raw
    };

    if (Number.isNaN(site.lat) || Number.isNaN(site.lon)) return null;

    site.productAssigned = getAssignedProduct(site);
    site.recycledPct = parseLocaleNumber(site.raw.contenido_reciclado_pct);
    site.gwp = parseLocaleNumber(site.raw.gwp_total_kg_co2e_t);

    return site;
  }).filter(Boolean);
}

// ─── Filtros desplegables ───────────────────────────────────────────────────
function populateAllFilters() {
  const continentSel = continentFilterEl.value;
  const countrySel   = countryFilterEl.value;
  const productSel   = productFilterEl.value;

  allSites.forEach(site => { site.continent = getContinentForSite(site); });

  const continents = Array.from(new Set(allSites.map(s => s.continent))).sort();
  continentFilterEl.innerHTML =
    `<option value="">${escapeHtml(t("allContinents"))}</option>` +
    continents.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (continents.includes(continentSel)) continentFilterEl.value = continentSel;

  updateCountryFilter(continentFilterEl.value, countrySel);

  const products = Array.from(new Set(allSites.map(s => s.productAssigned)))
    .sort((a, b) => a.localeCompare(b, currentLang, { sensitivity: "base" }));
  productFilterEl.innerHTML =
    `<option value="">${escapeHtml(t("all"))}</option>` +
    products.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  if (products.includes(productSel)) productFilterEl.value = productSel;
}

function updateCountryFilter(selectedContinent, keepValue = "") {
  const sourceSites = selectedContinent
    ? allSites.filter(s => s.continent === selectedContinent)
    : allSites;

  const countries = Array.from(new Set(
    sourceSites.map(s => String(s.raw.pais_produccion || "").trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, currentLang, { sensitivity: "base" }));

  countryFilterEl.innerHTML =
    `<option value="">${escapeHtml(t("allCountries"))}</option>` +
    countries.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  if (countries.includes(keepValue)) countryFilterEl.value = keepValue;
}

// ─── Rutas de PDF ───────────────────────────────────────────────────────────
function getPdfSubdir(site) {
  const explicitFolder = String(site?.raw?.pdf_subdir || site?.raw?.pdf_folder || "").trim();
  if (explicitFolder) return explicitFolder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

  const normalized = String(site?.productAssigned || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("b500sd")) return "B500SD";
  if (normalized.includes("y1860") && normalized.includes("s7")) return "Y1860_S7";
  if (normalized.includes("s355") && normalized.includes("offshore")) return "S355_Offshore";

  return slugify(site?.productAssigned || "").replace(/-/g, "_");
}

function buildPdfHref(site) {
  const archivoRaw = String(site?.raw?.archivo || "").trim();
  if (!archivoRaw) return String(site?.raw?.pdf_url || "").trim();

  const fileName = archivoRaw.split(/[\\/]/).pop().trim();
  const subdir = getPdfSubdir(site);
  const safeName = fileName.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  const safeDir = String(subdir || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");

  return safeDir ? `${PDF_BASE_PATH}${safeDir}/${safeName}` : `${PDF_BASE_PATH}${safeName}`;
}

// ─── Popup ──────────────────────────────────────────────────────────────────
function buildPopupHtml(site) {
  const popupKeys = ["contenido_reciclado_pct", "gwp_total_kg_co2e_t"]
    .filter(key => site.raw[key] && String(site.raw[key]).trim() !== "");

  const popupItems = popupKeys.length
    ? popupKeys.map(key => `
        <div class="popup-item">
          <span class="k">${escapeHtml(tm(key))}</span>
          <span class="v">${escapeHtml(site.raw[key])}</span>
        </div>`).join("")
    : `<div class="popup-item">
        <span class="k">${escapeHtml(t("location"))}</span>
        <span class="v">${escapeHtml(t("latitude"))} ${site.lat.toFixed(4)}, ${escapeHtml(t("longitude"))} ${site.lon.toFixed(4)}</span>
       </div>`;

  const pdfHref = buildPdfHref(site);

  return `
    <div class="popup-shell">
      <div class="popup-head">
        <div class="popup-title">${escapeHtml(site.name)}</div>
        <div class="popup-subtitle">${escapeHtml(String(site.raw.producto || "").trim() || t("geolocatedEPD"))}</div>
      </div>
      <div class="popup-grid">${popupItems}</div>
      <div class="popup-links">
        ${pdfHref ? `<a class="popup-link" href="${escapeHtml(pdfHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("openPdf"))}</a>` : ""}
        <a class="popup-link" href="https://www.google.com/maps?q=${site.lat},${site.lon}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("googleMapsLabel"))}</a>
      </div>
    </div>`;
}

// ─── Mapa pantalla completa ─────────────────────────────────────────────────
function setMapExpanded(expanded) {
  if (!mapPanelEl || !mapExpandBtn) return;

  mapPanelEl.classList.toggle("map-fullscreen", expanded);
  document.body.classList.toggle("map-fullscreen-open", expanded);
  mapExpandBtn.textContent = expanded ? t("closeMap") : t("expandMap");
  mapExpandBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  mapExpandBtn.setAttribute("aria-label", expanded ? t("closeMap") : t("expandMap"));

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 120);
}

function toggleMapExpanded() {
  const expanded = mapPanelEl?.classList.contains("map-fullscreen");
  setMapExpanded(!expanded);
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
    radius: isSelected ? 10 : 7,
    fillColor: getColorForCategory(site.productAssigned),
    color: isSelected ? "#ffffff" : "rgba(255,255,255,0.72)",
    weight: isSelected ? 3 : 1.5,
    opacity: 1,
    fillOpacity: isSelected ? 1 : 0.88
  };
}

function updateMarkerStyles() {
  markerById.forEach((marker, id) => {
    const site = allSites.find(s => s.id === id);
    if (site) marker.setStyle(getMarkerStyle(site, id === selectedId));
  });
}

function renderMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  markerById = new Map();

  if (!filteredSites.length) {
    map.setView(INITIAL_CENTER, INITIAL_ZOOM);
    return;
  }

  const bounds = [];

  filteredSites.forEach(site => {
    const marker = L.circleMarker([site.lat, site.lon], getMarkerStyle(site, site.id === selectedId)).addTo(map);

    marker.bindPopup(buildPopupHtml(site), {
      maxWidth: 360,
      minWidth: 220,
      autoPan: true
    });

    marker.on("click", () => {
      selectedId = site.id;
      updateMarkerStyles();
      renderScatterPlot();
      renderBoxplots();
    });

    markers.push(marker);
    markerById.set(site.id, marker);
    bounds.push([site.lat, site.lon]);
  });

  bounds.length === 1
    ? map.setView(bounds[0], 6)
    : map.fitBounds(bounds, { padding: [30, 30] });
}

// ─── Gráfico de dispersión ──────────────────────────────────────────────────
function computeTrendLine(points) {
  if (!points || points.length < 2) return null;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const n = points.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;

  if (!Number.isFinite(denom) || denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept }
  ];
}

function renderScatterPlot() {
  const chartCanvas = document.getElementById("scatterChart");
  const validSites = filteredSites.filter(s => Number.isFinite(s.recycledPct) && Number.isFinite(s.gwp));

  if (scatterChart) {
    scatterChart.destroy();
    scatterChart = null;
  }

  if (!validSites.length) {
    chartStatusEl.textContent = t("noValidChartData");
    return;
  }

  const grouped = new Map();
  const categoryCounts = getCategoryCounts(validSites);

  validSites.forEach(site => {
    if (!grouped.has(site.productAssigned)) grouped.set(site.productAssigned, []);
    grouped.get(site.productAssigned).push({
      x: site.recycledPct,
      y: site.gwp,
      siteId: site.id,
      label: site.name,
      productAssigned: site.productAssigned,
      codigo: site.raw.codigo_epd || ""
    });
  });

  const datasets = [];

  Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0], currentLang, { sensitivity: "base" }))
    .forEach(([category, data]) => {
      const color = getColorForCategory(category);
      const label = formatCategoryWithCount(category, categoryCounts.get(category) || data.length);

      datasets.push({
        label,
        data,
        showLine: false,
        borderColor: color,
        backgroundColor: color,
        pointRadius: ctx => ctx.raw.siteId === selectedId ? 8 : 5,
        pointHoverRadius: 9,
        pointBorderColor: "#ffffff",
        pointBorderWidth: ctx => ctx.raw.siteId === selectedId ? 2.5 : 1.2,
        order: 2
      });
    });

  const globalTrendData = validSites.map(site => ({
    x: site.recycledPct,
    y: site.gwp
  }));

  const globalTrend = computeTrendLine(globalTrendData);

  if (globalTrend) {
    datasets.push({
      label: t("globalTrendLabel"),
      data: globalTrend,
      type: "line",
      showLine: true,
      parsing: false,
      borderColor: "#ffffff",
      backgroundColor: "#ffffff",
      borderWidth: 2.5,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
      fill: false,
      tension: 0,
      order: 1
    });
  }

  scatterChart = new Chart(chartCanvas, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      plugins: {
        legend: {
          labels: {
            color: "#eaf1ff",
            usePointStyle: true,
            filter: (item, d) => !!d.datasets[item.datasetIndex].label,
            generateLabels(chart) {
              const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);

              return defaultLabels.map(label => {
                const ds = chart.data.datasets[label.datasetIndex];

                if (ds.type === "line") {
                  return {
                    ...label,
                    pointStyle: "line",
                    strokeStyle: ds.borderColor,
                    fillStyle: ds.borderColor,
                    lineWidth: ds.borderWidth || 2
                  };
                }

                return {
                  ...label,
                  pointStyle: "circle"
                };
              });
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(10,16,29,0.95)",
          borderColor: "rgba(102,179,255,0.35)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#eaf1ff",
          callbacks: {
            label(ctx) {
              const raw = ctx.raw;

              if (!raw?.siteId) {
                return ctx.dataset?.label || "";
              }

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
          min: 0,
          max: 100,
          title: {
            display: true,
            text: t("recycledContentAxis"),
            color: "#eaf1ff"
          },
          ticks: { color: "#9db0d1" },
          grid: { color: "rgba(157,176,209,0.15)" }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: t("gwpAxis"),
            color: "#eaf1ff"
          },
          ticks: { color: "#9db0d1" },
          grid: { color: "rgba(157,176,209,0.15)" }
        }
      },
      onClick(event, elements, chart) {
        if (!elements.length) return;
        const raw = chart.data.datasets[elements[0].datasetIndex].data[elements[0].index];
        if (raw?.siteId) selectSite(raw.siteId, true, true);
      }
    }
  });

  chartStatusEl.textContent = t("chartPoints")(validSites.length, filteredSites.length);
}

// ─── Boxplots ───────────────────────────────────────────────────────────────
function wrapLabel(text, maxLen = 18) {
  if (text.length <= maxLen) return text;
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLen && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.join('<br>');
}

function getPlotlyBaseLayout(yTitle) {
  return {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 56, r: 12, t: 8, b: 110 },
    autosize: true,
    showlegend: false,
    font: { color: "#eaf1ff", family: 'Inter, system-ui, sans-serif' },
    xaxis: {
      title: "",
      tickangle: 0,
      automargin: true,
      color: "#9db0d1",
      gridcolor: "rgba(157,176,209,0.08)",
      zeroline: false
    },
    yaxis: {
      title: yTitle,
      automargin: true,
      color: "#9db0d1",
      gridcolor: "rgba(157,176,209,0.15)",
      zeroline: false
    }
  };
}

function renderSingleBoxplot(targetId, accessor, yTitle) {
  const validSites = filteredSites.filter(s => Number.isFinite(accessor(s)));
  const targetEl = document.getElementById(targetId);

  if (!validSites.length) {
    Plotly.purge(targetEl);
    targetEl.innerHTML = "";
    return;
  }

  const categoryCounts = getCategoryCounts(validSites);
  const categories = Array.from(new Set(validSites.map(s => s.productAssigned)))
    .sort((a, b) => a.localeCompare(b, currentLang, { sensitivity: "base" }));
  const labelMap = new Map(categories.map(c => [c, wrapLabel(formatCategoryWithCount(c, categoryCounts.get(c) || 0))]));

  const traces = categories.map(cat => ({
    type: "box",
    name: labelMap.get(cat),
    y: validSites.filter(s => s.productAssigned === cat).map(s => accessor(s)),
    boxpoints: false,
    line: { color: getColorForCategory(cat), width: 1.8 },
    fillcolor: "rgba(102,179,255,0.14)",
    marker: { color: getColorForCategory(cat) },
    hovertemplate: `<b>${escapeHtml(labelMap.get(cat))}</b><br>${escapeHtml(yTitle)}: %{y}<extra></extra>`
  }));

  const sel = validSites.find(s => s.id === selectedId);
  if (sel) {
    traces.push({
      type: "scatter",
      mode: "markers",
      x: [labelMap.get(sel.productAssigned)],
      y: [accessor(sel)],
      marker: { size: 12, color: "#ffffff", line: { color: "#111827", width: 2 } },
      hovertemplate:
        `<b>${escapeHtml(sel.name)}</b><br>` +
        `${escapeHtml(t("selectedCategory"))}: ${escapeHtml(labelMap.get(sel.productAssigned))}<br>` +
        `${escapeHtml(yTitle)}: ${accessor(sel)}<extra></extra>`
    });
  }

  Plotly.react(targetEl, traces, getPlotlyBaseLayout(yTitle), {
    responsive: true,
    displayModeBar: false
  });
}

function renderBoxplots() {
  renderSingleBoxplot("boxplotGwp", s => s.gwp, t("gwpAxis"));
  renderSingleBoxplot("boxplotRecycled", s => s.recycledPct, t("recycledContentAxis"));
}

// ─── Filtrar y redibujar ────────────────────────────────────────────────────
function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  const selectedContinent = continentFilterEl.value.trim();
  const selectedCountry = countryFilterEl.value.trim();
  const selectedProduct = productFilterEl.value.trim();

  filteredSites = allSites.filter(site => {
    if (selectedContinent && site.continent !== selectedContinent) return false;
    if (selectedCountry && String(site.raw.pais_produccion || "").trim() !== selectedCountry) return false;
    if (selectedProduct && site.productAssigned !== selectedProduct) return false;
    if (q && !Object.values(site.raw).join(" ").toLowerCase().includes(q)) return false;
    return true;
  });

  if (!filteredSites.some(s => s.id === selectedId)) {
    selectedId = filteredSites.length ? filteredSites[0].id : null;
  }

  statusEl.textContent = t("loadedData")(filteredSites.length, allSites.length);
  renderMarkers();
  renderScatterPlot();
  renderBoxplots();
}

function selectSite(id, centerMap, openPopup) {
  selectedId = id;
  updateMarkerStyles();
  renderScatterPlot();
  renderBoxplots();

  if (!map) return;

  const site = allSites.find(s => s.id === id);
  const marker = markerById.get(id);

  if (site && centerMap) map.setView([site.lat, site.lon], Math.max(map.getZoom(), 5));
  if (marker && openPopup) marker.openPopup();
}

// ─── Carga de datos ─────────────────────────────────────────────────────────
async function loadData() {
  try {
    const response = await fetch("./datos.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(t("fileNotFound"));

    allSites = parseCSV(await response.text());
    if (!allSites.length) throw new Error(t("noValidRecords"));

    allSites.forEach(site => { site.continent = getContinentForSite(site); });

    populateAllFilters();
    filteredSites = [...allSites];
    selectedId = allSites[0].id;

    statusEl.textContent = t("loadedAllData")(allSites.length);
    renderMarkers();
    renderScatterPlot();
    renderBoxplots();

    setTimeout(() => {
      map.invalidateSize();
      window.dispatchEvent(new Event("resize"));
    }, 80);
  } catch (error) {
    statusEl.textContent = t("errorReadingCsv")(error.message);
    chartStatusEl.textContent = t("chartBuildError");
    allSites = [];
    filteredSites = [];
    selectedId = null;
    Plotly.purge("boxplotGwp");
    Plotly.purge("boxplotRecycled");
  }
}

// ─── Eventos ────────────────────────────────────────────────────────────────
searchInput.addEventListener("input", applyFilter);
productFilterEl.addEventListener("change", applyFilter);
countryFilterEl.addEventListener("change", applyFilter);

continentFilterEl.addEventListener("change", () => {
  updateCountryFilter(continentFilterEl.value, "");
  applyFilter();
});

langSwitchEl.value = currentLang;
langSwitchEl.addEventListener("change", e => {
  currentLang = e.target.value;
  localStorage.setItem("epd_lang", currentLang);
  applyStaticLanguage();
  populateAllFilters();

  if (allSites.length) {
    applyFilter();
  } else {
    statusEl.textContent = t("loading");
    chartStatusEl.textContent = t("preparingChart");
  }
});

window.addEventListener("resize", () => {
  if (map) setTimeout(() => map.invalidateSize(), 50);
});

if (mapExpandBtn) {
  mapExpandBtn.addEventListener("click", toggleMapExpanded);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mapPanelEl?.classList.contains("map-fullscreen")) {
    setMapExpanded(false);
  }
});

// ─── Arranque ───────────────────────────────────────────────────────────────
applyStaticLanguage();
initMap();
loadData();
