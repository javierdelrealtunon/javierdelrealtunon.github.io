/* ============================================================
   GEOPORTAL MAR PORTUGUÊS — DGRM
   layers.js — Catálogo de camadas WMS
   ============================================================ */

const BASE = "https://webgis.dgrm.mm.gov.pt/arcgis/services/PSOEM_GEOPORTAL/";
const WMS  = "/MapServer/WMSServer";

const LAYERS = [

  // ── PLANEAMENTO E ORDENAMENTO ──────────────────────────────
  { cat: "📋 Planeamento e Ordenamento", id: "psoem_cn1",
    name: "Carta Náutica 1 (CN1)",
    desc: "Plano de Situação do POEM — Carta Náutica nível 1",
    url: BASE + "Geoportal_CN1" + WMS, layer: "0" },

  { cat: "📋 Planeamento e Ordenamento", id: "psoem_cn2",
    name: "Carta Náutica 2 (CN2)",
    desc: "Plano de Situação do POEM — Carta Náutica nível 2",
    url: BASE + "Geoportal_CN2" + WMS, layer: "0" },

  { cat: "📋 Planeamento e Ordenamento", id: "psoem_cn3",
    name: "Carta Náutica 3 (CN3)",
    desc: "Plano de Situação do POEM — Carta Náutica nível 3",
    url: BASE + "Geoportal_CN3" + WMS, layer: "0" },

  { cat: "📋 Planeamento e Ordenamento", id: "tupem",
    name: "TUPEM — Títulos de Utilização do Espaço Marítimo",
    desc: "Títulos de utilização privativa do espaço marítimo nacional",
    url: BASE + "TUPEM" + WMS, layer: "0" },

  { cat: "📋 Planeamento e Ordenamento", id: "tupem1",
    name: "TUPEM (v1)",
    desc: "Versão 1 da camada TUPEM",
    url: BASE + "Tupem_geoportal1" + WMS, layer: "0" },

  { cat: "📋 Planeamento e Ordenamento", id: "tin",
    name: "Batimetria TIN",
    desc: "Modelo batimétrico de superfície triangulada",
    url: BASE + "tin" + WMS, layer: "0" },

  // ── LIMITES E JURISDIÇÃO ───────────────────────────────────
  { cat: "⚓ Limites e Jurisdição", id: "limites",
    name: "Limites Marítimos (IH)",
    desc: "Mar territorial, ZEE, zona contígua — fonte IH v2",
    url: BASE + "Limites_Fonte_IH_v2" + WMS, layer: "0" },

  { cat: "⚓ Limites e Jurisdição", id: "faixa",
    name: "Faixa de Proteção Costeira (1 e 2 mn)",
    desc: "Banda de proteção da orla costeira a 1 e 2 milhas náuticas",
    url: BASE + "FaixaProtecaoCosteira1e2mn" + WMS, layer: "0" },

  { cat: "⚓ Limites e Jurisdição", id: "linhajmm",
    name: "Linha Base e Jurisdição Portuária",
    desc: "Linha de Base normal (DL 495/85) e limites de jurisdição portuária",
    url: "https://webgis.dgrm.mm.gov.pt/arcgis/services/PSOEM_PosCPub/LinhaJMM_pcp_final1/MapServer/WMSServer",
    layer: "0" },

  // ── AMBIENTE E CONSERVAÇÃO ─────────────────────────────────
  { cat: "🌿 Ambiente e Conservação", id: "amps",
    name: "Áreas Marinhas Protegidas (AMPs)",
    desc: "Rede de AMPs nacionais — PSOEM",
    url: BASE + "AMPs_geoportalPSOEM" + WMS, layer: "0" },

  { cat: "🌿 Ambiente e Conservação", id: "ospar",
    name: "OSPAR — Áreas Protegidas",
    desc: "Áreas marinhas protegidas da Convenção OSPAR",
    url: BASE + "OSPAR" + WMS, layer: "0" },

  { cat: "🌿 Ambiente e Conservação", id: "iba",
    name: "IBA — Áreas Importantes para Aves",
    desc: "Important Bird & Biodiversity Areas em meio marinho",
    url: BASE + "IBA" + WMS, layer: "0" },

  { cat: "🌿 Ambiente e Conservação", id: "zpe_raa",
    name: "ZPE — Zonas de Proteção Especial (Açores)",
    desc: "Zonas de Proteção Especial da Região Autónoma dos Açores",
    url: BASE + "ZPE_RAA" + WMS, layer: "0" },

  { cat: "🌿 Ambiente e Conservação", id: "rede_natura_es",
    name: "Rede Natura 2000 (Espanha)",
    desc: "Zonas de proteção especial da Rede Natura 2000 em águas espanholas",
    url: BASE + "PSOEM_Rede_natura_2000_Espanha" + WMS, layer: "0" },

  // ── PESCA ──────────────────────────────────────────────────
  { cat: "🎣 Pesca", id: "artes_pesca",
    name: "Artes de Pesca — Áreas Legais",
    desc: "Artes de pesca com licença e respetivas áreas autorizadas",
    url: BASE + "ArtesPesca_AreasLegais_GEOPORTAL" + WMS, layer: "0" },

  { cat: "🎣 Pesca", id: "cond_pesca",
    name: "Condicionamento à Pesca",
    desc: "Zonas com restrições ou proibições de pesca",
    url: BASE + "Condicionamento_pesca_GEOPORTAL" + WMS, layer: "0" },

  { cat: "🎣 Pesca", id: "pesca_armacao",
    name: "Pesca com Armação",
    desc: "Localização e áreas de armações de pesca fixas",
    url: BASE + "Pesca_com_arma%C3%A7%C3%A3o" + WMS, layer: "0" },

  { cat: "🎣 Pesca", id: "rel_pesca_local",
    name: "Relevância Pesca Local",
    desc: "Áreas de relevância para a pesca local e artesanal",
    url: BASE + "relevancia_pesca_local" + WMS, layer: "0" },

  { cat: "🎣 Pesca", id: "portos_docapesca",
    name: "Portos e Docas de Pesca",
    desc: "Infraestrutura portuária dedicada à pesca comercial",
    url: BASE + "Portos_DocaPesca" + WMS, layer: "0" },

  { cat: "🎣 Pesca", id: "bacias_dragagem",
    name: "Bacias de Dragagem — Doca de Pesca",
    desc: "Áreas de dragagem portuária associadas a docas de pesca",
    url: BASE + "BaciasDragagemDocaPesca" + WMS, layer: "0" },

  // ── ENERGIA E INFRAESTRUTURA ───────────────────────────────
  { cat: "⚡ Energia e Infraestrutura", id: "eolicas",
    name: "Energia Eólica Offshore",
    desc: "Zonas existentes e potenciais para eólica offshore — PSOEM",
    url: BASE + "PSOEM_Eolicas_geoportal" + WMS, layer: "0" },

  { cat: "⚡ Energia e Infraestrutura", id: "cabos_submarinos",
    name: "Cabos Submarinos (EMODnet)",
    desc: "Rede de cabos de telecomunicações e elétricos submarinos",
    url: BASE + "Cabos_submarinos_EMODnet" + WMS, layer: "0" },

  { cat: "⚡ Energia e Infraestrutura", id: "emissarios",
    name: "Emissários Submarinos",
    desc: "Condutas submarinas de descarga de efluentes",
    url: BASE + "Emissarios_submarinos_geoportal" + WMS, layer: "0" },

  { cat: "⚡ Energia e Infraestrutura", id: "monoboia",
    name: "Monoboia de Leixões",
    desc: "Sistema de monoboia para descarregamento de hidrocarbonetos",
    url: BASE + "MonoboiaLeixoes" + WMS, layer: "0" },

  { cat: "⚡ Energia e Infraestrutura", id: "residuos",
    name: "Gestão de Resíduos (v4)",
    desc: "Instalações e áreas de gestão de resíduos marítimos",
    url: BASE + "Gest%C3%A3o_de_residuos_V4" + WMS, layer: "0" },

  // ── TRÁFEGO MARÍTIMO ───────────────────────────────────────
  { cat: "🚢 Tráfego Marítimo", id: "sep_trafego",
    name: "Separação de Tráfego Marítimo",
    desc: "Esquemas de separação de tráfego da OMI nas águas portuguesas",
    url: BASE + "SeparacaoTrafegoMaritimo_geoportal" + WMS, layer: "0" },

  { cat: "🚢 Tráfego Marítimo", id: "marinas",
    name: "Marinas e Portos de Recreio",
    desc: "Infraestruturas náuticas de recreio em Portugal continental",
    url: BASE + "marinas_e_portos_de_recreio" + WMS, layer: "0" },

  { cat: "🚢 Tráfego Marítimo", id: "itp",
    name: "ITP — Infraestrutura de Transportes de Portugal",
    desc: "Portos e marinas de recreio — base ITP",
    url: BASE + "ITP_marinas_portos_recreio" + WMS, layer: "0" },

  // ── GEOLOGIA E BATIMETRIA ──────────────────────────────────
  { cat: "🪨 Geologia e Batimetria", id: "montes_sub",
    name: "Montes Submarinos e Estrutura Geológica",
    desc: "Morfologia do fundo marinho: montes, dorsais, estruturas geológicas",
    url: BASE + "MontesSub_EstrtGeol" + WMS, layer: "0" },

  { cat: "🪨 Geologia e Batimetria", id: "manchas_emprestimo",
    name: "Manchas de Empréstimo",
    desc: "Áreas de extração de sedimentos marinhos para alimentação de praias",
    url: BASE + "ManchasEmprestimo" + WMS, layer: "0" },

  { cat: "🪨 Geologia e Batimetria", id: "gest_sedimentar",
    name: "Gestão Estratégica de Sedimentos (APA)",
    desc: "Área de gestão estratégica de sedimentos costeiros — APA",
    url: BASE + "Area_estrat_gest_sedimentar_APA" + WMS, layer: "0" },

  { cat: "🪨 Geologia e Batimetria", id: "hsmax",
    name: "Cartas Hsmax (LNEC)",
    desc: "Altura significativa máxima de ondas — modelação LNEC",
    url: BASE + "Cartas_Hsmax_LNEC" + WMS, layer: "0" },

  { cat: "🪨 Geologia e Batimetria", id: "recursos_geo",
    name: "Títulos Recursos Geológicos (TIT)",
    desc: "Títulos de prospeção e extração de recursos geológicos marinhos",
    url: BASE + "TIT_RECURSOS_GEOLOGICOS" + WMS, layer: "0" },

  // ── DEFESA E SEGURANÇA ─────────────────────────────────────
  { cat: "🛡️ Defesa e Segurança", id: "exercicios_mil",
    name: "Exercícios Militares",
    desc: "Áreas e períodos reservados para exercícios militares marítimos",
    url: BASE + "Exercicios_Militares" + WMS, layer: "0" },

  { cat: "🛡️ Defesa e Segurança", id: "naufrágios",
    name: "Naufrágios e Afundamentos (IH)",
    desc: "Localização de embarcações naufragadas nas águas portuguesas",
    url: BASE + "Localiza%C3%A7%C3%A3o_de_naufr%C3%A1gios_e_afundamentos_Fonte_IH_v2" + WMS, layer: "0" },

  { cat: "🛡️ Defesa e Segurança", id: "imersao",
    name: "Áreas de Imersão",
    desc: "Zonas autorizadas para imersão de materiais dragados",
    url: BASE + "PSOEM_AREASLOCAIS_IMERSAO" + WMS, layer: "0" },

  // ── RECREIO E TURISMO ──────────────────────────────────────
  { cat: "🏖️ Recreio e Turismo", id: "patrimonio_orla",
    name: "Património e Restrições na Orla Marítima",
    desc: "Bens patrimoniais classificados e restrições de uso na orla costeira",
    url: BASE + "Patrim%C3%B3nio_e_Restri%C3%A7%C3%B5es_na_Orla_Maritima" + WMS, layer: "0" },

];
