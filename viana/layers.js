/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM + EMODnet
   layers.js — Catálogo de camadas
   Tipos:
     type: "arcgis"  → L.esri.dynamicMapLayer  (DGRM)
     type: "wms"     → L.tileLayer.wms         (EMODnet)
   ============================================================ */

// ── DGRM — ArcGIS REST ────────────────────────────────────────
const BASE = "https://webgis.dgrm.mm.gov.pt/arcgis/rest/services/PSOEM_GEOPORTAL/";
const MS   = "/MapServer";

// ── EMODnet — WMS endpoints ───────────────────────────────────
const EMOD_BATH  = "https://ows.emodnet-bathymetry.eu/wms";
const EMOD_HAB   = "https://ows.emodnet-seabedhabitats.eu/geoserver/emodnet_view/wms";
const EMOD_HAB_LIB = "https://ows.emodnet-seabedhabitats.eu/geoserver/emodnet_view_maplibrary/wms";
const EMOD_HUM   = "https://ows.emodnet-humanactivities.eu/wms";
const EMOD_GEO   = "https://drive.emodnet-geology.eu/geoserver/bgr/wms";
const EMOD_CHEM  = "https://ec.oceanbrowser.net/emodnet/Python/web/wms";

const LAYERS = [

  // ══════════════════════════════════════════════════════════
  //  DGRM — Camadas nacionais (ArcGIS REST)
  // ══════════════════════════════════════════════════════════

  // ── PLANEAMENTO E ORDENAMENTO ──────────────────────────────
  { cat: "📋 Planeamento e Ordenamento", id: "tupem1",
    name: "TUPEM (v1)",
    desc: "Versão 1 da camada TUPEM",
    url: BASE + "Tupem_geoportal1" + MS },

  // ── LIMITES E JURISDIÇÃO ───────────────────────────────────
  { cat: "⚓ Limites e Jurisdição", id: "limites",
    name: "Limites Marítimos (IH)",
    desc: "Mar territorial, ZEE, zona contígua — fonte IH v2",
    url: BASE + "Limites_Fonte_IH_v2" + MS },

  { cat: "⚓ Limites e Jurisdição", id: "faixa",
    name: "Faixa de Proteção Costeira (1 e 2 mn)",
    desc: "Banda de proteção da orla costeira a 1 e 2 milhas náuticas",
    url: BASE + "FaixaProtecaoCosteira1e2mn" + MS },

  { cat: "⚓ Limites e Jurisdição", id: "linhajmm",
    name: "Linha Base e Jurisdição Portuária",
    desc: "Linha de Base normal (DL 495/85) e limites de jurisdição portuária",
    url: "https://webgis.dgrm.mm.gov.pt/arcgis/rest/services/PSOEM_PosCPub/LinhaJMM_pcp_final1/MapServer" },

  // ── PESCA ──────────────────────────────────────────────────
  { cat: "🎣 Pesca", id: "portos_docapesca",
    name: "Portos e Docas de Pesca",
    desc: "Infraestrutura portuária dedicada à pesca comercial",
    url: BASE + "Portos_DocaPesca" + MS },

  { cat: "🎣 Pesca", id: "bacias_dragagem",
    name: "Bacias de Dragagem — Doca de Pesca",
    desc: "Áreas de dragagem portuária associadas a docas de pesca",
    url: BASE + "BaciasDragagemDocaPesca" + MS },

  // ── ENERGIA E INFRAESTRUTURA ───────────────────────────────
  { cat: "⚡ Energia e Infraestrutura", id: "eolicas",
    name: "Energia Eólica Offshore",
    desc: "Zonas existentes e potenciais para eólica offshore — PSOEM",
    url: BASE + "PSOEM_Eolicas_geoportal" + MS },

  { cat: "⚡ Energia e Infraestrutura", id: "emissarios",
    name: "Emissários Submarinos",
    desc: "Condutas submarinas de descarga de efluentes",
    url: BASE + "Emissarios_submarinos_geoportal" + MS },

  { cat: "⚡ Energia e Infraestrutura", id: "residuos",
    name: "Gestão de Resíduos (v4)",
    desc: "Instalações e áreas de gestão de resíduos marítimos",
    url: BASE + "Gest%C3%A3o_de_residuos_V4" + MS },

  // ── TRÁFEGO MARÍTIMO ───────────────────────────────────────
  { cat: "🚢 Tráfego Marítimo", id: "sep_trafego",
    name: "Separação de Tráfego Marítimo",
    desc: "Esquemas de separação de tráfego da OMI nas águas portuguesas",
    url: BASE + "SeparacaoTrafegoMaritimo_geoportal" + MS },

  { cat: "🚢 Tráfego Marítimo", id: "marinas",
    name: "Marinas e Portos de Recreio",
    desc: "Infraestruturas náuticas de recreio em Portugal continental",
    url: BASE + "marinas_e_portos_de_recreio" + MS },

  { cat: "🚢 Tráfego Marítimo", id: "itp",
    name: "ITP — Infraestrutura de Transportes de Portugal",
    desc: "Portos e marinas de recreio — base ITP",
    url: BASE + "ITP_marinas_portos_recreio" + MS },

  // ── GEOLOGIA E BATIMETRIA (DGRM) ──────────────────────────
  { cat: "🪨 Geologia e Batimetria", id: "montes_sub",
    name: "Montes Submarinos e Estrutura Geológica",
    desc: "Morfologia do fundo marinho: montes, dorsais, estruturas geológicas",
    url: BASE + "MontesSub_EstrtGeol" + MS },

  { cat: "🪨 Geologia e Batimetria", id: "manchas_emprestimo",
    name: "Manchas de Empréstimo",
    desc: "Áreas de extração de sedimentos marinhos para alimentação de praias",
    url: BASE + "ManchasEmprestimo" + MS },

  { cat: "🪨 Geologia e Batimetria", id: "gest_sedimentar",
    name: "Gestão Estratégica de Sedimentos (APA)",
    desc: "Área de gestão estratégica de sedimentos costeiros — APA",
    url: BASE + "Area_estrat_gest_sedimentar_APA" + MS },

  { cat: "🪨 Geologia e Batimetria", id: "recursos_geo",
    name: "Títulos Recursos Geológicos (TIT)",
    desc: "Títulos de prospeção e extração de recursos geológicos marinhos",
    url: BASE + "TIT_RECURSOS_GEOLOGICOS" + MS },

  // ── DEFESA E SEGURANÇA ─────────────────────────────────────
  { cat: "🛡️ Defesa e Segurança", id: "exercicios_mil",
    name: "Exercícios Militares",
    desc: "Áreas e períodos reservados para exercícios militares marítimos",
    url: BASE + "Exercicios_Militares" + MS },

  { cat: "🛡️ Defesa e Segurança", id: "imersao",
    name: "Áreas de Imersão",
    desc: "Zonas autorizadas para imersão de materiais dragados",
    url: BASE + "PSOEM_AREASLOCAIS_IMERSAO" + MS },

  // ── RECREIO E TURISMO ──────────────────────────────────────
  { cat: "🏖️ Recreio e Turismo", id: "patrimonio_orla",
    name: "Património e Restrições na Orla Marítima",
    desc: "Bens patrimoniais classificados e restrições de uso na orla costeira",
    url: BASE + "Patrim%C3%B3nio_e_Restri%C3%A7%C3%B5es_na_Orla_Maritima" + MS },


  // ══════════════════════════════════════════════════════════
  //  EMODnet — Camadas europeias (WMS)
  // ══════════════════════════════════════════════════════════

  // ── BATIMETRIA EMODnet ─────────────────────────────────────
  { cat: "🌊 [EMODnet] Batimetria", id: "emod_bath_multi",
    type: "wms",
    name: "Profundidade Média — Multicolor (DTM)",
    desc: "Modelo digital de terreno do fundo marinho — resolução 1/8 arc min (~250 m)",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_multicolour" },

  { cat: "🌊 [EMODnet] Batimetria", id: "emod_bath_rainbow",
    type: "wms",
    name: "Profundidade Média — Arco-íris",
    desc: "DTM em escala de cores arco-íris, útil para distinguir relevos",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_rainbowcolour" },

  { cat: "🌊 [EMODnet] Batimetria", id: "emod_bath_land",
    type: "wms",
    name: "DTM com Topografia Terrestre",
    desc: "Batimetria combinada com altimetria terrestre (SRTM)",
    url: EMOD_BATH, wmsLayers: "emodnet:mean_atlas_land" },

  { cat: "🌊 [EMODnet] Batimetria", id: "emod_bath_contours",
    type: "wms",
    name: "Isolinhas Batimétricas",
    desc: "Linhas de igual profundidade (curvas de nível do fundo marinho)",
    url: EMOD_BATH, wmsLayers: "emodnet:contours" },

  // ── HABITATS DO FUNDO MARINHO ──────────────────────────────
  { cat: "🐚 [EMODnet] Habitats Bênticos", id: "emod_euseamap",
    type: "wms",
    name: "EUSeaMap — Habitats Bênticos Pan-Europeus",
    desc: "Mapa de habitats do fundo marinho (classificação EUNIS) a escala europeia",
    url: EMOD_HAB, wmsLayers: "emodnet_view:EUSeaMap_2021" },

  { cat: "🐚 [EMODnet] Habitats Bênticos", id: "emod_hab_ospar",
    type: "wms",
    name: "Habitats OSPAR Ameaçados e em Declínio",
    desc: "Habitats marinhos classificados como ameaçados pela Convenção OSPAR",
    url: EMOD_HAB_LIB, wmsLayers: "emodnet_view_maplibrary:OSPAR_threatened_habitats" },

  // ── ATIVIDADES HUMANAS ─────────────────────────────────────
  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_windfarms",
    type: "wms",
    name: "Parques Eólicos Offshore",
    desc: "Parques eólicos no mar: operacionais, em construção e planeados",
    url: EMOD_HUM, wmsLayers: "windfarms" },

  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_cables",
    type: "wms",
    name: "Cabos Submarinos",
    desc: "Cabos elétricos e de telecomunicações no fundo do mar",
    url: EMOD_HUM, wmsLayers: "cables" },

  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_pipelines",
    type: "wms",
    name: "Oleodutos e Gasodutos Submarinos",
    desc: "Infraestrutura de transporte de hidrocarbonetos sob o mar",
    url: EMOD_HUM, wmsLayers: "pipelines" },

  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_ais",
    type: "wms",
    name: "Densidade de Tráfego AIS",
    desc: "Intensidade de tráfego marítimo baseada em dados AIS (transponders)",
    url: EMOD_HUM, wmsLayers: "ais_vessel_density" },

  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_mpa",
    type: "wms",
    name: "Áreas Marinhas Protegidas (AMP)",
    desc: "Rede europeia de Áreas Marinhas Protegidas (MPAs)",
    url: EMOD_HUM, wmsLayers: "MarineProtectedAreas" },

  { cat: "🏭 [EMODnet] Atividades Humanas", id: "emod_aquaculture",
    type: "wms",
    name: "Aquicultura Marinha",
    desc: "Instalações de aquicultura offshore e zonas de produção",
    url: EMOD_HUM, wmsLayers: "aquaculture" },

  // ── GEOLOGIA SUBMARINA (EMODnet) ───────────────────────────
  { cat: "🗺️ [EMODnet] Geologia Submarina", id: "emod_substrate_1m",
    type: "wms",
    name: "Substrato do Fundo Marinho (1:1.000.000)",
    desc: "Tipo de substrato bêntico: rocha, cascalho, areia, lodo — escala 1M",
    url: EMOD_GEO, wmsLayers: "emodnet_seabed_substrate_1m" },

  { cat: "🗺️ [EMODnet] Geologia Submarina", id: "emod_substrate_250k",
    type: "wms",
    name: "Substrato do Fundo Marinho (1:250.000)",
    desc: "Tipo de substrato bêntico a maior resolução — escala 250k",
    url: EMOD_GEO, wmsLayers: "emodnet_seabed_substrate_250k" },

  { cat: "🗺️ [EMODnet] Geologia Submarina", id: "emod_geo_events",
    type: "wms",
    name: "Eventos Geológicos Submarinos",
    desc: "Deslizamentos, vulcões submarinos e outras ocorrências geológicas",
    url: EMOD_GEO, wmsLayers: "geological_events_and_probabilities" },

];
