const REKALDE_CENTER = [43.25402799, -2.947535998];
const radiusMeters = { "100 m": 100, "250 m": 250, "500 m": 500, "1.000 m": 1000 };
const WALKING_DISTANCE_FACTOR = 1.25;
const categoryColors = {
  Local: "#0b5d57",
  "Disponibilidad inmobiliaria": "#b65d2f",
  "Hostelería y alimentación": "#d97706",
  "Comercio cotidiano": "#2f7d51",
  "Comercio especializado": "#7c3aed",
  "Servicios personales": "#db2777",
  "Servicios profesionales y financieros": "#2563eb",
  "Salud y bienestar": "#16a34a",
  "Educación y formación": "#1f5f99",
  "Deporte y actividad física": "#e48a2a",
  "Logística urbana y paquetería": "#c2417a",
  "Almacenaje y trasteros": "#8a5a2b",
  "Alojamiento de visitantes": "#0f766e",
  Movilidad: "#6b4aa0",
  "Equipamientos y comunidad": "#966b00",
  "Otros servicios y actividades": "#5a6966"
};

function drawFallbackMap(container, geojson, radius = "500 m") {
  const center = [-2.947535998, 43.25402799];
  const radiusSize = { "100 m": 110, "250 m": 190, "500 m": 290, "1.000 m": 390 }[radius] || 290;
  container.innerHTML = `<div class="fallback-map" role="img" aria-label="Mapa esquemático del entorno de Rekalde">
    <span class="radius-ring" style="width:${radiusSize}px;height:${radiusSize}px"></span>
  </div>`;
  const map = container.querySelector(".fallback-map");
  geojson.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const x = 50 + ((lon - center[0]) * 9000);
    const y = 50 - ((lat - center[1]) * 9000);
    const point = document.createElement("button");
    point.className = "map-point";
    point.type = "button";
    point.dataset.category = feature.properties.category;
    point.style.left = `${Math.max(8, Math.min(92, x))}%`;
    point.style.top = `${Math.max(8, Math.min(92, y))}%`;
    point.setAttribute("aria-label", `${feature.properties.name}, ${feature.properties.category}`);
    point.title = `${feature.properties.name} · ${feature.properties.category}`;
    map.append(point);
  });
}

function markerIcon(category) {
  if (!window.L) return null;
  if (category === "Local") {
    return L.divIcon({
      className: "local-leaflet-marker",
      html: `<span aria-hidden="true"></span><strong>LOCAL</strong>`,
      iconSize: [78, 36],
      iconAnchor: [18, 28],
      popupAnchor: [0, -28]
    });
  }
  const color = categoryColors[category] || "#5a6966";
  return L.divIcon({
    className: "simple-leaflet-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function safeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function distanceMeters(from, to) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const [fromLat, fromLon] = from;
  const [toLat, toLon] = to;
  const earthRadius = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function enrichFeature(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const directDistance = distanceMeters(REKALDE_CENTER, [lat, lon]);
  const walkingDistance = Math.round(directDistance * WALKING_DISTANCE_FACTOR);
  feature.properties.walking_distance_m = feature.properties.walking_distance_m ?? walkingDistance;
  feature.properties.distance_m = feature.properties.distance_m ?? Math.round(directDistance);
  feature.filterText = [
    feature.properties.name,
    feature.properties.commercial_name,
    feature.properties.category,
    feature.properties.category_original,
    feature.properties.subcategory,
    feature.properties.business_chain,
    feature.properties.notes,
    feature.properties.address,
    feature.properties.status
  ].filter(Boolean).join(" ").toLowerCase();
  return feature;
}

function formatMeters(value) {
  if (!Number.isFinite(Number(value))) return "";
  return `${Math.round(Number(value)).toLocaleString("es-ES")} m`;
}

function featureDetail(props) {
  const details = [
    props.category_original && props.category_original !== props.category ? props.category_original : null,
    props.subcategory,
    props.business_chain,
    props.address,
    props.walking_distance_m ? `a pie ${formatMeters(props.walking_distance_m)}` : null,
    props.walking_time_min ? `${props.walking_time_min} min` : null
  ].filter(Boolean);
  return details.join(" · ");
}

function activityTypeLabel(props) {
  return props.subcategory || (props.category_original && props.category_original !== props.category ? props.category_original : "") || "";
}

function featurePopup(feature) {
  const props = feature.properties;
  const detail = featureDetail(props);
  const commercialName = props.commercial_name || props.business_chain || props.name;
  const websiteUrl = safeExternalUrl(props.website);
  const sourceUrl = !websiteUrl ? safeExternalUrl(props.source_url) : "";
  const photoUrl = safeExternalUrl(props.photo_url);
  const photoSourceUrl = safeExternalUrl(props.photo_source_url);
  const photoSource = props.photo_source || props.photo_credit || "";
  const linkHtml = [
    websiteUrl ? `<a class="popup-link" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer">Web</a>` : "",
    sourceUrl ? `<a class="popup-link popup-link--secondary" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Fuente</a>` : ""
  ].filter(Boolean).join("");
  return `
    <div class="activity-popup">
      ${photoUrl ? `<figure class="activity-popup__media">
        <img src="${escapeHtml(photoUrl)}" alt="Imagen pública de ${escapeHtml(commercialName)}" loading="lazy">
        ${photoSourceUrl ? `<figcaption><a href="${escapeHtml(photoSourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photoSource || "Origen de la imagen")}</a></figcaption>` : photoSource ? `<figcaption>${escapeHtml(photoSource)}</figcaption>` : ""}
      </figure>` : ""}
      <strong>${escapeHtml(commercialName)}</strong>
      ${commercialName !== props.name ? `<span class="activity-popup__name">${escapeHtml(props.name)}</span>` : ""}
      <dl>
        <dt>Categoría</dt>
        <dd>${escapeHtml(props.category)}</dd>
        <dt>Estado</dt>
        <dd>${escapeHtml(props.status)}</dd>
        <dt>Confianza</dt>
        <dd>${escapeHtml(props.confidence)}</dd>
        ${detail ? `<dt>Detalle</dt><dd>${escapeHtml(detail)}</dd>` : ""}
      </dl>
      ${linkHtml ? `<div class="activity-popup__links">${linkHtml}</div>` : ""}
    </div>
  `;
}

function createLeafletMap(container, geojson, radius = "500 m") {
  if (!window.L) {
    drawFallbackMap(container, geojson, radius);
    return null;
  }

  container.innerHTML = "";
  const map = L.map(container, { scrollWheelZoom: true }).setView(REKALDE_CENTER, 16);
  const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  });
  const orthoLayer = L.tileLayer.wms("https://www.ign.es/wms-inspire/pnoa-ma", {
    layers: "OI.OrthoimageCoverage",
    format: "image/jpeg",
    transparent: false,
    attribution: "PNOA &copy; IGN"
  });
  streetLayer.addTo(map);

  const layers = {
    markers: L.layerGroup().addTo(map),
    radius: L.circle(REKALDE_CENTER, {
      radius: radiusMeters[radius] || 500,
      color: "#0b5d57",
      weight: 2,
      fillColor: "#0b5d57",
      fillOpacity: 0.08
    }).addTo(map)
  };

  layers.allMarkers = geojson.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const marker = L.marker([lat, lon], { icon: markerIcon(feature.properties.category) })
      .bindPopup(featurePopup(feature));
  if (feature.properties.category === "Local") marker.setZIndexOffset(1000);
    marker.featureCategory = feature.properties.category;
    marker.feature = feature;
    marker.addTo(layers.markers);
    return marker;
  });

  map._recaldeLayers = layers;
  map._baseLayers = { street: streetLayer, ortho: orthoLayer };
  container._recaldeMap = map;
  window.recaldeActivityMap = map;
  setTimeout(() => map.invalidateSize(), 120);
  return map;
}

function setBaseLayer(map, baseLayer) {
  if (!map || !map._baseLayers) return;
  Object.values(map._baseLayers).forEach((layer) => map.removeLayer(layer));
  (map._baseLayers[baseLayer] || map._baseLayers.street).addTo(map);
}

function wireMapPanelControls(panel, map) {
  if (!panel) return;
  const baseLayerSelect = panel.querySelector("[data-base-layer]");
  const expandButton = panel.querySelector("[data-map-expand]");

  baseLayerSelect?.addEventListener("change", () => {
    setBaseLayer(map, baseLayerSelect.value);
  });

  expandButton?.addEventListener("click", () => {
    const isExpanded = panel.classList.toggle("is-expanded");
    document.body.classList.toggle("map-expanded", isExpanded);
    expandButton.setAttribute("aria-label", isExpanded ? "Reducir mapa" : "Ampliar mapa");
    expandButton.setAttribute("title", isExpanded ? "Reducir mapa" : "Ampliar mapa");
    expandButton.setAttribute("aria-pressed", String(isExpanded));
    setTimeout(() => map?.invalidateSize(), 180);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !panel.classList.contains("is-expanded")) return;
    panel.classList.remove("is-expanded");
    document.body.classList.remove("map-expanded");
    if (expandButton) {
      expandButton.setAttribute("aria-label", "Ampliar mapa");
      expandButton.setAttribute("title", "Ampliar mapa");
      expandButton.setAttribute("aria-pressed", "false");
    }
    setTimeout(() => map?.invalidateSize(), 180);
  });
}

function updateLeafletRadius(map, radius) {
  if (!map || !map._recaldeLayers) return;
  map._recaldeLayers.radius.setRadius(radiusMeters[radius] || 500);
}

function filterLeafletMarkers(map, filterState) {
  if (!map || !map._recaldeLayers) return;
  map._recaldeLayers.markers.clearLayers();
  map._recaldeLayers.allMarkers.forEach((marker) => {
    const shouldShow = matchesFeature(marker.feature, filterState);
    if (shouldShow) marker.addTo(map._recaldeLayers.markers);
  });
}

function getSelectedCategories(categoryFilter) {
  if (!categoryFilter) return ["todas"];
  if (categoryFilter.matches("select")) {
    const selected = [...categoryFilter.selectedOptions].map((option) => option.value);
    return selected.length ? selected : ["todas"];
  }
  const selected = [...categoryFilter.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);
  return selected.length ? selected : ["todas"];
}

function getSelectedActivityTypes(activityTypeFilter) {
  if (!activityTypeFilter) return ["todas"];
  const selected = [...activityTypeFilter.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);
  return selected.length ? selected : ["todas"];
}

function closeCategoryFilter(categoryFilter) {
  const menu = categoryFilter.querySelector("[data-category-filter-menu]");
  const button = categoryFilter.querySelector("[data-category-filter-button]");
  if (!menu || !button) return;
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function closeActivityTypeFilter(activityTypeFilter) {
  const menu = activityTypeFilter.querySelector("[data-activity-type-filter-menu]");
  const button = activityTypeFilter.querySelector("[data-activity-type-filter-button]");
  if (!menu || !button) return;
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function updateCategoryFilterSummary(categoryFilter) {
  const summary = categoryFilter.querySelector("[data-category-filter-summary]");
  if (!summary) return;
  const selected = getSelectedCategories(categoryFilter).filter((value) => value !== "todas");
  if (!selected.length) {
    summary.textContent = "Todas";
  } else if (selected.length === 1) {
    summary.textContent = selected[0];
  } else {
    summary.textContent = `${selected.length} categorías`;
  }
}

function updateActivityTypeFilterSummary(activityTypeFilter) {
  const summary = activityTypeFilter.querySelector("[data-activity-type-filter-summary]");
  if (!summary) return;
  const selected = getSelectedActivityTypes(activityTypeFilter).filter((value) => value !== "todas");
  if (!selected.length) {
    summary.textContent = "Todas";
  } else if (selected.length === 1) {
    summary.textContent = selected[0];
  } else {
    summary.textContent = `${selected.length} actividades`;
  }
}

function wireCategoryFilter(categoryFilter) {
  if (categoryFilter.matches("select") || categoryFilter.dataset.wired === "true") return;
  categoryFilter.dataset.wired = "true";
  const button = categoryFilter.querySelector("[data-category-filter-button]");
  const menu = categoryFilter.querySelector("[data-category-filter-menu]");
  if (!button || !menu) return;

  button.addEventListener("click", () => {
    const willOpen = menu.hidden;
    document.querySelectorAll("[data-category-filter]").forEach((filter) => {
      if (filter !== categoryFilter && !filter.matches("select")) closeCategoryFilter(filter);
    });
    document.querySelectorAll("[data-activity-type-filter]").forEach(closeActivityTypeFilter);
    menu.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });

  categoryFilter.addEventListener("change", (event) => {
    const changed = event.target;
    if (!changed.matches("input[type='checkbox']")) return;
    const checkboxes = [...categoryFilter.querySelectorAll("input[type='checkbox']")];
    const all = checkboxes.find((input) => input.value === "todas");
    if (changed.value === "todas" && changed.checked) {
      checkboxes.forEach((input) => {
        if (input !== all) input.checked = false;
      });
    } else if (changed.checked && all) {
      all.checked = false;
    }
    if (!checkboxes.some((input) => input.checked) && all) all.checked = true;
    updateCategoryFilterSummary(categoryFilter);
  });

  document.addEventListener("click", (event) => {
    if (!categoryFilter.contains(event.target)) closeCategoryFilter(categoryFilter);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCategoryFilter(categoryFilter);
  });
}

function wireActivityTypeFilter(activityTypeFilter) {
  if (activityTypeFilter.dataset.wired === "true") return;
  activityTypeFilter.dataset.wired = "true";
  const button = activityTypeFilter.querySelector("[data-activity-type-filter-button]");
  const menu = activityTypeFilter.querySelector("[data-activity-type-filter-menu]");
  if (!button || !menu) return;

  button.addEventListener("click", () => {
    const willOpen = menu.hidden;
    document.querySelectorAll("[data-category-filter]").forEach((filter) => {
      if (!filter.matches("select")) closeCategoryFilter(filter);
    });
    document.querySelectorAll("[data-activity-type-filter]").forEach((filter) => {
      if (filter !== activityTypeFilter) closeActivityTypeFilter(filter);
    });
    menu.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });

  activityTypeFilter.addEventListener("change", (event) => {
    const changed = event.target;
    if (!changed.matches("input[type='checkbox']")) return;
    const checkboxes = [...activityTypeFilter.querySelectorAll("input[type='checkbox']")];
    const all = checkboxes.find((input) => input.value === "todas");
    if (changed.value === "todas" && changed.checked) {
      checkboxes.forEach((input) => {
        if (input !== all) input.checked = false;
      });
    } else if (changed.checked && all) {
      all.checked = false;
    }
    if (!checkboxes.some((input) => input.checked) && all) all.checked = true;
    updateActivityTypeFilterSummary(activityTypeFilter);
  });

  document.addEventListener("click", (event) => {
    if (!activityTypeFilter.contains(event.target)) closeActivityTypeFilter(activityTypeFilter);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeActivityTypeFilter(activityTypeFilter);
  });
}

function getActivityFilterState() {
  const activityFilter = document.querySelector("[data-activity-filter]");
  const categoryFilter = document.querySelector("[data-category-filter]");
  const activityTypeFilter = document.querySelector("[data-activity-type-filter]");
  const walkingDistanceFilter = document.querySelector("[data-walking-distance-filter]");
  const activeRadius = document.querySelector("[data-map-radius-control] button.is-active")?.dataset.radius || "500 m";
  const selectedCategories = getSelectedCategories(categoryFilter);
  const selectedActivityTypes = getSelectedActivityTypes(activityTypeFilter);
  return {
    query: (activityFilter?.value || "").trim().toLowerCase(),
    categories: selectedCategories.length ? selectedCategories : ["todas"],
    activityTypes: selectedActivityTypes.length ? selectedActivityTypes : ["todas"],
    maxRadiusDistance: radiusMeters[activeRadius] || 500,
    maxWalkingDistance: walkingDistanceFilter?.value === "todas" ? Infinity : Number(walkingDistanceFilter?.value || Infinity)
  };
}

function matchesFeature(feature, filterState) {
  const props = feature.properties;
  if (props.category === "Local") return true;
  const matchesQuery = !filterState.query || feature.filterText.includes(filterState.query);
  const matchesCategory = filterState.categories.includes("todas") || filterState.categories.includes(props.category);
  const activityType = activityTypeLabel(props);
  const matchesActivityType = filterState.activityTypes.includes("todas") || filterState.activityTypes.includes(activityType);
  const matchesRadius = Number(props.distance_m || Infinity) <= filterState.maxRadiusDistance;
  const matchesWalkingDistance = Number(props.walking_distance_m || 0) <= filterState.maxWalkingDistance;
  return matchesQuery && matchesCategory && matchesActivityType && matchesRadius && matchesWalkingDistance;
}

function populateCategoryFilters(geojson) {
  const categories = [...new Set(geojson.features.map((feature) => feature.properties.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  document.querySelectorAll("[data-category-filter]").forEach((categoryFilter) => {
    const selected = getSelectedCategories(categoryFilter);
    const selectedSet = new Set(selected.length ? selected : ["todas"]);
    if (categoryFilter.matches("select")) {
      categoryFilter.innerHTML = [
        `<option value="todas">Todas</option>`,
        ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      ].join("");
      [...categoryFilter.options].forEach((option) => {
        option.selected = selectedSet.has(option.value) || (!selectedSet.size && option.value === "todas");
      });
      return;
    }

    const menu = categoryFilter.querySelector("[data-category-filter-menu]");
    if (!menu) return;
    const options = ["todas", ...categories];
    menu.innerHTML = options.map((category, index) => {
      const id = `category-filter-${index}`;
      const checked = selectedSet.has(category) || (!selectedSet.size && category === "todas");
      return `
        <label class="multi-select__option" for="${id}">
          <input id="${id}" type="checkbox" value="${escapeHtml(category)}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(category === "todas" ? "Todas" : category)}</span>
        </label>`;
    }).join("");
    wireCategoryFilter(categoryFilter);
    updateCategoryFilterSummary(categoryFilter);
  });
}

function populateActivityTypeFilters(geojson, filterState = getActivityFilterState()) {
  const categories = filterState.categories || ["todas"];
  const activityTypes = [...new Set(geojson.features
    .filter((feature) => feature.properties.category !== "Local")
    .filter((feature) => categories.includes("todas") || categories.includes(feature.properties.category))
    .map((feature) => activityTypeLabel(feature.properties))
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  document.querySelectorAll("[data-activity-type-filter]").forEach((activityTypeFilter) => {
    const selectedSet = new Set(getSelectedActivityTypes(activityTypeFilter));
    const availableSet = new Set(activityTypes);
    const keptSelected = [...selectedSet].filter((value) => value === "todas" || availableSet.has(value));
    const effectiveSet = new Set(keptSelected.length ? keptSelected : ["todas"]);
    const menu = activityTypeFilter.querySelector("[data-activity-type-filter-menu]");
    if (!menu) return;
    const options = ["todas", ...activityTypes];
    menu.innerHTML = options.map((activityType, index) => {
      const id = `activity-type-filter-${index}`;
      const checked = effectiveSet.has(activityType) || (!effectiveSet.size && activityType === "todas");
      return `
        <label class="multi-select__option" for="${id}">
          <input id="${id}" type="checkbox" value="${escapeHtml(activityType)}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(activityType === "todas" ? "Todas" : activityType)}</span>
        </label>`;
    }).join("");
    wireActivityTypeFilter(activityTypeFilter);
    updateActivityTypeFilterSummary(activityTypeFilter);
  });
}

async function initMap() {
  const containers = document.querySelectorAll("[data-map]");
  if (!containers.length) return;
  const geojson = await getJson("actividades.geojson?v=20260626-public-profile-2");
  geojson.features = geojson.features.map(enrichFeature);
  populateCategoryFilters(geojson);
  populateActivityTypeFilters(geojson);
  const maps = [...containers].map((container) => createLeafletMap(container, geojson));
  containers.forEach((container, index) => {
    wireMapPanelControls(container.closest("[data-map-panel]"), maps[index]);
  });
  let currentRadius = "500 m";

  const filteredGeojson = () => ({
    type: "FeatureCollection",
    features: geojson.features.filter((feature) => matchesFeature(feature, getActivityFilterState()))
  });

  const setRadius = (radius) => {
    currentRadius = radius;
    maps.forEach((map, index) => {
      if (map) updateLeafletRadius(map, radius);
      else drawFallbackMap(containers[index], filteredGeojson(), radius);
    });
    applyActivityFilters();
  };

  document.querySelectorAll("[data-map-radius-control] button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-map-radius-control] button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      setRadius(button.dataset.radius);
    });
  });

  const table = document.querySelector("#activities-table");
  if (table) {
    table.querySelector("thead").innerHTML = `
      <tr>
        <th scope="col">Actividad</th>
        <th scope="col">Categoría</th>
        <th scope="col">Tipo de actividad</th>
        <th scope="col">Estado</th>
        <th scope="col">Confianza</th>
        <th scope="col">Distancia a pie</th>
        <th scope="col">Tiempo a pie</th>
        <th scope="col">Detalle</th>
      </tr>`;
    table.querySelector("tbody").innerHTML = geojson.features.map((feature, index) => `
      <tr data-filter-row data-feature-index="${index}" data-category="${escapeHtml(feature.properties.category)}">
        <td>${escapeHtml(feature.properties.name)}</td>
        <td>${escapeHtml(feature.properties.category)}</td>
        <td>${escapeHtml(activityTypeLabel(feature.properties))}</td>
        <td>${escapeHtml(feature.properties.status)}</td>
        <td>${escapeHtml(feature.properties.confidence)}</td>
        <td>${escapeHtml(formatMeters(feature.properties.walking_distance_m))}</td>
        <td>${escapeHtml(feature.properties.walking_time_min ? `${feature.properties.walking_time_min} min` : "")}</td>
        <td>${escapeHtml(featureDetail(feature.properties))}</td>
      </tr>`).join("");
  }

  const applyActivityFilters = () => {
    populateActivityTypeFilters(geojson);
    const filterState = getActivityFilterState();
    document.querySelectorAll("#activities-table tbody tr").forEach((row) => {
      const feature = geojson.features[Number(row.dataset.featureIndex)];
      row.hidden = !matchesFeature(feature, filterState);
    });
    maps.forEach((map, index) => {
      if (map) filterLeafletMarkers(map, filterState);
      else drawFallbackMap(containers[index], filteredGeojson(), currentRadius);
    });
  };

  document.querySelectorAll("[data-activity-filter], [data-category-filter], [data-activity-type-filter], [data-walking-distance-filter]").forEach((control) => {
    control.addEventListener("input", applyActivityFilters);
    control.addEventListener("change", applyActivityFilters);
  });

  applyActivityFilters();

  document.querySelectorAll("[data-export-geojson]").forEach((button) => {
    button.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "actividades-rekalde.geojson";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
}

initMap().catch(console.warn);
