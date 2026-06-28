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
    if (!title.querySelector(".banner-contact-button")) {
      title.insertAdjacentHTML("beforeend", `
      <button class="banner-contact-button no-print" type="button" data-contact-open>
        Contactar
      </button>`);
    }
    if (!title.querySelector(".banner-home-link")) {
      title.insertAdjacentHTML("beforeend", `
      <a class="banner-home-link no-print" href="index.html" aria-label="Volver a la portada">
        <span class="visually-hidden">Volver a la portada</span>
      </a>`);
    }
  });

  if (!document.querySelector("[data-contact-modal]")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="contact-modal no-print" data-contact-modal hidden>
        <button class="contact-modal__backdrop" type="button" data-contact-close aria-label="Cerrar contacto"></button>
        <section class="contact-modal__panel" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" aria-describedby="contact-modal-description">
          <button class="contact-modal__close" type="button" data-contact-close aria-label="Cerrar contacto">×</button>
          <div class="contact-modal__header">
            <p class="property-eyebrow">Contacto directo</p>
            <h2 id="contact-modal-title">Bajo en Rekalde en alquiler</h2>
            <p id="contact-modal-description">Disponible inmediatamente para alquiler. Condiciones negociables.</p>
          </div>
          <div class="contact-modal__status" aria-label="Disponibilidad">
            <span>Disponibilidad inmediata</span>
            <strong>Alquiler · condiciones negociables</strong>
          </div>
          <div class="contact-modal__actions">
            <a href="mailto:bajorekalde@zuloaga.com">
              <span>Escribir email</span>
              <strong>bajorekalde@zuloaga.com</strong>
            </a>
            <a href="tel:+34628611388">
              <span>Llamar por teléfono</span>
              <strong>628 611 388</strong>
            </a>
          </div>
        </section>
      </div>`);
  }
}

function wireContactModal() {
  const modal = document.querySelector("[data-contact-modal]");
  if (!modal || modal.dataset.contactReady === "true") return;

  let previousFocus = null;
  modal.dataset.contactReady = "true";

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("has-contact-modal");
    if (previousFocus) previousFocus.focus();
  };

  document.querySelectorAll("[data-contact-open]").forEach((button) => {
    button.addEventListener("click", () => {
      previousFocus = button;
      modal.hidden = false;
      document.body.classList.add("has-contact-modal");
      modal.querySelector(".contact-modal__close")?.focus();
    });
  });

  modal.querySelectorAll("[data-contact-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
    if (event.key !== "Tab" || modal.hidden) return;

    const focusable = [...modal.querySelectorAll("button, a")].filter((node) => !node.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
wireContactModal();
wireGlobalControls();
wireExportButtons();
initSharedData();
