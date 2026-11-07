import {coordinates,distanceKm} from './core.js';

export const localSpotsKey='marine.localSpots.v1';

export function localSpot(input) {
  const lat=Number(input.lat),lon=Number(input.lon),name=String(input.name||'').trim();
  if(input.lat==null||input.lon==null||String(input.lat).trim()===''||String(input.lon).trim()==='')throw new Error('Introduce la latitud y la longitud o selecciona un punto en el mapa.');
  coordinates(lat,lon);
  if(!name||name.length>160)throw new Error('El nombre debe tener entre 1 y 160 caracteres.');
  const description=String(input.description||'').trim();
  if(description.length>2000)throw new Error('Las notas no pueden superar 2000 caracteres.');
  const id=input.id||`local-${crypto.randomUUID()}`;
  if(!/^local-[\w-]{1,80}$/.test(id))throw new Error('Identificador local inválido.');
  return {id,name,lat,lon,description,local:true,public:false,localConfidence:'sin calibración',thresholds:input.thresholds||null};
}

export function readLocalSpots(storage) {
  try {
    const values=JSON.parse(storage.getItem(localSpotsKey)||'[]');
    if(!Array.isArray(values))return [];
    return values.flatMap(value=>{try{return value?.id?[localSpot(value)]:[];}catch{return [];}});
  } catch {return [];}
}

export function writeLocalSpots(storage,spots) {
  const validated=spots.map(localSpot);
  try {storage.setItem(localSpotsKey,JSON.stringify(validated));}
  catch {throw new Error('No se pudo guardar la ubicación en este navegador. Comprueba que el almacenamiento esté disponible.');}
  return validated;
}

export function mergeSpots(serverSpots,localSpots) {
  const serverIds=new Set(serverSpots.map(spot=>spot.id));
  return [...serverSpots,...localSpots.filter(spot=>!serverIds.has(spot.id))];
}

export function nearbySpot(candidate,spots) {
  return spots.find(spot=>spot.id!==candidate.id&&distanceKm([candidate.lat,candidate.lon],[spot.lat,spot.lon])<0.03)||null;
}
