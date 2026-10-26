export const finite = x => typeof x === 'number' && Number.isFinite(x);
export const angle = d => ((d % 360) + 360) % 360;
export const iso = t => new Date(t).toISOString();
export function coordinates(lat, lon) {
  if (!finite(lat) || !finite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Coordenadas WGS84 inválidas');
  return [lat, lon];
}
export function distanceKm(a, b) {
  const r = Math.PI / 180, dlat = (b[0]-a[0])*r, dlon = (b[1]-a[1])*r;
  const h = Math.sin(dlat/2)**2 + Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dlon/2)**2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function toUV(speed, direction, convention = 'towards') {
  if (!finite(speed) || !finite(direction)) return {u:null,v:null};
  const d = (direction + (convention === 'from' ? 180 : 0)) * Math.PI/180;
  return {u:speed*Math.sin(d),v:speed*Math.cos(d)};
}
export function fromUV(u,v) {
  if (!finite(u) || !finite(v)) return {speed:null,direction:null};
  return {speed:Math.hypot(u,v),direction: Math.hypot(u,v)<1e-10 ? null : angle(Math.atan2(u,v)*180/Math.PI)};
}
export function interpolateVector(a,b,f) {
  if (!(f>=0 && f<=1) || ![a.u,a.v,b.u,b.v].every(finite)) return {u:null,v:null,speed:null,direction:null};
  const u=a.u+(b.u-a.u)*f,v=a.v+(b.v-a.v)*f;
  return {u,v,...fromUV(u,v)};
}
export function speedMS(value,unit) {
  if (!finite(value)) return null;
  if (unit === 'm/s') return value;
  if (unit === 'km/h') return value/3.6;
  if (unit === 'kn' || unit === 'knots') return value*0.514444;
  throw new Error(`Unidad de velocidad no reconocida: ${unit}`);
}
export function fresh(run,now=Date.now(),maxHours=6) {
  const age = now-Date.parse(run?.downloadedAt);
  return finite(age) && age>=-300000 && age<=maxHours*3600000 && run?.rows?.some(r=>Date.parse(r.time)>=now);
}
export function tideExtrema(rows) {
  const found=[];
  for(let i=1;i<rows.length-1;i++) {
    const a=rows[i-1],b=rows[i],c=rows[i+1];
    if (![a.level,b.level,c.level].every(finite) || Date.parse(c.time)-Date.parse(a.time)!==7200000) continue;
    if(b.level>a.level && b.level>=c.level) found.push({...b,kind:'pleamar'});
    if(b.level<a.level && b.level<=c.level) found.push({...b,kind:'bajamar'});
  }
  return found;
}
