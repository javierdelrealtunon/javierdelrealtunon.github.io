import {config} from '../config.js';
import {getForecast} from './providers.js';
import {getRegionalWave} from './regional.js';
import {fresh,finite,tideExtrema} from './core.js';
import {defaults,validateThresholds,evaluate,assess} from './conditions.js';
import {exposureSectors,localEstimate,waterSide} from './exposure.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=(v,n=2)=>finite(v)?v.toFixed(n):'—';
const local=(t,opts={dateStyle:'short',timeStyle:'short'})=>new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',...opts}).format(new Date(t));
const labels={favorable:'Favorable según umbrales',unfavorable:'Desfavorable',unknown:'Datos insuficientes',intermediate:'Intermedio'};
let spots=[],spot,run,geography,exposure,token='',adminState=null,charts=[],requestId=0;
const runs=new Map();
let apiBase=config.apiBase||localStorage.getItem('marine.apiBase')||'';
let rules=defaults;
try{rules=validateThresholds(JSON.parse(localStorage.getItem('marine.thresholds')||'{}'));}catch{}
const root=document.createElement('section');root.id='marine-panel';root.hidden=true;root.setAttribute('aria-label','Plataforma oceanometeorológica');
root.innerHTML=`<div class="marine-wrap"><div class="marine-top"><div><p class="marine-kicker">CANTÁBRICO / OBSERVATORIO DE CONDICIONES</p><h1 id="marine-title">Previsiones</h1></div><span class="marine-badge" id="marine-status" role="status">Sin descargar</span></div>
<div class="marine-toolbar"><label>Lugar<select id="marine-spot"></select></label><label>Desde (Madrid)<input type="date" id="marine-date"></label><label>Horizonte<select id="marine-hours"><option>24</option><option selected>48</option><option>72</option><option value="168">7 días disponibles</option></select></label><label>Velocidad<select id="marine-unit"><option value="1">m/s</option><option value="3.6">km/h</option><option value="1.943844">nudos</option></select></label><button id="marine-refresh">Actualizar</button><button id="marine-map">Ver en mapa ↗</button><button id="marine-csv">CSV ↓</button></div>
<p class="marine-notice">Herramienta de planificación. Una puntuación favorable no garantiza seguridad. Contrasta avisos oficiales, rompientes, corrientes costeras, acceso y restricciones legales; valora tu experiencia y las condiciones reales.</p>
<p id="marine-error" role="alert"></p>
<section data-marine-view="forecast"><div class="marine-metrics" id="marine-metrics"></div><p id="marine-cursor" class="marine-muted" aria-live="polite"></p><div class="marine-charts" id="marine-charts"></div>
<div class="marine-grid"><article class="marine-card"><h2>Ventanas según tus criterios</h2><div id="marine-windows">Carga una previsión para evaluar.</div><details><summary>Configurar umbrales y pesos</summary><form id="marine-thresholds" class="marine-form"></form></details></article><article class="marine-card"><h2>Exposición local</h2><div id="marine-exposure"></div></article></div>
<details class="marine-card"><summary>Procedencia, celdas y vigencia</summary><div id="marine-sources"></div></details>
<details class="marine-card"><summary>Tabla horaria accesible · tiempos Europe/Madrid</summary><div class="marine-scroll" id="marine-table"></div></details></section>
<section data-marine-view="compare" hidden><article class="marine-card"><h2>Comparador de lugares</h2><p>Ordenado por mejor ventana continua; los datos incompletos quedan sin puntuación.</p><button id="marine-compare">Comparar los lugares públicos</button><div id="marine-ranking"></div></article></section>
<section data-marine-view="alerts" hidden><article class="marine-card"><h2>Alertas del servidor</h2><p>Las comprobaciones programadas se ejecutan cada tres horas con la web cerrada. Es necesario configurar Worker, D1 y correo. Solo se envían oportunidades con datos completos y vigentes.</p><button id="marine-check">Comprobar ahora</button><div id="marine-alert-state">Conecta el backend e inicia sesión en Administración para consultar reglas e historial.</div><form id="marine-rule" class="marine-form"><h3>Guardar regla de aviso</h3><label>Tipo<select name="type"><option value="opportunity">Nueva oportunidad</option><option value="daily">Resumen diario</option><option value="weekly">Resumen semanal (lunes)</option><option value="deterioration">Empeoramiento significativo</option></select></label><label>Hora preferida (Madrid; resúmenes)<input name="preferredHour" type="number" min="0" max="21" value="9" required></label><p>Los resúmenes salen en la primera comprobación de las tres horas siguientes a la hora indicada.</p><label>Lista<select name="listId" id="marine-rule-list" required></select></label><label>Espera mínima entre avisos (h)<input name="cooldownHours" type="number" min="3" max="168" value="24" required></label><label><input name="enabled" type="checkbox" checked> Activada</label><p>Usa el lugar seleccionado, el horizonte y tus umbrales actuales.</p><button>Guardar en servidor</button></form></article></section>
<section data-marine-view="admin" hidden><div class="marine-grid"><article class="marine-card"><h2>Conexión administrativa</h2><form id="marine-login" class="marine-form"><label>URL del Worker<input id="marine-api" type="url" placeholder="https://spearfishing-forecast.…workers.dev" required></label><label>Credencial administrativa<input id="marine-token" type="password" autocomplete="off" minlength="32" required></label><p>La credencial permanece solo en memoria hasta cerrar o desconectar esta página.</p><button>Conectar</button><button type="button" id="marine-logout">Desconectar</button></form><pre id="marine-diagnostics">Backend no configurado.</pre></article>
<article class="marine-card"><h2>Listas y destinatarios</h2><form id="marine-list" class="marine-form"><label>Nombre de nueva lista<input name="name" maxlength="120" required></label><button>Crear lista</button></form><form id="marine-subscriber" class="marine-form"><label>Lista<select name="listId" id="marine-subscriber-list" required></select></label><label>Correo<input name="email" type="email" required></label><label><input name="consent" type="checkbox" required> Tengo autorización del destinatario para estos avisos.</label><button>Añadir destinatario</button></form><div id="marine-subscribers"></div><p>Los destinatarios se almacenan en D1 y solo son accesibles mediante autenticación. Cada aviso incluye baja con confirmación.</p></article>
<article class="marine-card"><h2>Ficha del lugar de previsión</h2><p>Independiente de puntos y fotografías de Google Sheets. Eliminar esta ficha no borra el KML ni registros originales.</p><form id="marine-edit" class="marine-form"><label>ID estable<input name="id" required pattern="[\\w-]{1,80}"></label><label>Nombre<input name="name" maxlength="160" required></label><label>Latitud<input name="lat" type="number" step="any" min="-90" max="90" required></label><label>Longitud<input name="lon" type="number" step="any" min="-180" max="180" required></label><label>Notas<textarea name="description"></textarea></label><label><input name="public" type="checkbox"> Lugar y coordenadas públicos</label><label>Parámetros locales / sectores manuales (JSON)<textarea name="localParameters" placeholder='{"sectors":[],"method":"manual","validationId":null}'></textarea></label><button>Guardar ficha en servidor</button><button type="button" id="marine-new">Nueva ficha</button><button type="button" id="marine-delete">Eliminar ficha seleccionada</button></form></article></div></section>
<p class="marine-footer">Datos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · Météo-France / Copernicus Marine · DWD · <a href="https://www.euskoos.eus/" target="_blank" rel="noopener">EuskOOS / Euskalmet-AZTI</a> · Costa © OpenStreetMap (ODbL). Sin validación observacional local.</p></div>`;
document.body.append(root);
const header=document.createElement('header');header.id='marine-nav';header.innerHTML=`<a class="marine-brand" href="#map">◉ <span>SPEARFISHING<small>FORECAST & ALERTS</small></span></a><nav aria-label="Secciones principales">${[['map','Mapa'],['forecast','Previsiones'],['compare','Comparador'],['alerts','Alertas'],['admin','Administración']].map(([id,label])=>`<button data-view="${id}" ${id==='map'?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;document.body.prepend(header);
function view(name){
 root.hidden=name==='map';document.body.classList.toggle('marine-open',name!=='map');
 document.getElementById('map').inert=name!=='map';document.getElementById('sidebar').inert=name!=='map';
 document.querySelectorAll('[data-marine-view]').forEach(s=>s.hidden=s.dataset.marineView!==name);
 header.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.view===name?'page':'false'));
 $('marine-title').textContent=({forecast:'Previsión del lugar',compare:'Elegir la próxima salida',alerts:'Oportunidades y alertas',admin:'Administración'})[name]||'Mapa';
 if(name==='forecast') {if(!run)load();else setTimeout(()=>charts.forEach(c=>c.resize()),0);}
 if(name==='map') setTimeout(()=>window.spearfishingMap.invalidateSize(),0);
}
header.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
header.querySelector('a').onclick=e=>{e.preventDefault();view('map');};
function message(error){$('marine-error').textContent=error?.message||String(error||'');}
async function api(path,{method='GET',data,auth=true}={}){
 if(!apiBase)throw new Error('Configura la URL del Worker en Administración.');
 if(auth&&!token)throw new Error('Inicia sesión en Administración.');
 const r=await fetch(apiBase.replace(/\/$/,'')+path,{method,cache:'no-store',headers:{...(data?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:`Bearer ${token}`}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const b=await r.json();if(!r.ok)throw new Error(b.error||`HTTP ${r.status}`);return b;
}
async function fetchRun(s,force=false){
 if(!force&&runs.has(s.id)&&fresh(runs.get(s.id),Date.now(),3))return runs.get(s.id);
 let r;
 if(apiBase)r=force&&token?await api('/admin/refresh',{method:'POST',data:{spotId:s.id}}):await api((s.public?'/forecast':'/admin/forecast')+'?spot='+encodeURIComponent(s.id),{auth:!s.public});
 else {r=await getForecast(s);try{r.comparison=await getRegionalWave(s);}catch(e){r.errors.push({kind:'WAM',message:e.message});}}
 runs.set(s.id,r);return r;
}
async function load(force=false){
 if(!spot)return;const id=++requestId;$('marine-refresh').disabled=true;message('');$('marine-status').textContent='Consultando fuentes reales…';
 try{const r=await fetchRun(spot,force);if(id!==requestId)return;run=r;render();}
 catch(e){if(id!==requestId)return;run=null;message(e);$('marine-status').textContent='Previsión no disponible';$('marine-metrics').replaceChildren();$('marine-windows').textContent='No se evalúan oportunidades sin datos.';charts.forEach(c=>c.dispose());charts=[];$('marine-charts').replaceChildren();$('marine-table').replaceChildren();$('marine-sources').textContent='Sin respuesta verificable';}
 finally{if(id===requestId)$('marine-refresh').disabled=false;}
}
function visibleRows(){
 const date=$('marine-date').value,now=Math.floor(Date.now()/3600000)*3600000,hours=Number($('marine-hours').value);
 const eligible=(run?.rows||[]).filter(r=>Date.parse(r.time)>=now && (!date||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.time))>=date));
 const start=Date.parse(eligible[0]?.time);return eligible.filter(r=>Date.parse(r.time)<start+hours*3600000);
}
function drawRose(){
 if(!exposure?.sectors?.length)return '<p>Sin geometría suficiente. No se estima atenuación.</p>';
 const paths=exposure.sectors.map(s=>{const a=s.bearing*Math.PI/180,r=20+Math.min(70,s.fetchM/30);return `${100+Math.sin(a)*r},${100-Math.cos(a)*r}`;}).join(' ');
 return `<svg class="marine-rose" viewBox="0 0 200 200" role="img" aria-label="Rosa geométrica de exposición; sin corrección de altura"><circle cx="100" cy="100" r="70" fill="none" stroke="#305061"/><path d="M100 15V185M15 100H185" stroke="#305061"/><polygon points="${paths}" fill="#45d6bb33" stroke="#45d6bb"/><text x="96" y="12">N</text><text x="188" y="105">E</text><text x="96" y="198">S</text><text x="0" y="105">O</text></svg>`;
}
function render(){
 if(!run)return;const valid=fresh(run),rows=visibleRows(),r=rows[0]||{},score=evaluate(r,rules,{valid}),unit=Number($('marine-unit').value),unitName=$('marine-unit').selectedOptions[0].text;
 $('marine-status').textContent=valid?`Descarga ${local(run.downloadedAt)}${run.errors.length?' · fuentes parciales':''}`:'DATOS CADUCADOS · evaluación suspendida';
 $('marine-status').classList.toggle('expired',!valid);
 const metric=(label,value,sub)=>`<article class="marine-metric"><span>${label}</span><strong>${value}</strong><small>${sub}</small></article>`;
 const extrema=tideExtrema(run.rows).filter(x=>Date.parse(x.time)>Date.now());
 $('marine-metrics').innerHTML=metric('Oleaje regional Hs',`${format(r.hs)} <em>m</em>`,`De ${format(r.waveDirection,0)}° · Tm ${format(r.tm,1)} s · Tp ${format(r.tp,1)} s`)+metric('Viento a 10 m',`${format(finite(r.wind)?r.wind*unit:null)} <em>${unitName}</em>`,`De ${format(r.windDirection,0)}° · Racha ${format(finite(r.gust)?r.gust*unit:null)} ${unitName}`)+metric('Corriente regional',`${format(finite(r.current)?r.current*unit:null)} <em>${unitName}</em>`,`Hacia ${format(r.currentDirection,0)}° · canal no resuelto`)+metric('Nivel regional MSL',`${format(r.level)} <em>m</em>`,extrema.slice(0,2).map(x=>`${x.kind} aprox. ${local(x.time)}`).join(' / ')||'Sin extremos verificables')+metric('Favorabilidad',score.score===null?'—':`${score.score}<em>/100</em>`,labels[score.status])+metric('Calidad',valid?'Regional':'Caducada','Sin calibración local · SST '+format(r.sst,1)+' °C');
 $('marine-cursor').textContent=rows.length?`Valores de ${local(r.time)} · ${rows.length} horas disponibles · viento/oleaje: de procedencia; corriente: hacia destino.`:'Sin horas disponibles para este filtro.';
 const outcome=assess({...run,rows},rules,{now:Math.max(Date.now(),Date.parse(rows[0]?.time)||0),hours:Number($('marine-hours').value)});
 $('marine-windows').innerHTML=outcome.windows.length?outcome.windows.map(w=>`<p class="marine-window">${esc(local(w.start))} → ${esc(local(w.end))}<br><strong>${w.hours} h · ${w.score}/100</strong></p>`).join(''):`<p>No hay ventanas que cumplan todos los criterios durante al menos ${rules.minHours} h. ${score.missing.length?'Faltan: '+esc(score.missing.join(', ')):score.critical.length?'Superaciones: '+esc(score.critical.join(', ')):''}</p>`;
 const est=localEstimate(r,exposure),water=waterSide(spot,geography);
 $('marine-exposure').innerHTML=drawRose()+`<p>Oleaje incidente: ${esc(est.waveExposure?.classification||'sin clasificar')}. Viento: ${esc(est.windExposure?.classification||'sin clasificar')}.</p><p><strong>Hs local: no estimada.</strong> No hay parámetros calibrados. Corriente regional sin corrección por abrigo.</p><p>Comprobación de costa: ${water.water===true?'lado marino':water.water===false?'lado terrestre: revisar ficha':'sin verificación'}${finite(water.distance)?' · '+format(water.distance,0)+' m a costa OSM':''}. Geometría limitada al recorte; sin batimetría numérica ni relieve.</p><details><summary>Sectores y método</summary><p>${esc(exposure.method)}</p><div class="marine-scroll"><table><tr><th>Rumbo</th><th>Distancia a obstáculo</th><th>Resultado</th></tr>${exposure.sectors.map(s=>`<tr><td>${s.bearing}°</td><td>${s.censored?'≥':''}${s.fetchM} m</td><td>${esc(s.classification)}${s.censored?' · sin intersección en el alcance':''}</td></tr>`).join('')}</table></div></details>`;
 $('marine-sources').innerHTML=[...run.sources,...(run.comparison?[run.comparison]:[])].map(s=>`<p><strong>${esc(s.provider)} · ${esc(s.model)}</strong><br>${esc(s.nativeResolution)} · celda ${format(s.cell.lat,5)}, ${format(s.cell.lon,5)} · ${format(s.cell.distanceKm,1)} km al lugar<br>Descarga ${esc(local(s.downloadedAt))} · ciclo: ${esc(s.runCycle||'no publicado')} · generación: ${esc(s.generatedAt||'no publicada')}${s.coverageEnd?' · cobertura hasta '+esc(local(s.coverageEnd)):''}</p>`).join('')+run.notes.map(n=>`<p>${esc(n)}</p>`).join('')+run.errors.map(e=>`<p class="marine-warning">${esc(e.kind)}: ${esc(e.message)}</p>`).join('');
 $('marine-table').innerHTML=`<table><thead><tr>${['Madrid','Hs m','Tm s','Tp s','Oleaje de °','Viento m/s','Racha m/s','Viento de °','Corriente m/s','Hacia °','U m/s','V m/s','MSL m','Lluvia mm','Valoración'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(local(x.time))}</td>${['hs','tm','tp','waveDirection','wind','gust','windDirection','current','currentDirection','u','v','level','rain'].map(k=>`<td>${format(x[k])}</td>`).join('')}<td>${labels[evaluate(x,rules,{valid}).status]}</td></tr>`).join('')}</tbody></table>`;
 drawCharts(rows);updateMapVectors(r);
}
function drawCharts(rows){
 charts.forEach(c=>c.dispose());charts=[];$('marine-charts').replaceChildren();
 if(!window.echarts){$('marine-charts').textContent='No se ha podido cargar la librería de gráficos. La tabla mantiene todos los valores.';return;}
 const groups=[['Oleaje y componentes · m',['hs','windWave','swell','secondarySwell'],['Hs regional','Mar de viento','Mar de fondo','Fondo secundario']],['Periodos · s',['tm','tp'],['Tm medio','Tp pico']],['Viento · m/s',['wind','gust'],['Viento','Rachas']],['Corrientes · m/s',['current','u','v'],['Velocidad','U este','V norte']],['Nivel del mar · m MSL',['level'],['Nivel incluido efecto mareal']],['Direcciones · oleaje/viento de; corriente hacia',['waveDirection','windDirection','currentDirection'],['Oleaje de','Viento de','Corriente hacia']]];
 for(const [title,fields,names] of groups){
  const card=document.createElement('article');card.className='marine-card marine-chart-card';const heading=document.createElement('h2');heading.textContent=title;const btn=document.createElement('button');btn.textContent='PNG ↓';const div=document.createElement('div');div.className='marine-chart';div.setAttribute('aria-label',title);card.append(heading,btn,div);$('marine-charts').append(card);
  const chart=window.echarts.init(div,null,{renderer:'canvas'});chart.group='marine';
  const directions=fields[0]==='waveDirection';
  const series=fields.map((key,i)=>directions?({name:names[i],type:'scatter',symbol:'arrow',symbolSize:12,data:rows.filter(r=>finite(r[key])).map(r=>({value:[Date.parse(r.time),i+1,r[key]],symbolRotate:-(r[key]+(key==='currentDirection'?0:180))}))}):({name:names[i],type:'line',showSymbol:false,connectNulls:false,data:rows.map(r=>[Date.parse(r.time),r[key]??null])}));
  if(fields[0]==='hs'&&run.comparison)series.push({name:'EuskOOS WAM · nativo',type:'line',showSymbol:true,symbolSize:3,connectNulls:false,lineStyle:{type:'dashed'},data:run.comparison.rows.filter(r=>rows.length&&Date.parse(r.time)>=Date.parse(rows[0].time)&&Date.parse(r.time)<=Date.parse(rows.at(-1).time)).map(r=>[Date.parse(r.time),r.hs])});
  chart.setOption({color:['#4ee0c0','#69aefe','#f0bd69','#b395ff'],textStyle:{color:'#acbfcd'},animation:false,legend:{top:0,textStyle:{color:'#acbfcd'},type:'scroll'},grid:{left:50,right:16,top:45,bottom:70},tooltip:{trigger:'axis',confine:true,valueFormatter:v=>format(v),formatter:items=>`${esc(local(items[0].value[0]))}<br>${items.map(p=>`${esc(p.seriesName)}: ${format(directions?p.value[2]:p.value[1])}${directions?'°':''}`).join('<br>')}<br>Previsión regional; fuentes en procedencia`},axisPointer:{link:[{xAxisIndex:'all'}]},xAxis:{type:'time',axisLabel:{formatter:v=>local(v,{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}},yAxis:{type:'value',...(directions?{min:0,max:4,interval:1,axisLabel:{formatter:v=>['','Oleaje','Viento','Corriente',''][v]}}:{}),splitLine:{lineStyle:{color:'#233e50'}}},dataZoom:[{type:'inside'},{type:'slider',height:20,bottom:10}],series});
  chart.on('updateAxisPointer',event=>{const time=event.axesInfo?.[0]?.value;if(time)$('marine-cursor').textContent='Cursor: '+local(time)+' · viento/oleaje de procedencia; corriente hacia destino.';});
  btn.onclick=()=>{const a=document.createElement('a');a.href=chart.getDataURL({pixelRatio:2,backgroundColor:'#102536'});a.download=`${spot.id}-${fields[0]}.png`;a.click();};charts.push(chart);
 }
 window.echarts.connect('marine');
}
function initThresholds(){
 $('marine-thresholds').innerHTML=['hs','wind','gust','current','period','minHours'].map((k,i)=>`<label>${['Hs máxima (m)','Viento máximo (m/s)','Racha máxima (m/s)','Corriente máxima (m/s)','Periodo máximo (s)','Duración mínima (h)'][i]}<input name="${k}" type="number" step="0.01" min="0.01" value="${rules[k]}" required></label>`).join('')+`<label><input name="daylight" type="checkbox" ${rules.daylight?'checked':''}> Solo horas diurnas</label><label>Variables críticas (JSON)<textarea name="critical">${esc(JSON.stringify(rules.critical))}</textarea></label><label>Pesos (JSON)<textarea name="weights">${esc(JSON.stringify(rules.weights))}</textarea></label><button>Aplicar criterios</button><p>Umbrales de planificación modificables; cada superación bloquea la ventana favorable.</p>`;
 $('marine-thresholds').onsubmit=e=>{e.preventDefault();try{const f=new FormData(e.target);rules=validateThresholds({...Object.fromEntries(['hs','wind','gust','current','period','minHours'].map(k=>[k,Number(f.get(k))])),daylight:f.has('daylight'),weights:JSON.parse(f.get('weights')),critical:JSON.parse(f.get('critical'))});localStorage.setItem('marine.thresholds',JSON.stringify(rules));render();message('Criterios aplicados en este navegador. Guarda una regla para utilizarlos en el servidor.');}catch(err){message(err);}};
}
let vectorLayer;
function updateMapVectors(r){
 const m=window.spearfishingMap;if(!m)return;vectorLayer?.remove();vectorLayer=L.layerGroup();
 for(const [direction,label,from,offset] of [[r.waveDirection,'Oleaje',true,0],[r.windDirection,'Viento',true,.001],[r.currentDirection,'Corriente',false,-.001]]){
  if(!finite(direction))continue;
  L.marker([spot.lat+offset,spot.lon+.0015],{interactive:false,icon:L.divIcon({className:'marine-vector',html:`<span style="transform:rotate(${direction+(from?180:0)}deg)">↑</span><small>${label} ${format(direction,0)}° ${from?'de':'hacia'}</small>`,iconSize:[90,40]})}).addTo(vectorLayer);
 }
 vectorLayer.addTo(m);
}
function mapMarkers(){
 const m=window.spearfishingMap;if(!m)return;
 window.marineSpotsLayer?.remove();const layer=L.layerGroup();
 for(const s of spots){L.circleMarker([s.lat,s.lon],{radius:10,color:'#43e1bb',fillOpacity:.9}).bindTooltip(s.name).on('click',()=>{selectSpot(s.id);view('forecast');}).addTo(layer);}
 window.marineSpotsLayer=layer.addTo(m);
 if(!window.marineCoastLayer && geography?.features?.length)window.marineCoastLayer=L.geoJSON(geography,{style:{color:'#62f0cf',weight:2,opacity:.7}}).addTo(m);
 const bathymetry=L.tileLayer.wms('https://ows.emodnet-bathymetry.eu/wms',{layers:'emodnet:mean_atlas_land',format:'image/png',transparent:true,opacity:.6,attribution:'EMODnet Bathymetry (visualización; no análisis numérico)'});
 if(window.marineLayerControl)window.marineLayerControl.remove();window.marineLayerControl=L.control.layers({}, {'Batimetría EMODnet (visual)':bathymetry,'Lugares de previsión':layer},{position:'topright'}).addTo(m);
}
function editFields(){const f=$('marine-edit');for(const k of ['id','name','lat','lon','description'])f.elements[k].value=spot?.[k]??'';f.elements.public.checked=spot?.public===true;f.elements.localParameters.value=JSON.stringify(spot?.localParameters||{},null,2);}
function selectSpot(id){spot=spots.find(s=>s.id===id)||spots[0];if(spot.thresholds){rules=validateThresholds(spot.thresholds);initThresholds();}$('marine-spot').value=spot.id;exposure=spot.localParameters?.sectors?.length?{...spot.localParameters,quality:'manual-unvalidated'}:exposureSectors(spot,geography);run=null;editFields();load();}
function downloadCSV(){if(!run)return;const fields=['time','hs','tm','tp','waveDirection','wind','gust','windDirection','current','currentDirection','u','v','level','sst','rain','day'];const rows=[['# UTC; unidades SI; procedencia: '+run.sources.map(s=>s.provider+' '+s.model).join(' | ')+'; descarga '+run.downloadedAt].join(''),fields.join(','),...visibleRows().map(r=>fields.map(k=>r[k]??'').join(','))];const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${spot.id}-forecast.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function refreshAdmin(){
 adminState=await api('/admin/state');
 for(const id of ['marine-rule-list','marine-subscriber-list'])$(id).innerHTML=adminState.lists.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
 $('marine-subscribers').innerHTML=adminState.subscribers.map(s=>`<p>${esc(s.email)} · ${esc(s.status)} <button data-test="${esc(s.id)}">Correo de prueba</button><button data-unsubscribe="${esc(s.id)}">Dar de baja</button></p>`).join('');
 $('marine-alert-state').innerHTML=`<h3>Reglas</h3>${adminState.rules.map(r=>`<p>${esc(r.spot_id)} · ${r.enabled?'activa':'desactivada'} <button data-toggle-rule="${esc(r.id)}">${r.enabled?'Desactivar':'Activar'}</button><br>${esc(r.configuration)}</p>`).join('')||'<p>Sin reglas guardadas</p>'}<h3>Historial de envíos</h3>${adminState.deliveries.map(d=>`<p>${esc(local(d.created_at))} · ${esc(d.status)} · intentos ${d.attempts} ${esc(d.error||'')}</p>`).join('')||'<p>Sin envíos</p>'}<h3>Evaluaciones recientes</h3>${adminState.evaluations.map(e=>`<p>${esc(local(e.evaluated_at))}: ${esc(e.result)}</p>`).join('')}`;
 $('marine-subscribers').querySelectorAll('[data-test]').forEach(b=>b.onclick=async()=>{try{const r=await api('/admin/test-email',{method:'POST',data:{subscriberId:b.dataset.test}});message('Proveedor aceptó el mensaje '+r.providerId+'. Confirma recepción en el buzón.');}catch(e){message(e);}});
 $('marine-subscribers').querySelectorAll('[data-unsubscribe]').forEach(b=>b.onclick=async()=>{try{await api('/admin/subscribers',{method:'DELETE',data:{id:b.dataset.unsubscribe}});await refreshAdmin();}catch(e){message(e);}});
 $('marine-alert-state').querySelectorAll('[data-toggle-rule]').forEach(b=>b.onclick=async()=>{try{const r=adminState.rules.find(r=>r.id===b.dataset.toggleRule);await api('/admin/rules',{method:'POST',data:{id:r.id,spotId:r.spot_id,listId:r.list_id,enabled:!r.enabled,...JSON.parse(r.configuration)}});await refreshAdmin();}catch(e){message(e);}});
 spots=adminState.spots;$('marine-spot').innerHTML=spots.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}${s.public?'':' · privado'}</option>`).join('');if(!spots.some(s=>s.id===spot?.id))spot=spots[0];if(spot){spot=spots.find(s=>s.id===spot.id);$('marine-spot').value=spot.id;editFields();}
}
function formAction(id,path,transform=x=>x){$(id).onsubmit=async e=>{e.preventDefault();try{const data=transform(Object.fromEntries(new FormData(e.target)));await api(path,{method:'POST',data});await refreshAdmin();runs.clear();mapMarkers();if(spot)exposure=spot.localParameters?.sectors?.length?spot.localParameters:exposureSectors(spot,geography);message('Guardado en el servidor.');}catch(err){message(err);}};}
$('marine-login').onsubmit=async e=>{e.preventDefault();try{const url=new URL($('marine-api').value);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('HTTPS requerido');apiBase=url.origin;token=$('marine-token').value;$('marine-token').value='';await refreshAdmin();localStorage.setItem('marine.apiBase',apiBase);$('marine-diagnostics').textContent=JSON.stringify(await api('/health',{auth:false}),null,2);message('Sesión administrativa conectada.');}catch(err){token='';message(err);}};
$('marine-logout').onclick=()=>{token='';adminState=null;$('marine-subscribers').replaceChildren();$('marine-alert-state').textContent='Sesión cerrada.';location.reload();};
formAction('marine-list','/admin/lists');formAction('marine-subscriber','/admin/subscribers',b=>({...b,consent:b.consent==='on'}));
formAction('marine-rule','/admin/rules',b=>({...b,spotId:spot.id,hours:Number($('marine-hours').value),cooldownHours:Number(b.cooldownHours),preferredHour:Number(b.preferredHour),enabled:b.enabled==='on',thresholds:rules}));
formAction('marine-edit','/admin/spots',b=>({...((b.id===spot.id)?spot:{}),...b,lat:Number(b.lat),lon:Number(b.lon),public:b.public==='on',localParameters:JSON.parse(b.localParameters||'{}'),thresholds:rules}));
$('marine-new').onclick=()=>{$('marine-edit').reset();$('marine-edit').elements.id.value=crypto.randomUUID();$('marine-edit').elements.localParameters.value='{}';};
$('marine-delete').onclick=async()=>{try{await api('/admin/spots',{method:'DELETE',data:{id:$('marine-edit').elements.id.value}});await refreshAdmin();mapMarkers();message('Ficha eliminada; registros originales conservados.');}catch(e){message(e);}};
$('marine-check').onclick=async()=>{try{message('Comprobando…');const r=await api('/admin/check',{method:'POST'});await refreshAdmin();message(r.status);}catch(e){message(e);}};
$('marine-compare').onclick=async()=>{try{message('Comparando datos reales…');const results=[];for(const s of spots.filter(s=>s.public)){try{const r=await fetchRun(s),a=assess(r,rules,{hours:Number($('marine-hours').value)});results.push({s,run:r,best:a.windows.sort((a,b)=>b.score-a.score)[0]});}catch{results.push({s});}}results.sort((a,b)=>(b.best?.score??-1)-(a.best?.score??-1));$('marine-ranking').innerHTML=results.map(({s,best,run:r})=>`<article class="marine-window"><button data-select="${esc(s.id)}">${esc(s.name)} ↗</button><p>${best?`${best.score}/100 · ${esc(local(best.start))} · ${best.hours} h · Hs ${format(best.rows[0].hs)} m · viento ${format(best.rows[0].wind)} m/s · corriente ${format(best.rows[0].current)} m/s`:'Sin ventana favorable verificable'}</p><small>${esc(r?.quality||'sin datos')} · corrientes costeras sin resolver</small></article>`).join('');$('marine-ranking').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{selectSpot(b.dataset.select);view('forecast');});message('');}catch(e){message(e);}};
$('marine-spot').onchange=e=>selectSpot(e.target.value);$('marine-refresh').onclick=()=>load(true);$('marine-map').onclick=()=>{view('map');window.spearfishingMap.setView([spot.lat,spot.lon],15);};$('marine-csv').onclick=downloadCSV;
for(const id of ['marine-date','marine-hours','marine-unit'])$(id).onchange=()=>render();
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));setInterval(()=>{if(run&&!fresh(run))render();},60000);
async function boot(){
 try{
  const [s,g]=await Promise.all([fetch('data/spots.json').then(r=>r.json()),fetch('data/coast.geojson').then(r=>r.json())]);spots=s;geography=g;
  if(apiBase)try{spots=await api('/spots',{auth:false});}catch(e){message(e);}
  $('marine-api').value=apiBase;$('marine-spot').innerHTML=spots.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  spot=spots.find(s=>s.id===new URLSearchParams(location.hash.slice(1)).get('spot'))||spots[0];
  exposure=exposureSectors(spot,geography);$('marine-spot').value=spot.id;editFields();mapMarkers();initThresholds();
  const btn=document.createElement('button');btn.className='marine-pilot-button';btn.textContent='◉ Mundaka · ver previsiones';btn.onclick=()=>view('forecast');document.querySelector('.sidebar-header').append(btn);
  if(location.hash.includes('spot='))view('forecast');
 }catch(e){message(e);}
}
boot();
