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
    const params = new URLSearchParams({
      action: 'write',
      nombre: data.nombre,
      tipo: data.tipo,
      lat: data.lat,
      lng: data.lng,
      notas: data.notas,
      autor: data.autor,
      foto_url: '',
      coord_origen: data.coord_origen,
    });

    const savedSite = await fetch(`${SHEET_API}?${params}`).then(readJsonResponse);
    return selectedPhoto ? { ...savedSite, photo_status: 'pending_backend' } : savedSite;
  }

  if (mapPickBtn) mapPickBtn.addEventListener('click', startMapPick);
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
      if (result.photo_status === 'pending_backend') {
        alert('✓ Sitio guardado. La foto queda pendiente hasta ajustar el Apps Script.');
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
