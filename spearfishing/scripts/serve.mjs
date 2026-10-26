import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.kml':'application/xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)&&path!==root)throw Error();if((await stat(path)).isDirectory())path=resolve(path,'index.html');if(path.includes(sep+'.git'+sep)||path.includes(sep+'worker'+sep)||path.includes(sep+'.dev.vars'))throw Error();res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(path));}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/spearfishing/'));
