import {jsonFetch} from './providers.js';
import {distanceKm,finite} from './core.js';
// WAM native times are irregular. Preserve them; never snap them to an hour.
export async function getRegionalWave(spot,{fetcher=fetch,now=Date.now()}={}){
  const base='https://www.euskoos.eus/erddap/';
  const meta=await jsonFetch(base+'info/EuskalmetWAMBasqueCoast/index.json',fetcher);
  const attr=(name)=>meta.table.rows.find(r=>r[1]==='NC_GLOBAL'&&r[2]===name)?.[4];
  const end=Date.parse(attr('time_coverage_end')),start=Date.parse(attr('time_coverage_start'));
  if(end<now+6*3600000 || start<now-48*3600000 || start>now+6*3600000) throw new Error('WAM sin cobertura actual verificable');
  // Try nearest cell, then progressively offshore cells, preserving chosen coordinates.
  for(const offset of [0,0.02,0.04]){
    const vars=['hs','tp','tm','sd','ws','wd'];
    const query=vars.map(v=>`${v}[0:1:last][0][(${spot.lat+offset})][(${spot.lon})]`).join(',');
    const b=await jsonFetch(base+'griddap/EuskalmetWAMBasqueCoast.json?'+query,fetcher);
    const names=b.table.columnNames,idx=k=>names.indexOf(k);
    const rows=b.table.rows.map(r=>({time:r[idx('time')],hs:r[idx('hs')],tp:r[idx('tp')],tm:r[idx('tm')],waveDirection:r[idx('sd')],wind:finite(r[idx('ws')])?r[idx('ws')]/3.6:null,windDirection:r[idx('wd')]}));
    if(!rows.some(r=>finite(r.hs)&&Date.parse(r.time)>=now))continue;
    if(b.table.columnUnits[idx('hs')]!=='m'||b.table.columnUnits[idx('tp')]!=='s')throw new Error('Unidades WAM inesperadas');
    const r=b.table.rows[0],lat=r[idx('latitude')],lon=r[idx('longitude')];
    return {provider:'EuskOOS / Euskalmet-AZTI',model:'EuskalmetWAMBasqueCoast',kind:'wave',runCycle:null,generatedAt:null,coverageStart:attr('time_coverage_start'),coverageEnd:attr('time_coverage_end'),downloadedAt:new Date(now).toISOString(),cell:{lat,lon,distanceKm:distanceKm([spot.lat,spot.lon],[lat,lon]),selection:'nearest valid wave cell; northward search ≤0.04°',verifiedWater:'valid model wave mask'},nativeResolution:'0.02° (~2 km); tiempos nativos irregulares ~1 h',outputResolution:'tiempos nativos',temporallyInterpolated:false,rows};
  }
  throw new Error('WAM: celdas sin oleaje válido');
}
