// In-memory fake Apps Script. Synthetic records; never writes to a real database.
import test from 'node:test';import assert from 'node:assert/strict';
import {ForecastStore,decodeForecastRows,sheetCoordinate,forecastRecordType} from '../marine/forecast-store.js';
import {fishingForecasts,seedFishingForecasts} from '../marine/fishing-sites.js';
const original={registro_id:'fixture-fish',tipo:'Sitio de pesca',nombre:'Fixture site',lat:43321436,lng:-3032386,notas:'Original notes'};
function database(){
 const rows=[structuredClone(original)];let writes=0;
 const fetcher=async input=>{const u=new URL(input);if(u.searchParams.get('action')==='write'){writes++;rows.push({...Object.fromEntries(u.searchParams),fecha:new Date().toISOString()});return Response.json({ok:true});}return Response.json(rows);};
 return {rows,fetcher,get writes(){return writes;}};
}
const fixture={id:'forecast-fixture',name:'Synthetic forecast',lat:43.4,lon:-3.2,public:true,sourceRefs:['fixture:1']};
test('browser-native fetch retains its required global receiver',async()=>{
 const store=new ForecastStore({fetcher:async function(){assert.equal(this,globalThis);return Response.json([]);}});
 assert.equal((await store.load()).spots.length,0);
});
test('a second independent client reads a saved forecast without browser storage',async()=>{
 const db=database(),a=new ForecastStore({fetcher:db.fetcher}),b=new ForecastStore({fetcher:db.fetcher});
 await a.save(fixture);assert.equal((await b.load()).spots[0].name,fixture.name);assert.deepEqual(db.rows[0],original);
});
test('edits and tombstones are folded without duplicates or changes to fishing records',async()=>{
 const db=database(),store=new ForecastStore({fetcher:db.fetcher});
 await store.save(fixture);await store.save({...fixture,name:'Edited fixture',lat:43.5});
 let list=await store.load();assert.equal(list.spots.length,1);assert.equal(list.spots[0].lat,43.5);
 await store.remove(list.spots[0]);list=await store.load();assert.equal(list.spots.length,0);assert.equal(list.records.length,1);assert.equal(list.records[0].deleted,true);assert.deepEqual(db.rows[0],original);
});
test('private coordinates cannot be written into the public legacy database',async()=>{
 const db=database(),store=new ForecastStore({fetcher:db.fetcher});
 await assert.rejects(store.save({...fixture,public:false}),/Compartir/);assert.equal(db.writes,0);
});
test('seed creates one forecast per source and is repeatable including deleted entries',async()=>{
 const db=database(),store=new ForecastStore({fetcher:db.fetcher});
 const result=await seedFishingForecasts(store,[fixture]);assert.equal(result.created,2);
 assert.equal((await seedFishingForecasts(store,[fixture])).created,0);
 await store.remove(fixture);assert.equal((await seedFishingForecasts(store,[fixture])).created,0);
 assert.equal(db.rows.filter(r=>r.tipo==='Sitio de pesca').length,1);
});
test('legacy numeric/decimal coordinate formats are normalized with stable source IDs',()=>{
 assert.equal(sheetCoordinate(43321436,'lat'),43.321436);assert.equal(sheetCoordinate('-3,032386','lon'),-3.032386);assert.equal(sheetCoordinate('','lat'),null);
 const a=fishingForecasts([original])[0],b=fishingForecasts([original])[0];assert.equal(a.id,b.id);assert.deepEqual(a.sourceRefs,['sheets:fixture-fish']);assert.equal(a.lat,43.321436);
});
test('unknown/malformed rows cannot overwrite a valid forecast and formula names are escaped',async()=>{
 const db=database(),store=new ForecastStore({fetcher:db.fetcher});await store.save({...fixture,name:'=fixture'});
 assert.equal(db.rows.at(-1).nombre,"'=fixture");assert.equal((await store.load()).spots[0].name,'=fixture');
 assert.equal(decodeForecastRows([...db.rows,{tipo:forecastRecordType,notas:'not JSON'}]).length,1);
});
