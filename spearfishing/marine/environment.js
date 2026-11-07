import {finite} from './core.js';
export const environmentVariables=[
 {key:'airTemp',label:'Aire · 2 m',unit:'°C',description:'Temperatura del aire a 2 m sobre el suelo'},
 {key:'sst',label:'Agua · superficie',unit:'°C',description:'Temperatura superficial del mar; no es la temperatura a profundidad de inmersión'},
 {key:'rain',label:'Precipitación',unit:'mm',description:'Precipitación total acumulada en la hora anterior, incluida nieve equivalente'},
 {key:'pressure',label:'Presión · nivel del mar',unit:'hPa',description:'Presión atmosférica reducida al nivel medio del mar'}
];
export function environmentalValue(value,unit,kind){
 if(!finite(value))return null;
 const u=String(unit||'').toLowerCase();
 if(kind==='temperature')return ['','°c','celsius','degc'].includes(u)?value:['°f','fahrenheit','degf'].includes(u)?(value-32)*5/9:null;
 if(kind==='pressure')return ['','hpa','mbar'].includes(u)?value:u==='pa'?value/100:u==='kpa'?value*10:null;
 if(kind==='precipitation')return ['','mm'].includes(u)?value:['inch','in'].includes(u)?value*25.4:null;
 return null;
}
export function environmentSummary(rows){return environmentVariables.map(v=>({...v,value:rows[0]?.[v.key]??null,count:rows.filter(r=>finite(r[v.key])).length,total:rows.length}));}
