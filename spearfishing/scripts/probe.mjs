import {mkdir,writeFile} from 'node:fs/promises';
import {getForecast} from '../marine/providers.js';
import {getRegionalWave} from '../marine/regional.js';
const spot={id:'mundaka-pilot',lat:43.416,lon:-2.7005};
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
try {
 const run=await getForecast(spot),regional=await getRegionalWave(spot);
 const {rows,...regionalMeta}=regional;
 const report={checkedAt:run.downloadedAt,spot,sources:run.sources,regional:regionalMeta,regionalCount:rows.length,errors:run.errors};
 console.log(JSON.stringify(report,null,2));
 await writeFile(new URL('../data/provider-probe.json',import.meta.url),JSON.stringify(report,null,2));
 if(run.errors.length)process.exitCode=1;
} catch(e){console.error(e.message);process.exitCode=1;
}
