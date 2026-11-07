import test from 'node:test';import assert from 'node:assert/strict';
import {environmentalValue,environmentSummary} from '../marine/environment.js';
import {getForecast,normalize,forecastVersion} from '../marine/providers.js';
const spot={id:'fixture',lat:43.4,lon:-2.7},time=[1794052800,1794056400];
const weather=()=>({latitude:43.4,longitude:-2.7,hourly:{time,temperature_2m:[-2,0],pressure_msl:[1019.8,null],precipitation:[0,.7],wind_speed_10m:[3,4]},hourly_units:{temperature_2m:'°C',pressure_msl:'hPa',precipitation:'mm',wind_speed_10m:'m/s'}});
test('environmental normalization preserves freezing temperatures, dry hours and missing pressure',()=>{
 const source=normalize(weather(),'weather',spot,new Date().toISOString(),'fixture');assert.equal(source.rows[0].airTemp,-2);assert.equal(source.rows[1].airTemp,0);assert.equal(source.rows[0].rain,0);assert.equal(source.rows[1].rain,.7);assert.equal(source.rows[0].pressure,1019.8);assert.equal(source.rows[1].pressure,null);assert.equal(source.rows[0].undefined,undefined);
 const summary=environmentSummary(source.rows);assert.equal(summary.find(v=>v.key==='pressure').count,1);assert.equal(summary.find(v=>v.key==='sst').count,0);assert.equal(summary.find(v=>v.key==='rain').value,0);
});
test('environmental unit conversion never converts missing values into zero and rejects unknown units',()=>{
 assert.equal(environmentalValue(32,'°F','temperature'),0);assert.equal(environmentalValue(101980,'Pa','pressure'),1019.8);assert.ok(Math.abs(environmentalValue(101.98,'kPa','pressure')-1019.8)<1e-9);assert.equal(environmentalValue(1,'inch','precipitation'),25.4);assert.equal(environmentalValue(null,'°C','temperature'),null);assert.equal(environmentalValue(5,'unknown','pressure'),null);
});
test('zone temperature source requests only SST and includes full weather variables in explicit units',async()=>{
 const urls=[];const run=await getForecast(spot,{kinds:['weather','sst'],fetcher:async input=>{const url=new URL(input);urls.push(url);return Response.json(url.hostname==='api.open-meteo.com'?weather():{latitude:43.5,longitude:-2.7,hourly:{time,sea_surface_temperature:[16.8,16.9]},hourly_units:{sea_surface_temperature:'°C'}});}});
 assert.equal(run.variablesVersion,forecastVersion);assert.equal(urls.length,2);const w=urls.find(u=>u.hostname==='api.open-meteo.com');assert.ok(w.searchParams.get('hourly').includes('pressure_msl'));assert.ok(w.searchParams.get('hourly').includes('temperature_2m'));assert.equal(w.searchParams.get('temperature_unit'),'celsius');assert.equal(w.searchParams.get('precipitation_unit'),'mm');assert.equal(urls.find(u=>u!==w).searchParams.get('hourly'),'sea_surface_temperature');assert.equal(run.rows[0].sst,16.8);assert.equal(run.rows[0].airTemp,-2);
});
test('missing water temperature remains unavailable while weather survives; ragged temperature arrays are rejected',async()=>{
 const run=await getForecast(spot,{kinds:['weather','sst'],fetcher:async url=>Response.json(new URL(url).hostname==='api.open-meteo.com'?weather():{latitude:43.5,longitude:-2.7,hourly:{time,sea_surface_temperature:[null,null]}})});
 assert.equal(run.rows[0].sst,undefined);assert.equal(run.rows[0].airTemp,-2);assert.ok(run.errors.some(e=>e.kind==='sst'));const body=weather();body.hourly.temperature_2m=[1];assert.throws(()=>normalize(body,'weather',spot,new Date().toISOString(),'fixture'),/Longitud incoherente/);
});
