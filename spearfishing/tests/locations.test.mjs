// Synthetic local records; never send a private or real user's location to a service.
import test from 'node:test';
import assert from 'node:assert/strict';
import {localSpot,readLocalSpots,writeLocalSpots,mergeSpots,nearbySpot,localSpotsKey} from '../marine/locations.js';
import {getRegionalWave} from '../marine/regional.js';

const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
const fixture=()=>localSpot({id:'local-fixture',name:'Synthetic map fixture',lat:43.45,lon:-2.7});

test('map-picked locations persist through a browser-storage reload with stable IDs and private visibility',()=>{
 const store=storage(),spot=fixture();
 writeLocalSpots(store,[spot]);const reloaded=readLocalSpots(store);
 assert.equal(reloaded[0].id,spot.id);assert.equal(reloaded[0].lat,43.45);assert.equal(reloaded[0].lon,-2.7);
 assert.equal(reloaded[0].local,true);assert.equal(reloaded[0].public,false);
});
test('local coordinates require a selected point and valid WGS84 values',()=>{
 for(const coordinates of [{lat:'',lon:''},{lat:null,lon:0},{lat:91,lon:0},{lat:0,lon:-181}])assert.throws(()=>localSpot({name:'Fixture',...coordinates}));
 assert.equal(localSpot({name:'Equatorial fixture',lat:0,lon:0}).lat,0);
});
test('merging local points preserves server records and chooses the server when an ID was imported',()=>{
 const local=fixture(),server={...local,local:false,public:false,name:'Server copy'};
 const serverSpots=[server,{id:'mundaka-pilot',name:'Original',lat:43.416,lon:-2.7005}];
 const merged=mergeSpots(serverSpots,[local]);assert.equal(merged.length,2);assert.equal(merged[0].name,'Server copy');assert.equal(serverSpots.length,2);
});
test('duplicate detection excludes the record being edited and rejects nearby duplicates',()=>{
 const existing=fixture();assert.equal(nearbySpot(existing,[existing]),null);
 assert.equal(nearbySpot({...existing,id:'local-other',lat:existing.lat+.00001},[existing]).id,existing.id);
 assert.equal(nearbySpot({...existing,id:'local-far',lat:existing.lat+.1},[existing]),null);
});
test('storage failures are explicit; a malformed record cannot discard other valid locations',()=>{
 const store=storage();store.setItem(localSpotsKey,JSON.stringify([fixture(),null,{id:'local-bad',name:'Bad',lat:999,lon:0}]));
 assert.equal(readLocalSpots(store).length,1);
 assert.throws(()=>writeLocalSpots({setItem(){throw new Error('Quota');}},[fixture()]),/No se pudo guardar/);
});
test('regional adapter never clamps a location outside WAM coverage to an unrelated Basque cell',async()=>{
 let requests=0;
 const attributes={geospatial_lat_min:43.2,geospatial_lat_max:45,geospatial_lon_min:-4.48,geospatial_lon_max:-.98};
 await assert.rejects(getRegionalWave({lat:43.4,lon:-8.3},{fetcher:async()=>{
  requests++;return Response.json({table:{rows:Object.entries(attributes).map(([name,value])=>['attribute','NC_GLOBAL',name,'double',String(value)])}});
 }}),/fuera de la cobertura/);
 assert.equal(requests,1);
});
