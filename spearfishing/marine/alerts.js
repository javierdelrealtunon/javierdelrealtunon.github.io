import {assess,evaluate,validateThresholds} from './conditions.js';
export function alertDecision(run,configuration,previous=null,now=Date.now()){
 const rules=validateThresholds(configuration.thresholds),hours=configuration.hours||48,result=assess(run,rules,{now,hours});
 const rows=run.rows.filter(r=>Date.parse(r.time)>=now&&Date.parse(r.time)<now+hours*3600000);
 const evaluations=rows.map(r=>evaluate(r,rules,{valid:result.valid}));
 const complete=result.valid&&evaluations.length>0&&evaluations.every(e=>e.status!=='unknown');
 const current=evaluations[0],type=configuration.type||'opportunity';
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
 const date=`${p.year}-${p.month}-${p.day}`,scheduled=Number(p.hour)>=Number(configuration.preferredHour??9)&&Number(p.hour)<Number(configuration.preferredHour??9)+3;
 let candidate=result.windows[0]||null,fingerprint=candidate?'opportunity:'+candidate.start.slice(0,13):null;
 if(type==='daily'||type==='weekly'){
  const due=scheduled&&(type==='daily'||p.weekday==='Mon');
  candidate=complete&&due?{start:rows[0].time,end:new Date(Date.parse(rows.at(-1).time)+3600000).toISOString(),hours:rows.length,score:Math.round(evaluations.reduce((s,e)=>s+e.score,0)/evaluations.length),rows,type}:null;
  fingerprint=`${type}:${date}`;
 }
 if(type==='deterioration'){
  const drop=(previous?.score??0)-(current?.score??0),criticalNew=current?.critical.some(k=>!previous?.critical?.includes(k));
  candidate=complete&&Number.isFinite(previous?.score)&&(drop>=15||criticalNew)?{start:rows[0].time,end:new Date(Date.parse(rows[0].time)+3600000).toISOString(),hours:1,score:current.score,rows:[rows[0]],type}:null;
  fingerprint=`deterioration:${date}:${current?.critical.join('-')}`;
 }
 return {valid:result.valid,windows:result.windows,candidate,fingerprint,summary:{valid:result.valid,score:current?.score??null,status:current?.status??'unknown',critical:current?.critical||[],windows:result.windows.map(({rows,...w})=>w)}};
}
