/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM + EMODnet
   layers.js — Layer catalogue
   Types:
     type: "arcgis"  → L.esri.dynamicMapLayer  (DGRM)
     type: "wms"     → L.tileLayer.wms         (EMODnet)
   ============================================================ */

// ── DGRM — ArcGIS REST ────────────────────────────────────────
const BASE = "https://webgis.dgrm.mm.gov.pt/arcgis/rest/services/PSOEM_GEOPORTAL/";
const MS   = "/MapServer";

// ── EMODnet — WMS endpoints ───────────────────────────────────
const EMOD_BATH    = "https://ows.emodnet-bathymetry.eu/wms";
const EMOD_HAB     = "https://ows.emodnet-seabedhabitats.eu/geoserver/emodnet_view/wms";
const EMOD_HAB_LIB = "https://ows.emodnet-seabedhabitats.eu/geoserver/emodnet_view_maplibrary/wms";
const EMOD_HUM     = "https://ows.emodnet-humanactivities.eu/wms";
const EMOD_GEO     = "https://drive.emodnet-geology.eu/geoserver/bgr/wms";

const LAYERS = [

  // ══════════════════════════════════════════════════════════
  //  DGRM — National layers (ArcGIS REST)
  // ══════════════════════════════════════════════════════════

  // ── PLANNING & ZONING ──────────────────────────────────────
  { cat: "📋 Planning & Zoning", id: "tupem1",
    name: "TUPEM (v1)",
    desc: "Version 1 of the TUPEM (maritime space use title) layer",
    url: BASE + "Tupem_geoportal1" + MS },

  // ── LIMITS & JURISDICTION ──────────────────────────────────
  { cat: "⚓ Limits & Jurisdiction", id: "limites",
    name: "Maritime Limits (IH)",
    desc: "Territorial sea, EEZ, contiguous zone — IH source v2",
    url: BASE + "Limites_Fonte_IH_v2" + MS },

  { cat: "⚓ Limits & Jurisdiction", id: "faixa",
    name: "Coastal Protection Zone (1 & 2 nm)",
    desc: "Coastal protection buffer at 1 and 2 nautical miles from shore",
    url: BASE + "FaixaProtecaoCosteira1e2mn" + MS },

  { cat: "⚓ Limits & Jurisdiction", id: "linhajmm",
    name: "Baseline & Port Jurisdiction",
    desc: "Normal baseline (DL 495/85) and port jurisdiction boundaries",
    url: "https://webgis.dgrm.mm.gov.pt/arcgis/rest/services/PSOEM_PosCPub/LinhaJMM_pcp_final1/MapServer" },

  // ── FISHING ────────────────────────────────────────────────
  { cat: "🎣 Fishing", id: "portos_docapesca",
    name: "Fishing Ports & Docks",
    desc: "Port infrastructure dedicated to commercial fishing",
    url: BASE + "Portos_DocaPesca" + MS },

  { cat: "🎣 Fishing", id: "bacias_dragagem",
    name: "Dredging Basins — Fishing Docks",
    desc: "Port dredging areas associated with fishing docks",
    url: BASE + "BaciasDragagemDocaPesca" + MS },

  // ── ENERGY & INFRASTRUCTURE ────────────────────────────────
  { cat: "⚡ Energy & Infrastructure", id: "eolicas",
    name: "Offshore Wind Energy",
    desc: "Existing and potential offshore wind energy zones — PSOEM",
    url: BASE + "PSOEM_Eolicas_geoportal" + MS },

  { cat: "⚡ Energy & Infrastructure", id: "emissarios",
    name: "Submarine Outfall Pipes",
    desc: "Submarine discharge pipes for effluent disposal",
    url: BASE + "Emissarios_submarinos_geoportal" + MS },

  { cat: "⚡ Energy & Infrastructure", id: "residuos",
    name: "Waste Management (v4)",
    desc: "Maritime waste management facilities and areas",
    url: BASE + "Gest%C3%A3o_de_residuos_V4" + MS },

  // ── MARITIME TRAFFIC ───────────────────────────────────────
  { cat: "🚢 Maritime Traffic", id: "sep_trafego",
    name: "Traffic Separation Schemes",
    desc: "IMO traffic separation schemes in Portuguese waters",
    url: BASE + "SeparacaoTrafegoMaritimo_geoportal" + MS },

  { cat: "🚢 Maritime Traffic", id: "marinas",
    name: "Marinas & Leisure Ports",
    desc: "Recreational nautical infrastructure in mainland Portugal",
    url: BASE + "marinas_e_portos_de_recreio" + MS },

  { cat: "🚢 Maritime Traffic", id: "itp",
    name: "ITP — Portugal Transport Infrastructure",
    desc: "Ports and marinas — ITP database",
    url: BASE + "ITP_marinas_portos_recreio" + MS },

  // ── GEOLOGY & BATHYMETRY (DGRM) ────────────────────────────
  { cat: "🪨 Geology & Bathymetry", id: "montes_sub",
    name: "Seamounts & Geological Structure",
    desc: "Seabed morphology: seamounts, ridges, geological structures",
    url: BASE + "MontesSub_EstrtGeol" + MS },

  { cat: "🪨 Geology & Bathymetry", id: "manchas_emprestimo",
    name: "Borrow Areas",
    desc: "Marine sediment extraction areas for beach nourishment",
    url: BASE + "ManchasEmprestimo" + MS },

  { cat: "🪨 Geology & Bathymetry", id: "gest_sedimentar",
    name: "Strategic Sediment Management (APA)",
    desc: "Coastal sediment strategic management area — APA",
    url: BASE + "Area_estrat_gest_sedimentar_APA" + MS },

  { cat: "🪨 Geology & Bathymetry", id: "recursos_geo",
    name: "Geological Resource Titles (TIT)",
    desc: "Exploration and extraction titles for marine geological resources",
    url: BASE + "TIT_RECURSOS_GEOLOGICOS" + MS },

  // ── DEFENCE & SECURITY ─────────────────────────────────────
  { cat: "🛡️ Defence & Security", id: "exercicios_mil",
    name: "Military Exercises",
    desc: "Areas and periods reserved for maritime military exercises",
    url: BASE + "Exercicios_Militares" + MS },

  { cat: "🛡️ Defence & Security", id: "imersao",
    name: "Dumping Areas",
    desc: "Zones authorised for disposal of dredged material",
    url: BASE + "PSOEM_AREASLOCAIS_IMERSAO" + MS },

  // ── RECREATION & TOURISM ───────────────────────────────────
  { cat: "🏖️ Recreation & Tourism", id: "patrimonio_orla",
    name: "Heritage & Restrictions — Maritime Shore",
    desc: "Listed heritage and use restrictions on the coastal fringe",
    url: BASE + "Patrim%C3%B3nio_e_Restri%C3%A7%C3%B5es_na_Orla_Maritima" + MS },


  // ══════════════════════════════════════════════════════════
  //  EMODnet — European layers (WMS)
  // ══════════════════════════════════════════════════════════

  // ── BATHYMETRY ─────────────────────────────────────────────
  { cat: "🌊 [EMODnet] Bathymetry", id: "emod_bath_multi",
    type: "wms",
    name: "Mean Depth — Multicolour (DTM)",
    desc: "Digital terrain model of the seabed — 1/8 arc min resolution (~250 m)",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_multicolour" },

  { cat: "🌊 [EMODnet] Bathymetry", id: "emod_bath_rainbow",
    type: "wms",
    name: "Mean Depth — Rainbow",
    desc: "DTM in rainbow colour scale, useful for highlighting relief",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_rainbowcolour" },

  { cat: "🌊 [EMODnet] Bathymetry", id: "emod_bath_land",
    type: "wms",
    name: "DTM with Land Topography",
    desc: "Bathymetry combined with land altimetry (SRTM)",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_atlas_land" },

  { cat: "🌊 [EMODnet] Bathymetry", id: "emod_bath_contours",
    type: "wms",
    name: "Bathymetric Contours",
    desc: "Isobath lines (equal-depth contours of the seabed)",
    url: EMOD_BATH, wmsLayers: "emodnet:contours" },

  // ── BENTHIC HABITATS ───────────────────────────────────────
  { cat: "🐚 [EMODnet] Benthic Habitats", id: "emod_euseamap",
    type: "wms",
    name: "EUSeaMap — Pan-European Benthic Habitats",
    desc: "Seabed habitat map (EUNIS classification) at European scale",
    url: EMOD_HAB, wmsLayers: "emodnet_view:EUSeaMap_2021" },

  { cat: "🐚 [EMODnet] Benthic Habitats", id: "emod_hab_ospar",
    type: "wms",
    name: "OSPAR Threatened & Declining Habitats",
    desc: "Marine habitats classified as threatened under the OSPAR Convention",
    url: EMOD_HAB_LIB, wmsLayers: "emodnet_view_maplibrary:OSPAR_threatened_habitats" },

  // ── HUMAN ACTIVITIES ───────────────────────────────────────
  { cat: "🏭 [EMODnet] Human Activities", id: "emod_windfarms",
    type: "wms",
    name: "Offshore Wind Farms",
    desc: "Offshore wind farms: operational, under construction and planned",
    url: EMOD_HUM, wmsLayers: "windfarms" },

  { cat: "🏭 [EMODnet] Human Activities", id: "emod_cables",
    type: "wms",
    name: "Submarine Cables",
    desc: "Electrical and telecommunications cables on the seabed",
    url: EMOD_HUM, wmsLayers: "cables" },

  { cat: "🏭 [EMODnet] Human Activities", id: "emod_pipelines",
    type: "wms",
    name: "Submarine Pipelines",
    desc: "Hydrocarbon transport infrastructure under the sea",
    url: EMOD_HUM, wmsLayers: "pipelines" },

  { cat: "🏭 [EMODnet] Human Activities", id: "emod_ais",
    type: "wms",
    name: "AIS Vessel Traffic Density",
    desc: "Maritime traffic intensity based on AIS transponder data",
    url: EMOD_HUM, wmsLayers: "ais_vessel_density" },

  { cat: "🏭 [EMODnet] Human Activities", id: "emod_mpa",
    type: "wms",
    name: "Marine Protected Areas (MPA)",
    desc: "European network of Marine Protected Areas",
    url: EMOD_HUM, wmsLayers: "MarineProtectedAreas" },

  { cat: "🏭 [EMODnet] Human Activities", id: "emod_aquaculture",
    type: "wms",
    name: "Marine Aquaculture",
    desc: "Offshore aquaculture installations and production zones",
    url: EMOD_HUM, wmsLayers: "aquaculture" },

  // ── SUBMARINE GEOLOGY ──────────────────────────────────────
  { cat: "🗺️ [EMODnet] Submarine Geology", id: "emod_substrate_1m",
    type: "wms",
    name: "Seabed Substrate (1:1,000,000)",
    desc: "Benthic substrate type: rock, gravel, sand, mud — 1M scale",
    url: EMOD_GEO, wmsLayers: "emodnet_seabed_substrate_1m" },

  { cat: "🗺️ [EMODnet] Submarine Geology", id: "emod_substrate_250k",
    type: "wms",
    name: "Seabed Substrate (1:250,000)",
    desc: "Higher-resolution benthic substrate type — 250k scale",
    url: EMOD_GEO, wmsLayers: "emodnet_seabed_substrate_250k" },

  { cat: "🗺️ [EMODnet] Submarine Geology", id: "emod_geo_events",
    type: "wms",
    name: "Submarine Geological Events",
    desc: "Landslides, submarine volcanoes and other geological occurrences",
    url: EMOD_GEO, wmsLayers: "geological_events_and_probabilities" },

];
