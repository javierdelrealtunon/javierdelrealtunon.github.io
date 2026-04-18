(function () {
  const fotoTipo = { color: '#f0b962', icon: '📷' };
  TIPOS.Foto = fotoTipo;

  const tipoInput = document.getElementById('form-tipo');
  const mapPickBtn = document.getElementById('btn-map-pick');
  let draftMarker = null;
  let pickingPoint = false;

  function setDraftMarker(lat, lng) {
    const point = [Number(lat), Number(lng)];
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;

    if (!draftMarker) {
      draftMarker = L.marker(point, {
        icon: makeIcon(fotoTipo.color),
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);
      draftMarker.bindPopup('Punto que se guardará');
      draftMarker.on('dragend', () => {
        const pos = draftMarker.getLatLng();
        setCoordinates(pos.lat, pos.lng, 'manual_mapa', 'Punto ajustado moviendo el marcador.');
      });
    } else {
      draftMarker.setLatLng(point);
    }
  }

  function setCoordinates(lat, lng, source, message) {
    latInput.value = Number(lat).toFixed(6);
    lngInput.value = Number(lng).toFixed(6);
    coordSource = source;
    if (message) gpsStatus.textContent = message;
    setDraftMarker(lat, lng);
  }

  function syncMarkerFromInputs() {
    const lat = Number(latInput.value);
    const lng = Number(lngInput.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setDraftMarker(lat, lng);
    if (!coordSource) coordSource = 'manual';
  }

  function startMapPick() {
    pickingPoint = true;
    mapPickBtn.classList.add('active');
    map.getContainer().style.cursor = 'crosshair';
    modal.classList.remove('open');
    setTimeout(() => alert('Toca el mapa en el punto exacto que quieres guardar.'), 50);
  }

  function finishMapPick(latlng) {
    pickingPoint = false;
    mapPickBtn.classList.remove('active');
    map.getContainer().style.cursor = '';
    setCoordinates(latlng.lat, latlng.lng, 'manual_mapa', 'Punto marcado en el mapa. Puedes mover el marcador o ajustar números.');
    modal.classList.add('open');
  }

  async function readJsonResponse(response) {
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (err) {
      const hint = text ? text.slice(0, 160) : 'respuesta vacía';
      throw new Error(`El servidor no devolvió JSON (${response.status}): ${hint}`);
    }
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  }

  async function patchedSaveSite(data) {
    const sheetCoordinate = value => String(value || '').replace('.', ',');
    const registroId = makeRegistroId();
    const params = new URLSearchParams({
      action: 'write',
      registro_id: registroId,
      nombre: data.nombre,
      tipo: data.tipo,
      lat: sheetCoordinate(data.lat),
      lng: sheetCoordinate(data.lng),
      notas: data.notas,
      autor: data.autor,
      foto_url: '',
      coord_origen: data.coord_origen,
    });

    const savedSite = await fetch(`${SHEET_API}?${params}`).then(readJsonResponse);
    if (!selectedPhoto) return savedSite;

    try {
      await uploadPhotoForSite(registroId);
      return { ...savedSite, photo_status: 'sent' };
    } catch (err) {
      console.warn('[photo upload]', err);
      return { ...savedSite, photo_status: 'failed' };
    }
  }

  function makeRegistroId() {
    const randomPart = window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `web-${randomPart}`;
  }

  async function uploadPhotoForSite(registroId) {
    const dataUrl = await resizePhotoForUpload(selectedPhoto);
    const response = await fetch(SHEET_API, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'attach_photo',
        registro_id: registroId,
        foto_nombre: selectedPhoto.name.replace(/\.[^.]+$/, '') + '.jpg',
        foto_tipo: 'image/jpeg',
        foto_base64: dataUrl.split(',')[1],
      }),
    });

    if (response.type === 'opaque') return { ok: true };
    return readJsonResponse(response);
  }

  function parseSheetCoordinate(value, axis) {
    if (value === null || value === undefined || value === '') return null;
    let normalized = String(value).trim();
    if (!normalized) return null;

    if (normalized.includes(',') && normalized.includes('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (normalized.includes(',')) {
      normalized = normalized.replace(',', '.');
    } else {
      const parts = normalized.split('.');
      if (parts.length > 2) normalized = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    let coordinate = Number(normalized);
    if (!Number.isFinite(coordinate)) return null;

    const max = axis === 'lat' ? 90 : 180;
    while (Math.abs(coordinate) > max && Math.abs(coordinate) >= 1000) coordinate /= 10;
    return Math.abs(coordinate) <= max ? coordinate : null;
  }

  function getLayerCheckbox(layer) {
    return document.querySelector(`#layer-list input[data-layer="${layer}"]`);
  }

  function getSheetLayerForTipo(tipo) {
    if (tipo === 'Aparcamiento') return 'parking';
    if (tipo === 'Punto de entrada') return 'entrada';
    if (tipo === 'Foto') return 'fotos';
    if (tipo === 'Sitio de pesca') return 'sitios';
    return '';
  }

  function isSheetTipoVisible(tipo) {
    const layer = getSheetLayerForTipo(tipo);
    const checkbox = layer ? getLayerCheckbox(layer) : null;
    return !checkbox || checkbox.checked;
  }

  function makePhotoAwareIcon(color, hasPhoto) {
    if (!hasPhoto) return makeIcon(color);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 34 40">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z"
        fill="${color}" fill-opacity="0.94"/>
      <circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>
      <g transform="translate(15 17)">
        <circle cx="9" cy="9" r="8" fill="#07111e" stroke="white" stroke-opacity="0.9" stroke-width="1.4"/>
        <path d="M4.8 7.1h2l.8-1.2h2.8l.8 1.2h2c.7 0 1.1.4 1.1 1.1v4.2c0 .7-.4 1.1-1.1 1.1H4.8c-.7 0-1.1-.4-1.1-1.1V8.2c0-.7.4-1.1 1.1-1.1z" fill="white" fill-opacity="0.92"/>
        <circle cx="9" cy="10.3" r="1.8" fill="#07111e"/>
      </g>
    </svg>`;

    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [34, 40],
      iconAnchor: [13, 34],
      popupAnchor: [0, -36],
    });
  }

  function buildPhotoPopup(row, tipo, fotoUrl) {
    const title = escapeHTML(row.nombre) || '(sin nombre)';
    const notes = escapeHTML(row.notas);
    const author = escapeHTML(row.autor);
    const safeTipo = escapeHTML(row.tipo);
    const image = fotoUrl
      ? `<a href="${fotoUrl}" target="_blank" rel="noopener" style="display:block;margin:10px -4px 8px">
          <img src="${fotoUrl}" alt="Foto de ${title}" loading="lazy" style="display:block;width:240px;max-width:100%;height:145px;object-fit:cover;border-radius:8px;border:1px solid rgba(100,181,255,.22);background:#07111e">
        </a>`
      : '';
    const openPhoto = fotoUrl
      ? `<a href="${fotoUrl}" target="_blank" rel="noopener" style="display:inline-flex;margin-top:6px;color:#a8d4ff;font-size:.8rem;text-decoration:none">Abrir foto</a>`
      : '';

    return `
      <strong style="font-size:.95rem">${title}</strong><br>
      <span style="color:#7a9bbf;font-size:.82rem">${tipo.icon} ${safeTipo}${fotoUrl ? ' · con foto' : ''}</span>
      ${image}
      ${notes ? `<span style="display:block;font-size:.82rem;margin-top:6px">${notes}</span>` : ''}
      ${author ? `<span style="display:block;font-size:.75rem;color:#999;margin-top:4px">por ${author}</span>` : ''}
      ${openPhoto}
    `;
  }

  function showSheetInfo(row, tipo, fotoUrl) {
    document.getElementById('info-empty').style.display = 'none';
    const content = document.getElementById('info-content');
    content.style.display = 'block';
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    document.getElementById('info-tag').innerHTML =
      `<span style="color:${tipo.color}">${tipo.icon}</span> ${escapeHTML(row.tipo)}${fotoUrl ? ' · foto' : ''}`;
    document.getElementById('info-name').textContent = row.nombre || '(sin nombre)';
    document.getElementById('info-desc').innerHTML = `
      ${fotoUrl ? `<a href="${fotoUrl}" target="_blank" rel="noopener" style="display:block;margin-bottom:12px">
        <img src="${fotoUrl}" alt="Foto de ${escapeHTML(row.nombre)}" loading="lazy" style="display:block;width:100%;max-height:210px;object-fit:cover;border-radius:8px;border:1px solid rgba(100,181,255,.18);background:#07111e">
      </a>` : ''}
      ${row.notas ? `<div>${escapeHTML(row.notas)}</div>` : '<div style="opacity:.7">Sin notas todavía.</div>'}
      ${row.autor ? `<div style="margin-top:10px;font-size:.78rem;opacity:.75">por ${escapeHTML(row.autor)}</div>` : ''}
    `;
  }

  loadSheetMarkers = function loadSheetMarkersPatched() {
    fetch(SHEET_API)
      .then(r => r.json())
      .then(rows => {
        sheetLayer.clearLayers();
        rows.forEach(row => {
          if (!isSheetTipoVisible(row.tipo)) return;

          const lat = parseSheetCoordinate(row.lat, 'lat');
          const lng = parseSheetCoordinate(row.lng, 'lng');
          if (lat === null || lng === null) return;

          const tipo = TIPOS[row.tipo] || { color: '#aaaaaa', icon: '📍' };
          const fotoUrl = escapeHTML(row.foto_url);
          const marker = L.marker([lat, lng], {
            icon: makePhotoAwareIcon(tipo.color, Boolean(fotoUrl)),
          });
          marker.bindPopup(buildPhotoPopup(row, tipo, fotoUrl), { maxWidth: 280 });
          marker.on('click', () => showSheetInfo(row, tipo, fotoUrl));
          sheetLayer.addLayer(marker);
        });
      })
      .catch(err => console.warn('[sheet]', err.message));
  };

  loadSheetMarkers();

  if (mapPickBtn) mapPickBtn.addEventListener('click', startMapPick);
  ['sitios', 'parking', 'entrada', 'fotos'].forEach(layer => {
    const checkbox = getLayerCheckbox(layer);
    if (checkbox) checkbox.addEventListener('change', () => setTimeout(loadSheetMarkers, 0));
  });
  latInput.addEventListener('change', syncMarkerFromInputs);
  lngInput.addEventListener('change', syncMarkerFromInputs);

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (tipoInput && !tipoInput.value) tipoInput.value = 'Foto';
    const gps = await getExifGps(file);
    if (gps) {
      setCoordinates(gps.lat, gps.lng, 'exif_foto', 'Coordenadas tomadas de la foto. Puedes mover el marcador o ajustar números.');
    }
  });

  map.on('click', e => {
    if (!pickingPoint) return;
    finishMapPick(e.latlng);
  });

  addForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = addForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;

    const data = {
      nombre: document.getElementById('form-nombre').value.trim(),
      tipo: document.getElementById('form-tipo').value,
      lat: latInput.value,
      lng: lngInput.value,
      notas: document.getElementById('form-notas').value.trim(),
      autor: document.getElementById('form-autor').value.trim(),
      coord_origen: coordSource || 'manual',
    };

    try {
      const result = await patchedSaveSite(data);
      if (!result.ok) throw new Error('respuesta not ok');
      modal.classList.remove('open');
      addForm.reset();
      gpsStatus.textContent = '';
      photoStatus.textContent = 'Si la foto tiene ubicación, se usarán esas coordenadas.';
      photoPreview.classList.remove('visible');
      photoPreviewImg.removeAttribute('src');
      selectedPhoto = null;
      coordSource = '';
      if (draftMarker) {
        map.removeLayer(draftMarker);
        draftMarker = null;
      }
      setTimeout(loadSheetMarkers, 2000);
      if (result.photo_status === 'sent') {
        alert('✓ Sitio guardado. Foto enviada; aparecerá si Apps Script v7 ya está desplegado.');
      } else if (result.photo_status === 'failed') {
        alert('✓ Sitio guardado. No se pudo enviar la foto; revisamos ese paso después.');
      } else {
        alert('✓ Sitio guardado correctamente');
      }
    } catch (err) {
      console.error('[save]', err);
      alert(
        `Error al guardar: ${err.message}\n\n` +
        'Si acabas de actualizar Apps Script, entra en Implementar > Gestionar implementaciones > Editar, elige una versión nueva y despliega la aplicación web con acceso para cualquier usuario.'
      );
    } finally {
      submitBtn.textContent = 'Guardar sitio';
      submitBtn.disabled = false;
    }
  }, true);
}());
