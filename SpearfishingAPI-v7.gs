// SpearfishingAPI — Google Apps Script v7
// Guarda sitios por nombre de columna y permite adjuntar fotos a la misma fila.

const SHEET_ID = '1OkBW-s_LpS4Y4OQhRq9kEwt1JE1jVgfKDaqKc_tJzjc';
const PHOTO_FOLDER_NAME = 'Spearfishing fotos';

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const headers = ensureHeaders_(sheet, [
    'Registro ID',
    'Origen coordenadas',
  ]);
  const action = (e.parameter && e.parameter.action) ? e.parameter.action : 'read';

  if (action === 'write') {
    const registroId = e.parameter.registro_id || makeRegistroId_();
    appendSite_(sheet, headers, {
      registro_id: registroId,
      nombre: e.parameter.nombre || '',
      tipo: e.parameter.tipo || '',
      lat: e.parameter.lat || '',
      lng: e.parameter.lng || '',
      notas: e.parameter.notas || '',
      autor: e.parameter.autor || '',
      foto_url: e.parameter.foto_url || '',
      coord_origen: e.parameter.coord_origen || '',
    });
    return json_({ ok: true, registro_id: registroId });
  }

  return json_(readSites_(sheet, headers));
}

function doPost(e) {
  const payload = parsePayload_(e);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const headers = ensureHeaders_(sheet, [
    'Registro ID',
    'Origen coordenadas',
  ]);

  if (payload.action === 'attach_photo') {
    const fotoUrl = savePhoto_(payload);
    const updated = updatePhotoUrl_(sheet, headers, payload.registro_id, fotoUrl);
    return json_({ ok: true, foto_url: fotoUrl, updated: updated });
  }

  const registroId = payload.registro_id || makeRegistroId_();
  let fotoUrl = payload.foto_url || '';
  if (payload.foto_base64) {
    fotoUrl = savePhoto_(payload);
  }

  appendSite_(sheet, headers, {
    registro_id: registroId,
    nombre: payload.nombre || '',
    tipo: payload.tipo || '',
    lat: payload.lat || '',
    lng: payload.lng || '',
    notas: payload.notas || '',
    autor: payload.autor || '',
    foto_url: fotoUrl,
    coord_origen: payload.coord_origen || '',
  });

  return json_({ ok: true, registro_id: registroId, foto_url: fotoUrl });
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function ensureHeaders_(sheet, requiredHeaders) {
  const headers = getHeaders_(sheet);
  requiredHeaders.forEach(header => {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header);
    }
  });
  return headers;
}

function appendSite_(sheet, headers, data) {
  const valores = {
    'Marca temporal': new Date(),
    'Nombre del sitio': data.nombre,
    'Tipo': data.tipo,
    'Latitud': data.lat,
    'Longitud': data.lng,
    'Notas': data.notas,
    'Tu nombre': data.autor,
    'Columna 1': data.foto_url,
    'Registro ID': data.registro_id,
    'Origen coordenadas': data.coord_origen,
  };
  const fila = headers.map(h => valores[h] !== undefined ? valores[h] : '');
  sheet.appendRow(fila);
}

function updatePhotoUrl_(sheet, headers, registroId, fotoUrl) {
  if (!registroId) return false;

  const idIndex = headers.indexOf('Registro ID');
  const photoIndex = headers.indexOf('Columna 1');
  if (idIndex === -1 || photoIndex === -1) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][idIndex]) === String(registroId)) {
      sheet.getRange(i + 2, photoIndex + 1).setValue(fotoUrl);
      return true;
    }
  }
  return false;
}

function readSites_(sheet, headers) {
  const rows = sheet.getDataRange().getValues();
  const nameIndex = headers.indexOf('Nombre del sitio');
  return rows.slice(1)
    .filter(row => nameIndex >= 0 && row[nameIndex])
    .map(row => {
      const r = {};
      headers.forEach((h, i) => r[h] = row[i]);
      return {
        registro_id: r['Registro ID'] || '',
        nombre: r['Nombre del sitio'] || '',
        tipo: r['Tipo'] || '',
        lat: r['Latitud'] || '',
        lng: r['Longitud'] || '',
        notas: r['Notas'] || '',
        autor: r['Tu nombre'] || '',
        foto_url: r['Columna 1'] || '',
        coord_origen: r['Origen coordenadas'] || '',
        fecha: r['Marca temporal'] || '',
      };
    });
}

function parsePayload_(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return e.parameter || {};
}

function savePhoto_(payload) {
  const folder = getOrCreateFolder_(PHOTO_FOLDER_NAME);
  const bytes = Utilities.base64Decode(payload.foto_base64);
  const contentType = payload.foto_tipo || 'image/jpeg';
  const safeName = (payload.foto_nombre || 'foto.jpg').replace(/[^\w.\-]+/g, '_');
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  const blob = Utilities.newBlob(bytes, contentType, `${stamp}_${safeName}`);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function makeRegistroId_() {
  return Utilities.getUuid();
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
