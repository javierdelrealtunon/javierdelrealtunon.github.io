(function () {
  const PHOTO_API = 'https://script.google.com/macros/s/AKfycbwM4miDG1ERYgKh3Sz5yUKWmvzULRhHsJZeCzqbRufDjamiUQiIBQs5zGgSbW8PwrkMqA/exec';
  function safePhotoURL(value) {
    try { const u = new URL(value); return u.protocol === 'https:' ? escapeHTML(u.href) : ''; } catch { return ''; }
  }
  const fotoTipo={color:MapSymbols.kinds.photo.color,icon:MapSymbols.key('photo')};
  TIPOS.Foto = fotoTipo;

  const tipoInput = document.getElementById('form-tipo');
  const mapPickBtn = document.getElementById('btn-map-pick');
  let draftMarker = null;
  let pickingPoint = false;
  window.addEventListener('spearfishing:geometry-opening',()=>{pickingPoint=false;mapPickBtn?.classList.remove('active');});

  function setDraftMarker(lat, lng) {
    const point = [Number(lat), Number(lng)];
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;

    if (!draftMarker) {
      draftMarker = L.marker(point, {
        icon:MapSymbols.icon('editing',{size:38,className:'geometry-point-handle'}),title:'Punto propuesto: arrastra para ajustar',
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

    const savedSite = await fetch(`${PHOTO_API}?${params}`).then(readJsonResponse);
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
    const body = new URLSearchParams({
      action: 'attach_photo',
      registro_id: registroId,
      foto_nombre: selectedPhoto.name.replace(/\.[^.]+$/, '') + '.jpg',
      foto_tipo: 'image/jpeg',
      foto_base64: dataUrl.split(',')[1],
    });

    const response = await fetch(PHOTO_API, {
      method: 'POST',
      mode: 'no-cors',
      body,
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
    if (Math.abs(coordinate) > max && Number.isInteger(coordinate) && Math.abs(coordinate) >= 1000) coordinate /= 1e6;
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

  function makePhotoAwareIcon(type,hasPhoto){return MapSymbols.icon(type,{photo:hasPhoto});}

  function buildPhotoPopup(row, tipo, fotoUrl, fotoThumb) {
    const title = escapeHTML(row.nombre) || '(sin nombre)';
    const notes = escapeHTML(row.notas);
    const author = escapeHTML(row.autor);
    const safeTipo = escapeHTML(row.tipo);
    const imageUrl = fotoThumb || fotoUrl;
    const image = imageUrl
      ? `<a href="${fotoUrl || imageUrl}" target="_blank" rel="noopener" style="display:block;margin:10px -4px 8px">
          <img src="${imageUrl}" alt="Foto de ${title}" loading="lazy" referrerpolicy="no-referrer" style="display:block;width:240px;max-width:100%;height:145px;object-fit:cover;border-radius:8px;border:1px solid rgba(100,181,255,.22);background:#07111e">
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

  function showSheetInfo(row, tipo, fotoUrl, fotoThumb, sourceRef) {
    document.getElementById('info-empty').style.display = 'none';
    const content = document.getElementById('info-content');
    content.style.display = 'block';
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    document.getElementById('info-tag').innerHTML =
      `<span style="color:${tipo.color}">${tipo.icon}</span> ${escapeHTML(row.tipo)}${fotoUrl ? ' · foto' : ''}`;
    document.getElementById('info-name').textContent = row.nombre || '(sin nombre)';
    const imageUrl = fotoThumb || fotoUrl;
    document.getElementById('info-desc').innerHTML = `
      ${imageUrl ? `<a href="${fotoUrl || imageUrl}" target="_blank" rel="noopener" style="display:block;margin-bottom:12px">
        <img src="${imageUrl}" alt="Foto de ${escapeHTML(row.nombre)}" loading="lazy" referrerpolicy="no-referrer" style="display:block;width:100%;max-height:320px;object-fit:contain;border-radius:8px;border:1px solid rgba(100,181,255,.18);background:#07111e">
      </a>` : ''}
      ${row.notas ? `<div>${escapeHTML(row.notas)}</div>` : '<div style="opacity:.7">Sin notas todavía.</div>'}
      ${row.autor ? `<div style="margin-top:10px;font-size:.78rem;opacity:.75">por ${escapeHTML(row.autor)}</div>` : ''}
    `;
    if(sourceRef&&['Aparcamiento','Punto de entrada'].includes(row.tipo)){const edit=document.createElement('button');edit.className='zone-open-detail';edit.textContent='✎ Editar punto en el visor';edit.onclick=()=>window.dispatchEvent(new CustomEvent('spearfishing:edit-feature',{detail:{sourceRef}}));document.getElementById('info-desc').append(edit);}
    if(row.tipo==='Sitio de pesca'){
      const button=document.createElement('button');button.className='zone-open-detail';button.textContent='Abrir ficha de zona ↗';
      button.onclick=()=>window.dispatchEvent(new CustomEvent('spearfishing:open-zone',{detail:{recordId:row.registro_id,name:row.nombre,lat:parseSheetCoordinate(row.lat,'lat'),lon:parseSheetCoordinate(row.lng,'lng')}}));
      document.getElementById('info-desc').append(button);
    }
  }

  loadSheetMarkers = function loadSheetMarkersPatched() {
    fetch(PHOTO_API)
      .then(r => r.json())
      .then(rows => {
        // Forecast locations use their own layer/list and never become generic pins.
        window.spearfishingRecords=rows;
        sheetLayer.clearLayers();
        for(const ref of window.spearfishingEditableFeatures.keys())if(ref.startsWith('sheets:'))window.spearfishingEditableFeatures.delete(ref);
        rows.forEach(row => {
          if(['Ubicación de previsión','Ficha de zona','Fotografía de zona','Edición de elemento'].includes(row.tipo))return;
          const visible=isSheetTipoVisible(row.tipo);

          const lat = parseSheetCoordinate(row.lat, 'lat');
          const lng = parseSheetCoordinate(row.lng, 'lng');
          if (lat === null || lng === null) return;

          const tipo = TIPOS[row.tipo] || { color: '#aaaaaa', icon: '📍' };
          const fotoUrl = safePhotoURL(row.foto_url);
          const fotoThumb = safePhotoURL(row.foto_thumb);
          const marker = L.marker([lat, lng], {
            icon:makePhotoAwareIcon(row.tipo,Boolean(fotoUrl||fotoThumb)),title:row.nombre||row.tipo,alt:(row.nombre||row.tipo)+" · "+row.tipo,riseOnHover:true,
          });
          marker.bindTooltip(escapeHTML(row.nombre||row.tipo)+'<br><small>'+escapeHTML(row.tipo)+'</small>',{direction:'top'});
          marker.bindPopup(buildPhotoPopup(row, tipo, fotoUrl, fotoThumb), { maxWidth: 280 });
          const id=String(row.registro_id||`legacy-${row.tipo}-${row.nombre}-${lat}-${lng}`),sourceRef=`sheets:${id}`;
          if(['Aparcamiento','Punto de entrada'].includes(row.tipo))window.spearfishingEditableFeatures.set(sourceRef,{sourceRef,layer:marker,container:sheetLayer,row,base:{sourceRef,name:row.nombre||row.tipo,type:row.tipo,notes:row.notas||'',author:row.autor||'',coordinateSource:row.coord_origen||'',geometry:{type:'Point',coordinates:[lng,lat]}}});
          marker.on('click', () => {const current=window.spearfishingEditableFeatures.get(sourceRef)?.current;showSheetInfo(current?{...row,nombre:current.name,tipo:current.type,notas:current.notes,autor:current.author}:row, current?(TIPOS[current.type]||tipo):tipo, fotoUrl, fotoThumb, sourceRef);});
          if(visible)sheetLayer.addLayer(marker);
        });
        window.dispatchEvent(new CustomEvent('spearfishing:records-loaded',{detail:{rows}}));
        window.dispatchEvent(new CustomEvent('spearfishing:features-loaded'));
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
        alert('✓ Sitio guardado. Foto enviada; aparecerá si Apps Script v9 ya está desplegado.');
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
