import test from 'node:test';
import assert from 'node:assert/strict';
import {ZoneStore,buildZones,zoneElements,nearbyElements,closestZoneElements,elementDistance,decodeZoneRows,zoneRecordType,zonePhotoType,zoneForecastRows,validateZone,photoURL} from '../marine/zones.js';

const fishing={registro_id:'fish-fixture',nombre:'Zona sintética',tipo:'Sitio de pesca',lat:43321436,lng:-3032386,notas:'Fondo de roca',autor:'Test',foto_url:'https://example.test/original.jpg'};
const fixture={id:'zone-fixture',name:'Ficha sintética',type:'Sitio de pesca',lat:43.3,lon:-3,notes:'Notas',author:'Test',coordinateSource:'manual',elementIds:['fish-fixture'],photos:[{id:'photo-fixture',url:'https://example.test/photo.jpg',caption:'Acceso'}]};
function database(){const rows=[structuredClone(fishing)];let writes=0;const fetcher=async(input,options={})=>{
 assert.equal(this,undefined);const url=new URL(input);if(url.searchParams.get('action')==='write'){writes++;rows.push(Object.fromEntries(url.searchParams));return Response.json({ok:true});}
 if(options.method==='POST'){const params=options.body;const row=rows.find(r=>r.registro_id===params.get('registro_id'));row.foto_url='https://example.test/upload.jpg';return new Response();}
 return Response.json(rows);
};return {rows,fetcher,get writes(){return writes;}};}

test('zone revisions and photo captions are shared between clients without changing source records',async()=>{
 const db=database(),a=new ZoneStore({fetcher:db.fetcher}),b=new ZoneStore({fetcher:db.fetcher});
 let data=await a.save(fixture,{publicConsent:true});const saved=data.records.get(fixture.id);assert.equal(saved.photos[0].caption,'Acceso');
 await b.save({...saved,name:'Edición compartida',photos:[{...saved.photos[0],caption:'Referencia nueva'}]},{publicConsent:true,baseRevision:saved.revision});
 data=await a.load();assert.equal(data.records.size,1);assert.equal(data.records.get(fixture.id).name,'Edición compartida');assert.equal(data.records.get(fixture.id).photos[0].caption,'Referencia nueva');assert.deepEqual(db.rows[0],fishing);
});
test('stale sessions cannot silently replace a newer zone revision',async()=>{
 const db=database(),a=new ZoneStore({fetcher:db.fetcher});await a.save(fixture,{publicConsent:true});const writes=db.writes;
 await assert.rejects(a.save({...fixture,name:'Obsoleta'},{publicConsent:true}),/Otra sesión/);assert.equal(db.writes,writes);
});
test('zone sharing and uploads require explicit consent before any network write',async()=>{
 const db=database(),store=new ZoneStore({fetcher:db.fetcher});await assert.rejects(store.save(fixture),/compartir/);await assert.rejects(store.upload(fixture,{dataUrl:'data:image/jpeg;base64,YQ=='}),/compartir/);assert.equal(db.writes,0);
});
test('uploads are only successful after a photo URL can be read independently',async()=>{
 const db=database(),store=new ZoneStore({fetcher:db.fetcher});const photo=await store.upload(fixture,{publicConsent:true,dataUrl:'data:image/jpeg;base64,YQ==',caption:'Texto de emplazamiento'});
 assert.equal(photo.url,'https://example.test/upload.jpg');assert.equal((await new ZoneStore({fetcher:db.fetcher}).load()).uploads.get(fixture.id)[0].caption,'Texto de emplazamiento');assert.deepEqual(db.rows[0],fishing);
});
test('unverified uploads do not report success and malformed records cannot replace valid data',async()=>{
 const db=database(),store=new ZoneStore({fetcher:db.fetcher});await store.save(fixture,{publicConsent:true});
 const data=decodeZoneRows([...db.rows,{tipo:zoneRecordType,notas:'invalid'},{tipo:zoneRecordType,notas:JSON.stringify({schema:'spearfishing.zone.v1',...fixture,lat:999,revision:'bad'})},{tipo:zonePhotoType,notas:JSON.stringify({schema:'spearfishing.zone-photo.v1',zoneId:fixture.id}),foto_url:'javascript:alert(1)'}]);assert.equal(data.records.get(fixture.id).lat,43.3);assert.equal(data.uploads.size,0);
 const pending=new ZoneStore({sleep:async()=>{},fetcher:async(input,opts={})=>opts.method==='POST'?new Response():db.fetcher(input)});await assert.rejects(pending.upload(fixture,{publicConsent:true,dataUrl:'data:image/jpeg;base64,YQ=='}),/sin URL verificable/);
});
test('zones preserve original fields and KML geometry while overlays update only the selected zone',async()=>{
 const db=database(),template={id:'zone-fixture',name:'KML — Previsión',lat:43.3,lon:-3,originalId:'placemark:0',sourceRefs:['kml/sitios.kml#placemark:0']},ring=[[43,-4],[44,-4],[44,-2],[43,-2]];
 const store=new ZoneStore({fetcher:db.fetcher});await store.save(fixture,{publicConsent:true});const zones=buildZones(db.rows,[template],[{name:'Zona KML',notes:'Notas KML',ring}]);
 assert.equal(zones.length,2);assert.deepEqual(zones.find(z=>z.id===fixture.id).ring,ring);const original=zones.find(z=>z.sourceRecordId===fishing.registro_id);assert.equal(original.notes,fishing.notas);assert.equal(original.photos[0].url,fishing.foto_url);assert.equal(original.lat,43.321436);
});
test('zone elements use polygon containment or a one-kilometre radius and ignore database events',()=>{
 const elements=zoneElements([fishing,{...fishing,registro_id:'far',lat:42,lng:-3},{...fishing,tipo:zoneRecordType}]);assert.equal(elements.length,2);
 assert.equal(nearbyElements({lat:43.321436,lon:-3.032386,ring:[]},elements).length,1);
 assert.equal(nearbyElements({lat:0,lon:0,ring:[[43,-4],[44,-4],[44,-2],[43,-2]]},elements).length,1);
});
test('forecast windows cover exactly 2 hours or 7 days with boundary points and preserve gaps',()=>{
 const now=Date.parse('2026-11-07T10:00Z'),run={rows:Array.from({length:172},(_,i)=>({time:new Date(now+(i-2)*3600000).toISOString(),hs:i===3?null:1,wind:2}))};
 const short=zoneForecastRows(run,2,now);assert.equal(short.length,3);assert.equal(short[1].hs,null);const week=zoneForecastRows(run,168,now);assert.equal(week.length,169);assert.equal(Date.parse(week.at(-1).time)-Date.parse(week[0].time),168*3600000);assert.throws(()=>zoneForecastRows(run,1,now));assert.throws(()=>zoneForecastRows(run,169,now));
});
test('zone validation rejects unsafe images, duplicate photo IDs and invalid coordinates',()=>{
 assert.equal(photoURL('javascript:alert(1)'),'');assert.equal(photoURL('https://user:pass@example.test/'),'');assert.throws(()=>validateZone({...fixture,lat:91}));assert.throws(()=>validateZone({...fixture,photos:[fixture.photos[0],fixture.photos[0]]}));assert.throws(()=>validateZone({...fixture,photos:[{...fixture.photos[0],url:'http://example.test/'}]}));
});

test('map discovers nearby unassigned elements while retaining distant selections without assigning them',()=>{
 const zone={lat:43,lon:-3,ring:[]},elements=[{id:'far-selected',lat:44,lon:-3},{id:'next',lat:43.02,lon:-3},{id:'nearest',lat:43.001,lon:-3},{id:'outside-limit',lat:43.5,lon:-3}],selected=new Set(['far-selected']);
 const shown=closestZoneElements(zone,elements,selected,2);assert.deepEqual(shown.map(e=>e.id),['nearest','next','far-selected']);assert.deepEqual([...selected],['far-selected']);assert.ok(shown[0].distance<shown[1].distance);assert.equal(elements[0].distance,undefined);
 const polygon={lat:43.5,lon:-3.5,ring:[[43,-4],[44,-4],[44,-3],[43,-3]]};assert.equal(elementDistance(polygon,{lat:43.1,lon:-3.01}),0);assert.ok(elementDistance(polygon,{lat:43.5,lon:-2.999})<.1);
});
test('one parking element can serve several zones and unassigning it from one preserves the others',async()=>{
 const db=database(),store=new ZoneStore({fetcher:db.fetcher});
 const a={...fixture,id:'zone-a',elementIds:['shared-parking']},b={...fixture,id:'zone-b',elementIds:['shared-parking']};
 await store.save(a,{publicConsent:true});let data=await store.save(b,{publicConsent:true});const savedA=data.records.get(a.id);
 await store.save({...savedA,elementIds:[]},{publicConsent:true,baseRevision:savedA.revision});data=await new ZoneStore({fetcher:db.fetcher}).load();assert.deepEqual(data.records.get(a.id).elementIds,[]);assert.deepEqual(data.records.get(b.id).elementIds,['shared-parking']);
});
