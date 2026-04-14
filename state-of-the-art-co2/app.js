/* ─── DEFAULT DATA ───────────────────────────────────────────────────────────── */
const DEFAULT_DATA = [
  { mw:"15",  units:"3",   foundation:"Barge (SATH)",                           type:"Floating",     cf:"38",    lt:"25", epbt:"NR",  gwp:"37.9",       gwp_h:"43.09", method:"Ecoinvent EN-15804",                               year:"2026", ref:"ANGELOS",                                                                                                                                                                         note:"Con site construction",                                      archivo:"",                                    lat:"",      lon:"" },
  { mw:"15",  units:"3",   foundation:"Barge (SATH)",                           type:"Floating",     cf:"38",    lt:"25", epbt:"NR",  gwp:"33.5",       gwp_h:"38.08", method:"Ecoinvent EN-15804",                               year:"2026", ref:"ANGELOS",                                                                                                                                                                         note:"Sin site construction",                                      archivo:"",                                    lat:"",      lon:"" },
  { mw:"8",   units:"75",  foundation:"Spar buoy",                              type:"Floating",     cf:"50",    lt:"25", epbt:"NR",  gwp:"30.17",      gwp_h:"26.07", method:"LCA, cradle-to-grave",                             year:"2019", ref:"Bang, J.-I., Ma, C., Tarantino, E., Vela, A., & Yamane, D. (2019). Life cycle assessment of greenhouse gas emissions for floating offshore wind energy in California. UC Santa Barbara.", note:"",                                                           archivo:"Bang-2019-Floating-Wind-LCA.pdf",      lat:"34.05", lon:"-119.25" },
  { mw:"4",   units:"—",   foundation:"Bottom-fixed (Gravity)",                 type:"Bottom-fixed", cf:"59",    lt:"20", epbt:"0.9", gwp:"10.9",       gwp_h:"9.98",  method:"ReCiPe",                                           year:"2016", ref:"Bonou, A., Laurent, A., & Olsen, S. I. (2016). Life cycle assessment of onshore and offshore wind energy-from theory to application. Applied Energy, 180.",                        note:"Not available",                                              archivo:"-",                                   lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"Bottom-fixed (Driven)",                  type:"Bottom-fixed", cf:"59",    lt:"20", epbt:"0.8", gwp:"7.8",        gwp_h:"7.14",  method:"ReCiPe",                                           year:"2016", ref:"Bonou, A., Laurent, A., & Olsen, S. I. (2016). Life cycle assessment of onshore and offshore wind energy-from theory to application. Applied Energy, 180.",                        note:"Not available",                                              archivo:"-",                                   lat:"",      lon:"" },
  { mw:"14.7",units:"190", foundation:"Semi-submersible steel",                 type:"Floating",     cf:"34.35", lt:"30", epbt:"NR",  gwp:"31",         gwp_h:"32.49", method:"LCA, cradle-to-grave; EPD (version 2018)",         year:"2023", ref:"Brussa, G., Grosso, M., & Rigamonti, L. (2023). Life cycle assessment of a floating offshore wind farm in Italy. Sustainable Production and Consumption, 39, 134–144.",             note:"",                                                           archivo:"1-s2.0-S235255092300101X-main.pdf",    lat:"44.4",  lon:"12.2" },
  { mw:"6",   units:"5",   foundation:"Spar buoy",                              type:"Floating",     cf:"49.4",  lt:"25", epbt:"NR",  gwp:"45.2",       gwp_h:"39.53", method:"LCA, cradle-to-grave; recycling partially",        year:"2022", ref:"Garcia Teruel, A., Rinaldi, G., Thies, P. R., Johanning, L., & Jeffrey, H. (2022). Life cycle assessment of floating offshore wind farms. Applied Energy, 307, 118067.",             note:"Not available",                                              archivo:"-",                                   lat:"",      lon:"" },
  { mw:"9.5", units:"5",   foundation:"Semi-submersible steel",                 type:"Floating",     cf:"39.6",  lt:"25", epbt:"NR",  gwp:"39.4",       gwp_h:"42.98", method:"LCA, cradle-to-grave; recycling partially",        year:"2022", ref:"Garcia Teruel, A., Rinaldi, G., Thies, P. R., Johanning, L., & Jeffrey, H. (2022). Life cycle assessment of floating offshore wind farms. Applied Energy, 307, 118067.",             note:"Not available",                                              archivo:"-",                                   lat:"",      lon:"" },
  { mw:"15",  units:"1",   foundation:"Semi-submersible steel",                 type:"Floating",     cf:"43",    lt:"20", epbt:"NR",  gwp:"32.6",       gwp_h:"40.94", method:"LCA, cradle-to-grave",                             year:"2022", ref:"Kollia, M. (2022). Life cycle assesment of floating offshore wind farms (Master's thesis, Oslo Metropolitan University).",                                                       note:"",                                                           archivo:"",                                    lat:"59.9",  lon:"10.7" },
  { mw:"15",  units:"1",   foundation:"Spar buoy concrete",                     type:"Floating",     cf:"43",    lt:"20", epbt:"NR",  gwp:"24.3",       gwp_h:"30.52", method:"LCA, cradle-to-grave",                             year:"2022", ref:"Kollia, M. (2022). Life cycle assesment of floating offshore wind farms (Master's thesis, Oslo Metropolitan University).",                                                       note:"",                                                           archivo:"",                                    lat:"59.9",  lon:"10.7" },
  { mw:"14",  units:"—",   foundation:"Monopile",                               type:"Bottom-fixed", cf:"45.34", lt:"20", epbt:"NR",  gwp:"26.15",      gwp_h:"31.14", method:"ReCiPe 2016 v1.03 midpoint (H)",                   year:"2024", ref:"Lotfizadeh, O. (2024). Life Cycle Assessment of Offshore Wind Farms – A Comparative Study of Floating Vs. Fixed Offshore Wind Turbines. MSc, Univ. of South-Eastern Norway.",    note:"",                                                           archivo:"ThesisReport-OmidLotfizadeh-258992.pdf", lat:"59.1", lon:"9.8" },
  { mw:"8",   units:"—",   foundation:"Concrete SPAR-type (ballast-stabilized)", type:"Floating",   cf:"54",    lt:"20", epbt:"NR",  gwp:"36.78",      gwp_h:"36.78", method:"ReCiPe 2016 v1.03 midpoint (H)",                   year:"2024", ref:"Lotfizadeh, O. (2024). Life Cycle Assessment of Offshore Wind Farms – A Comparative Study. MSc, Univ. of South-Eastern Norway.",                                           note:"",                                                           archivo:"ThesisReport-OmidLotfizadeh-258992.pdf", lat:"59.1", lon:"9.8" },
  { mw:"8",   units:"11",  foundation:"SPAR (Hywind Tampen)",                   type:"Floating",     cf:"54",    lt:"20", epbt:"NR",  gwp:"36.78",      gwp_h:"36.78", method:"ReCiPe 2016 v1.03 midpoint (H)",                   year:"2024", ref:"Lotfizadeh, O., Barahmand, Z., & Amlashi, H. (2024). LCA of Floating Offshore Wind Farms: The Case of Hywind Tampen. SIMS EUROSIM 2024.",                                        note:"",                                                           archivo:"ThesisReport-OmidLotfizadeh-258992.pdf", lat:"61.1", lon:"2.3" },
  { mw:"5",   units:"—",   foundation:"Bottom-fixed (Driven)",                  type:"Bottom-fixed", cf:"46",    lt:"20", epbt:"1.6", gwp:"18.9",       gwp_h:"22.19", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"Sway (Tension Leg Spar)",                type:"Floating",     cf:"46",    lt:"20", epbt:"1.8", gwp:"20.9",       gwp_h:"24.53", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"TLB (Tension Leg Barge)",                type:"Floating",     cf:"46",    lt:"20", epbt:"1.6", gwp:"18",         gwp_h:"21.13", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"TLP (Tension Leg Platform)",             type:"Floating",     cf:"46",    lt:"20", epbt:"1.7", gwp:"19.2",       gwp_h:"22.54", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"Spar buoy",                              type:"Floating",     cf:"46",    lt:"20", epbt:"2.2", gwp:"25.3",       gwp_h:"29.70", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"Semi-submersible platform",              type:"Floating",     cf:"46",    lt:"20", epbt:"2.7", gwp:"31.4",       gwp_h:"36.86", method:"Only GWP",                                         year:"2014", ref:"Raadal, H. L., Vold, B. I., Myhr, A., & Nygaard, T. A. (2014). GHG emissions and energy performance of offshore wind power. Renewable Energy, 66.",                            note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"NE",  units:"—",   foundation:"Steel hull",                             type:"Floating",     cf:"50",    lt:"50", epbt:"NE",  gwp:"NR",         gwp_h:"NR",    method:"OneClickLCA + Ecoinvent; GWP en CO₂e/T",           year:"2025", ref:"Shakori, R., & Chaudhuri, A. (2025). Life cycle analysis of floating offshore wind turbine concepts. Springer.",                                                                 note:"Métrica en CO₂e/tonelada, no en gCO₂eq/kWh",                archivo:"978-3-031-69626-8_144.pdf",           lat:"",      lon:"" },
  { mw:"NE",  units:"—",   foundation:"Concrete hull",                          type:"Floating",     cf:"50",    lt:"50", epbt:"NE",  gwp:"NR",         gwp_h:"NR",    method:"OneClickLCA + Ecoinvent; GWP en CO₂e/T",           year:"2025", ref:"Shakori, R., & Chaudhuri, A. (2025). Life cycle analysis of floating offshore wind turbine concepts. Springer.",                                                                 note:"Métrica en CO₂e/tonelada, no en gCO₂eq/kWh",                archivo:"978-3-031-69626-8_144.pdf",           lat:"",      lon:"" },
  { mw:"4",   units:"—",   foundation:"Bottom-fixed (Monopile)",                type:"Bottom-fixed", cf:"52",    lt:"20", epbt:"0.88",gwp:"10",         gwp_h:"10.38", method:"EPD",                                              year:"—",    ref:"Siemens AG. (n.d.). EPD: Offshore Wind Power Plant SWT-4.0-130 and SWT-6.0-154.",                                                                                                note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"6",   units:"—",   foundation:"Bottom-fixed (Monopile)",                type:"Bottom-fixed", cf:"50",    lt:"25", epbt:"0.79",gwp:"7",          gwp_h:"6.05",  method:"EPD",                                              year:"—",    ref:"Siemens AG. (n.d.). EPD: Offshore Wind Power Plant SWT-4.0-130 and SWT-6.0-154.",                                                                                                note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"8",   units:"—",   foundation:"Bottom-fixed (Driven)",                  type:"Bottom-fixed", cf:"61",    lt:"25", epbt:"0.62",gwp:"6",          gwp_h:"4.25",  method:"EPD",                                              year:"—",    ref:"Siemens-Gamesa. (n.d.). EPD: Offshore Wind Power Plant SWT-8.0-167 DD.",                                                                                                         note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"15",  units:"94",  foundation:"Semi-submersible steel",                 type:"Floating",     cf:"52.3",  lt:"20", epbt:"NR",  gwp:"26.3",       gwp_h:"27.15", method:"LCA, cradle-to-grave",                             year:"2023", ref:"Struthers, I. A. et al. (2023). LCA of four floating wind farms around Scotland using site-specific O&M model with SOVs. Energies, 16(23), 7739.",                              note:"",                                                           archivo:"",                                    lat:"57.5",  lon:"-3.2" },
  { mw:"5",   units:"6",   foundation:"Jacket foundation",                      type:"Bottom-fixed", cf:"44",    lt:"20", epbt:"NR",  gwp:"32",         gwp_h:"39.27", method:"LCA, cradle-to-grave",                             year:"2011", ref:"Wagner, H.-J. et al. (2011). Life cycle assessment of the offshore wind farm alpha ventus. Energy, 36(5), 2459–2464.",                                                         note:"Alpha Ventus",                                               archivo:"",                                    lat:"54.0",  lon:"6.6" },
  { mw:"5",   units:"40",  foundation:"Spar buoy",                              type:"Floating",     cf:"53",    lt:"20", epbt:"NR",  gwp:"11.52",      gwp_h:"11.74", method:"LCA, cradle-to-grave",                             year:"2009", ref:"Weinzettel, J., Reenaas, M., Solli, C., & Hertwich, E. G. (2009). Life cycle assessment of a floating offshore wind turbine. Renewable Energy, 34(3), 742–747.",                  note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"5",   units:"—",   foundation:"Sway",                                   type:"Floating",     cf:"53",    lt:"20", epbt:"0.43",gwp:"11.5",       gwp_h:"11.72", method:"CML 2 baseline 2000 v2.03",                        year:"2009", ref:"Weinzettel, J., Reenaas, M., Solli, C., & Hertwich, E. G. (2009). Life cycle assessment of a floating offshore wind turbine. Renewable Energy, 34(3).",                          note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"3.6", units:"27",  foundation:"Monopile",                               type:"Bottom-fixed", cf:"NR",    lt:"25", epbt:"NR",  gwp:"25",         gwp_h:"NR",    method:"LCA, cradle-to-grave",                             year:"2018", ref:"Yang, J. et al. (2018). The life-cycle energy and environmental emissions of a typical offshore wind farm in China. Journal of Cleaner Production, 180, 316–324.",                   note:"China",                                                      archivo:"",                                    lat:"30.0",  lon:"121.5" },
  { mw:"2",   units:"1",   foundation:"Barge-type",                             type:"Floating",     cf:"NR",    lt:"20", epbt:"NR",  gwp:"18.6",       gwp_h:"NR",    method:"LCA, cradle-to-cradle",                            year:"2021", ref:"Yildiz, N., Hemida, H., & Baniotopoulos, C. (2021). LCA of a barge-type floating wind turbine. Energies, 14(18), 5656.",                                                          note:"",                                                           archivo:"",                                    lat:"",      lon:"" },
  { mw:"15",  units:"NR",  foundation:"Semi-submersible",                       type:"Floating",     cf:"NR",    lt:"NR", epbt:"NR",  gwp:"18.63–29.01",gwp_h:"NR",   method:"NR",                                               year:"2026", ref:"Guo, X., Liu, Y., & Ren, D. (2026). Life cycle carbon emissions assessment of floating offshore wind power in China. Sustainable Energy Technologies and Assessments, 86, 104879.", note:"Not available",                                              archivo:"-",                                   lat:"25.0",  lon:"120.0" },
];

/* ─── STATE ──────────────────────────────────────────────────────────────────── */
let allData = [], filteredData = [];
let sortCol = -1, sortAsc = true;
let charts = {};
let leafletMap = null, mapMarkers = [], mapInited = false;
let searchQuery = '';

const FS = {
  type: 'all',
  yearLo: null, yearHi: null,
  mwLo: null,   mwHi: null,
  gwpLo: null,  gwpHi: null,
  foundations: new Set(),
  methods: new Set(),
};

/* ─── GOOGLE SHEETS ──────────────────────────────────────────────────────────── */
const SHEET_ID  = '19QFDP_oa8FHAQWEn3j6t8gysZvGbOrTrLSTtAExCBFk';
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=GW_impact`;

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gs-url').value = SHEET_CSV;
  autoLoadSheets();
});

function autoLoadSheets() {
  setStatus('syncing', 'Sincronizando con Google Sheets…');
  fetch(SHEET_CSV)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(csv => {
      const mapped = parseSheetCSV(csv);
      if (!mapped.length) throw new Error('Sin datos');
      processData(mapped);
      setStatus('ok', `Datos cargados · ${mapped.length} entradas`);
    })
    .catch(e => {
      console.warn('Google Sheets no disponible, usando datos locales:', e);
      processData(DEFAULT_DATA);
      setStatus('warn', 'Datos locales (hoja no responde)');
    });
}

function loadFromSheets() {
  const url = document.getElementById('gs-url').value.trim();
  if (!url) return;
  setStatus('syncing', 'Cargando…');
  fetch(url)
    .then(r => r.text())
    .then(csv => { const m = parseSheetCSV(csv); processData(m); setStatus('ok', `Cargado · ${m.length} entradas`); })
    .catch(e => { setStatus('error', 'Error al cargar'); console.error(e); });
}

function loadDefaultData() {
  processData(DEFAULT_DATA);
  setStatus('warn', 'Mostrando datos locales');
}

function setStatus(type, msg) {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  dot.className = 'status-dot ' + type;
  txt.textContent = msg;
}

function parseSheetCSV(csv) {
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (!result.data.length) return [];
  const cols = Object.keys(result.data[0]);
  const norm = s => String(s).toLowerCase().replace(/[\s\n\r]+/g, ' ').trim();

  function findCol(...hints) {
    for (const hint of hints) {
      const h = norm(hint);
      const exact = cols.find(c => norm(c) === h);
      if (exact) return exact;
      const partial = cols.find(c => norm(c).includes(h) || h.includes(norm(c)));
      if (partial) return partial;
    }
    return null;
  }

  const colMW    = findCol('power rating', 'mw');
  const colUnits = findCol('units', 'unidades');
  const colFnd   = findCol('offshore foundation design', 'foundation design', 'foundation');
  const colType  = findCol('type', 'tipo');
  const colCF    = findCol('cf (%)', 'cf(%)', 'cf');
  const colLT    = findCol('lt (year)', 'lt');
  const colEPBT  = findCol('epbt (year)', 'epbt');
  const colGWP   = findCol('gw impact', 'gwp');
  const colGWPH  = findCol('harmonised gw', 'harmonized gw', 'harmonised');
  const colMeth  = findCol('lcia method', 'method');
  const colYear  = findCol('year', 'año');
  const colRef   = findCol('ref.', 'ref');
  const colNote  = findCol('note', 'nota');
  const colArch  = findCol('archivo', 'file');
  const colLat   = findCol('lat', 'latitude');
  const colLon   = findCol('lon', 'longitude', 'long');

  const gwCols   = cols.filter(c => norm(c).includes('gw impact') || norm(c).includes('gwp'));
  const val = (row, col) => {
    if (!col) return '—';
    const v = row[col];
    if (v === undefined || v === null || String(v).trim() === '') return '—';
    return String(v).trim();
  };

  return result.data.map(row => ({
    mw:        val(row, colMW),
    units:     val(row, colUnits),
    foundation:val(row, colFnd),
    type:      val(row, colType),
    cf:        val(row, colCF),
    lt:        val(row, colLT),
    epbt:      val(row, colEPBT),
    gwp:       val(row, colGWP)  !== '—' ? val(row, colGWP)  : val(row, gwCols[0] || null),
    gwp_h:     val(row, colGWPH) !== '—' ? val(row, colGWPH) : val(row, gwCols[1] || null),
    method:    val(row, colMeth),
    year:      val(row, colYear),
    ref:       val(row, colRef),
    note:      val(row, colNote) === '—' ? '' : val(row, colNote),
    archivo:   val(row, colArch) === '—' ? '' : val(row, colArch),
    lat:       val(row, colLat)  === '—' ? '' : val(row, colLat),
    lon:       val(row, colLon)  === '—' ? '' : val(row, colLon),
  }));
}

/* ─── PROCESS DATA ───────────────────────────────────────────────────────────── */
function processData(data) {
  allData = data;
  initFilterRanges(data);
  initCheckboxLists(data);
  updateTypeCounts(data);
  applyAllFilters();
}

function initFilterRanges(data) {
  const years = data.map(d => parseInt(d.year)).filter(y => !isNaN(y));
  if (years.length) {
    const yMin = Math.min(...years), yMax = Math.max(...years);
    setRangeAttr('year', yMin, yMax, yMin, yMax);
  }
  const mws = data.map(d => parseNum(d.mw)).filter(v => v !== null);
  if (mws.length) {
    const lo = Math.floor(Math.min(...mws)), hi = Math.ceil(Math.max(...mws));
    setRangeAttr('mw', lo, hi, lo, hi);
  }
  const gwps = data.map(d => parseNum(d.gwp_h)).filter(v => v !== null);
  if (gwps.length) {
    const lo = Math.floor(Math.min(...gwps)), hi = Math.ceil(Math.max(...gwps));
    setRangeAttr('gwp', lo, hi, lo, hi);
  }
  FS.yearLo = null; FS.yearHi = null;
  FS.mwLo   = null; FS.mwHi   = null;
  FS.gwpLo  = null; FS.gwpHi  = null;
}

function setRangeAttr(id, min, max, lo, hi) {
  const rlo = document.getElementById(`rlo-${id}`);
  const rhi = document.getElementById(`rhi-${id}`);
  if (!rlo || !rhi) return;
  [rlo.min, rlo.max, rlo.value] = [min, max, lo];
  [rhi.min, rhi.max, rhi.value] = [min, max, hi];
  updateRangeFill(id);
  setRangeLabel(id, lo, hi);
}

function setRangeLabel(id, lo, hi) {
  const loEl = document.getElementById(`rlv-${id}-lo`);
  const hiEl = document.getElementById(`rlv-${id}-hi`);
  if (loEl) loEl.textContent = lo;
  if (hiEl) {
    if (hiEl.children.length) hiEl.childNodes[0].textContent = hi;
    else hiEl.textContent = hi;
  }
}

function initCheckboxLists(data) {
  const foundations = [...new Set(data.map(d => d.foundation).filter(v => v && v !== '—'))].sort();
  const methods     = [...new Set(data.map(d => d.method).filter(v => v && v !== '—'))].sort();
  buildCheckList('chk-found',  foundations, 'found');
  buildCheckList('chk-method', methods,     'method');
}

function buildCheckList(containerId, values, fsKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = values.map((v, i) => `
    <label class="chk-item">
      <input type="checkbox" id="chk-${fsKey}-${i}" value="${esc(v)}" onchange="onCheckbox('${fsKey}')">
      <label for="chk-${fsKey}-${i}" style="pointer-events:none">${esc(v)}</label>
    </label>`).join('');
}

function updateTypeCounts(data) {
  setText('cnt-all',   data.length);
  setText('cnt-float', data.filter(d => d.type === 'Floating').length);
  setText('cnt-fixed', data.filter(d => d.type === 'Bottom-fixed').length);
  setText('n-studies', data.length);
}

/* ─── SIDEBAR TOGGLE ─────────────────────────────────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 260);
}

/* ─── ACCORDION ──────────────────────────────────────────────────────────────── */
function toggleFSection(header) {
  header.closest('.f-section').classList.toggle('open');
}

/* ─── FILTER: TYPE ───────────────────────────────────────────────────────────── */
function setType(type, btn) {
  FS.type = type;
  document.querySelectorAll('.type-chip').forEach(c => c.className = 'type-chip');
  if      (type === 'all')           btn.classList.add('active-all');
  else if (type === 'Floating')      btn.classList.add('active-float');
  else                               btn.classList.add('active-fixed');
  const tag = document.getElementById('ftag-type');
  tag.textContent = type === 'all' ? '' : (type === 'Floating' ? 'Flotante' : 'Fijo');
  tag.classList.toggle('on', type !== 'all');
  applyAllFilters();
}

/* ─── FILTER: RANGES ─────────────────────────────────────────────────────────── */
function onRange(id) {
  const rlo = document.getElementById(`rlo-${id}`);
  const rhi = document.getElementById(`rhi-${id}`);
  let lo = parseFloat(rlo.value), hi = parseFloat(rhi.value);
  if (lo > hi) { [lo, hi] = [hi, lo]; rlo.value = lo; rhi.value = hi; }
  updateRangeFill(id);
  setRangeLabel(id, lo, hi);
  const min = parseFloat(rlo.min), max = parseFloat(rlo.max);
  const isDefault = (lo <= min && hi >= max);
  if (id === 'year') { FS.yearLo = isDefault ? null : lo; FS.yearHi = isDefault ? null : hi; updateSectionTag('year', isDefault ? '' : `${lo}–${hi}`); }
  if (id === 'mw')   { FS.mwLo   = isDefault ? null : lo; FS.mwHi   = isDefault ? null : hi; updateSectionTag('mw',   isDefault ? '' : `${lo}–${hi} MW`); }
  if (id === 'gwp')  { FS.gwpLo  = isDefault ? null : lo; FS.gwpHi  = isDefault ? null : hi; updateSectionTag('gwp',  isDefault ? '' : `${lo}–${hi}`); }
  applyAllFilters();
}

function updateRangeFill(id) {
  const rlo  = document.getElementById(`rlo-${id}`);
  const rhi  = document.getElementById(`rhi-${id}`);
  const fill = document.getElementById(`rfill-${id}`);
  if (!rlo || !rhi || !fill) return;
  const min = parseFloat(rlo.min), max = parseFloat(rlo.max);
  const lo  = parseFloat(rlo.value), hi = parseFloat(rhi.value);
  const l = ((lo - min) / (max - min)) * 100;
  const r = ((hi - min) / (max - min)) * 100;
  fill.style.left  = l + '%';
  fill.style.width = (r - l) + '%';
}

function updateSectionTag(id, text) {
  const tag = document.getElementById(`ftag-${id}`);
  if (!tag) return;
  tag.textContent = text;
  tag.classList.toggle('on', !!text);
}

/* ─── FILTER: CHECKBOXES ─────────────────────────────────────────────────────── */
function onCheckbox(fsKey) {
  const stateKey = fsKey === 'found' ? 'foundations' : 'methods';
  const checkboxes = document.querySelectorAll(`#chk-${fsKey} input[type=checkbox]`);
  FS[stateKey] = new Set([...checkboxes].filter(c => c.checked).map(c => c.value));
  const count = FS[stateKey].size;
  const tagId = fsKey === 'found' ? 'ftag-found' : 'ftag-method';
  updateSectionTag(tagId.replace('ftag-', '').trim(), ''); // clear
  const tag = document.getElementById(tagId);
  if (tag) { tag.textContent = count ? `${count} sel.` : ''; tag.classList.toggle('on', count > 0); }
  applyAllFilters();
}

/* ─── APPLY ALL FILTERS ──────────────────────────────────────────────────────── */
function applyAllFilters() {
  const rloYear = document.getElementById('rlo-year');
  const rhiYear = document.getElementById('rhi-year');
  const rloMw   = document.getElementById('rlo-mw');
  const rhiMw   = document.getElementById('rhi-mw');
  const rloGwp  = document.getElementById('rlo-gwp');
  const rhiGwp  = document.getElementById('rhi-gwp');

  const yearLo = FS.yearLo !== null ? FS.yearLo : (rloYear ? parseFloat(rloYear.min) : 0);
  const yearHi = FS.yearHi !== null ? FS.yearHi : (rhiYear ? parseFloat(rhiYear.max) : 9999);
  const mwLo   = FS.mwLo   !== null ? FS.mwLo   : -Infinity;
  const mwHi   = FS.mwHi   !== null ? FS.mwHi   : Infinity;
  const gwpLo  = FS.gwpLo  !== null ? FS.gwpLo  : -Infinity;
  const gwpHi  = FS.gwpHi  !== null ? FS.gwpHi  : Infinity;

  filteredData = allData.filter(d => {
    if (FS.type !== 'all' && d.type !== FS.type) return false;
    const year = parseInt(d.year);
    if (!isNaN(year) && (year < yearLo || year > yearHi)) return false;
    const mw  = parseNum(d.mw);
    if (mw  !== null && (mw  < mwLo  || mw  > mwHi))  return false;
    const gwp = parseNum(d.gwp_h);
    if (gwp !== null && (gwp < gwpLo || gwp > gwpHi)) return false;
    if (FS.foundations.size > 0 && !FS.foundations.has(d.foundation)) return false;
    if (FS.methods.size     > 0 && !FS.methods.has(d.method))         return false;
    return true;
  });

  const q = searchQuery.toLowerCase();
  const display = q ? filteredData.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(q))) : filteredData;

  updateStats();
  renderTable(display);
  renderCharts(filteredData);
  updateMapMarkers(filteredData);
  updateFilterCount(filteredData.length);
  updateActiveChips();
}

function updateFilterCount(n) {
  const el = document.getElementById('f-count');
  if (el) el.textContent = n !== undefined ? n : (filteredData ? filteredData.length : '—');
}

/* ─── CLEAR FILTERS ──────────────────────────────────────────────────────────── */
function clearAllFilters() {
  FS.type = 'all'; FS.yearLo = null; FS.yearHi = null;
  FS.mwLo = null;  FS.mwHi  = null;
  FS.gwpLo = null; FS.gwpHi = null;
  FS.foundations = new Set(); FS.methods = new Set();

  document.querySelectorAll('.type-chip').forEach(c => c.className = 'type-chip');
  document.querySelector('.type-chip[data-type="all"]').classList.add('active-all');

  ['year', 'mw', 'gwp'].forEach(id => {
    const rlo = document.getElementById(`rlo-${id}`);
    const rhi = document.getElementById(`rhi-${id}`);
    if (rlo && rhi) {
      rlo.value = rlo.min; rhi.value = rhi.max;
      updateRangeFill(id);
      setRangeLabel(id, rlo.min, rhi.max);
    }
    updateSectionTag(id, '');
  });

  document.querySelectorAll('#chk-found input, #chk-method input').forEach(c => c.checked = false);
  ['ftag-found', 'ftag-method', 'ftag-type'].forEach(id => {
    const t = document.getElementById(id);
    if (t) { t.textContent = ''; t.classList.remove('on'); }
  });
  applyAllFilters();
}

/* ─── ACTIVE FILTER CHIPS ────────────────────────────────────────────────────── */
function updateActiveChips() {
  const bar  = document.getElementById('af-bar');
  const cont = document.getElementById('af-chips');
  const chips = [];

  if (FS.type !== 'all') chips.push({
    label: FS.type === 'Floating' ? 'Flotante' : 'Fijo al fondo',
    clear: () => setType('all', document.querySelector('.type-chip[data-type="all"]'))
  });
  if (FS.yearLo !== null || FS.yearHi !== null) {
    const rlo = document.getElementById('rlo-year'), rhi = document.getElementById('rhi-year');
    chips.push({ label: `Año ${rlo.value}–${rhi.value}`, clear: () => { FS.yearLo = null; FS.yearHi = null; rlo.value = rlo.min; rhi.value = rhi.max; updateRangeFill('year'); setRangeLabel('year', rlo.min, rhi.max); updateSectionTag('year', ''); applyAllFilters(); } });
  }
  if (FS.mwLo !== null || FS.mwHi !== null) {
    const rlo = document.getElementById('rlo-mw'), rhi = document.getElementById('rhi-mw');
    chips.push({ label: `${rlo.value}–${rhi.value} MW`, clear: () => { FS.mwLo = null; FS.mwHi = null; rlo.value = rlo.min; rhi.value = rhi.max; updateRangeFill('mw'); setRangeLabel('mw', rlo.min, rhi.max); updateSectionTag('mw', ''); applyAllFilters(); } });
  }
  if (FS.gwpLo !== null || FS.gwpHi !== null) {
    const rlo = document.getElementById('rlo-gwp'), rhi = document.getElementById('rhi-gwp');
    chips.push({ label: `GWP ${rlo.value}–${rhi.value}`, clear: () => { FS.gwpLo = null; FS.gwpHi = null; rlo.value = rlo.min; rhi.value = rhi.max; updateRangeFill('gwp'); setRangeLabel('gwp', rlo.min, rhi.max); updateSectionTag('gwp', ''); applyAllFilters(); } });
  }
  if (FS.foundations.size > 0) chips.push({ label: `Cim. (${FS.foundations.size})`, clear: () => { FS.foundations = new Set(); document.querySelectorAll('#chk-found input').forEach(c => c.checked = false); updateSectionTag('found', ''); const t = document.getElementById('ftag-found'); if (t) { t.textContent = ''; t.classList.remove('on'); } applyAllFilters(); } });
  if (FS.methods.size > 0)     chips.push({ label: `Método (${FS.methods.size})`,    clear: () => { FS.methods = new Set();     document.querySelectorAll('#chk-method input').forEach(c => c.checked = false); updateSectionTag('method', ''); const t = document.getElementById('ftag-method'); if (t) { t.textContent = ''; t.classList.remove('on'); } applyAllFilters(); } });

  if (!chips.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  cont.innerHTML = chips.map((c, i) => `<span class="af-chip">${esc(c.label)}<button onclick="clearChip(${i})" title="Quitar">×</button></span>`).join('');
  window.__afClears = chips.map(c => c.clear);
}

function clearChip(i) { if (window.__afClears && window.__afClears[i]) window.__afClears[i](); }

/* ─── TAB SWITCHING ──────────────────────────────────────────────────────────── */
function switchTab(id, btn) {
  document.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
  if (id === 'mapa') {
    if (!mapInited) { initMap(); mapInited = true; }
    setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 60);
    updateMapMarkers(filteredData);
  }
  if (id === 'resumen') renderCharts(filteredData);
}

/* ─── MAP ────────────────────────────────────────────────────────────────────── */
function initMap() {
  leafletMap = L.map('map', { center: [30, 10], zoom: 2 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(leafletMap);
}

function updateMapMarkers(data) {
  if (!leafletMap) return;
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const withCoords = data.filter(d => {
    const la = parseFloat(d.lat), lo = parseFloat(d.lon);
    return !isNaN(la) && !isNaN(lo);
  });

  const isEmpty = withCoords.length === 0;
  document.getElementById('map-empty').classList.toggle('hidden', !isEmpty);
  document.getElementById('map-legend').style.display = isEmpty ? 'none' : 'block';
  setText('map-cnt-total', withCoords.length);
  setText('map-cnt-float', withCoords.filter(d => d.type === 'Floating').length);
  setText('map-cnt-fixed', withCoords.filter(d => d.type === 'Bottom-fixed').length);

  withCoords.forEach(d => {
    const la = parseFloat(d.lat), lo = parseFloat(d.lon);
    const isFloat = d.type === 'Floating';
    const color = isFloat ? '#62f0cf' : '#ffc06b';
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:11px;height:11px;border-radius:50%;background:${color};border:2px solid rgba(7,17,30,.8);box-shadow:0 0 7px ${color}90"></div>`,
      iconSize: [11, 11], iconAnchor: [5, 5], popupAnchor: [0, -8]
    });
    const refShort = d.ref.length > 55 ? d.ref.slice(0, 53) + '…' : d.ref;
    const popup = `<div class="lpop">
      <div class="lpop-type">${isFloat ? 'Flotante' : 'Fijo al fondo'}${d.note ? ' · ' + d.note : ''}</div>
      <div class="lpop-ref">${refShort}</div>
      <div class="lpop-grid">
        <span class="lk">MW</span><span class="lv">${d.mw}</span>
        <span class="lk">GWP_h</span><span class="lv">${d.gwp_h !== 'NR' ? d.gwp_h + ' gCO₂eq/kWh' : 'NR'}</span>
        <span class="lk">Año</span><span class="lv">${d.year}</span>
        <span class="lk">Cimentación</span><span class="lv">${d.foundation.split(' ')[0]}</span>
      </div>
    </div>`;
    const marker = L.marker([la, lo], { icon }).bindPopup(popup, { maxWidth: 280 });
    marker.addTo(leafletMap);
    mapMarkers.push(marker);
  });

  if (withCoords.length > 0) {
    leafletMap.fitBounds(L.featureGroup(mapMarkers).getBounds(), { padding: [40, 40], maxZoom: 8 });
  }
}

/* ─── STATS ──────────────────────────────────────────────────────────────────── */
function updateStats() {
  const vals      = filteredData.map(d => parseNum(d.gwp_h)).filter(v => v !== null);
  const floatVals = filteredData.filter(d => d.type === 'Floating').map(d    => parseNum(d.gwp_h)).filter(v => v !== null);
  const fixedVals = filteredData.filter(d => d.type === 'Bottom-fixed').map(d => parseNum(d.gwp_h)).filter(v => v !== null);
  if (!vals.length) return;
  const minV = Math.min(...vals), maxV = Math.max(...vals), medV = median(vals);
  const minEntry = filteredData.find(d => parseNum(d.gwp_h) === minV);
  const maxEntry = filteredData.find(d => parseNum(d.gwp_h) === maxV);
  setText('stat-min',   minV.toFixed(1));
  setText('stat-med',   medV ? medV.toFixed(1) : '—');
  setText('stat-max',   maxV.toFixed(1));
  setText('stat-float', floatVals.length ? avg(floatVals).toFixed(1) : '—');
  setText('stat-fixed', fixedVals.length ? avg(fixedVals).toFixed(1) : '—');
  setText('stat-count', vals.length);
  setText('n-studies',  filteredData.length);
  if (minEntry) setText('stat-min-ref', minEntry.ref.split('(')[0].trim().slice(0, 22));
  if (maxEntry) setText('stat-max-ref', maxEntry.ref.split('(')[0].trim().slice(0, 22));
}

/* ─── TABLE ──────────────────────────────────────────────────────────────────── */
function filterTable() {
  searchQuery = document.getElementById('search-input').value;
  applyAllFilters();
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  document.getElementById('row-count').textContent = `${data.length} entradas`;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;color:var(--muted);padding:2rem;font-size:.8rem">Sin resultados para estos filtros</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(d => {
    const tClass = d.type === 'Floating' ? 'tbadge-float' : d.type === 'Bottom-fixed' ? 'tbadge-fixed' : '';
    const tLabel = d.type === 'Floating' ? 'Flotante'     : d.type === 'Bottom-fixed' ? 'Fijo'         : d.type;
    const gwp  = parseNum(d.gwp);
    const gwph = parseNum(d.gwp_h);
    const hasPdf = d.archivo && d.archivo !== '—' && d.archivo !== '-' && d.archivo !== '';
    const latOk = d.lat && d.lat !== '—', lonOk = d.lon && d.lon !== '—';
    return `<tr>
      <td><span class="vnum">${isNE(d.mw) ? '<span class="vnr">NE</span>' : d.mw}</span></td>
      <td>${d.units !== '—' ? d.units : '<span class="vnr">—</span>'}</td>
      <td>${d.foundation}</td>
      <td><span class="tbadge ${tClass}">${tLabel}</span></td>
      <td>${d.cf && d.cf !== 'NR' && !isNE(d.cf) ? d.cf + ' %' : '<span class="vnr">NR</span>'}</td>
      <td>${d.lt && d.lt !== 'NR' ? d.lt + ' a' : '<span class="vnr">NR</span>'}</td>
      <td>${d.epbt && d.epbt !== 'NR' && !isNE(d.epbt) ? `<span class="vnum">${d.epbt}</span>` : '<span class="vnr">NR</span>'}</td>
      <td>${gwp  !== null ? `<span class="vnum">${gwp.toFixed(1)}</span>`  : '<span class="vnr">NR</span>'}</td>
      <td>${gwph !== null ? `<span class="vnum">${gwph.toFixed(2)}</span>` : '<span class="vnr">NR</span>'}</td>
      <td><span class="meth">${d.method && d.method !== '—' && d.method !== 'NR' ? d.method : '<span class="vnr">—</span>'}</span></td>
      <td>${d.year !== '—' ? d.year : '<span class="vnr">—</span>'}</td>
      <td class="geo">${latOk ? parseFloat(d.lat).toFixed(4) : '<span class="vnr">—</span>'}</td>
      <td class="geo">${lonOk ? parseFloat(d.lon).toFixed(4) : '<span class="vnr">—</span>'}</td>
      <td><span class="reft">${d.ref}${d.note ? `<br><em style="color:var(--accent-2);font-size:.62rem">${d.note}</em>` : ''}</span></td>
      <td style="text-align:center">${hasPdf ? `<a href="./pdf/${d.archivo}" target="_blank" style="font-size:1rem;text-decoration:none;opacity:.8" title="${d.archivo}">📄</a>` : '<span class="vnr">—</span>'}</td>
    </tr>`;
  }).join('');
}

function sortTable(col) {
  if (sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
  const keys = ['mw','units','foundation','type','cf','lt','epbt','gwp','gwp_h','method','year','lat','lon','ref','archivo'];
  const k = keys[col];
  filteredData.sort((a, b) => {
    const av = parseNum(a[k]) ?? a[k];
    const bv = parseNum(b[k]) ?? b[k];
    if (av === null || av === '—' || av === 'NR') return 1;
    if (bv === null || bv === '—' || bv === 'NR') return -1;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  document.querySelectorAll('th').forEach((th, i) => {
    th.className = i === col ? 'sorted' : '';
    const arrow = th.querySelector('.sa');
    if (arrow) arrow.textContent = i === col ? (sortAsc ? ' ↑' : ' ↓') : '↕';
  });
  const q = searchQuery.toLowerCase();
  renderTable(q ? filteredData.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(q))) : filteredData);
}

/* ─── CHARTS ─────────────────────────────────────────────────────────────────── */
const ACCENT = '#5baaff', ACCENT2 = '#62f0cf', AMBER = '#ffc06b';
const MUTED  = '#7a9bbf', GRID = 'rgba(100,181,255,0.07)', TEXTCOL = '#ddeeff';

const BASE_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend:  { labels: { color: MUTED, font: { family: 'DM Sans', size: 11 }, boxWidth: 12, padding: 14 } },
    tooltip: { backgroundColor: '#0d1c2e', borderColor: 'rgba(100,181,255,0.22)', borderWidth: 1,
               titleColor: TEXTCOL, bodyColor: MUTED,
               titleFont: { family: 'DM Sans', size: 11 }, bodyFont: { family: 'DM Sans', size: 10 }, padding: 9 }
  },
  scales: {
    x: { ticks: { color: MUTED, font: { family: 'DM Sans', size: 10 } }, grid: { color: GRID } },
    y: { ticks: { color: MUTED, font: { family: 'DM Sans', size: 10 } }, grid: { color: GRID } }
  }
};

function renderCharts(data) {
  renderFoundationChart(data);
  renderYearChart(data);
  renderScatterChart(data);
  renderBoxplot(data);
}

function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

/* Chart 1 – Foundation bar */
function renderFoundationChart(data) {
  destroyChart('foundation');
  const byF = {};
  data.forEach(d => { const v = parseNum(d.gwp_h); if (v === null) return; const k = abbreviate(d.foundation); if (!byF[k]) byF[k] = []; byF[k].push(v); });
  const labels = Object.keys(byF).sort((a, b) => avg(byF[b]) - avg(byF[a]));
  const vals   = labels.map(l => avg(byF[l]).toFixed(1));
  const colors = labels.map((_, i) => `hsla(${200 + i * 20}, 68%, 62%, 0.82)`);
  charts['foundation'] = new Chart(document.getElementById('chart-foundation'), {
    type: 'bar',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderRadius: 5, borderSkipped: false }] },
    options: { ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: {
        x: { ...BASE_OPTS.scales.x, ticks: { ...BASE_OPTS.scales.x.ticks, maxRotation: 38, minRotation: 22 } },
        y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'gCO₂eq/kWh', color: MUTED, font: { size: 9 } } }
      }
    }
  });
}

/* Chart 2 – Year line */
function renderYearChart(data) {
  destroyChart('year');
  const byY = {};
  data.forEach(d => { const v = parseNum(d.gwp_h), y = parseInt(d.year); if (v === null || isNaN(y)) return; if (!byY[y]) byY[y] = []; byY[y].push(v); });
  const years = Object.keys(byY).map(Number).sort((a, b) => a - b);
  const meds  = years.map(y => median(byY[y]).toFixed(1));
  const mins  = years.map(y => Math.min(...byY[y]).toFixed(1));
  const maxs  = years.map(y => Math.max(...byY[y]).toFixed(1));
  charts['year'] = new Chart(document.getElementById('chart-year'), {
    type: 'line',
    data: { labels: years, datasets: [
      { label: 'Mediana', data: meds, borderColor: ACCENT,  backgroundColor: 'rgba(91,170,255,.12)', tension: .35, fill: false, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Mínimo',  data: mins, borderColor: ACCENT2, borderDash: [4, 3], tension: .35, fill: false, pointRadius: 3 },
      { label: 'Máximo',  data: maxs, borderColor: AMBER,   borderDash: [4, 3], tension: .35, fill: false, pointRadius: 3 },
    ]},
    options: { ...BASE_OPTS,
      scales: { x: { ...BASE_OPTS.scales.x }, y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'gCO₂eq/kWh', color: MUTED, font: { size: 9 } } } }
    }
  });
}

/* Chart 3 – Scatter */
function renderScatterChart(data) {
  destroyChart('scatter');
  const mk = t => data.filter(d => d.type === t).map(d => ({ x: parseNum(d.mw), y: parseNum(d.gwp_h), label: d.ref })).filter(p => p.x !== null && p.y !== null);
  charts['scatter'] = new Chart(document.getElementById('chart-scatter'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Flotante',     data: mk('Floating'),     backgroundColor: 'rgba(98,240,207,.68)', pointRadius: 6, pointHoverRadius: 8 },
      { label: 'Fijo al fondo', data: mk('Bottom-fixed'), backgroundColor: 'rgba(255,192,107,.68)', pointRadius: 6, pointHoverRadius: 8 },
    ]},
    options: { ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, tooltip: { ...BASE_OPTS.plugins.tooltip, callbacks: {
        label: ctx => `${ctx.dataset.label} · ${ctx.raw.x} MW · ${ctx.raw.y} gCO₂eq/kWh`
      }}},
      scales: {
        x: { ...BASE_OPTS.scales.x, title: { display: true, text: 'Potencia nominal (MW)', color: MUTED, font: { family: 'DM Sans', size: 10 } } },
        y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'GWP armonizado (gCO₂eq/kWh)', color: MUTED, font: { family: 'DM Sans', size: 10 } } }
      }
    }
  });
}

/* Chart 4 – Boxplot (custom Canvas plugin) */
function renderBoxplot(data) {
  destroyChart('boxplot');
  const floatVals = data.filter(d => d.type === 'Floating').map(d    => parseNum(d.gwp_h)).filter(v => v !== null);
  const fixedVals = data.filter(d => d.type === 'Bottom-fixed').map(d => parseNum(d.gwp_h)).filter(v => v !== null);
  if (!floatVals.length && !fixedVals.length) return;

  const calcStats = vals => {
    if (!vals.length) return null;
    const s   = [...vals].sort((a, b) => a - b);
    const n   = s.length;
    const q1  = s[Math.floor(n * 0.25)];
    const q3  = s[Math.floor(n * 0.75)];
    const med = median(s);
    const mn  = avg(s);
    const iqr = q3 - q1;
    const wlo = Math.max(s[0],   q1 - 1.5 * iqr);
    const whi = Math.min(s[n-1], q3 + 1.5 * iqr);
    const outliers = s.filter(v => v < wlo || v > whi);
    return { q1, q3, med, mn, wlo, whi, outliers, n };
  };

  const fsStats = calcStats(floatVals);
  const fxStats = calcStats(fixedVals);

  // Pre-compute stable jitter per value (deterministic using index)
  const jitter = (vals, halfW) => vals.map((_, i) => ((i * 6271 + 1237) % 1000 / 1000 - 0.5) * halfW * 1.4);
  const fjit = floatVals.length ? jitter(floatVals, 1) : [];
  const xjit = fixedVals.length ? jitter(fixedVals, 1) : [];

  const boxPlugin = {
    id: 'boxDraw',
    afterDatasetsDraw(chart) {
      const ctx    = chart.ctx;
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      const drawBox = (catIdx, st, color, vals, jit) => {
        if (!st) return;
        const cx    = xScale.getPixelForTick(catIdx);
        const halfW = Math.min(55, xScale.width / 4.5);
        const scY   = v => yScale.getPixelForValue(v);

        ctx.save();

        /* whisker lines */
        ctx.strokeStyle = color + 'aa';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cx, scY(st.whi)); ctx.lineTo(cx, scY(st.q3)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, scY(st.wlo)); ctx.lineTo(cx, scY(st.q1)); ctx.stroke();
        ctx.setLineDash([]);

        /* whisker caps */
        ctx.strokeStyle = color + 'bb';
        ctx.lineWidth   = 1.5;
        const capW = halfW * 0.38;
        ctx.beginPath(); ctx.moveTo(cx - capW, scY(st.whi)); ctx.lineTo(cx + capW, scY(st.whi)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - capW, scY(st.wlo)); ctx.lineTo(cx + capW, scY(st.wlo)); ctx.stroke();

        /* IQR box fill */
        ctx.fillStyle   = color + '1a';
        ctx.strokeStyle = color + 'cc';
        ctx.lineWidth   = 2;
        const bx = cx - halfW, bw = halfW * 2;
        const by = scY(st.q3), bh = scY(st.q1) - scY(st.q3);
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.fill();
        ctx.stroke();

        /* median line */
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2.5;
        ctx.beginPath(); ctx.moveTo(cx - halfW, scY(st.med)); ctx.lineTo(cx + halfW, scY(st.med)); ctx.stroke();

        /* mean diamond */
        const dm = 5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx,      scY(st.mn) - dm);
        ctx.lineTo(cx + dm, scY(st.mn));
        ctx.lineTo(cx,      scY(st.mn) + dm);
        ctx.lineTo(cx - dm, scY(st.mn));
        ctx.closePath();
        ctx.fill();

        /* individual data points */
        vals.forEach((v, i) => {
          const isOut = st.outliers.includes(v);
          const px    = cx + jit[i] * halfW;
          const py    = scY(v);
          ctx.beginPath();
          ctx.arc(px, py, isOut ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isOut ? color : color + '55';
          ctx.strokeStyle = isOut ? 'rgba(255,255,255,0.3)' : 'transparent';
          ctx.lineWidth = 1;
          ctx.fill();
          if (isOut) ctx.stroke();
        });

        /* n label */
        ctx.fillStyle  = MUTED;
        ctx.font       = `11px DM Sans, sans-serif`;
        ctx.textAlign  = 'center';
        ctx.fillText(`n=${st.n}`, cx, yScale.bottom + 32);

        ctx.restore();
      };

      drawBox(0, fsStats, ACCENT2, floatVals, fjit);
      drawBox(1, fxStats, AMBER,   fixedVals, xjit);
    }
  };

  const allVals = [...floatVals, ...fixedVals];
  const minV = Math.min(...allVals), maxV = Math.max(...allVals);
  const pad  = (maxV - minV) * 0.12;

  charts['boxplot'] = new Chart(document.getElementById('chart-boxplot'), {
    type: 'bar',
    data: {
      labels: ['Flotante', 'Fijo al fondo'],
      datasets: [{ data: [null, null], backgroundColor: 'transparent', borderColor: 'transparent' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend:  { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: { ticks: { color: TEXTCOL, font: { family: 'DM Sans', size: 12, weight: '500' } }, grid: { display: false } },
        y: {
          ticks: { color: MUTED, font: { family: 'DM Sans', size: 10 } },
          grid:  { color: GRID },
          title: { display: true, text: 'GWP armonizado (gCO₂eq/kWh)', color: MUTED, font: { size: 10 } },
          min: Math.max(0, minV - pad),
          max: maxV + pad,
        }
      },
      layout: { padding: { bottom: 10 } }
    },
    plugins: [boxPlugin]
  });
}

/* ─── UTILS ──────────────────────────────────────────────────────────────────── */
function isNE(v)      { if (!v) return false; const s = String(v).trim().toLowerCase(); return s === 'ne' || s.startsWith('no especificado'); }
function parseNum(v)  { if (!v || v === '—' || v === 'NR' || v === 'NaN') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
function median(arr)  { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2; }
function avg(arr)     { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(s)       { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

function abbreviate(name) {
  const map = {
    'Semi-submersible steel': 'Semi-sub. acero', 'Semi-submersible platform': 'Semi-sub.',
    'Semi-submersible': 'Semi-sub.', 'Spar buoy concrete': 'Spar concreto',
    'Concrete SPAR-type (ballast-stabilized)': 'Spar concreto',
    'Bottom-fixed (Gravity)': 'Fijo (grav.)',   'Bottom-fixed (Driven)': 'Fijo (hincado)',
    'Bottom-fixed (Monopile)': 'Monopile', 'Sway (Tension Leg Spar)': 'TLS',
    'TLB (Tension Leg Barge)': 'TLB',     'TLP (Tension Leg Platform)': 'TLP',
    'SPAR (Hywind Tampen)': 'Spar Hywind', 'Jacket foundation': 'Jacket',
    'Barge-type': 'Barge', 'Barge (SATH)': 'SATH',
  };
  return map[name] || (name.length > 18 ? name.slice(0, 17) + '…' : name);
}
