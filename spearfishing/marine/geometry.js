import {coordinates} from './core.js';
import {sheetCoordinate} from './forecast-store.js';
export const featureRecordType='Edición de elemento';
export const featureSchema='spearfishing.feature.v1';
export function featureRowId(row){return String(row.__featureId||row.registro_id||`legacy-${row.tipo}-${row.nombre}-${sheetCoordinate(row.lat,'lat')}-${sheetCoordinate(row.lng,'lon')}`);}
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function on(a,b,c){return Math.abs(cross(a,b,c))<1e-12&&c[0]>=Math.min(a[0],b[0])-1e-12&&c[0]<=Math.max(a[0],b[0])+1e-12&&c[1]>=Math.min(a[1],b[1])-1e-12&&c[1]<=Math.max(a[1],b[1])+1e-12;}
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);return x*y<0&&u*v<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);}
export function validateGeometry(input){
 const point=p=>{if(!Array.isArray(p)||p.length!==2)throw Error('Coordenadas de geometría inválidas.');coordinates(p[1],p[0]);return [...p];};
 if(input?.type==='Point')return {type:'Point',coordinates:point(input.coordinates)};
 if(input?.type!=='Polygon'||!Array.isArray(input.coordinates)||input.coordinates.length!==1)throw Error('Se admite un punto o un polígono de un contorno.');
 const ring=input.coordinates[0].map(point);if(ring.length<4||ring.length>1001||!same(ring[0],ring.at(-1)))throw Error('El polígono debe estar cerrado y tener entre 3 y 1000 vértices.');
 if(new Set(ring.slice(0,-1).map(p=>p.join(','))).size!==ring.length-1)throw Error('El polígono tiene vértices repetidos.');
 for(let i=0;i<ring.length-1;i++)for(let j=i+2;j<ring.length-1;j++){if(i===0&&j===ring.length-2)continue;if(intersects(ring[i],ring[i+1],ring[j],ring[j+1]))throw Error(`El polígono se cruza entre los lados ${i+1}–${i+2} y ${j+1}–${j+2}. Mueve sus vértices antes de guardar.`);}
 const origin=ring[0],area=ring.slice(0,-1).reduce((sum,p,i)=>sum+(p[0]-origin[0])*(ring[i+1][1]-origin[1])-(ring[i+1][0]-origin[0])*(p[1]-origin[1]),0);
 if(Math.abs(area)<1e-12)throw Error('El polígono no tiene superficie válida.');return {type:'Polygon',coordinates:[ring]};
}
export function validateFeature(input){
 const sourceRef=String(input.sourceRef||'');if(!/^(sheets:|kml\/)/.test(sourceRef)||sourceRef.length>350)throw Error('Referencia de elemento inválida.');
 const name=String(input.name||'').trim(),notes=String(input.notes||'').trim(),author=String(input.author||'').trim(),coordinateSource=String(input.coordinateSource||'').trim(),type=String(input.type||'');
 if(!name||name.length>160||notes.length>2000||author.length>160||coordinateSource.length>160)throw Error('Revisa el nombre y la longitud de los textos.');
 const geometry=validateGeometry(input.geometry);if(geometry.type==='Point'&&!['Aparcamiento','Punto de entrada'].includes(type)||geometry.type==='Polygon'&&type!=='Sitio de pesca')throw Error('Tipo de elemento no editable en este diálogo.');
 if(sourceRef.startsWith('kml/')&&geometry.type!=='Polygon'||sourceRef.startsWith('sheets:')&&geometry.type!=='Point')throw Error('La geometría no corresponde al tipo de origen.');
 return {sourceRef,name,type,notes,author,coordinateSource,geometry,zoneRevision:typeof input.zoneRevision==='string'?input.zoneRevision:null};
}
export function decodeFeatureRows(rows){const records=new Map();for(const row of rows){if(row.tipo!==featureRecordType)continue;try{const data=JSON.parse(row.notas);if(data.schema!==featureSchema||!Number.isFinite(Date.parse(data.updatedAt))||typeof data.revision!=='string')continue;const feature=validateFeature(data);records.set(feature.sourceRef,{...feature,revision:data.revision,updatedAt:data.updatedAt});}catch{}}return records;}
export function applyFeatureRows(rows,records=decodeFeatureRows(rows)){return rows.map(row=>{
 if(!['Aparcamiento','Punto de entrada'].includes(row.tipo))return row;const id=featureRowId(row),feature=records.get(`sheets:${id}`);if(!feature)return row;
 return {...row,__featureId:id,nombre:feature.name,tipo:feature.type,notas:feature.notes,autor:feature.author,coord_origen:feature.coordinateSource,lng:feature.geometry.coordinates[0],lat:feature.geometry.coordinates[1]};
});}
export function closestSegment(ring,point){let best=0,distance=Infinity;const scale=Math.cos(point[1]*Math.PI/180);for(let i=0;i<ring.length-1;i++){
 const a=ring[i],b=ring[i+1],x=(b[0]-a[0])*scale,y=b[1]-a[1],den=x*x+y*y,t=den?Math.max(0,Math.min(1,((point[0]-a[0])*scale*x+(point[1]-a[1])*y)/den)):0;
 const d=((point[0]-a[0])*scale-t*x)**2+(point[1]-a[1]-t*y)**2;if(d<distance){best=i;distance=d;}
}return best;}
