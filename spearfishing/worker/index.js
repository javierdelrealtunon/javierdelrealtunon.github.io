import {getForecast,providerRegistry} from '../marine/providers.js';
import {getRegionalWave} from '../marine/regional.js';
import {validateThresholds,defaults,assess} from '../marine/conditions.js';
import {alertDecision} from '../marine/alerts.js';
import {coordinates,fresh} from '../marine/core.js';
import {mailPayload,sendMail,escapeHTML} from './mail.js';
import pilot from '../data/spots.json' with {type:'json'};
const uid=()=>crypto.randomUUID(), stamp=()=>new Date().toISOString();
const query=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const all=async(env,sql,...args)=>(await query(env,sql,...args).all()).results;
const parseSpot=r=>({...JSON.parse(r.data),id:r.id,name:r.name,lat:r.lat,lon:r.lon,public:!!r.public});
export async function authorized(request,env){
 if(!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length<32)return false;
 const actual=request.headers.get('Authorization')||'';
 const digest=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([digest(actual),digest(`Bearer ${env.ADMIN_TOKEN}`)]);
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function body(request){
 if(Number(request.headers.get('content-length'))>65536)throw new Error('Petición demasiado grande');
 const text=await request.text();if(text.length>65536)throw new Error('Petición demasiado grande');
 return JSON.parse(text);
}
async function audit(env,action,id){await query(env,'INSERT INTO audit_log VALUES(?,?,?,?)',uid(),stamp(),action,id).run();}
export async function ensurePilot(env){
 const s=pilot[0];await query(env,'INSERT OR IGNORE INTO spots(id,name,lat,lon,public,data) VALUES(?,?,?,?,?,?)',s.id,s.name,s.lat,s.lon,1,JSON.stringify(s)).run();
}
async function forecast(env,spot,force=false){
 const last=await query(env,'SELECT * FROM forecast_runs WHERE spot_id=? ORDER BY downloaded_at DESC LIMIT 1',spot.id).first();
 if(!force && last && Date.parse(last.downloaded_at)>Date.now()-3*3600000){const run=JSON.parse(last.payload);if(fresh(run))return run;}
 const run=await getForecast(spot);
 try{const regional=await getRegionalWave(spot);run.comparison=regional;run.notes.push('Comparación WAM en tiempos nativos; no fusionada con la serie Open-Meteo.');}catch(e){run.errors.push({kind:'regional-wave',message:e.message});}
 const id=uid();await query(env,'INSERT INTO forecast_runs VALUES(?,?,?,?,?)',id,spot.id,run.downloadedAt,new Date(Date.parse(run.downloadedAt)+6*3600000).toISOString(),JSON.stringify(run)).run();
 await query(env,'INSERT INTO forecast_quality VALUES(?,?)',id,JSON.stringify({quality:run.quality,errors:run.errors})).run();
 const groups={wave:['hs','tm','tp','waveDirection','windWave','windWaveDirection','windWavePeriod','swell','swellDirection','swellPeriod','swellPeakPeriod','secondarySwell','secondarySwellDirection','secondarySwellPeriod'],weather:['wind','gust','windDirection','rain','day'],ocean:['current','currentDirection','level','sst','u','v']};
 for(const source of run.sources){
  const fields=groups[source.kind];
  await query(env,`INSERT INTO forecast_values SELECT ?,json_extract(r.value,'$.time'),v.key,CASE WHEN v.type IN ('integer','real') THEN v.value ELSE NULL END,CASE WHEN v.key IN ('wind','gust','current','u','v') THEN 'm/s' WHEN v.key LIKE '%Direction' THEN 'degree' WHEN v.key IN ('tm','tp','windWavePeriod','swellPeriod','swellPeakPeriod','secondarySwellPeriod') THEN 's' WHEN v.key='sst' THEN 'degC' WHEN v.key='day' THEN 'boolean' WHEN v.key='rain' THEN 'mm' ELSE 'm' END,? FROM json_each(?,'$.rows') r,json_each(r.value) v WHERE v.key IN (SELECT value FROM json_each(?))`,id,source.provider+' / '+source.model,JSON.stringify(run),JSON.stringify(fields)).run();
 }
 await query(env,`INSERT INTO local_estimates SELECT ?,json_extract(value,'$.time'),'regional-only',json_object('regionalHs',json_extract(value,'$.hs'),'localHs',NULL,'calibrated',0) FROM json_each(?,'$.rows')`,id,JSON.stringify(run)).run();
 // Retain seven days. Full normalized payload carries per-source provenance.
 await query(env,"DELETE FROM forecast_runs WHERE downloaded_at < datetime('now','-7 days')").run();
 return run;
}
export function alertFingerprint(window,type='opportunity') {return `${type}:${window.start.slice(0,13)}`;}
export async function dispatchQueue(env){
 const deliveries=await all(env,"SELECT d.*,s.status AS subscriber_status FROM alert_deliveries d JOIN subscribers s ON s.id=d.subscriber_id WHERE d.status IN ('pending','retry') AND d.attempts<3 AND (d.next_attempt IS NULL OR d.next_attempt<=?) LIMIT 30",stamp());
 for(const d of deliveries){
  if(d.subscriber_status!=='active'){await query(env,"UPDATE alert_deliveries SET status='cancelled' WHERE id=?",d.id).run();continue;}
  // Compare-and-set prevents concurrent cron/manual workers claiming the same attempt.
  const claim=await query(env,"UPDATE alert_deliveries SET status='sending',attempts=attempts+1,next_attempt=? WHERE id=? AND status IN ('pending','retry') AND attempts=?",new Date(Date.now()+300000).toISOString(),d.id,d.attempts).run();
  if(!claim.meta.changes)continue;
  try{const id=await sendMail(env,JSON.parse(d.payload),d.id);await query(env,"UPDATE alert_deliveries SET status='accepted',provider_id=?,error=NULL WHERE id=?",id,d.id).run();}
  catch(e){await query(env,'UPDATE alert_deliveries SET status=?,error=?,next_attempt=? WHERE id=?',d.attempts>=2?'failed':'retry',e.message,new Date(Date.now()+Math.pow(3,d.attempts+1)*60000).toISOString(),d.id).run();}
 }
}
export async function runAlerts(env){
 await ensurePilot(env);
 const lock=await query(env,"INSERT INTO job_locks VALUES('alerts',?) ON CONFLICT(id) DO UPDATE SET expires_at=excluded.expires_at WHERE job_locks.expires_at<?",new Date(Date.now()+20*60000).toISOString(),stamp()).run();
 if(!lock.meta.changes)return {status:'already-running'};
 try{
  await query(env,"UPDATE alert_deliveries SET status='retry' WHERE status='sending' AND next_attempt<? AND attempts<3",stamp()).run();
  await query(env,"UPDATE alert_deliveries SET status='failed',error='Último intento interrumpido; comprobar proveedor' WHERE status='sending' AND next_attempt<? AND attempts>=3",stamp()).run();
  const rules=await all(env,'SELECT a.*,s.data,s.name,s.lat,s.lon,s.public FROM alert_rules a JOIN spots s ON s.id=a.spot_id WHERE a.enabled=1 AND s.deleted_at IS NULL');
  const runs=new Map();
  for(const rule of rules){
   try{
    const spot={...JSON.parse(rule.data),id:rule.spot_id,name:rule.name,lat:rule.lat,lon:rule.lon};
    if(!runs.has(spot.id))runs.set(spot.id,await forecast(env,spot));
    const run=runs.get(spot.id),configuration=JSON.parse(rule.configuration);
    const prior=await query(env,'SELECT result FROM alert_evaluations WHERE rule_id=? ORDER BY evaluated_at DESC LIMIT 1',rule.id).first();
    const result=alertDecision(run,configuration,prior?JSON.parse(prior.result):null);
    await query(env,'INSERT INTO alert_evaluations VALUES(?,?,?,?)',uid(),rule.id,stamp(),JSON.stringify(result.summary)).run();
    const window=result.candidate;if(!result.valid||!window)continue;
    const fingerprint=result.fingerprint;
    if(rule.last_fingerprint===fingerprint || Date.now()-Date.parse(rule.last_sent_at||'1970-01-01')<(configuration.cooldownHours||24)*3600000)continue;
    const subscribers=await all(env,"SELECT * FROM subscribers WHERE list_id=? AND status='active'",rule.list_id);
    const statements=subscribers.map(s=>{
     const url=new URL('/unsubscribe',env.WORKER_URL);url.searchParams.set('token',s.unsubscribe_token);
     const payload={to:[s.email],...mailPayload({spot,window,run,unsubscribeUrl:url.href,appUrl:env.PUBLIC_APP_URL})};
     return query(env,'INSERT OR IGNORE INTO alert_deliveries(id,rule_id,subscriber_id,fingerprint,payload,created_at) VALUES(?,?,?,?,?,?)',uid(),rule.id,s.id,fingerprint,JSON.stringify(payload),stamp());
    });
    statements.push(query(env,'UPDATE alert_rules SET last_fingerprint=?,last_sent_at=? WHERE id=?',fingerprint,stamp(),rule.id));
    await env.DB.batch(statements);
   }catch(e){await query(env,'INSERT INTO alert_evaluations VALUES(?,?,?,?)',uid(),rule.id,stamp(),JSON.stringify({error:e.message,windows:[]})).run();}
  }
  await dispatchQueue(env);return {status:'completed',rules:rules.length};
 }finally{await query(env,"DELETE FROM job_locks WHERE id='alerts'").run();}
}
async function limited(request,env){
 const key=(request.headers.get('CF-Connecting-IP')||'local')+':'+new URL(request.url).pathname.split('/')[1],window=Math.floor(Date.now()/60000);
 const r=await query(env,'INSERT INTO rate_limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,count=CASE WHEN rate_limits.window=excluded.window THEN rate_limits.count+1 ELSE 1 END RETURNING count',key,window).first();
 if(Math.random()<0.01)await query(env,'DELETE FROM rate_limits WHERE window<?',window-2).run();
 return r.count>60;
}
export async function handle(request,env){
 const u=new URL(request.url),path=u.pathname,origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
 if(origin===env.ALLOWED_ORIGIN){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='Authorization, Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, PUT, DELETE, OPTIONS';}
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin && origin!==env.ALLOWED_ORIGIN)return reply({error:'Origen no autorizado'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  if(!env.DB)return reply({error:'D1 sin configurar'},503);
  if(await limited(request,env))return reply({error:'Límite de peticiones'},429);
  if(path==='/health'){
   const latest=await all(env,'SELECT r.spot_id,r.downloaded_at,r.payload FROM forecast_runs r JOIN spots s ON s.id=r.spot_id WHERE s.public=1 AND s.deleted_at IS NULL ORDER BY r.downloaded_at DESC LIMIT 10');
   return reply({status:'ok',mailConfigured:!!(env.RESEND_API_KEY&&env.MAIL_FROM&&env.WORKER_URL),missingConfiguration:['ADMIN_TOKEN','RESEND_API_KEY','MAIL_FROM','WORKER_URL'].filter(k=>!env[k]),schedule:'0 */3 * * *',providers:providerRegistry,recentPublicRuns:latest.map(r=>{const run=JSON.parse(r.payload);return {spotId:r.spot_id,downloadedAt:r.downloaded_at,fresh:fresh(run),sources:run.sources,errors:run.errors};})});
  }
  if(path==='/unsubscribe'){
   const token=u.searchParams.get('token');if(!/^[a-f0-9-]{72}$/.test(token||''))return reply({error:'Enlace inválido'},400);
   if(request.method==='GET')return new Response(`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><title>Baja Spearfishing</title><h1>Dejar de recibir avisos</h1><form method="post"><button>Confirmar baja</button></form></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; form-action 'self'"}});
   if(request.method!=='POST')return reply({error:'Método no permitido'},405);
   await query(env,"UPDATE subscribers SET status='unsubscribed' WHERE unsubscribe_token=?",token).run();return reply({ok:true,message:'Suscripción desactivada'});
  }
  if(path.startsWith('/admin/') && !await authorized(request,env))return reply({error:'Autenticación requerida'},401);
  if(path==='/spots'&&request.method==='GET'){await ensurePilot(env);return reply((await all(env,'SELECT * FROM spots WHERE public=1 AND deleted_at IS NULL')).map(parseSpot));}
  if(path==='/forecast'&&request.method==='GET'){
   const row=await query(env,'SELECT * FROM spots WHERE id=? AND public=1 AND deleted_at IS NULL',u.searchParams.get('spot')||'').first();
   if(!row)return reply({error:'Lugar no encontrado'},404);return reply(await forecast(env,parseSpot(row)));
  }
  if(path==='/admin/state'&&request.method==='GET')return reply({spots:(await all(env,'SELECT * FROM spots WHERE deleted_at IS NULL')).map(parseSpot),lists:await all(env,'SELECT * FROM distribution_lists'),subscribers:await all(env,'SELECT id,list_id,email,status,consent_at FROM subscribers'),rules:await all(env,'SELECT * FROM alert_rules'),deliveries:await all(env,'SELECT id,rule_id,status,attempts,provider_id,error,created_at FROM alert_deliveries ORDER BY created_at DESC LIMIT 100'),evaluations:await all(env,'SELECT * FROM alert_evaluations ORDER BY evaluated_at DESC LIMIT 30')});
  if(path==='/admin/forecast'&&request.method==='GET'){
   const s=await query(env,'SELECT * FROM spots WHERE id=? AND deleted_at IS NULL',u.searchParams.get('spot')||'').first();if(!s)return reply({error:'Lugar no encontrado'},404);return reply(await forecast(env,parseSpot(s)));
  }
  if(path==='/admin/spots'&&['POST','PUT','DELETE'].includes(request.method)){
   const s=await body(request);if(!/^[\w-]{1,80}$/.test(s.id||''))throw new Error('ID inválido');
   if(request.method==='DELETE'){await query(env,'UPDATE spots SET deleted_at=? WHERE id=?',stamp(),s.id).run();await audit(env,'spot-delete',s.id);return reply({ok:true});}
   coordinates(s.lat,s.lon);if(!s.name?.trim()||s.name.length>160)throw new Error('Nombre inválido');
   const sectors=s.localParameters?.sectors;
   if(sectors && (!Array.isArray(sectors)||sectors.length>72||sectors.some(x=>!Number.isFinite(x.bearing)||x.bearing<0||x.bearing>=360||!Number.isFinite(x.fetchM)||x.fetchM<0||x.fetchM>20000||typeof x.classification!=='string'||x.classification.length>80)))throw new Error('Sectores locales inválidos');
   s.thresholds=validateThresholds(s.thresholds||defaults);if(typeof s.public!=='boolean')throw new Error('Visibilidad explícita requerida');
   await query(env,'INSERT INTO spots(id,name,lat,lon,public,data) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,lat=excluded.lat,lon=excluded.lon,public=excluded.public,data=excluded.data',s.id,s.name,s.lat,s.lon,s.public?1:0,JSON.stringify(s)).run();await audit(env,'spot-save',s.id);return reply({ok:true});
  }
  if(path==='/admin/lists'&&request.method==='POST'){
   const b=await body(request);if(!b.name?.trim()||b.name.length>120)throw new Error('Nombre de lista inválido');const id=uid();await query(env,'INSERT INTO distribution_lists VALUES(?,?)',id,b.name.trim()).run();await audit(env,'list-create',id);return reply({id});
  }
  if(path==='/admin/subscribers'&&request.method==='POST'){
   const b=await body(request);if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(b.email||'')||b.email.length>254||b.consent!==true)throw new Error('Correo o consentimiento inválido');
   const id=uid();await query(env,'INSERT INTO subscribers VALUES(?,?,?,?,?,?)',id,b.listId,b.email.toLowerCase().trim(),'active',uid()+uid(),stamp()).run();await audit(env,'subscriber-create',id);return reply({id});
  }
  if(path==='/admin/subscribers'&&request.method==='DELETE'){const b=await body(request);await query(env,"UPDATE subscribers SET status='unsubscribed' WHERE id=?",b.id).run();await audit(env,'subscriber-unsubscribe',b.id);return reply({ok:true});}
  if(path==='/admin/rules'&&request.method==='POST'){
   const b=await body(request),id=b.id||uid(),thresholds=validateThresholds(b.thresholds);if(!['opportunity','daily','weekly','deterioration'].includes(b.type||'opportunity')||!Number.isInteger(b.preferredHour??9)||(b.preferredHour??9)<0||(b.preferredHour??9)>21)throw new Error('Tipo u hora inválidos');if(![24,48,72,168].includes(b.hours)||!(b.cooldownHours>=3&&b.cooldownHours<=168))throw new Error('Horizonte o espera inválidos');
   await query(env,'INSERT INTO alert_rules(id,spot_id,list_id,enabled,configuration) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET spot_id=excluded.spot_id,list_id=excluded.list_id,enabled=excluded.enabled,configuration=excluded.configuration',id,b.spotId,b.listId,b.enabled?1:0,JSON.stringify({thresholds,hours:b.hours,cooldownHours:b.cooldownHours,type:b.type||'opportunity',preferredHour:b.preferredHour??9})).run();await audit(env,'rule-save',id);return reply({id});
  }
  if(path==='/admin/check'&&request.method==='POST'){const result=await runAlerts(env);await audit(env,'manual-check',null);return reply(result);}
  if(path==='/admin/refresh'&&request.method==='POST'){const b=await body(request),s=await query(env,'SELECT * FROM spots WHERE id=? AND deleted_at IS NULL',b.spotId).first();if(!s)return reply({error:'Lugar no encontrado'},404);return reply(await forecast(env,parseSpot(s),true));}
  if(path==='/admin/test-email'&&request.method==='POST'){
   const b=await body(request),s=await query(env,"SELECT * FROM subscribers WHERE id=? AND status='active'",b.subscriberId).first();if(!s)throw new Error('Destinatario activo requerido');
   const id=await sendMail(env,{to:[s.email],subject:'Spearfishing | Prueba de configuración',html:`<h1>Prueba de correo</h1><p>El proveedor ha aceptado este mensaje. Confirma su recepción en tu buzón.</p><p>${escapeHTML(stamp())}</p>`},uid());await audit(env,'test-email',s.id);return reply({accepted:true,providerId:id,receipt:'Confirmar en el buzón; aceptación no acredita entrega.'});
  }
  return reply({error:'Ruta o método no disponible'},404);
 }catch(e){console.error('API',path,e.message);return reply({error:e.message},400);}
}
export default {fetch:handle,scheduled:(_event,env,ctx)=>ctx.waitUntil(runAlerts(env))};
