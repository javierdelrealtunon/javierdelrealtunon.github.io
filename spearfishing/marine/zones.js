import {sheetCoordinate,defaultSheetUrl} from './forecast-store.js';
import {fishingForecasts} from './fishing-sites.js';
import {coordinates,distanceKm} from './core.js';

export const zoneRecordType='Ficha de zona';
export const zonePhotoType='Fotografía de zona';
const schema='spearfishing.zone.v1',photoSchema='spearfishing.zone-photo.v1';
export function photoURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function rowId(row){return String(row.registro_id||`legacy-${row.tipo}-${row.nombre}-${sheetCoordinate(row.lat,'lat')}-${sheetCoordinate(row.lng,'lon')}`);}
export function zoneElements(rows){return rows.filter(r=>['Sitio de pesca','Aparcamiento','Punto de entrada','Foto'].includes(r.tipo)).flatMap(r=>{
 const lat=sheetCoordinate(r.lat,'lat'),lon=sheetCoordinate(r.lng,'lon');return lat===null||lon===null?[]:[{id:rowId(r),name:String(r.nombre||r.tipo),type:r.tipo,lat,lon,notes:String(r.notas||''),author:String(r.autor||''),url:photoURL(r.foto_url)||photoURL(r.foto_thumb),thumb:photoURL(r.foto_thumb)}];
});}
export function insideRing(lat,lon,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const [y,x]=ring[i],[py,px]=ring[j];if((y>lat)!==(py>lat)&&lon<(px-x)*(lat-y)/(py-y)+x)inside=!inside;
}return inside;}
export function nearbyElements(zone,elements){return elements.filter(e=>e.id===zone.sourceRecordId||(zone.ring?.length?insideRing(e.lat,e.lon,zone.ring):distanceKm([zone.lat,zone.lon],[e.lat,e.lon])<=1));}
export function elementDistance(zone,element){
 if(zone.ring?.length&&insideRing(element.lat,element.lon,zone.ring))return 0;
 let distance=distanceKm([zone.lat,zone.lon],[element.lat,element.lon]);
 const scale=Math.cos(element.lat*Math.PI/180),ring=zone.ring||[];
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],x=(b[1]-a[1])*scale,y=b[0]-a[0],den=x*x+y*y;
  const t=den?Math.max(0,Math.min(1,((element.lon-a[1])*scale*x+(element.lat-a[0])*y)/den)):0;
  distance=Math.min(distance,distanceKm([element.lat,element.lon],[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]));
 }
 return distance;
}
// Discovery does not assign anything. Selected elements remain visible even when far away.
export function closestZoneElements(zone,elements,selectedIds=new Set(),limit=12){
 const ranked=elements.map(element=>({...element,distance:elementDistance(zone,element)})).sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
 const nearest=new Set(ranked.slice(0,limit).map(e=>e.id));return ranked.filter(e=>nearest.has(e.id)||selectedIds.has(e.id));
}
export function validateZone(input){
 coordinates(input.lat,input.lon);
 const text=(key,max,required=false)=>{const s=String(input[key]??'').trim();if(s.length>max||(required&&!s))throw Error(`Campo ${key} inválido (máximo ${max} caracteres).`);return s;};
 const id=text('id',80,true);if(!/^[\w-]+$/.test(id))throw Error('Identificador de zona inválido.');
 const photos=(input.photos||[]).map(p=>{const url=photoURL(p.url);if(!url||url.length>1500||!p.id||String(p.id).length>200||String(p.caption||'').length>300)throw Error('Fotografía inválida: usa una URL HTTPS y un texto de hasta 300 caracteres.');return {id:String(p.id),url,caption:String(p.caption||'').trim(),...(photoURL(p.thumb)?{thumb:photoURL(p.thumb)}:{})};});
 if(photos.length>24||new Set(photos.map(p=>p.id)).size!==photos.length)throw Error('La ficha admite hasta 24 fotografías diferentes.');
 if(input.elementIds!==null&&(!Array.isArray(input.elementIds)||input.elementIds.length>200||input.elementIds.some(x=>typeof x!=='string'||x.length>300)))throw Error('Lista de elementos inválida.');
 return {id,name:text('name',160,true),type:text('type',80,true),lat:input.lat,lon:input.lon,notes:text('notes',2000),author:text('author',160),coordinateSource:text('coordinateSource',160),photos,elementIds:input.elementIds===null?null:[...new Set(input.elementIds)]};
}
export function decodeZoneRows(rows){
 const records=new Map(),uploads=new Map();
 for(const row of rows){try{
  const data=JSON.parse(row.notas);
  if(row.tipo===zoneRecordType&&data.schema===schema){const zone=validateZone(data);if(typeof data.revision==='string'&&Number.isFinite(Date.parse(data.updatedAt)))records.set(zone.id,{...zone,revision:data.revision,updatedAt:data.updatedAt});}
  if(row.tipo===zonePhotoType&&data.schema===photoSchema&&/^[\w-]{1,80}$/.test(data.zoneId)&&(photoURL(row.foto_url)||photoURL(row.foto_thumb))){
   const photos=uploads.get(data.zoneId)||[];photos.push({id:row.registro_id,url:photoURL(row.foto_url)||photoURL(row.foto_thumb),thumb:photoURL(row.foto_thumb),caption:String(data.caption||'').slice(0,300)});uploads.set(data.zoneId,photos);
  }
 }catch{/* Original records and malformed events are never overwritten. */}}
 return {records,uploads};
}
export function buildZones(rows,templates,kml,decoded=decodeZoneRows(rows)){
 const siteForecasts=fishingForecasts(rows);
 const bases=[...templates.map(s=>{const index=Number(s.originalId?.split(':')[1]),source=kml[index]||{},name=source.name&&!/sin t[ií]tulo|untitled/i.test(source.name)?source.name:s.name.replace(/ — Previsión$/,'');return {id:s.id,name,type:'Sitio de pesca',lat:s.lat,lon:s.lon,notes:source.notes||'',author:'',coordinateSource:'KML',sourceRecordId:null,sourceRef:s.sourceRefs?.[0],ring:source.ring||[],forecast:s,photos:[],elementIds:null,revision:null};}),
 ...siteForecasts.map(s=>{const row=rows.find(r=>r.tipo==='Sitio de pesca'&&fishingForecasts([r])[0]?.id===s.id);return {id:s.id,name:String(row.nombre||'Sitio de pesca'),type:row.tipo,lat:s.lat,lon:s.lon,notes:String(row.notas||''),author:String(row.autor||''),coordinateSource:String(row.coord_origen||''),sourceRecordId:rowId(row),sourceRef:s.sourceRefs?.[0],ring:[],forecast:s,photos:(photoURL(row.foto_url)||photoURL(row.foto_thumb))?[{id:`original-${rowId(row)}`,url:photoURL(row.foto_url)||photoURL(row.foto_thumb),thumb:photoURL(row.foto_thumb),caption:String(row.notas||'').slice(0,300)}]:[],elementIds:null,revision:null};})];
 return bases.map(base=>{const overlay=decoded.records.get(base.id),zone={...base,...overlay};
  const photos=new Map([...base.photos,...(decoded.uploads.get(base.id)||[]),...(overlay?.photos||[])].map(p=>[p.id,p]));return {...zone,photos:[...photos.values()]};
 }).sort((a,b)=>a.name.localeCompare(b.name,'es',{numeric:true}));
}
export function zoneForecastRows(run,hours,now=Date.now()){
 if(!Number.isFinite(hours)||hours<2||hours>168)throw Error('El intervalo debe estar entre 2 y 168 horas.');
 const start=Math.floor(now/3600000)*3600000;return (run?.rows||[]).filter(r=>Date.parse(r.time)>=start&&Date.parse(r.time)<=start+hours*3600000);
}

export class ZoneStore{
 constructor({sheetUrl=defaultSheetUrl,fetcher=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){this.url=sheetUrl;this.fetcher=fetcher.bind(globalThis);this.sleep=sleep;}
 async load(){const response=await this.fetcher(this.url,{cache:'no-store',signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error(`Base de zonas HTTP ${response.status}`);const rows=await response.json();if(!Array.isArray(rows))throw Error('Respuesta de zonas inválida.');return {rows,...decodeZoneRows(rows)};}
 async write(parameters){const url=`${this.url}?${new URLSearchParams({action:'write',...parameters})}`;if(url.length>28000)throw Error('La ficha es demasiado grande. Reduce los textos o los enlaces de fotografías.');const r=await this.fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Guardado HTTP ${r.status}`);const b=await r.json();if(b.ok!==true)throw Error(b.error||'La base no confirmó el guardado.');}
 async save(input,{baseRevision=null,publicConsent=false}={}){
  const zone=validateZone(input);if(!publicConsent)throw Error('Confirma que quieres compartir los cambios en este visor.');
  const current=(await this.load()).records.get(zone.id);if((current?.revision||null)!==baseRevision)throw Error('Otra sesión ha editado esta zona. Tus cambios siguen en el formulario; recarga la ficha antes de guardar una nueva versión.');
  const revision=crypto.randomUUID();await this.write({registro_id:`zone-event-${revision}`,tipo:zoneRecordType,nombre:/^[=+@-]/.test(zone.name)?"'"+zone.name:zone.name,lat:String(zone.lat).replace('.',','),lng:String(zone.lon).replace('.',','),notas:JSON.stringify({schema,...zone,revision,updatedAt:new Date().toISOString()}),autor:'Spearfishing / Zonas',foto_url:'',coord_origen:zone.coordinateSource});
  for(let i=0;i<3;i++){if(i)await this.sleep(600*i);const snapshot=await this.load();if(snapshot.records.get(zone.id)?.revision===revision)return snapshot;}
  throw Error('Guardado aceptado, pero la lectura aún no está verificada. Recarga la ficha para comprobarlo antes de repetir.');
 }
 async upload(zone,{dataUrl,caption='',publicConsent=false}={}){
  if(!publicConsent)throw Error('Confirma que quieres compartir la fotografía en este visor.');
  if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)||dataUrl.length>5e6||caption.length>300)throw Error('Fotografía o texto no válidos.');
  const id=`zone-photo-${crypto.randomUUID()}`;await this.write({registro_id:id,tipo:zonePhotoType,nombre:'Fotografía de zona',lat:String(zone.lat).replace('.',','),lng:String(zone.lon).replace('.',','),notas:JSON.stringify({schema:photoSchema,zoneId:zone.id,caption}),autor:'Spearfishing / Zonas',foto_url:'',coord_origen:'aportación a ficha de zona'});
  await this.fetcher(this.url,{method:'POST',mode:'no-cors',body:new URLSearchParams({action:'attach_photo',registro_id:id,foto_nombre:`${id}.jpg`,foto_tipo:'image/jpeg',foto_base64:dataUrl.split(',')[1]}),signal:AbortSignal.timeout(60000)});
  for(let i=0;i<4;i++){if(i)await this.sleep(1000*i);const snapshot=await this.load();const photo=snapshot.uploads.get(zone.id)?.find(p=>p.id===id);if(photo)return photo;}
  throw Error('Fotografía enviada, todavía sin URL verificable. Recarga la ficha más tarde antes de repetir la subida.');
 }
}
