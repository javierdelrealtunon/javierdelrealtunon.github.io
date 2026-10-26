// Only local Wrangler + local D1. Synthetic .test subscriber, no sending credentials.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787';
const headers={Origin:'http://127.0.0.1:4173',Authorization:'Bearer local-test-only-token-00000000000000000000','Content-Type':'application/json'};
async function call(path,method='GET',data){const response=await fetch(base+path,{method,headers,...(data?{body:JSON.stringify(data)}:{})});const b=await response.json();assert.equal(response.status,200,JSON.stringify(b));return b;}
const health=await call('/health');assert.equal(health.mailConfigured,false,'Do not run this script with real email credentials');
const spots=await call('/spots');assert.ok(spots.some(s=>s.id==='mundaka-pilot'));
const run=await call('/forecast?spot=mundaka-pilot');assert.ok(run.rows.length>24);assert.ok(run.sources.some(s=>s.kind==='ocean'));
const list=await call('/admin/lists','POST',{name:'Local runtime test '+Date.now()});
const subscriber=await call('/admin/subscribers','POST',{listId:list.id,email:'local-runtime@example.test',consent:true});
const rule={spotId:'mundaka-pilot',listId:list.id,enabled:true,hours:48,cooldownHours:24,thresholds:{hs:20,wind:100,gust:150,current:10,period:40,daylight:false}};
const saved=await call('/admin/rules','POST',rule);const check=await call('/admin/check','POST');assert.equal(check.status,'completed');
const state=await call('/admin/state');assert.ok(state.evaluations.some(e=>e.rule_id===saved.id));
const deliveries=state.deliveries.filter(d=>d.rule_id===saved.id);assert.equal(deliveries.length,1);assert.equal(deliveries[0].status,'retry');assert.match(deliveries[0].error,/sin configurar/);
await call('/admin/check','POST');const state2=await call('/admin/state');assert.equal(state2.deliveries.filter(d=>d.rule_id===saved.id).length,1);
await call('/admin/rules','POST',{...rule,id:saved.id,enabled:false});await call('/admin/subscribers','DELETE',{id:subscriber.id});
console.log(JSON.stringify({runtime:'workerd + local D1',sources:run.sources.map(s=>s.kind),rows:run.rows.length,regional:!!run.comparison,persistentEvaluation:true,duplicateSuppressed:true,email:'not configured; retry recorded; no email sent'},null,2));
