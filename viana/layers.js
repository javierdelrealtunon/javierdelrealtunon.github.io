/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM
   layers.js — Catálogo de camadas (ArcGIS REST MapServer)
   ============================================================ */

// Endpoint REST — no usa /services/ (bloqueado) sino /rest/services/
const BASE = "https://webgis.dgrm.mm.gov.pt/arcgis/rest/services/PSOEM_GEOPORTAL/";
const MS   = "/MapServer";

const LAYERS = [

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

  // ── AMBIENTE E CONSERVAÇÃO ─────────────────────────────────
  { cat: "🌿 Ambiente e Conservação", id: "ospar",
    name: "OSPAR — Áreas Protegidas",
    desc: "Áreas marinhas protegidas da Convenção OSPAR",
    url: BASE + "OSPAR" + MS },

  { cat: "🌿 Ambiente e Conservação", id: "iba",
    name: "IBA — Áreas Importantes para Aves",
    desc: "Important Bird & Biodiversity Areas em meio marinho",
    url: BASE + "IBA" + MS },

  { cat: "🌿 Ambiente e Conservação", id: "rede_natura_es",
    name: "Rede Natura 2000 (Espanha)",
    desc: "Zonas de proteção especial da Rede Natura 2000 em águas espanholas",
    url: BASE + "PSOEM_Rede_natura_2000_Espanha" + MS },

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

  { cat: "⚡ Energia e Infraestrutura", id: "cabos_submarinos",
    name: "Cabos Submarinos (EMODnet)",
    desc: "Rede de cabos de telecomunicações e elétricos submarinos",
    url: BASE + "Cabos_submarinos_EMODnet" + MS },

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

  // ── GEOLOGIA E BATIMETRIA ──────────────────────────────────
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

  { cat: "🪨 Geologia e Batimetria", id: "hsmax",
    name: "Cartas Hsmax (LNEC)",
    desc: "Altura significativa máxima de ondas — modelação LNEC",
    url: BASE + "Cartas_Hsmax_LNEC" + MS },

  { cat: "🪨 Geologia e Batimetria", id: "recursos_geo",
    name: "Títulos Recursos Geológicos (TIT)",
    desc: "Títulos de prospeção e extração de recursos geológicos marinhos",
    url: BASE + "TIT_RECURSOS_GEOLOGICOS" + MS },

  // ── DEFESA E SEGURANÇA ─────────────────────────────────────
  { cat: "🛡️ Defesa e Segurança", id: "exercicios_mil",
    name: "Exercícios Militares",
    desc: "Áreas e períodos reservados para exercícios militares marítimos",
    url: BASE + "Exercicios_Militares" + MS },

  { cat: "🛡️ Defesa e Segurança", id: "naufrágios",
    name: "Naufrágios e Afundamentos (IH)",
    desc: "Localização de embarcações naufragadas nas águas portuguesas",
    url: BASE + "Localiza%C3%A7%C3%A3o_de_naufr%C3%A1gios_e_afundamentos_Fonte_IH_v2" + MS },

  { cat: "🛡️ Defesa e Segurança", id: "imersao",
    name: "Áreas de Imersão",
    desc: "Zonas autorizadas para imersão de materiais dragados",
    url: BASE + "PSOEM_AREASLOCAIS_IMERSAO" + MS },

  // ── RECREIO E TURISMO ──────────────────────────────────────
  { cat: "🏖️ Recreio e Turismo", id: "patrimonio_orla",
    name: "Património e Restrições na Orla Marítima",
    desc: "Bens patrimoniais classificados e restrições de uso na orla costeira",
    url: BASE + "Patrim%C3%B3nio_e_Restri%C3%A7%C3%B5es_na_Orla_Maritima" + MS },

];
