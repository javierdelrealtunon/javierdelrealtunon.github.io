import test from 'node:test';import assert from 'node:assert/strict';
import {FeatureStore} from '../marine/feature-store.js';
import {validateGeometry,featureRowId,applyFeatureRows,decodeFeatureRows,closestSegment,featureRecordType} from '../marine/geometry.js';
import {zoneElements,buildZones,ZoneStore} from '../marine/zones.js';
const original={nombre:'Aparcamiento sintético',tipo:'Aparcamiento',lat:43300000,lng:-3000000,notas:'Original',autor:'Test'};
const ref=`sheets:${featureRowId(original)}`,point={sourceRef:ref,name:'Punto editado',type:'Aparcamiento',notes:'Notas nuevas',author:'Test',coordinateSource:'mapa',geometry:{type:'Point',coordinates:[-3.01,43.31]}};
const polygon={sourceRef:'kml/sitios.kml#placemark:0',name:'Polígono editado',type:'Sitio de pesca',notes:'Nuevo contorno',geometry:{type:'Polygon',coordinates:[[[-3,43],[-2.9,43],[-2.9,43.1],[-3,43.1],[-3,43]]]}};
function database(){const rows=[structuredClone(original)];let writes=0;const fetcher=async input=>{const url=new URL(input);if(url.searchParams.get('action')==='write'){writes++;rows.push(Object.fromEntries(url.searchParams));return Response.json({ok:true});}return Response.json(rows);};return {rows,fetcher,get writes(){return writes;}};}
test('geometry rejects invalid positions, open or crossing polygons and zero-area contours',()=>{
 assert.throws(()=>validateGeometry({type:'Point',coordinates:[-3,91]}));assert.throws(()=>validateGeometry({type:'Point',coordinates:['-3',43]}));assert.throws(()=>validateGeometry({type:'Polygon',coordinates:[[[0,0],[1,0],[0,1]]]}));assert.throws(()=>validateGeometry({type:'Polygon',coordinates:[[[0,0],[1,1],[0,1],[1,0],[0,0]]]}),/cruza/);assert.throws(()=>validateGeometry({type:'Polygon',coordinates:[[[0,0],[1,0],[2,0],[0,0]]]}),/superficie/);assert.deepEqual(validateGeometry(polygon.geometry),polygon.geometry);
});
test('moving a legacy point preserves its identity and assignments after independent reload',async()=>{
 const db=database(),store=new FeatureStore({fetcher:db.fetcher});await store.save(point,{publicConsent:true});const data=await new FeatureStore({fetcher:db.fetcher}).load(),row=applyFeatureRows(data.rows)[0];
 assert.equal(row.nombre,point.name);assert.equal(row.lat,43.31);assert.equal(row.lng,-3.01);assert.equal(featureRowId(row),featureRowId(original));const element=zoneElements(data.rows)[0];assert.equal(element.id,featureRowId(original));assert.equal(element.lat,43.31);assert.deepEqual(db.rows[0],original);assert.equal(data.records.size,1);
});
test('polygon edits are read by zone maps while original source geometry remains unchanged',async()=>{
 const db=database(),store=new FeatureStore({fetcher:db.fetcher});await store.save(polygon,{publicConsent:true});const template={id:'zone-kml-fixture',name:'Original',lat:43,lon:-3,originalId:'placemark:0',sourceRefs:[polygon.sourceRef]},source={name:'Original',notes:'Original',ring:[[43,-3],[43,-2.8],[43.2,-2.8],[43,-3]]},before=structuredClone(source);
 const zone=buildZones(db.rows,[template],[source])[0];assert.deepEqual(zone.ring,polygon.geometry.coordinates[0].map(([lon,lat])=>[lat,lon]));assert.equal(zone.name,polygon.name);assert.deepEqual(source,before);assert.equal(zone.id,template.id);
});
test('feature saves require consent, reject stale revisions and ignore malformed events',async()=>{
 const db=database(),store=new FeatureStore({fetcher:db.fetcher});await assert.rejects(store.save(point),/compartir/);assert.equal(db.writes,0);let data=await store.save(point,{publicConsent:true});const saved=data.records.get(ref);await store.save({...saved,name:'Segunda revisión'},{publicConsent:true,baseRevision:saved.revision});const writes=db.writes;
 await assert.rejects(store.save(point,{publicConsent:true,baseRevision:saved.revision}),/Otra sesión/);assert.equal(db.writes,writes);assert.equal(decodeFeatureRows([...db.rows,{tipo:featureRecordType,notas:'bad json'}]).size,1);assert.deepEqual(db.rows[0],original);
});
test('new polygon vertices are inserted on the closest edge, including the closing edge',()=>{
 const ring=[[0,0],[1,0],[1,1],[0,1],[0,0]];assert.equal(closestSegment(ring,[.5,-.1]),0);assert.equal(closestSegment(ring,[-.1,.5]),3);
});

test('a later zone description is preserved while the edited polygon remains in use',async()=>{
 const db=database(),zones=new ZoneStore({fetcher:db.fetcher}),features=new FeatureStore({fetcher:db.fetcher}),template={id:'zone-kml-fixture',name:'Original',lat:43,lon:-3,originalId:'placemark:0',sourceRefs:[polygon.sourceRef]};
 const input={id:template.id,name:'Nombre de ficha',type:'Sitio de pesca',lat:43,lon:-3,notes:'Descripción de ficha',author:'Test',coordinateSource:'KML',photos:[],elementIds:[]};let data=await zones.save(input,{publicConsent:true});const saved=data.records.get(input.id);
 await features.save({...polygon,zoneRevision:saved.revision},{publicConsent:true});assert.equal(buildZones(db.rows,[template],[])[0].name,polygon.name);
 await zones.save({...saved,name:'Nombre actualizado desde la ficha'},{publicConsent:true,baseRevision:saved.revision});const zone=buildZones(db.rows,[template],[])[0];assert.equal(zone.name,'Nombre actualizado desde la ficha');assert.deepEqual(zone.ring,polygon.geometry.coordinates[0].map(([lon,lat])=>[lat,lon]));
});
