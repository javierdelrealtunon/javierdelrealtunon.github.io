async function populateTable({ file, table, columns, mapRow = (row) => row }) {
  const target = document.querySelector(table);
  if (!target) return [];
  const rows = (await getJson(file)).map(mapRow);
  target.querySelector("thead").innerHTML = `<tr>${columns.map((column) => `<th scope="col">${column.label}</th>`).join("")}</tr>`;
  target.querySelector("tbody").innerHTML = rows.map((row) => `
    <tr data-filter-row>
      ${columns.map((column) => `<td>${row[column.key] ?? ""}</td>`).join("")}
    </tr>`).join("");
  return rows;
}

function radiusMetersFromLabel(radius) {
  return Number(String(radius).replace(/[^\d]/g, ""));
}

function radiusAreaKm2(radius) {
  const meters = radiusMetersFromLabel(radius);
  return Math.PI * (meters / 1000) ** 2;
}

function localeOperation(row) {
  const type = String(row.type || "").toLowerCase();
  if (type.includes("alquiler")) return "alquiler";
  if (type.includes("venta") || type.includes("compra")) return "compra";
  return "sin_precio";
}

function marketPriceLabel(row) {
  if (!row.priceM2) return "No publicado";
  const decimals = localeOperation(row) === "alquiler" ? 1 : 0;
  const value = formatNumber(row.priceM2, { maximumFractionDigits: decimals });
  return localeOperation(row) === "compra" ? `${value} EUR/m² venta` : `${value} EUR/m²/mes`;
}

const NON_COMPARABLE_MARKET_NAMES = new Set([
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

function isCommercialComparable(row) {
  const operation = localeOperation(row);
  const priceM2 = Number(row.priceM2);
  const totalPrice = Number(row.totalPrice);
  const surface = Number(row.surface);

  if (NON_COMPARABLE_MARKET_NAMES.has(row.name)) return false;
  if (Number.isFinite(surface) && surface <= 1) return false;
  if (operation === "alquiler" && Number.isFinite(priceM2) && priceM2 > 60) return false;
  if (operation === "alquiler" && Number.isFinite(totalPrice) && totalPrice > 20000) return false;
  if (operation === "compra" && Number.isFinite(priceM2) && priceM2 > 10000) return false;
  return true;
}

function commercialReferenceLabel(row) {
  if (row.name && row.name !== "Bilbao") return row.name;
  const ref = String(row.notes || "").match(/Ref:\s*([^\.]+)/i)?.[1]?.trim();
  const zone = row.street || "Bilbao";
  return ref ? `Local ${zone} (${ref})` : `Local ${zone}`;
}

function commercialTotalLabel(row) {
  const operation = localeOperation(row);
  const totalPrice = Number(row.totalPrice);
  const surface = Number(row.surface);
  const priceM2 = Number(row.priceM2);
  const suffix = operation === "alquiler" ? " EUR/mes" : " EUR";

  if (Number.isFinite(totalPrice) && totalPrice > 0) {
    return `${formatNumber(totalPrice)}${suffix}`;
  }

  if (Number.isFinite(surface) && Number.isFinite(priceM2) && surface > 0 && priceM2 > 0) {
    return `≈ ${formatNumber(surface * priceM2)}${suffix}`;
  }

  return "No publicado";
}

function renderTableRows(tableSelector, rows, columns) {
  const target = document.querySelector(tableSelector);
  if (!target) return;
  target.querySelector("thead").innerHTML = `<tr>${columns.map((column) => `<th scope="col">${column.label}</th>`).join("")}</tr>`;
  target.querySelector("tbody").innerHTML = rows.length
    ? rows.map((row) => `
      <tr data-filter-row>
        ${columns.map((column) => `<td>${row[column.key] ?? ""}</td>`).join("")}
      </tr>`).join("")
    : `<tr><td colspan="${columns.length}">Sin referencias en este grupo.</td></tr>`;
}

function setMarketText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

async function initMarketTables() {
  const hasMarketTable = document.querySelector("#locales-table, #locales-rent-table, #locales-sale-table");
  if (!hasMarketTable) return;

  const rows = (await getJson("locales.json?v=20260627-market-metrics")).map((row) => ({
    ...row,
    operation: localeOperation(row),
    surfaceLabel: row.surface ? `${formatNumber(row.surface, { maximumFractionDigits: 1 })} m²` : "",
    priceLabel: marketPriceLabel(row),
    precisionLabel: row.locationPrecision || ""
  }));

  const comparableRows = rows.filter(isCommercialComparable);
  const allRentRows = rows.filter((row) => row.operation === "alquiler");
  const rentRows = comparableRows.filter((row) => row.operation === "alquiler");
  const saleRows = comparableRows.filter((row) => row.operation === "compra");
  const median = (items, operation) => {
    const values = items.map((item) => Number(item.priceM2)).filter(Number.isFinite);
    if (!values.length) return "Sin datos";
    values.sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const value = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    const decimals = operation === "alquiler" ? 1 : 0;
    return formatNumber(value, { maximumFractionDigits: decimals });
  };

  setMarketText("[data-market-rent-count]", formatNumber(rentRows.length));
  setMarketText("[data-market-sale-count]", formatNumber(saleRows.length));
  setMarketText("[data-price-sample-count]", formatNumber(rentRows.length));
  setMarketText("[data-price-discard-count]", formatNumber(allRentRows.length - rentRows.length));
  setMarketText("[data-market-rent-avg]", `${median(rentRows, "alquiler")} EUR/m²/mes`);
  setMarketText("[data-market-sale-avg]", `${median(saleRows, "compra")} EUR/m² venta`);

  const columns = [
    { key: "referenceLabel", label: "Referencia" },
    { key: "street", label: "Zona" },
    { key: "surfaceLabel", label: "Superficie" },
    { key: "totalLabel", label: "Renta / precio" },
    { key: "priceLabel", label: "Precio unitario" }
  ];

  const commercialRows = comparableRows.map((row) => ({
    ...row,
    referenceLabel: commercialReferenceLabel(row),
    totalLabel: commercialTotalLabel(row)
  }));

  renderTableRows("#locales-table", commercialRows, [
    { key: "name", label: "Local" },
    { key: "type", label: "Operación" },
    ...columns.slice(1)
  ]);
  renderTableRows("#locales-rent-table", commercialRows.filter((row) => row.operation === "alquiler"), [
    columns[0],
    columns[1],
    columns[2],
    { key: "totalLabel", label: "Renta mensual" },
    columns[4]
  ]);
  renderTableRows("#locales-sale-table", commercialRows.filter((row) => row.operation === "compra"), [
    columns[0],
    columns[1],
    columns[2],
    { key: "totalLabel", label: "Precio venta" },
    columns[4]
  ]);
}

async function initTables() {
  await initMarketTables();

  await populateTable({
    file: "locales.json",
    table: "#locales-table",
    columns: [
      { key: "name", label: "Local" },
      { key: "type", label: "Tipo" },
      { key: "surface", label: "Superficie" },
      { key: "priceM2", label: "Precio" },
      { key: "street", label: "Ubicación" },
      { key: "confidence", label: "Confianza" },
      { key: "source", label: "Fuente" }
    ],
    mapRow: (row) => ({
      ...row,
      surface: `${formatNumber(row.surface, { maximumFractionDigits: 1 })} m²`,
      priceM2: row.priceM2 ? `${formatNumber(row.priceM2, { maximumFractionDigits: 1 })} EUR/m²` : "No publicado"
    })
  });

  await populateTable({
    file: "demografia.json",
    table: "#demografia-table",
    columns: [
      { key: "radius", label: "Radio" },
      { key: "areaKm2", label: "Área km²" },
      { key: "population", label: "Población" },
      { key: "populationDensity", label: "Hab./km²" },
      { key: "households", label: "Hogares" },
      { key: "householdDensity", label: "Hogares/km²" },
      { key: "avgAge", label: "Edad media" },
      { key: "notes", label: "Lectura" }
    ],
    mapRow: (row) => {
      const area = radiusAreaKm2(row.radius);
      return {
        ...row,
        areaKm2: formatNumber(area, { maximumFractionDigits: 3 }),
        population: formatNumber(row.population),
        populationDensity: formatNumber(Math.round(row.population / area)),
        households: formatNumber(row.households),
        householdDensity: formatNumber(Math.round(row.households / area)),
        avgAge: formatNumber(row.avgAge, { maximumFractionDigits: 1 })
      };
    }
  });

  await populateTable({
    file: "demografia-proyeccion-5y.json",
    table: "#demografia-forecast-table",
    columns: [
      { key: "radius", label: "Radio" },
      { key: "horizon", label: "Horizonte" },
      { key: "areaKm2", label: "Area km²" },
      { key: "population", label: "Población estimada" },
      { key: "populationDensity", label: "Hab./km²" },
      { key: "growth", label: "Var. poblacion" },
      { key: "households", label: "Hogares estimados" },
      { key: "householdDensity", label: "Hogares/km²" },
      { key: "householdGrowth", label: "Var. hogares" },
      { key: "avgAge", label: "Edad media" },
      { key: "notes", label: "Lectura urbana" }
    ],
    mapRow: (row) => {
      const area = radiusAreaKm2(row.radius);
      return {
        ...row,
        areaKm2: formatNumber(area, { maximumFractionDigits: 3 }),
        population: formatNumber(row.population),
        populationDensity: formatNumber(Math.round(row.population / area)),
        households: formatNumber(row.households),
        householdDensity: formatNumber(Math.round(row.households / area)),
        avgAge: formatNumber(row.avgAge, { maximumFractionDigits: 1 })
      };
    }
  });

  wireExportButtons();
}

initTables().catch(console.warn);
