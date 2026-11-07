import {sheetCoordinate} from './forecast-store.js';

function hash(text){let value=2166136261;for(const character of text){value^=character.charCodeAt(0);value=Math.imul(value,16777619);}return (value>>>0).toString(16).padStart(8,'0');}
export function fishingForecasts(rows){
 return rows.filter(row=>row.tipo==='Sitio de pesca').flatMap(row=>{
  const lat=sheetCoordinate(row.lat,'lat'),lon=sheetCoordinate(row.lng,'lon');if(lat===null||lon===null)return [];
  const name=String(row.nombre||'Sitio de pesca').trim();
  const reference=row.registro_id||`legacy-${hash(`${name}|${lat}|${lon}`)}`;
  return [{id:`forecast-sheet-${hash(reference)}`,name:`${name} — Previsión`,lat,lon,public:true,local:false,generated:true,
   description:'Previsión regional asociada a la ficha de pesca existente. Conserva sus coordenadas originales; verificar el punto antes de utilizarlo.',
   sourceRefs:[`sheets:${reference}`],originalSource:'Google Sheets / Sitio de pesca',originalId:reference,
   pointMethod:'coordenadas de la ficha de pesca',localConfidence:'sin calibración',thresholds:null}];
 });
}

export async function seedFishingForecasts(store,kmlSpots,{onProgress=()=>{}}={}){
 const snapshot=await store.load(),known=new Set(snapshot.records.map(s=>s.id));
 const candidates=[...kmlSpots,...fishingForecasts(snapshot.rows)];
 let created=0;
 for(const candidate of candidates){
  if(known.has(candidate.id))continue;
  await store.save(candidate);known.add(candidate.id);created++;onProgress({created,name:candidate.name});
 }
 return {created,total:candidates.length,sheetSites:fishingForecasts(snapshot.rows).length,kmlSites:kmlSpots.length};
}
