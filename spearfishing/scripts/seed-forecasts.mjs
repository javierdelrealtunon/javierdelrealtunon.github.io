// Authorized import of forecast locations only. Never changes fishing/photo rows.
import {readFile} from 'node:fs/promises';
import {ForecastStore} from '../marine/forecast-store.js';
import {seedFishingForecasts} from '../marine/fishing-sites.js';
const kml=JSON.parse(await readFile(new URL('../data/forecast-sites.json',import.meta.url),'utf8'));
const store=new ForecastStore();
const onlyFirst=process.argv.includes('--first');
const result=await seedFishingForecasts(store,onlyFirst?kml.slice(0,1):kml,{onProgress:({created,name})=>console.log(`${created}: ${name}`)});
const snapshot=await store.load();
console.log(JSON.stringify({...result,stored:snapshot.spots.length,records:snapshot.rows.length,originalFishingRecords:snapshot.rows.filter(r=>r.tipo==='Sitio de pesca').length},null,2));
