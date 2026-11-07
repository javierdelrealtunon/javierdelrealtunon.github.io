import {coordinates,finite} from './core.js';

export const forecastRecordType='Ubicación de previsión';
const schema='spearfishing.forecast.v1';
const defaultSheetUrl='https://script.google.com/macros/s/AKfycbwM4miDG1ERYgKh3Sz5yUKWmvzULRhHsJZeCzqbRufDjamiUQiIBQs5zGgSbW8PwrkMqA/exec';

export function sheetCoordinate(value,axis){
 if(value==null||String(value).trim()==='')return null;
 let text=String(value).trim();
 if(text.includes(',')&&text.includes('.'))text=text.replace(/\./g,'').replace(',','.');
 else if(text.includes(','))text=text.replace(',','.');
 else if(text.split('.').length>2){const parts=text.split('.');text=parts.shift()+'.'+parts.join('');}
 let number=Number(text),limit=axis==='lat'?90:180;
 if(!finite(number))return null;
 // Older Sheet rows contain integer microdegrees (e.g. 43321436, -3032386).
 if(Math.abs(number)>limit&&Number.isInteger(number)&&Math.abs(number)>=1000)number/=1e6;
 return Math.abs(number)<=limit?number:null;
}

export function validateForecastSpot(input){
 coordinates(input.lat,input.lon);
 const id=String(input.id||''),name=String(input.name||'').trim();
 if(!/^[\w-]{1,80}$/.test(id)||!name||name.length>160)throw new Error('Identificador o nombre de ubicación inválidos.');
 const description=String(input.description||'').trim();
 if(description.length>2000)throw new Error('Las notas no pueden superar 2000 caracteres.');
 return {id,name,lat:input.lat,lon:input.lon,description,public:input.public===true,local:false,
  sourceRefs:Array.isArray(input.sourceRefs)?input.sourceRefs.filter(x=>typeof x==='string').slice(0,16):[],
  originalSource:input.originalSource||null,originalId:input.originalId||null,
  localConfidence:input.localConfidence||'sin calibración',thresholds:input.thresholds||null,
  pointMethod:input.pointMethod||'selección manual',generated:input.generated===true};
}

export function decodeForecastRows(rows){
 const records=new Map();
 // The existing Apps Script returns rows in append order. Later events supersede
 // earlier ones, so edits/deletions never alter a fishing/photo/access record.
 for(const row of rows){
  if(row.tipo!==forecastRecordType)continue;
  try{
   const metadata=JSON.parse(row.notas);
   if(metadata.schema!==schema)continue;
   const spot=validateForecastSpot({...metadata,lat:sheetCoordinate(row.lat,'lat'),lon:sheetCoordinate(row.lng,'lon')});
   if(!spot.public)continue; // A public Sheet must never contain private locations.
   records.set(spot.id,{...spot,database:'sheets',deleted:metadata.deleted===true,revision:metadata.revision,eventId:row.registro_id,updatedAt:row.fecha||metadata.updatedAt});
  }catch{ /* Ignore invalid forecast events, without changing any original row. */ }
 }
 return [...records.values()];
}

export class ForecastStore {
 constructor({sheetUrl=defaultSheetUrl,fetcher=fetch,api=null,mode='sheets',sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  this.sheetUrl=sheetUrl;this.fetcher=fetcher.bind(globalThis);this.api=api;this.mode=mode;this.sleep=sleep;
 }
 async load(){
  if(this.mode==='worker'){
   const spots=await this.api('/spots',{auth:false});return {spots:spots.map(s=>({...s,database:'d1',local:false})),records:spots,rows:[]};
  }
  const response=await this.fetcher(this.sheetUrl,{cache:'no-store',signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error(`Base compartida HTTP ${response.status}`);
  const rows=await response.json();if(!Array.isArray(rows))throw new Error('La base compartida no devolvió un listado válido.');
  const records=decodeForecastRows(rows);return {spots:records.filter(s=>!s.deleted),records,rows};
 }
 async save(input,{deleted=false}={}){
  const spot=validateForecastSpot(input);
  if(this.mode==='worker'){
   await this.api('/admin/spots',{method:deleted?'DELETE':'POST',data:deleted?{id:spot.id}:spot});
   return {...spot,database:'d1',deleted};
  }
  if(!spot.public)throw new Error('Activa «Compartir ubicación en este visor» para guardarla en la base compartida. Las ubicaciones privadas necesitan el backend autenticado.');
  const revision=crypto.randomUUID(),eventId=`forecast-event-${revision}`;
  const metadata={schema,...spot,revision,deleted,updatedAt:new Date().toISOString()};
  const safeName=/^[=+@-]/.test(spot.name)?"'"+spot.name:spot.name;
  const parameters=new URLSearchParams({action:'write',registro_id:eventId,nombre:safeName,tipo:forecastRecordType,
   lat:String(spot.lat).replace('.',','),lng:String(spot.lon).replace('.',','),notas:JSON.stringify(metadata),autor:'Spearfishing Forecast',foto_url:'',coord_origen:spot.pointMethod});
  const response=await this.fetcher(`${this.sheetUrl}?${parameters}`,{cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`No se pudo guardar la ubicación: HTTP ${response.status}`);
  const result=await response.json();if(result.ok!==true)throw new Error(result.error||'La base no confirmó el guardado.');
  for(let attempt=0;attempt<3;attempt++){
   if(attempt)await this.sleep(600*attempt);
   const snapshot=await this.load();
   const stored=snapshot.records.find(s=>s.id===spot.id&&s.revision===revision&&s.deleted===deleted);
   if(stored)return stored;
  }
  throw new Error('La base aceptó el guardado, pero todavía no se ha podido verificar su lectura. Actualiza el listado antes de volver a guardar.');
 }
 async remove(spot){return this.save(spot,{deleted:true});}
}
