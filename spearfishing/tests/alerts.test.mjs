// Synthetic fixtures. No real email is sent.
import test from 'node:test';import assert from 'node:assert/strict';
import {alertDecision} from '../marine/alerts.js';
import {defaults,evaluate,validateThresholds} from '../marine/conditions.js';
const now=Date.parse('2026-10-26T08:05:00Z'); // Monday 09:05 Madrid, after DST transition.
const fixture=()=>({downloadedAt:new Date(now).toISOString(),sources:[],rows:[1,2,3,4].map(h=>({time:new Date(now+h*3600000).toISOString(),hs:.2,wind:1,gust:2,current:.05,tm:8,day:1}))});
test('daily and weekly digest use Madrid preferred hour and stable day key',()=>{const d=alertDecision(fixture(),{type:'daily',preferredHour:9},null,now);assert.ok(d.candidate);assert.equal(d.fingerprint,'daily:2026-10-26');assert.ok(alertDecision(fixture(),{type:'weekly',preferredHour:9},null,now).candidate);assert.equal(alertDecision(fixture(),{type:'daily',preferredHour:15},null,now).candidate,null);});
test('deterioration requires previous complete evaluation and a material change',()=>{const r=fixture();r.rows.forEach(x=>x.hs=2);assert.equal(alertDecision(r,{type:'deterioration'},null,now).candidate,null);assert.ok(alertDecision(r,{type:'deterioration'},{score:95,critical:[]},now).candidate);assert.equal(alertDecision(fixture(),{type:'deterioration'},{score:20,critical:[]},now).candidate,null);});
test('incomplete or expired providers suppress summaries and opportunity alerts',()=>{const r=fixture();r.rows[0].current=null;assert.equal(alertDecision(r,{type:'daily',preferredHour:9},null,now).candidate,null);r.downloadedAt='2026-10-20T00:00:00Z';assert.equal(alertDecision(r,{type:'opportunity'},null,now).candidate,null);});
test('noncritical preferences produce intermediate classification',()=>{const r={...fixture().rows[0],tm:20};assert.equal(evaluate(r,validateThresholds({critical:['current']})).status,'intermediate');assert.equal(evaluate(r,defaults).status,'unfavorable');});
