const MARKET_SCATTER_LOCAL_SURFACE = 162;
const MARKET_SCATTER_MODES = {
  alquiler: {
    label: "Alquiler",
    unit: "EUR/m²/mes",
    color: "#0b5d57",
    softColor: "rgba(11, 93, 87, 0.12)"
  },
  compra: {
    label: "Precio de venta",
    unit: "EUR/m² venta",
    color: "#1f5f99",
    softColor: "rgba(31, 95, 153, 0.12)"
  }
};

function scatterEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function scatterOperation(row) {
  const type = String(row.type || "").toLowerCase();
  if (type.includes("alquiler")) return "alquiler";
  if (type.includes("venta") || type.includes("compra")) return "compra";
  return "sin_precio";
}

const MARKET_NON_COMPARABLE_NAMES = new Set([
  "Amorebieta-Etxano",
  "Barakaldo",
  "Basauri",
  "Durango",
  "Elorrio",
  "Erandio",
  "Ermua",
  "Getxo",
  "Iurreta",
  "Leioa",
  "Lemoa",
  "Portugalete",
  "Sestao"
]);

function isMarketScatterComparable(row) {
  const operation = scatterOperation(row);
  const priceM2 = Number(row.priceM2);
  const totalPrice = Number(row.totalPrice);
  const surface = Number(row.surface);

  if (MARKET_NON_COMPARABLE_NAMES.has(row.name)) return false;
  if (Number.isFinite(surface) && surface <= 1) return false;
  if (operation === "alquiler" && Number.isFinite(priceM2) && priceM2 > 60) return false;
  if (operation === "alquiler" && Number.isFinite(totalPrice) && totalPrice > 20000) return false;
  if (operation === "compra" && Number.isFinite(priceM2) && priceM2 > 10000) return false;
  return true;
}

function scatterNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentile(values, p) {
  const sorted = values.slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function niceCeil(value) {
  if (!value || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const scaled = value / base;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * base;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatScatterValue(value, maximumFractionDigits = 0) {
  return formatNumber(value, { maximumFractionDigits });
}

function scatterDecimals(mode) {
  return mode === "alquiler" ? 1 : 0;
}

function formatScatterPrice(value, mode) {
  return `${formatScatterValue(value, scatterDecimals(mode))} ${MARKET_SCATTER_MODES[mode].unit}`;
}

function marketScatterRows(rows, mode) {
  return rows
    .filter(isMarketScatterComparable)
    .map((row) => ({
      ...row,
      operation: scatterOperation(row),
      surfaceValue: scatterNumber(row.surface),
      priceValue: scatterNumber(row.priceM2),
      totalValue: scatterNumber(row.totalPrice)
    }))
    .filter((row) => row.operation === mode)
    .filter((row) => row.surfaceValue > 0 && row.priceValue > 0);
}

function getMarketSummary(rows, mode) {
  const data = marketScatterRows(rows, mode);
  const prices = data.map((row) => row.priceValue);
  const surfaces = data.map((row) => row.surfaceValue);
  const q1 = percentile(prices, 0.25);
  const q3 = percentile(prices, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - iqr * 1.5;
  const upperFence = q3 + iqr * 1.5;
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  return {
    mode,
    rows: data,
    count: data.length,
    mean: average(prices),
    min,
    max,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    outlierCount: data.filter((row) => row.priceValue < lowerFence || row.priceValue > upperFence).length,
    surfaceMean: average(surfaces),
    minRow: data.find((row) => row.priceValue === min),
    maxRow: data.find((row) => row.priceValue === max)
  };
}

function scaleValue(value, min, max, start, end) {
  if (max === min) return start;
  return start + ((value - min) / (max - min)) * (end - start);
}

function rangePosition(value, min, max) {
  if (max === min) return 50;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function renderScatterStats(container, summary) {
  const { rows, mode, mean, min, max, surfaceMean } = summary;
  container.innerHTML = `
    <span><strong>${formatNumber(rows.length)}</strong> referencias</span>
    <span><strong>${formatScatterPrice(mean, mode)}</strong> media</span>
    <span><strong>${formatScatterPrice(min, mode)}</strong> mínimo</span>
    <span><strong>${formatScatterPrice(max, mode)}</strong> máximo</span>
    <span><strong>${formatScatterValue(surfaceMean)} m²</strong> superficie media</span>
  `;
}

function renderMarketRangeGrid(container, rows, activeMode) {
  if (!container) return;
  const summaries = ["alquiler", "compra"].map((mode) => getMarketSummary(rows, mode));
  container.innerHTML = summaries.map((summary) => {
    const config = MARKET_SCATTER_MODES[summary.mode];
    if (!summary.count) return "";
    const iqrLeft = rangePosition(summary.q1, summary.min, summary.max);
    const iqrRight = rangePosition(summary.q3, summary.min, summary.max);
    const meanLeft = rangePosition(summary.mean, summary.min, summary.max);
    const minLabel = scatterEscape(summary.minRow?.name || "Referencia mínima");
    const maxLabel = scatterEscape(summary.maxRow?.name || "Referencia máxima");
    return `
      <article class="market-range-card${summary.mode === activeMode ? " is-active" : ""}" style="--metric-color:${config.color}; --metric-soft:${config.softColor}">
        <div class="market-range-card__header">
          <span>${config.label}</span>
          <strong>media ${formatScatterPrice(summary.mean, summary.mode)}</strong>
        </div>
        <div class="market-range-bar" aria-label="${config.label}: mínimo ${formatScatterPrice(summary.min, summary.mode)}, media ${formatScatterPrice(summary.mean, summary.mode)}, máximo ${formatScatterPrice(summary.max, summary.mode)}">
          <span class="market-range-bar__track"></span>
          <span class="market-range-bar__iqr" style="left:${iqrLeft}%; width:${Math.max(iqrRight - iqrLeft, 1)}%"></span>
          <span class="market-range-bar__mean" style="left:${meanLeft}%"></span>
        </div>
        <div class="market-range-card__values">
          <span><strong>Mín.</strong> ${formatScatterPrice(summary.min, summary.mode)}<small>${minLabel}</small></span>
          <span><strong>Máx.</strong> ${formatScatterPrice(summary.max, summary.mode)}<small>${maxLabel}</small></span>
          <span><strong>${formatNumber(summary.outlierCount)}</strong> extremos IQR</span>
        </div>
      </article>
    `;
  }).join("");
}

function buildMarketScatterSvg(summary) {
  const { rows, mode } = summary;
  const config = MARKET_SCATTER_MODES[mode];
  const width = 980;
  const height = 455;
  const margin = { top: 36, right: 44, bottom: 70, left: 86 };
  const plot = {
    left: margin.left,
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };
  const surfaces = rows.map((row) => row.surfaceValue);
  const prices = rows.map((row) => row.priceValue);
  const xMax = niceCeil(Math.max(MARKET_SCATTER_LOCAL_SURFACE * 1.15, percentile(surfaces, 0.92) * 1.08));
  const yMax = niceCeil(Math.max(percentile(prices, 0.9) * 1.18, summary.mean * 1.15));
  const xTicks = Array.from({ length: 6 }, (_, index) => Math.round((xMax / 5) * index));
  const yTicks = Array.from({ length: 5 }, (_, index) => (yMax / 4) * index);
  const localX = scaleValue(Math.min(MARKET_SCATTER_LOCAL_SURFACE, xMax), 0, xMax, plot.left, plot.right);
  const meanY = scaleValue(Math.min(summary.mean, yMax), 0, yMax, plot.bottom, plot.top);
  const priceDecimals = scatterDecimals(mode);

  const grid = [
    ...xTicks.map((tick) => {
      const x = scaleValue(tick, 0, xMax, plot.left, plot.right);
      return `
        <line class="market-scatter-grid" x1="${x}" x2="${x}" y1="${plot.top}" y2="${plot.bottom}"></line>
        <text class="market-scatter-tick" x="${x}" y="${plot.bottom + 27}" text-anchor="middle">${formatScatterValue(tick)}</text>
      `;
    }),
    ...yTicks.map((tick) => {
      const y = scaleValue(tick, 0, yMax, plot.bottom, plot.top);
      return `
        <line class="market-scatter-grid" x1="${plot.left}" x2="${plot.right}" y1="${y}" y2="${y}"></line>
        <text class="market-scatter-tick" x="${plot.left - 13}" y="${y + 4}" text-anchor="end">${formatScatterValue(tick, priceDecimals)}</text>
      `;
    })
  ].join("");

  const points = rows.map((row, index) => {
    const isClipped = row.surfaceValue > xMax || row.priceValue > yMax;
    const isMinMax = row.priceValue === summary.min || row.priceValue === summary.max;
    const isIqrExtreme = row.priceValue < summary.lowerFence || row.priceValue > summary.upperFence;
    const classes = [
      "market-scatter-point",
      isClipped ? "is-clipped" : "",
      isMinMax ? "is-minmax" : "",
      isIqrExtreme ? "is-iqr-extreme" : ""
    ].filter(Boolean).join(" ");
    const x = scaleValue(Math.min(row.surfaceValue, xMax), 0, xMax, plot.left, plot.right);
    const y = scaleValue(Math.min(row.priceValue, yMax), 0, yMax, plot.bottom, plot.top);
    const radius = isMinMax ? 7 : isClipped ? 6.5 : 5.2;
    return `
      <circle
        class="${classes}"
        cx="${x}"
        cy="${y}"
        r="${radius}"
        fill="${config.color}"
        data-market-point="${index}"
        tabindex="0"
        role="button"
        aria-label="${scatterEscape(row.name)}: ${formatScatterValue(row.surfaceValue)} m², ${formatScatterPrice(row.priceValue, mode)}"
      ></circle>
    `;
  }).join("");

  return `
    <svg class="market-scatter-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de dispersión de ${config.label.toLowerCase()} por superficie y precio por metro cuadrado">
      <rect class="market-scatter-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      ${grid}
      <line class="market-scatter-axis" x1="${plot.left}" x2="${plot.right}" y1="${plot.bottom}" y2="${plot.bottom}"></line>
      <line class="market-scatter-axis" x1="${plot.left}" x2="${plot.left}" y1="${plot.top}" y2="${plot.bottom}"></line>
      <line class="market-scatter-mean" x1="${plot.left}" x2="${plot.right}" y1="${meanY}" y2="${meanY}"></line>
      <text class="market-scatter-note" x="${plot.right - 8}" y="${Math.max(meanY - 8, plot.top + 14)}" text-anchor="end">media ${formatScatterPrice(summary.mean, mode)}</text>
      <line class="market-scatter-local" x1="${localX}" x2="${localX}" y1="${plot.top}" y2="${plot.bottom}"></line>
      <text class="market-scatter-note" x="${localX + 8}" y="${plot.top + 17}">local 162 m²</text>
      ${points}
      <text class="market-scatter-axis-label" x="${plot.left + plot.width / 2}" y="${height - 23}" text-anchor="middle">Superficie del local (m²)</text>
      <text class="market-scatter-axis-label" x="${-plot.top - plot.height / 2}" y="24" text-anchor="middle" transform="rotate(-90)">Precio por m² (${config.unit})</text>
      <g class="market-scatter-legend" transform="translate(${plot.right - 275}, ${plot.top + 4})">
        <circle cx="7" cy="7" r="5" fill="${config.color}"></circle>
        <text x="20" y="11">referencia comparable</text>
        <line class="market-scatter-mean" x1="0" x2="15" y1="30" y2="30"></line>
        <text x="20" y="35">media de la muestra</text>
        <circle class="is-minmax" cx="7" cy="55" r="6" fill="${config.color}"></circle>
        <text x="20" y="59">mínimo / máximo</text>
      </g>
    </svg>
  `;
}

function tooltipHtml(row, mode, summary) {
  const total = row.totalValue ? `<dt>Total anunciado</dt><dd>${formatScatterValue(row.totalValue)} EUR</dd>` : "";
  const extreme = row.priceValue === summary.min
    ? `<dt>Lectura</dt><dd>Mínimo de la muestra</dd>`
    : row.priceValue === summary.max
      ? `<dt>Lectura</dt><dd>Máximo de la muestra</dd>`
      : row.priceValue < summary.lowerFence || row.priceValue > summary.upperFence
        ? `<dt>Lectura</dt><dd>Extremo estadístico IQR</dd>`
        : "";
  const source = row.sourceUrl
    ? `<a href="${scatterEscape(row.sourceUrl)}" target="_blank" rel="noreferrer">Abrir fuente</a>`
    : `<span>${scatterEscape(row.source || "Fuente no indicada")}</span>`;
  return `
    <strong>${scatterEscape(row.name)}</strong>
    <dl>
      <dt>Superficie</dt><dd>${formatScatterValue(row.surfaceValue)} m²</dd>
      <dt>Precio unitario</dt><dd>${formatScatterPrice(row.priceValue, mode)}</dd>
      ${total}
      <dt>Ubicación</dt><dd>${scatterEscape(row.street || "No indicada")}</dd>
      <dt>Confianza</dt><dd>${scatterEscape(row.confidence || "Sin indicar")}</dd>
      ${extreme}
    </dl>
    ${source}
  `;
}

function positionScatterTooltip(tooltip, target, container) {
  const targetBox = target.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();
  const left = targetBox.left - containerBox.left + targetBox.width / 2;
  const top = targetBox.top - containerBox.top;
  tooltip.style.left = `${Math.min(Math.max(left, 150), containerBox.width - 150)}px`;
  tooltip.style.top = `${Math.max(top - 12, 12)}px`;
}

function renderMarketScatter(root, rows, mode) {
  const chart = root.querySelector("[data-market-scatter-chart]");
  const stats = root.querySelector("[data-market-scatter-stats]");
  const tooltip = root.querySelector("[data-market-scatter-tooltip]");
  const rangeGrid = root.querySelector("[data-market-range-grid]");
  const summary = getMarketSummary(rows, mode);
  if (!chart || !stats || !tooltip) return;

  renderMarketRangeGrid(rangeGrid, rows, mode);

  if (!summary.rows.length) {
    stats.innerHTML = "";
    chart.innerHTML = `<div class="callout">No hay referencias con superficie y precio por m² para este indicador.</div>`;
    return;
  }

  renderScatterStats(stats, summary);
  chart.innerHTML = buildMarketScatterSvg(summary);
  tooltip.hidden = true;

  chart.querySelectorAll("[data-market-point]").forEach((point) => {
    const row = summary.rows[Number(point.dataset.marketPoint)];
    const show = () => {
      tooltip.innerHTML = tooltipHtml(row, mode, summary);
      tooltip.hidden = false;
      positionScatterTooltip(tooltip, point, root);
    };
    const hide = () => {
      tooltip.hidden = true;
    };
    point.addEventListener("mouseenter", show);
    point.addEventListener("focus", show);
    point.addEventListener("mouseleave", hide);
    point.addEventListener("blur", hide);
  });
}

async function initMarketScatter() {
  const root = document.querySelector("[data-market-scatter]");
  if (!root) return;

  const rows = await getJson("locales.json?v=20260627-market-metrics");
  let mode = "alquiler";
  const buttons = root.querySelectorAll("[data-market-scatter-mode]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.marketScatterMode;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderMarketScatter(root, rows, mode);
    });
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });

  renderMarketScatter(root, rows, mode);
}

initMarketScatter().catch(console.warn);
