import {finite,fresh} from './core.js';
export const defaults=Object.freeze({hs:0.8,wind:5,gust:8,current:0.2,period:14,daylight:true,minHours:3,critical:['hs','wind','gust','current','period'],weights:{hs:4,wind:2,gust:1,current:3,period:1}});
export function validateThresholds(input={}){
  const r={...defaults,...input,weights:{...defaults.weights,...input.weights}};
  for(const key of ['hs','wind','gust','current','period','minHours']) if(!finite(r[key])||r[key]<=0||r[key]>({minHours:24,hs:20,wind:100,gust:150,current:10,period:40}[key])) throw new Error(`Umbral inválido: ${key}`);
  if(typeof r.daylight!=='boolean' || Object.keys(r.weights).some(k=>!['hs','wind','gust','current','period'].includes(k)) || Object.values(r.weights).some(v=>!finite(v)||v<0) || !Object.values(r.weights).some(v=>v>0)) throw new Error('Pesos o luz diurna inválidos');
  if(!Array.isArray(r.critical)||r.critical.some(k=>!['hs','wind','gust','current','period'].includes(k)))throw new Error('Restricciones críticas inválidas');
  return r;
}
export function evaluate(row,rules=defaults,{valid=true}={}){
  const reasons=[],critical=[],missing=[];let score=0,total=0;
  for(const key of ['hs','wind','gust','current','period']){
    const value=key==='period'?row.tp??row.tm:row[key];
    if(!finite(value)){missing.push(key);continue;}
    if(value<0){missing.push(key);continue;}
    const passed=value<=rules[key];
    reasons.push({variable:key,value,limit:rules[key],passed});
    if(!passed && rules.critical.includes(key)) critical.push(key);
    score+=rules.weights[key]*Math.max(0,100*(1-value/(2*rules[key])));total+=rules.weights[key];
  }
  if(rules.daylight && row.day!==1){if(row.day===0)critical.push('noche');else missing.push('luz diurna');}
  if(!valid) missing.push('datos caducados');
  const status=missing.length?'unknown':critical.length?'unfavorable':reasons.some(r=>!r.passed)?'intermediate':'favorable';
  return {score:missing.length?null:Math.round(score/total),status,critical,missing,reasons,quality:missing.length?'insuficiente':'regional; ajuste local no validado'};
}
export function favorableWindows(rows,rules=defaults,{now=Date.now(),hours=72,valid=true}={}){
  const windows=[];let group=[];
  const flush=()=>{if(group.length>=rules.minHours) windows.push({start:group[0].time,end:new Date(Date.parse(group.at(-1).time)+3600000).toISOString(),hours:group.length,score:Math.round(group.reduce((s,r)=>s+evaluate(r,rules,{valid}).score,0)/group.length),rows:group});group=[];};
  for(const row of rows){
    const time=Date.parse(row.time);
    // Each row represents the interval starting at its timestamp. Never count gaps.
    if(time<now || time>=now+hours*3600000 || evaluate(row,rules,{valid}).status!=='favorable'){flush();continue;}
    if(group.length && time-Date.parse(group.at(-1).time)!==3600000) flush();
    group.push(row);
  }flush();return windows;
}
export function assess(run,rules=defaults,options={}){
  const valid=fresh(run,options.now??Date.now());
  return {valid,windows:favorableWindows(run.rows,rules,{...options,valid})};
}
