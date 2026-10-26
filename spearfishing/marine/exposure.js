import {angle,finite} from './core.js';
const R=6371000,rad=Math.PI/180;
// Equirectangular local projection. Limited to coastal analysis within 20 km.
function xy(c,origin){return [(c[0]-origin[0])*rad*R*Math.cos(origin[1]*rad),(c[1]-origin[1])*rad*R];}
function cross(a,b){return a[0]*b[1]-a[1]*b[0];}
export function waterSide(spot,geography){
  const bbox=geography?.source?.bbox;
  if(!bbox || spot.lon<bbox[0]||spot.lat<bbox[1]||spot.lon>bbox[2]||spot.lat>bbox[3]) return {water:null,method:'fuera del recorte costero'};
  let best=null;
  for(const f of geography.features.filter(f=>f.properties?.natural==='coastline')){
    const c=f.geometry.coordinates;
    for(let i=1;i<c.length;i++){
      const a=xy(c[i-1],[spot.lon,spot.lat]),b=xy(c[i],[spot.lon,spot.lat]),s=[b[0]-a[0],b[1]-a[1]];
      const l=s[0]**2+s[1]**2;if(!l)continue;
      const t=Math.max(0,Math.min(1,-(a[0]*s[0]+a[1]*s[1])/l));
      const distance=Math.hypot(a[0]+t*s[0],a[1]+t*s[1]);
      if(!best||distance<best.distance) best={distance,water:cross(s,[-a[0],-a[1]])<0,osmWay:f.properties.osmWay};
    }
  }
  return best?{...best,water:best.distance<30?null:best.water,method:'Lado derecho marino de costa OSM orientada; comprobación geométrica, sin sondaje'}:{water:null,method:'sin costa'};
}
export function pointInRing(p,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  } return inside;
}
export function exposureSectors(spot,geography,{step=15,maxDistance=10000}={}){
  if(!geography?.features?.length) return {method:'sin geometría costera',quality:'unknown',sectors:[],waterVerified:false};
  if(step<5 || step>90 || 360%step!==0 || maxDistance>20000) throw new Error('Resolución geométrica no válida');
  const origin=[spot.lon,spot.lat],segments=[];
  let onLand=false;
  for(const f of geography.features){
    const g=f.geometry;
    if(g.type==='Polygon'){
      if(pointInRing(origin,g.coordinates[0]) && !g.coordinates.slice(1).some(r=>pointInRing(origin,r))) onLand=true;
    }
    const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'||g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];
    for(const line of lines) for(let i=1;i<line.length;i++) segments.push([xy(line[i-1],origin),xy(line[i],origin)]);
  }
  const sectors=[];
  for(let bearing=0;bearing<360;bearing+=step){
    const d=[Math.sin(bearing*rad),Math.cos(bearing*rad)];
    let limit=maxDistance;
    const box=geography.source?.bbox;
    if(box){
      const lo=xy([box[0],box[1]],origin),hi=xy([box[2],box[3]],origin);
      if(origin[0]<box[0]||origin[0]>box[2]||origin[1]<box[1]||origin[1]>box[3])return {method:'fuera de cobertura geométrica',quality:'unknown',sectors:[],waterVerified:false};
      for(let axis=0;axis<2;axis++)if(Math.abs(d[axis])>1e-9)limit=Math.min(limit,(d[axis]>0?hi[axis]:lo[axis])/d[axis]);
    }
    let hit=limit;
    for(const [a,b] of segments){
      const s=[b[0]-a[0],b[1]-a[1]],den=cross(d,s);
      if(Math.abs(den)<1e-9) continue;
      const t=cross(a,s)/den,u=cross(a,d)/den;
      if(t>=0 && u>=0 && u<=1) hit=Math.min(hit,t);
    }
    sectors.push({bearing,fetchM:Math.round(hit),obstructed:hit<limit,classification:hit===limit?'indeterminado':hit<500?'obstruido':hit<2000?'parcial':'abierto',censored:hit===limit});
  }
  return {method:'Intersección de rayos con costa/obstáculos emergidos; clasificación geométrica',quality:'geometric-unvalidated',waterVerified:false,onLand,source:geography.source,sectors,maxDistance,limitations:['No simula refracción, difracción, rotura ni relieve.','Rayos sin intersección: alcance limitado por geometría disponible, no fetch oceánico.','La costa lineal no certifica máscara tierra/agua.']};
}
export function localEstimate(row,exposure,calibration=null){
  const nearest=exposure?.sectors?.length && finite(row.waveDirection)?exposure.sectors.reduce((a,b)=>Math.abs(((b.bearing-row.waveDirection+540)%360)-180)<Math.abs(((a.bearing-row.waveDirection+540)%360)-180)?b:a):null;
  // Quantitative corrections are reserved for externally validated nested-model results.
  const valid=calibration?.method==='validated-nested-model' && calibration.validationId && calibration.time===row.time && finite(calibration.hs) && calibration.hs>=0;
  return {regionalHs:row.hs??null,localHs:valid?calibration.hs:null,difference:valid&&finite(row.hs)?calibration.hs-row.hs:null,waveExposure:nearest||null,windExposure:exposure?.sectors?.length&&finite(row.windDirection)?exposure.sectors.reduce((a,b)=>Math.abs(((b.bearing-row.windDirection+540)%360)-180)<Math.abs(((a.bearing-row.windDirection+540)%360)-180)?b:a):null,current:row.current??null,method:valid?calibration.method:'regional + exposición cualitativa',quality:valid?'externally-validated':'sin calibración local'};
}
