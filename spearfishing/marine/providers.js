import {coordinates,distanceKm,finite,iso,speedMS,toUV} from './core.js';
export const marineVariables=['wave_height','wave_direction','wave_period','wave_peak_period','wind_wave_height','wind_wave_direction','wind_wave_period','swell_wave_height','swell_wave_direction','swell_wave_period','swell_wave_peak_period','secondary_swell_wave_height','secondary_swell_wave_direction','secondary_swell_wave_period'];
export const oceanVariables=['ocean_current_velocity','ocean_current_direction','sea_level_height_msl','sea_surface_temperature'];
const weatherVariables=['wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','is_day'];
export async function jsonFetch(url,fetcher=fetch) {
  const response=await fetcher(url,{signal:AbortSignal.timeout(20000),cache:'no-store'});
  if(!response.ok) throw new Error(`Proveedor HTTP ${response.status}`);
  const body=await response.json();
  if(body.error) throw new Error(body.reason || 'Error del proveedor');
  return body;
}
function url(base,spot,vars,extra={}) {
  const q=new URLSearchParams({latitude:spot.lat,longitude:spot.lon,hourly:vars.join(','),timezone:'UTC',timeformat:'unixtime',forecast_days:'7',...extra});
  return `${base}?${q}`;
}
export function normalize(body,kind,spot,downloadedAt,model) {
  if(!body.hourly || !Array.isArray(body.hourly.time) || !body.hourly.time.length) throw new Error('Serie horaria ausente');
  coordinates(body.latitude,body.longitude);
  const fields=kind==='weather'?weatherVariables:kind==='ocean'?oceanVariables:marineVariables;
  for(const key of fields) if(body.hourly[key] && body.hourly[key].length!==body.hourly.time.length) throw new Error(`Longitud incoherente: ${key}`);
  const value=(key,i)=>finite(body.hourly[key]?.[i])?body.hourly[key][i]:null;
  const rows=body.hourly.time.map((t,i)=>{
    if(!finite(t)) throw new Error('Tiempo UTC no válido');
    const row={time:iso(t*1000)};
    const names={wave_height:'hs',wave_direction:'waveDirection',wave_period:'tm',wave_peak_period:'tp',wind_wave_height:'windWave',wind_wave_direction:'windWaveDirection',wind_wave_period:'windWavePeriod',swell_wave_height:'swell',swell_wave_direction:'swellDirection',swell_wave_period:'swellPeriod',swell_wave_peak_period:'swellPeakPeriod',secondary_swell_wave_height:'secondarySwell',secondary_swell_wave_direction:'secondarySwellDirection',secondary_swell_wave_period:'secondarySwellPeriod',wind_direction_10m:'windDirection',precipitation:'rain',is_day:'day',ocean_current_direction:'currentDirection',sea_level_height_msl:'level',sea_surface_temperature:'sst'};
    for(const key of fields) {
      if(key==='ocean_current_velocity') row.current=speedMS(value(key,i),body.hourly_units?.[key]);
      else if(key==='wind_speed_10m') row.wind=speedMS(value(key,i),body.hourly_units?.[key]);
      else if(key==='wind_gusts_10m') row.gust=speedMS(value(key,i),body.hourly_units?.[key]);
      else row[names[key]]=value(key,i);
    }
    if(kind==='ocean') Object.assign(row,toUV(row.current,row.currentDirection));
    return row;
  });
  for(let i=1;i<rows.length;i++) if(rows[i].time<=rows[i-1].time) throw new Error('Tiempo duplicado o desordenado');
  if(!rows.some(r=>Object.entries(r).some(([k,v])=>k!=='time' && finite(v)))) throw new Error('Celda sin datos; posible máscara terrestre');
  return {provider:'Open-Meteo',model,kind,runCycle:null,generatedAt:null,downloadedAt,cell:{lat:body.latitude,lon:body.longitude,distanceKm:distanceKm([spot.lat,spot.lon],[body.latitude,body.longitude]),selection:kind==='weather'?'land':'sea',verifiedWater:null},nativeResolution:kind==='ocean'?'~8 km / 1 h (SST 6 h)':kind==='wave'?'~8 km / 3 h':'best_match: resolución variable; ciclo no publicado',outputResolution:'1 h',temporallyInterpolated:kind==='wave',units:body.hourly_units,rows};
}
export async function getForecast(spot,{fetcher=fetch,now=Date.now(),waveModel='meteofrance_wave'}={}) {
  coordinates(spot.lat,spot.lon);
  const downloadedAt=iso(now);
  const specs=[['wave',url('https://marine-api.open-meteo.com/v1/marine',spot,marineVariables,{cell_selection:'sea',models:waveModel}),waveModel],['ocean',url('https://marine-api.open-meteo.com/v1/marine',spot,oceanVariables,{cell_selection:'sea',models:'meteofrance_currents'}),'meteofrance_currents / SMOC'],['weather',url('https://api.open-meteo.com/v1/forecast',spot,weatherVariables,{wind_speed_unit:'ms'}),'best_match']];
  const results=await Promise.allSettled(specs.map(async ([kind,u,model])=>normalize(await jsonFetch(u,fetcher),kind,spot,downloadedAt,model)));
  const sources=[],errors=[];
  results.forEach((r,i)=>r.status==='fulfilled'?sources.push(r.value):errors.push({kind:specs[i][0],message:r.reason.message}));
  if(!sources.length) throw new Error(errors.map(x=>`${x.kind}: ${x.message}`).join('; '));
  const byTime=new Map();
  for(const source of sources) for(const row of source.rows) byTime.set(row.time,{...byTime.get(row.time),...row});
  return {spotId:spot.id,downloadedAt,sources:sources.map(({rows,...meta})=>meta),errors,rows:[...byTime.values()].sort((a,b)=>a.time.localeCompare(b.time)),quality:errors.length?'partial':'regional',notes:['Consulta real; el ciclo de modelo no se publica en esta respuesta.','Serie de oleaje horaria interpolada desde 3 h; no es una simulación horaria independiente.','SMOC no resuelve corrientes del canal de Urdaibai. Nivel referido a MSL, no a cero hidrográfico.']};
}
// Independent provider contract: return the same normalized source object as normalize().
// Regional ERDDAP adapters must pass metadata/freshness/unit validation before selection.
export const providerRegistry=[
  {id:'open-meteo',status:'implemented',url:'https://open-meteo.com/en/docs/marine-weather-api'},
  {id:'euskoos-wam',status:'implemented-comparison; native irregular times',url:'https://www.euskoos.eus/erddap/info/EuskalmetWAMBasqueCoast/index.json'},
  {id:'copernicus-ibi',status:'requires-dataset-access',url:'https://data.marine.copernicus.eu/'},
  {id:'puertos',status:'requires-documented-interface',url:'https://portuscopia.puertos.es/'}
];
