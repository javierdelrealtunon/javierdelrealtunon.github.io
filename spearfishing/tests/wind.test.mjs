// Synthetic test fixtures, never used as application forecasts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {getForecast} from '../marine/providers.js';
import {windCoverage} from '../marine/wind.js';

const spot={id:'fixture',lat:43.416,lon:-2.7005};
const marine=()=>Response.json({latitude:43.5,longitude:-2.7,hourly:{time:[1794009600],wave_height:[1],ocean_current_velocity:[0.36],ocean_current_direction:[90]},hourly_units:{wave_height:'m',ocean_current_velocity:'km/h'}});
const weather=()=>Response.json({latitude:43.41,longitude:-2.71,hourly:{time:[1794009600],wind_speed_10m:[18],wind_gusts_10m:[36],wind_direction_10m:[270],is_day:[1],precipitation:[0]},hourly_units:{wind_speed_10m:'km/h',wind_gusts_10m:'km/h'}});
const isWeather=url=>new URL(url).hostname==='api.open-meteo.com';

test('weather recovers after one transient server failure and keeps wind units and direction',async()=>{
 let attempts=0;
 const run=await getForecast(spot,{fetcher:async url=>isWeather(url)?(++attempts===1?new Response('',{status:503}):weather()):marine()});
 assert.equal(attempts,2);assert.equal(run.errors.length,0);
 assert.equal(run.rows[0].wind,5);assert.equal(run.rows[0].gust,10);assert.equal(run.rows[0].windDirection,270);
 assert.equal(windCoverage(run.rows).status,'complete');
});
test('quota errors are not retried and unavailable wind is never filled with zero',async()=>{
 let attempts=0;
 const run=await getForecast(spot,{fetcher:async url=>isWeather(url)?(++attempts,new Response('',{status:429})):marine()});
 assert.equal(attempts,1);assert.equal(run.rows[0].wind,undefined);
 assert.equal(run.quality,'partial');assert.ok(run.errors.some(e=>e.kind==='weather'));
 assert.equal(windCoverage(run.rows).status,'missing');
});
test('weather containing daylight but no wind is reported as partial',async()=>{
 const run=await getForecast(spot,{fetcher:async url=>isWeather(url)?Response.json({latitude:43.41,longitude:-2.71,hourly:{time:[1794009600],is_day:[1]}}):marine()});
 assert.equal(run.rows[0].wind,null);assert.equal(run.rows[0].day,1);
 assert.equal(run.quality,'partial');assert.match(run.errors.find(e=>e.kind==='weather').message,/velocidad de viento/);
});
test('calm wind is data; missing gusts and directions are counted separately',()=>{
 assert.deepEqual(windCoverage([{wind:0,gust:0,windDirection:0}]),{total:1,speed:1,gust:1,direction:1,status:'complete'});
 assert.deepEqual(windCoverage([{wind:3,gust:null,windDirection:null},{wind:null,gust:4,windDirection:90}]),{total:2,speed:1,gust:1,direction:1,status:'partial'});
 assert.equal(windCoverage([]).status,'missing');
});

test('zone forecasts request only wind and wave sources and retain correct partial-source labels',async()=>{
 const urls=[];const run=await getForecast(spot,{kinds:['wave','weather'],fetcher:async url=>{urls.push(url);return isWeather(url)?new Response('',{status:429}):marine();}});
 assert.equal(urls.length,2);assert.ok(urls.every(u=>!u.includes('meteofrance_currents')));assert.equal(run.sources.length,1);assert.equal(run.sources[0].kind,'wave');assert.equal(run.errors[0].kind,'weather');
});
