function metersFromRadius(radius) {
  return Number(String(radius).replace(/[^\d]/g, ""));
}

function areaKm2FromRadius(radius) {
  const meters = metersFromRadius(radius);
  return Math.PI * (meters / 1000) ** 2;
}

async function initDemographicCards() {
  const container = document.querySelector("[data-demografia-cards]");
  if (!container) return;
  const rows = await getJson("demografia.json");
  container.innerHTML = rows.map((row) => {
    const area = areaKm2FromRadius(row.radius);
    return `
      <article class="card kpi" data-filter-row>
        <span class="kpi__label">${row.radius}</span>
        <strong class="kpi__value">${formatNumber(row.population)}</strong>
        <span>${formatNumber(Math.round(row.population / area))} hab./km²</span>
        <p class="meta">${formatNumber(row.households)} hogares · edad media ${formatNumber(row.avgAge, { maximumFractionDigits: 1 })}</p>
      </article>
    `;
  }).join("");
}

initDemographicCards().catch(console.warn);
