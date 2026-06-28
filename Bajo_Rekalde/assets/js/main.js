const DATA_ROOT = "../data/";

async function getJson(path) {
  const response = await fetch(`${DATA_ROOT}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

function formatNumber(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  const {
    minimumFractionDigits,
    maximumFractionDigits = 0
  } = options;
  const formatted = number.toLocaleString("es-ES", {
    useGrouping: false,
    minimumFractionDigits,
    maximumFractionDigits
  });
  const [integer, decimal] = formatted.split(",");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimal ? `${grouped},${decimal}` : grouped;
}

function buildShell() {
  const header = document.querySelector("[data-shell]");
  if (!header) return;

  header.innerHTML = `
    <a class="skip-link" href="#contenido">Saltar al contenido principal</a>`;

  document.querySelectorAll(".page-title").forEach((title) => {
    if (title.querySelector(".banner-home-link")) return;
    title.insertAdjacentHTML("beforeend", `
      <a class="banner-home-link no-print" href="index.html" aria-label="Volver a la portada">
        <span class="visually-hidden">Volver a la portada</span>
      </a>`);
  });
}

function wireTabs(context = document) {
  const roots = [
    ...(context.matches && context.matches("[data-tabs]") ? [context] : []),
    ...context.querySelectorAll("[data-tabs]")
  ];

  roots.forEach((tabsRoot) => {
    if (tabsRoot.dataset.tabsWired === "true") return;
    const tabs = tabsRoot.querySelectorAll("[data-tab]");
    const panels = tabsRoot.querySelectorAll("[data-panel]");
    if (!tabs.length || !panels.length) return;

    tabsRoot.dataset.tabsWired = "true";
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.dataset.tab;
        tabs.forEach((item) => {
          const selected = item === tab;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-selected", String(selected));
        });
        panels.forEach((panel) => {
          const selected = panel.dataset.panel === id;
          panel.classList.toggle("is-active", selected);
          panel.hidden = !selected;
        });
      });
    });
  });
}

function wireGlobalControls() {
  wireTabs();
}

function exportRows(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function wireExportButtons(context = document) {
  context.querySelectorAll("[data-export]").forEach((button) => {
    if (button.dataset.exportWired === "true") return;
    button.dataset.exportWired = "true";

    button.addEventListener("click", () => {
      const table = document.querySelector(button.dataset.export);
      if (!table) return;
      const headers = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      const rows = [...table.querySelectorAll("tbody tr:not([hidden])")].map((tr) => {
        const cells = [...tr.children].map((td) => td.textContent.trim());
        return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
      });
      exportRows(button.dataset.filename || "tabla.csv", rows);
    });
  });
}

function renderKpis(site) {
  document.querySelectorAll("[data-kpi='activities']").forEach((node) => node.textContent = formatNumber(site.kpis.activities));
  document.querySelectorAll("[data-kpi='comparables']").forEach((node) => node.textContent = formatNumber(site.kpis.comparables));
  document.querySelectorAll("[data-kpi='avgRent']").forEach((node) => node.textContent = `${formatNumber(site.kpis.avgRent, { maximumFractionDigits: 1 })} EUR/m²`);
  document.querySelectorAll("[data-kpi='population500']").forEach((node) => node.textContent = formatNumber(site.kpis.population500));
  document.querySelectorAll("[data-updated]").forEach((node) => node.textContent = site.updatedAt);
}
function renderTimeline(container, rows) {
  if (!container) return;
  const values = rows.map((row) => Number(row.rent)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);
  document.querySelectorAll("[data-price-evolution-points]").forEach((node) => {
    node.textContent = formatNumber(rows.length);
  });
  container.innerHTML = rows.map((row) => `
    <div class="timeline__item">
      <span class="timeline__value">${formatNumber(row.rent, { maximumFractionDigits: 1 })}</span>
      <span class="timeline__bar" style="--height:${Math.max(34, 54 + ((row.rent - min) / range) * 96)}px" aria-hidden="true"></span>
      <strong>${row.month}</strong>
      <span>EUR/m²/mes</span>
    </div>`).join("");
}

async function initSharedData() {
  try {
    const site = await getJson("site.json");
    renderKpis(site);
    renderTimeline(document.querySelector("[data-price-evolution]"), site.priceEvolution);
  } catch (error) {
    console.warn(error);
  }
}

buildShell();
wireGlobalControls();
wireExportButtons();
initSharedData();
