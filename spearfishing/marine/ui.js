import {config} from '../config.js';
import {getForecast} from './providers.js';
import {getRegionalWave} from './regional.js';
import {fresh,finite,tideExtrema} from './core.js';
import {defaults,validateThresholds,evaluate,assess} from './conditions.js';
import {exposureSectors,localEstimate,waterSide} from './exposure.js';
import {windCoverage} from './wind.js';
import {localSpot,readLocalSpots,writeLocalSpots,mergeSpots,nearbySpot} from './locations.js';
import {ForecastStore,validateForecastSpot} from './forecast-store.js';
import {createZoneSection} from './zone-ui.js';
import {environmentSummary} from './environment.js';
import {createFeatureEditor} from './feature-ui.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=(v,n=2)=>finite(v)?v.toFixed(n):'—';
const local=(t,opts={dateStyle:'short',timeStyle:'short'})=>new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',...opts}).format(new Date(t));
const labels={favorable:'Favorable según umbrales',unfavorable:'Desfavorable',unknown:'Datos insuficientes',intermediate:'Intermedio'};
let spots=[],spot,run,geography,exposure,token='',adminState=null,charts=[],requestId=0;
let chartFilter='all';
let localSpots=[],serverSpots=[],pickingForecast=false;
let sharedSpots=[],backendSpots=[],kmlSources=[],zoneSpots=[];
let deletedForecastIds=new Set();
let forecastLayers={enabled:true,listVisible:true,hiddenIds:[]};
try{forecastLayers={...forecastLayers,...JSON.parse(localStorage.getItem('marine.forecastLayers.v1')||'{}')};if(!Array.isArray(forecastLayers.hiddenIds))forecastLayers.hiddenIds=[];}catch{}
const forecastMarkers=new Map();
const runs=new Map();
let apiBase=config.apiBase||localStorage.getItem('marine.apiBase')||'';
let rules=defaults;
try{rules=validateThresholds(JSON.parse(localStorage.getItem('marine.thresholds')||'{}'));}catch{}
const root=document.createElement('section');root.id='marine-panel';root.hidden=true;root.setAttribute('aria-label','Plataforma oceanometeorológica');
root.innerHTML=`<div class="marine-wrap"><div class="marine-top"><div><p class="marine-kicker">CANTÁBRICO / OBSERVATORIO DE CONDICIONES</p><h1 id="marine-title">Previsiones</h1></div><span class="marine-badge" id="marine-status" role="status">Sin descargar</span></div>
<div class="marine-toolbar"><label>Lugar<select id="marine-spot"></select></label><label>Desde (Madrid)<input type="date" id="marine-date"></label><label>Horizonte<select id="marine-hours"><option>24</option><option selected>48</option><option>72</option><option value="168">7 días disponibles</option></select></label><label>Velocidad<select id="marine-unit"><option value="1">m/s</option><option value="3.6">km/h</option><option value="1.943844">nudos</option></select></label><button id="marine-refresh">Actualizar</button><button id="marine-map">Ver en mapa ↗</button><button id="marine-csv">CSV ↓</button></div>
<p class="marine-notice">Herramienta de planificación. Una puntuación favorable no garantiza seguridad. Contrasta avisos oficiales, rompientes, corrientes costeras, acceso y restricciones legales; valora tu experiencia y las condiciones reales.</p>
<p id="marine-error" role="alert"></p>
<section data-marine-view="forecast"><div class="marine-metrics" id="marine-metrics"></div><p id="marine-cursor" class="marine-muted" aria-live="polite"></p>
<nav class="marine-variable-tabs" aria-label="Gráficos de previsión"><button data-chart-filter="all" aria-pressed="true">Todas las variables</button><button data-chart-filter="wave" aria-pressed="false">Oleaje</button><button data-chart-filter="wind" aria-pressed="false">Viento y rachas</button><button data-chart-filter="current" aria-pressed="false">Corrientes</button><button data-chart-filter="level" aria-pressed="false">Nivel del mar</button><button data-chart-filter="environment" aria-pressed="false">Temperatura y tiempo</button></nav>
<p id="marine-wind-status" class="marine-muted" role="status"></p><div id="marine-environment" class="marine-environment" aria-label="Temperaturas, precipitación y presión"></div><div class="marine-charts" id="marine-charts"></div>
<div class="marine-grid"><article class="marine-card"><h2>Ventanas según tus criterios</h2><div id="marine-windows">Carga una previsión para evaluar.</div><details><summary>Configurar umbrales y pesos</summary><form id="marine-thresholds" class="marine-form"></form></details></article><article class="marine-card"><h2>Exposición local</h2><div id="marine-exposure"></div></article></div>
<details class="marine-card"><summary>Procedencia, celdas y vigencia</summary><div id="marine-sources"></div></details>
<details class="marine-card"><summary>Tabla horaria accesible · tiempos Europe/Madrid</summary><div class="marine-scroll" id="marine-table"></div></details></section>
<section data-marine-view="alerts" hidden><article class="marine-card"><h2>Alertas del servidor</h2><p>Las comprobaciones programadas se ejecutan cada tres horas con la web cerrada. Es necesario configurar Worker, D1 y correo. Solo se envían oportunidades con datos completos y vigentes.</p><button id="marine-check">Comprobar ahora</button><div id="marine-alert-state">Conecta el backend e inicia sesión en Administración para consultar reglas e historial.</div><form id="marine-rule" class="marine-form"><h3>Guardar regla de aviso</h3><label>Tipo<select name="type"><option value="opportunity">Nueva oportunidad</option><option value="daily">Resumen diario</option><option value="weekly">Resumen semanal (lunes)</option><option value="deterioration">Empeoramiento significativo</option></select></label><label>Hora preferida (Madrid; resúmenes)<input name="preferredHour" type="number" min="0" max="21" value="9" required></label><p>Los resúmenes salen en la primera comprobación de las tres horas siguientes a la hora indicada.</p><label>Lista<select name="listId" id="marine-rule-list" required></select></label><label>Espera mínima entre avisos (h)<input name="cooldownHours" type="number" min="3" max="168" value="24" required></label><label><input name="enabled" type="checkbox" checked> Activada</label><p>Usa el lugar seleccionado, el horizonte y tus umbrales actuales.</p><button>Guardar en servidor</button></form></article></section>
<section data-marine-view="admin" hidden><div class="marine-grid"><article class="marine-card"><h2>Conexión administrativa</h2><form id="marine-login" class="marine-form"><label>URL del Worker<input id="marine-api" type="url" placeholder="https://spearfishing-forecast.…workers.dev" required></label><label>Credencial administrativa<input id="marine-token" type="password" autocomplete="off" minlength="32" required></label><p>La credencial permanece solo en memoria hasta cerrar o desconectar esta página.</p><button>Conectar</button><button type="button" id="marine-logout">Desconectar</button></form><pre id="marine-diagnostics">Backend no configurado.</pre></article>
<article class="marine-card"><h2>Listas y destinatarios</h2><form id="marine-list" class="marine-form"><label>Nombre de nueva lista<input name="name" maxlength="120" required></label><button>Crear lista</button></form><form id="marine-subscriber" class="marine-form"><label>Lista<select name="listId" id="marine-subscriber-list" required></select></label><label>Correo<input name="email" type="email" required></label><label><input name="consent" type="checkbox" required> Tengo autorización del destinatario para estos avisos.</label><button>Añadir destinatario</button></form><div id="marine-subscribers"></div><p>Los destinatarios se almacenan en D1 y solo son accesibles mediante autenticación. Cada aviso incluye baja con confirmación.</p></article>
<article class="marine-card"><h2>Ficha del lugar de previsión</h2><p>Independiente de puntos y fotografías de Google Sheets. Eliminar esta ficha no borra el KML ni registros originales.</p><form id="marine-edit" class="marine-form"><label>ID estable<input name="id" required pattern="[\\w-]{1,80}"></label><label>Nombre<input name="name" maxlength="160" required></label><label>Latitud<input name="lat" type="number" step="any" min="-90" max="90" required></label><label>Longitud<input name="lon" type="number" step="any" min="-180" max="180" required></label><label>Notas<textarea name="description"></textarea></label><label><input name="public" type="checkbox"> Lugar y coordenadas públicos</label><label>Parámetros locales / sectores manuales (JSON)<textarea name="localParameters" placeholder='{"sectors":[],"method":"manual","validationId":null}'></textarea></label><button>Guardar ficha en servidor</button><button type="button" id="marine-new">Nueva ficha</button><button type="button" id="marine-delete">Eliminar ficha seleccionada</button></form></article></div></section>
<p class="marine-footer">Datos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · Météo-France / Copernicus Marine · DWD · <a href="https://www.euskoos.eus/" target="_blank" rel="noopener">EuskOOS / Euskalmet-AZTI</a> · Costa © OpenStreetMap (ODbL). Sin validación observacional local.</p></div>`;
document.body.append(root);
const header=document.createElement('header');header.id='marine-nav';header.innerHTML=`<a class="marine-brand" href="#map">◉ <span>SPEARFISHING<small>FORECAST & ALERTS</small></span></a><nav aria-label="Secciones principales">${[['map','Mapa'],['zones','Zonas de pesca'],['alerts','Alertas'],['admin','Administración']].map(([id,label])=>`<button data-view="${id}" ${id==='map'?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;document.body.prepend(header);
const zoneSection=createZoneSection(root);
const featureEditor=createFeatureEditor();
window.addEventListener('spearfishing:geometry-opening',()=>{if(pickingForecast)stopForecastPick();});
window.addEventListener('spearfishing:edit-feature',event=>{view('map');featureEditor.open(event.detail?.sourceRef);});
window.addEventListener('spearfishing:open-zone',event=>{view('zones');zoneSection.open(event.detail);});
const locationDialog=document.createElement('dialog');
locationDialog.className='marine-wrap marine-location-dialog';locationDialog.setAttribute('aria-labelledby','marine-location-title');
locationDialog.innerHTML=`<h2 id="marine-location-title">Nueva ubicación de previsión</h2><p>Elige el punto en el visor. Se guardará en la base de datos para consultarlo desde otros dispositivos.</p><form id="marine-location-form" class="marine-form"><input name="id" type="hidden"><input name="lat" type="hidden"><input name="lon" type="hidden"><label>Nombre de la ubicación<input name="name" maxlength="160" required placeholder="Ej.: Punta de…"></label><label>Notas<textarea name="description" maxlength="2000" placeholder="Referencia del lugar o acceso"></textarea></label><label><input name="shared" type="checkbox"> Compartir ubicación en este visor</label><p>La base compartida es visible para quienes acceden a este visor. Las ubicaciones privadas requieren el backend autenticado.</p><p id="marine-location-coordinates"></p><p id="marine-location-error" role="alert"></p><button type="button" id="marine-location-pick">Cambiar punto en el mapa</button><button type="submit">Guardar en la base y ver previsión</button><button type="button" id="marine-location-remove" hidden>Eliminar ubicación de previsión</button><button type="button" id="marine-location-cancel">Cancelar</button></form>`;
document.body.append(locationDialog);
const locationForm=$('marine-location-form');
const pickBanner=document.createElement('div');pickBanner.className='marine-pick-banner';pickBanner.hidden=true;pickBanner.setAttribute('role','status');pickBanner.innerHTML='<span>Toca el mapa para situar la ubicación de previsión.</span><button type="button">Cancelar</button>';document.body.append(pickBanner);
const addLocationButton=document.createElement('button');addLocationButton.id='marine-add-location';addLocationButton.textContent='＋ Añadir ubicación';addLocationButton.onclick=()=>startForecastPick(true);
const editLocationButton=document.createElement('button');editLocationButton.id='marine-edit-location';editLocationButton.textContent='Editar ubicación';editLocationButton.hidden=true;editLocationButton.onclick=()=>editForecastLocation();
root.querySelector('.marine-toolbar').append(addLocationButton,editLocationButton);
const forecastLayerPanel=document.createElement('section');forecastLayerPanel.className='forecast-layer-section';forecastLayerPanel.setAttribute('aria-label','Capas de previsión');
forecastLayerPanel.innerHTML=`<div class="forecast-layer-heading"><span class="section-label">Previsiones <span id="forecast-layer-count"></span></span><button type="button" id="forecast-list-refresh" aria-label="Actualizar ubicaciones desde la base">↻</button></div><label class="layer-item"><span class="map-layer-symbol" aria-hidden="true">${window.MapSymbols.key('forecast')}</span><span class="layer-name">Ubicaciones de previsión</span><input id="forecast-layer-enabled" type="checkbox"><span class="toggle-track"><span class="toggle-thumb"></span></span></label><label class="forecast-list-switch"><input id="forecast-list-enabled" type="checkbox"> Mostrar listado de previsiones</label><p id="forecast-database-state" role="status">Conectando con la base compartida…</p><div id="forecast-location-list"><label class="forecast-search-label">Buscar ubicación<input id="forecast-location-search" type="search" placeholder="Nombre del sitio…"></label><div id="forecast-location-items"></div></div>`;
forecastLayerPanel.hidden=true;document.getElementById('info-panel').before(forecastLayerPanel);
addLocationButton.hidden=true;editLocationButton.hidden=true;$('marine-edit').closest('article').hidden=true;
window.addEventListener('spearfishing:zone-selected',event=>{spot=spots.find(s=>s.id===event.detail.id)||spot;renderSpotOptions();});
window.addEventListener('spearfishing:zones-updated',event=>{
 const previous=spot;spots=zoneSpots=event.detail.zones.map(z=>({...z.forecast,id:z.id,name:z.name,...z.forecastPoint,public:true,local:false,database:null,sourceRefs:[z.sourceRef]}));
 spot=spots.find(s=>s.id===previous?.id)||spots[0];if(previous&&spot&&(previous.lat!==spot.lat||previous.lon!==spot.lon)){runs.delete(spot.id);run=null;}renderSpotOptions();
});
$('forecast-layer-enabled').checked=forecastLayers.enabled;$('forecast-list-enabled').checked=forecastLayers.listVisible;
$('forecast-layer-enabled').onchange=event=>{forecastLayers.enabled=event.target.checked;persistForecastLayers();applyForecastVisibility();renderForecastList();};
$('forecast-list-enabled').onchange=event=>{forecastLayers.listVisible=event.target.checked;persistForecastLayers();renderForecastList();};
$('forecast-location-search').oninput=()=>renderForecastList();
$('forecast-list-refresh').onclick=async()=>{try{await refreshForecastSpots();message('Ubicaciones actualizadas desde la base compartida.');}catch(error){$('forecast-database-state').textContent=error.message;message(error);}};

function persistForecastLayers(){try{localStorage.setItem('marine.forecastLayers.v1',JSON.stringify(forecastLayers));}catch{}}
function renderForecastList(){
 $('forecast-layer-count').textContent=`(${spots.length})`;$('forecast-location-list').hidden=!forecastLayers.listVisible;
 const search=$('forecast-location-search').value.toLocaleLowerCase('es');
 const visible=spots.filter(s=>s.name.toLocaleLowerCase('es').includes(search));
 $('forecast-location-items').innerHTML=visible.map(s=>`<div class="forecast-location-row"><input type="checkbox" data-forecast-visible="${esc(s.id)}" aria-label="Mostrar previsión de ${esc(s.name)}" ${forecastLayers.hiddenIds.includes(s.id)?'':'checked'} ${forecastLayers.enabled?'':'disabled'}><button class="forecast-location-open" data-forecast-open="${esc(s.id)}">${esc(s.name)}<small>${s.local?'Pendiente de guardar en la base':s.database==='sheets'?'Base compartida':s.database==='d1'?'Base de datos':'Sin sincronizar'}</small></button><button class="forecast-location-locate" data-forecast-locate="${esc(s.id)}" aria-label="Centrar ${esc(s.name)} en el mapa">⌖</button></div>`).join('')||'<p class="forecast-empty">No hay ubicaciones con ese nombre.</p>';
 $('forecast-location-items').querySelectorAll('[data-forecast-visible]').forEach(box=>box.onchange=()=>{const id=box.dataset.forecastVisible;forecastLayers.hiddenIds=forecastLayers.hiddenIds.filter(x=>x!==id);if(!box.checked)forecastLayers.hiddenIds.push(id);persistForecastLayers();applyForecastVisibility();});
 $('forecast-location-items').querySelectorAll('[data-forecast-open]').forEach(button=>button.onclick=()=>{selectSpot(button.dataset.forecastOpen);view('forecast');});
 $('forecast-location-items').querySelectorAll('[data-forecast-locate]').forEach(button=>button.onclick=()=>{const s=spots.find(s=>s.id===button.dataset.forecastLocate);if(!s)return;view('map');window.spearfishingMap.setView([s.lat,s.lon],15);});
}
function combineForecastSpots(){
 const previous=spot;
 spots=zoneSpots;
 spot=spots.find(s=>s.id===previous?.id)||spots.find(s=>s.id==='mundaka-pilot')||spots[0];renderSpotOptions();mapMarkers();
 if(previous&&spot&&(spot.id!==previous.id||spot.lat!==previous.lat||spot.lon!==previous.lon)){runs.delete(spot.id);run=null;clearForecastForSelection();if(!root.hidden&&!root.querySelector('[data-marine-view="forecast"]').hidden)load();}
}
async function refreshForecastSpots(){await zoneSection.init();}

function applyForecastVisibility(){
 const map=window.spearfishingMap,group=window.marineSpotsLayer;if(!group)return;
 for(const [id,marker] of forecastMarkers){if(forecastLayers.hiddenIds.includes(id))group.removeLayer(marker);else if(!group.hasLayer(marker))group.addLayer(marker);}
 if(forecastLayers.enabled){if(!map.hasLayer(group))group.addTo(map);}else group.remove();
 if(run&&spot&&run.spotId===spot.id)updateMapVectors(visibleRows()[0]||{});else vectorLayer?.remove();
}

function renderSpotOptions(){
 $('marine-spot').innerHTML=spots.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}${s.local?' · este navegador':s.public?'':' · privado'}</option>`).join('');
 if(spot&&spots.some(s=>s.id===spot.id))$('marine-spot').value=spot.id;
 editLocationButton.hidden=true;renderForecastList();for(const [id,marker] of forecastMarkers)marker.setIcon(window.MapSymbols.icon('forecast',{active:id===spot?.id}));
}
function resetLocationForm(){
 locationForm.reset();locationForm.elements.id.value='';locationForm.elements.lat.value='';locationForm.elements.lon.value='';
 $('marine-location-title').textContent='Nueva ubicación de previsión';$('marine-location-error').textContent='';$('marine-location-remove').hidden=true;
}
function editForecastLocation(){
 if(!spot)return;resetLocationForm();
 for(const key of ['id','name','description','lat','lon'])locationForm.elements[key].value=spot[key]??'';
 locationForm.elements.shared.checked=spot.public===true;
 $('marine-location-title').textContent='Editar ubicación de previsión';$('marine-location-remove').hidden=false;showLocationDialog();
}
function showLocationDialog(){
 $('marine-location-coordinates').textContent=`Punto seleccionado: ${Number(locationForm.elements.lat.value).toFixed(6)}, ${Number(locationForm.elements.lon.value).toFixed(6)} (WGS84).`;
 if(!locationDialog.open)locationDialog.showModal();
}
function startForecastPick(newLocation=false){
 if(newLocation)resetLocationForm();
 if(locationDialog.open)locationDialog.close();
 pickingForecast=true;pickBanner.hidden=false;document.body.classList.add('marine-picking');view('map');
 window.spearfishingMap.getContainer().style.cursor='crosshair';
}
function stopForecastPick(){pickingForecast=false;pickBanner.hidden=true;document.body.classList.remove('marine-picking');window.spearfishingMap.getContainer().style.cursor='';}
pickBanner.querySelector('button').onclick=()=>{stopForecastPick();if(locationForm.elements.lat.value!=='')showLocationDialog();};
$('marine-location-pick').onclick=()=>startForecastPick();
$('marine-location-cancel').onclick=()=>locationDialog.close();
locationForm.onsubmit=async event=>{
 event.preventDefault();
 const button=locationForm.querySelector('[type="submit"]');button.disabled=true;$('marine-location-error').textContent='Guardando en la base de datos…';
 try{
  const value=Object.fromEntries(new FormData(locationForm));if(!value.id)delete value.id;
  if(value.lat===''||value.lon==='')throw new Error('Selecciona primero el punto en el mapa.');
  const previous=spots.find(s=>s.id===value.id)||{};
  const candidate=validateForecastSpot({...previous,...value,id:value.id||`forecast-${crypto.randomUUID()}`,lat:Number(value.lat),lon:Number(value.lon),public:locationForm.elements.shared.checked,thresholds:rules,pointMethod:'selección manual en el visor'}),duplicate=nearbySpot(candidate,spots);
  if(duplicate&&(!previous.id||candidate.lat!==previous.lat||candidate.lon!==previous.lon))throw new Error(`Ya existe «${duplicate.name}» a menos de 30 m. Selecciona otro punto o utiliza esa ubicación.`);
  const saved=await forecastStore.save(candidate);
  deletedForecastIds.delete(saved.id);
  sharedSpots=sharedSpots.filter(s=>s.id!==saved.id);sharedSpots.push(saved);
  if(localSpots.some(s=>s.id===saved.id)){try{localSpots=writeLocalSpots(localStorage,localSpots.filter(s=>s.id!==saved.id));}catch{/* The confirmed server record takes precedence over an old local copy. */}}
  combineForecastSpots();runs.delete(saved.id);$('forecast-database-state').textContent=`Base compartida · ${sharedSpots.length} ubicaciones guardadas`;
  locationDialog.close();selectSpot(saved.id);window.spearfishingMap.setView([saved.lat,saved.lon],15);view('forecast');message('Ubicación guardada y verificada en la base de datos. Disponible desde otros dispositivos.');
 }catch(error){$('marine-location-error').textContent=error.message;}finally{button.disabled=false;}
};
$('marine-location-remove').onclick=async()=>{
 const button=$('marine-location-remove');button.disabled=true;
 try{
  const id=locationForm.elements.id.value,current=spots.find(s=>s.id===id);
  if(current?.database){await forecastStore.remove(current);deletedForecastIds.add(id);sharedSpots=sharedSpots.filter(s=>s.id!==id);backendSpots=backendSpots.filter(s=>s.id!==id);}
  localSpots=writeLocalSpots(localStorage,localSpots.filter(s=>s.id!==id));runs.delete(id);combineForecastSpots();
  locationDialog.close();if(spot){selectSpot(spot.id);view('forecast');}else{run=null;view('map');}message('Ubicación de previsión eliminada; el sitio de pesca original se conserva.');
 }catch(error){$('marine-location-error').textContent=error.message;}finally{button.disabled=false;}
};
function serverSpotId(){if(!backendSpots.some(s=>s.id===spot?.id&&s.database==='d1'))throw new Error('La ubicación está en la base compartida. Para alertas automáticas, importa su ficha al backend D1 desde Administración.');return spot.id;}

function view(name){
 const forecastView=name==='forecast';if(forecastView)name='zones';
 if(name!=='map'&&featureEditor.isEditing){featureEditor.warn();return;}
 if(name!=='map'&&featureEditor.isOpen)featureEditor.cancel();
 if(name!=='map'&&pickingForecast)stopForecastPick();
 root.hidden=name==='map';document.body.classList.toggle('marine-open',name!=='map');
 document.getElementById('map').inert=name!=='map';document.getElementById('sidebar').inert=name!=='map'||(innerWidth<=680&&!document.getElementById('sidebar').classList.contains('open'));
 document.querySelectorAll('[data-marine-view]').forEach(s=>s.hidden=s.dataset.marineView!==name);
 header.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.view===name?'page':'false'));
 $('marine-title').textContent=({zones:'Zonas de pesca',forecast:'Previsión del lugar',alerts:'Oportunidades y alertas',admin:'Administración'})[name]||'Mapa';
 root.querySelector('.marine-toolbar').hidden=name==='zones';root.querySelector('.marine-notice').hidden=name==='zones';$('marine-status').hidden=name==='zones';$('marine-error').hidden=name==='zones';
 if(name==='zones')zoneSection.open(forecastView?{id:spot?.id,forecast:true}:undefined);
 if(name==='forecast') {if(!run&&!$('marine-refresh').disabled)load();else if(run)setTimeout(()=>charts.forEach(c=>c.resize()),0);}
 if(name==='map') setTimeout(()=>window.spearfishingMap.invalidateSize(),0);
}
header.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
header.querySelector('a').onclick=e=>{e.preventDefault();view('map');};
function message(error){$('marine-error').textContent=error?.message||String(error||'');}
root.addEventListener('click',event=>{
 const button=event.target.closest('[data-chart-filter]');
 if(!button)return;
 chartFilter=button.dataset.chartFilter;
 root.querySelectorAll('.marine-variable-tabs [data-chart-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartFilter===chartFilter)));
 if(run)render();
 if(button.closest('.marine-metric'))root.querySelector('.marine-variable-tabs').scrollIntoView({block:'start'});
});
async function api(path,{method='GET',data,auth=true}={}){
 if(!apiBase)throw new Error('Configura la URL del Worker en Administración.');
 if(auth&&!token)throw new Error('Inicia sesión en Administración.');
 const r=await fetch(apiBase.replace(/\/$/,'')+path,{method,cache:'no-store',headers:{...(data?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:`Bearer ${token}`}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const b=await r.json();if(!r.ok)throw new Error(b.error||`HTTP ${r.status}`);return b;
}
const forecastStore=new ForecastStore({mode:config.spotStorage||'sheets',api});
locationForm.elements.shared.required=forecastStore.mode==='sheets';
async function fetchRun(s,force=false){
 if(!force&&runs.has(s.id)&&fresh(runs.get(s.id),Date.now(),3))return runs.get(s.id);
 let r;
 if(apiBase&&s.database==='d1')r=force&&token?await api('/admin/refresh',{method:'POST',data:{spotId:s.id}}):await api((s.public?'/forecast':'/admin/forecast')+'?spot='+encodeURIComponent(s.id),{auth:!s.public});
 else {r=await getForecast(s);try{r.comparison=await getRegionalWave(s);}catch(e){r.errors.push({kind:'WAM',message:e.message});}}
 runs.set(s.id,r);return r;
}
async function load(force=false){
 if(!spot)return;const id=++requestId;$('marine-refresh').disabled=true;message('');$('marine-status').textContent='Consultando fuentes reales…';
 try{const r=await fetchRun(spot,force);if(id!==requestId)return;run=r;render();}
 catch(e){if(id!==requestId)return;run=null;message(e);$('marine-status').textContent='Previsión no disponible';$('marine-metrics').replaceChildren();$('marine-environment').replaceChildren();$('marine-windows').textContent='No se evalúan oportunidades sin datos.';charts.forEach(c=>c.dispose());charts=[];$('marine-charts').replaceChildren();$('marine-table').replaceChildren();$('marine-sources').textContent='Sin respuesta verificable';}
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
 $('marine-metrics').innerHTML=metric('Oleaje regional Hs',`${format(r.hs)} <em>m</em>`,`De ${format(r.waveDirection,0)}° · Tm ${format(r.tm,1)} s · Tp ${format(r.tp,1)} s`)+metric('Viento a 10 m',`${format(finite(r.wind)?r.wind*unit:null)} <em>${unitName}</em>`,`De ${format(r.windDirection,0)}° · Racha ${format(finite(r.gust)?r.gust*unit:null)} ${unitName}`)+metric('Corriente regional',`${format(finite(r.current)?r.current*unit:null)} <em>${unitName}</em>`,`Hacia ${format(r.currentDirection,0)}° · canal no resuelto`)+metric('Nivel regional MSL',`${format(r.level)} <em>m</em>`,extrema.slice(0,2).map(x=>`${x.kind} aprox. ${local(x.time)}`).join(' / ')||'Sin extremos verificables')+metric('Favorabilidad',score.score===null?'—':`${score.score}<em>/100</em>`,labels[score.status])+metric('Calidad',valid?'Regional':'Caducada','Sin calibración local');
 $('marine-cursor').textContent=rows.length?`Valores de ${local(r.time)} · ${rows.length} horas disponibles · viento/oleaje: de procedencia; corriente: hacia destino.`:'Sin horas disponibles para este filtro.';
 const windButton=document.createElement('button');windButton.dataset.chartFilter='wind';windButton.textContent='Ver previsión horaria →';$('marine-metrics').children[1].append(windButton);
 $('marine-environment').innerHTML=environmentSummary(rows).map(v=>`<article title="${esc(v.description)} · ${v.count}/${v.total} horas disponibles"><span>${esc(v.label)}</span><strong>${format(v.value,1)} <small>${esc(v.unit)}</small></strong></article>`).join('');
 const coverage=windCoverage(rows),weather=run.sources.find(s=>s.kind==='weather');
 $('marine-wind-status').textContent=coverage.status==='missing'?'Viento no disponible para este intervalo. Pulsa Actualizar para reintentar; la ausencia de datos no significa calma.':`Viento previsto a 10 m: ${coverage.speed}/${coverage.total} horas · rachas: ${coverage.gust}/${coverage.total} · dirección de procedencia: ${coverage.direction}/${coverage.total}. Fuente: ${weather?.provider||'no identificada'} · ${weather?.model||'modelo no publicado'}.`;
 $('marine-wind-status').classList.toggle('marine-warning',coverage.status!=='complete');
 const outcome=assess({...run,rows},rules,{now:Math.max(Date.now(),Date.parse(rows[0]?.time)||0),hours:Number($('marine-hours').value)});
 $('marine-windows').innerHTML=outcome.windows.length?outcome.windows.map(w=>`<p class="marine-window">${esc(local(w.start))} → ${esc(local(w.end))}<br><strong>${w.hours} h · ${w.score}/100</strong></p>`).join(''):`<p>No hay ventanas que cumplan todos los criterios durante al menos ${rules.minHours} h. ${score.missing.length?'Faltan: '+esc(score.missing.join(', ')):score.critical.length?'Superaciones: '+esc(score.critical.join(', ')):''}</p>`;
 const est=localEstimate(r,exposure),water=waterSide(spot,geography);
 $('marine-exposure').innerHTML=drawRose()+`<p>Oleaje incidente: ${esc(est.waveExposure?.classification||'sin clasificar')}. Viento: ${esc(est.windExposure?.classification||'sin clasificar')}.</p><p><strong>Hs local: no estimada.</strong> No hay parámetros calibrados. Corriente regional sin corrección por abrigo.</p><p>Comprobación de costa: ${water.water===true?'lado marino':water.water===false?'lado terrestre: revisar ficha':'sin verificación'}${finite(water.distance)?' · '+format(water.distance,0)+' m a costa OSM':''}. Geometría limitada al recorte; sin batimetría numérica ni relieve.</p><details><summary>Sectores y método</summary><p>${esc(exposure.method)}</p><div class="marine-scroll"><table><tr><th>Rumbo</th><th>Distancia a obstáculo</th><th>Resultado</th></tr>${exposure.sectors.map(s=>`<tr><td>${s.bearing}°</td><td>${s.censored?'≥':''}${s.fetchM} m</td><td>${esc(s.classification)}${s.censored?' · sin intersección en el alcance':''}</td></tr>`).join('')}</table></div></details>`;
 $('marine-sources').innerHTML=[...run.sources,...(run.comparison?[run.comparison]:[])].map(s=>`<p><strong>${esc(s.provider)} · ${esc(s.model)}</strong><br>${esc(s.nativeResolution)} · celda ${format(s.cell.lat,5)}, ${format(s.cell.lon,5)} · ${format(s.cell.distanceKm,1)} km al lugar<br>Descarga ${esc(local(s.downloadedAt))} · ciclo: ${esc(s.runCycle||'no publicado')} · generación: ${esc(s.generatedAt||'no publicada')}${s.coverageEnd?' · cobertura hasta '+esc(local(s.coverageEnd)):''}</p>`).join('')+run.notes.map(n=>`<p>${esc(n)}</p>`).join('')+run.errors.map(e=>`<p class="marine-warning">${esc(e.kind)}: ${esc(e.message)}</p>`).join('');
 $('marine-table').innerHTML=`<table><thead><tr>${['Madrid','Hs m','Tm s','Tp s','Oleaje de °','Viento m/s','Racha m/s','Viento de °','Corriente m/s','Hacia °','U m/s','V m/s','MSL m','Aire °C','Agua superficial °C','Precip. hora anterior mm','Presión MSL hPa','Valoración'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(local(x.time))}</td>${['hs','tm','tp','waveDirection','wind','gust','windDirection','current','currentDirection','u','v','level','airTemp','sst','rain','pressure'].map(k=>`<td>${format(x[k])}</td>`).join('')}<td>${labels[evaluate(x,rules,{valid}).status]}</td></tr>`).join('')}</tbody></table>`;
 drawCharts(rows);updateMapVectors(r);
}
function drawCharts(rows){
 charts.forEach(c=>c.dispose());charts=[];$('marine-charts').replaceChildren();
 if(!window.echarts){$('marine-charts').textContent='No se ha podido cargar la librería de gráficos. La tabla mantiene todos los valores.';return;}
 const groups=[['Oleaje y componentes · m',['hs','windWave','swell','secondarySwell'],['Hs regional','Mar de viento','Mar de fondo','Fondo secundario']],['Periodos · s',['tm','tp'],['Tm medio','Tp pico']],['Viento · m/s',['wind','gust'],['Viento','Rachas']],['Corrientes · m/s',['current','u','v'],['Velocidad','U este','V norte']],['Nivel del mar · m MSL',['level'],['Nivel incluido efecto mareal']],['Direcciones · oleaje/viento de; corriente hacia',['waveDirection','windDirection','currentDirection'],['Oleaje de','Viento de','Corriente hacia']],['Temperatura · °C',['airTemp','sst'],['Aire a 2 m','Agua superficial']],['Precipitación · mm en la hora anterior',['rain'],['Precipitación total']],['Presión a nivel del mar · hPa',['pressure'],['Presión MSL']]];
 const category=fields=>['airTemp','rain','pressure'].includes(fields[0])?'environment':fields[0]==='wind'?'wind':fields[0]==='current'?'current':fields[0]==='level'?'level':['hs','tm'].includes(fields[0])?'wave':'all';
 const visibleGroups=groups.filter(([,fields])=>chartFilter==='all'||category(fields)===chartFilter);
 if(chartFilter==='wind')visibleGroups.push(['Dirección del viento · procedencia °',['windDirection'],['Viento de']]);
 const unit=Number($('marine-unit').value),unitName=$('marine-unit').selectedOptions[0].text;
 for(const [originalTitle,fields,names] of visibleGroups){
  const isSpeed=fields[0]==='wind'||fields[0]==='current',title=isSpeed?originalTitle.replace('m/s',unitName):originalTitle;
  const card=document.createElement('article');card.className='marine-card marine-chart-card';const heading=document.createElement('h2');heading.textContent=title;const btn=document.createElement('button');btn.textContent='PNG ↓';const div=document.createElement('div');div.className='marine-chart';div.setAttribute('aria-label',title);card.append(heading,btn,div);$('marine-charts').append(card);
  const chart=window.echarts.init(div,null,{renderer:'canvas'});chart.group='marine';
  const directions=fields.every(key=>key.endsWith('Direction'));
  const series=fields.map((key,i)=>directions?({name:names[i],type:'scatter',symbol:'arrow',symbolSize:12,data:rows.filter(r=>finite(r[key])).map(r=>({value:[Date.parse(r.time),i+1,r[key]],symbolRotate:-(r[key]+(key==='currentDirection'?0:180))}))}):({name:names[i],type:key==='rain'?'bar':'line',showSymbol:false,connectNulls:false,data:rows.map(r=>[Date.parse(r.time),finite(r[key])?r[key]*(isSpeed?unit:1):null])}));
  if(fields[0]==='hs'&&run.comparison)series.push({name:'EuskOOS WAM · nativo',type:'line',showSymbol:true,symbolSize:3,connectNulls:false,lineStyle:{type:'dashed'},data:run.comparison.rows.filter(r=>rows.length&&Date.parse(r.time)>=Date.parse(rows[0].time)&&Date.parse(r.time)<=Date.parse(rows.at(-1).time)).map(r=>[Date.parse(r.time),r.hs])});
  chart.setOption({color:['#4ee0c0','#69aefe','#f0bd69','#b395ff'],textStyle:{color:'#acbfcd'},animation:false,legend:{top:0,textStyle:{color:'#acbfcd'},type:'scroll'},grid:{left:50,right:16,top:45,bottom:70},tooltip:{trigger:'axis',confine:true,valueFormatter:v=>format(v),formatter:items=>`${esc(local(items[0].value[0]))}<br>${items.map(p=>`${esc(p.seriesName)}: ${format(directions?p.value[2]:p.value[1])}${directions?'°':''}`).join('<br>')}<br>Previsión regional; fuentes en procedencia`},axisPointer:{link:[{xAxisIndex:'all'}]},xAxis:{type:'time',splitNumber:4,axisLabel:{hideOverlap:true,formatter:v=>local(v,{hour:'2-digit',minute:'2-digit'})+'\n'+local(v,{day:'2-digit',month:'2-digit'})}},yAxis:{type:'value',...(['airTemp','pressure'].includes(fields[0])?{scale:true}:{}),...(directions?{min:0,max:4,interval:1,axisLabel:{formatter:v=>['','Oleaje','Viento','Corriente',''][v]}}:{}),splitLine:{lineStyle:{color:'#233e50'}}},dataZoom:[{type:'inside'},{type:'slider',height:20,bottom:10}],series});
  if(directions&&fields.length===1)chart.setOption({yAxis:{min:0,max:2,axisLabel:{formatter:value=>value===1?'Viento':''}}});
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
 if(!forecastLayers.enabled||!spot||forecastLayers.hiddenIds.includes(spot.id))return;
 for(const [direction,label,from,offset,color] of [[r.waveDirection,'Oleaje',true,0,window.MapSymbols.kinds.fishing.color],[r.windDirection,'Viento',true,.001,window.MapSymbols.kinds.forecast.color],[r.currentDirection,'Corriente',false,-.001,window.MapSymbols.kinds.parking.color]]){
  if(!finite(direction))continue;
  L.marker([spot.lat+offset,spot.lon+.0015],{interactive:false,icon:L.divIcon({className:'marine-vector',html:`<span class="map-vector-arrow" style="color:${color};transform:rotate(${direction+(from?180:0)}deg)">${window.MapSymbols.glyph('navigation-2')}</span><small>${label} ${format(direction,0)}° ${from?'de':'hacia'}</small>`,iconSize:[90,40]})}).addTo(vectorLayer);
 }
 vectorLayer.addTo(m);
}
function mapMarkers(){
 const m=window.spearfishingMap;if(!m)return;
 window.marineSpotsLayer?.remove();forecastMarkers.clear();const layer=L.layerGroup();
 window.marineSpotsLayer=layer;
 if(!window.marineCoastLayer && geography?.features?.length)window.marineCoastLayer=L.geoJSON(geography,{style:{color:'#718595',weight:1.1,opacity:.4,fillOpacity:0,dashArray:'2 5',className:'map-reference-coast'},interactive:false}).addTo(m);
 const bathymetry=window.marineBathymetry||L.tileLayer.wms('https://ows.emodnet-bathymetry.eu/wms',{layers:'emodnet:mean_atlas_land',format:'image/png',transparent:true,opacity:.6,attribution:'EMODnet Bathymetry (visualización; no análisis numérico)'});window.marineBathymetry=bathymetry;
 if(window.marineLayerControl)window.marineLayerControl.remove();window.marineLayerControl=L.control.layers({}, {'Batimetría EMODnet (visual)':bathymetry},{position:'topright'}).addTo(m);applyForecastVisibility();
}
function initForecastMap(){
 const map=window.spearfishingMap;
 const control=L.control({position:'topleft'});
 control.onAdd=()=>{
  const box=L.DomUtil.create('div','marine-map-location-control');
  const button=L.DomUtil.create('button','',box);button.type='button';button.textContent='＋ Añadir ubicación de previsión';
  L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
  button.onclick=()=>startForecastPick(true);return box;
 };
 control.addTo(map);
 map.on('click',event=>{
  if(!pickingForecast)return;
  locationForm.elements.lat.value=event.latlng.lat.toFixed(6);locationForm.elements.lon.value=event.latlng.lng.toFixed(6);
  stopForecastPick();showLocationDialog();
 });
}
function editFields(){const f=$('marine-edit');for(const k of ['id','name','lat','lon','description'])f.elements[k].value=spot?.[k]??'';f.elements.public.checked=spot?.public===true;f.elements.localParameters.value=JSON.stringify(spot?.localParameters||{},null,2);}
function clearForecastForSelection(){
 charts.forEach(chart=>chart.dispose());charts=[];
 for(const id of ['marine-metrics','marine-environment','marine-charts','marine-table','marine-sources','marine-exposure'])$(id).replaceChildren();
 $('marine-windows').textContent='Esperando datos para evaluar esta ubicación.';
 $('marine-cursor').textContent=`${spot.name} · ${spot.lat.toFixed(6)}, ${spot.lon.toFixed(6)}`;
 $('marine-wind-status').textContent='Consultando la previsión de viento para esta ubicación…';
 vectorLayer?.remove();
}
function selectSpot(id){spot=spots.find(s=>s.id===id)||spots[0];if(!spot)return;renderSpotOptions();if(spot.thresholds){rules=validateThresholds(spot.thresholds);initThresholds();}$('marine-spot').value=spot.id;exposure=spot.localParameters?.sectors?.length?{...spot.localParameters,quality:'manual-unvalidated'}:exposureSectors(spot,geography);run=null;clearForecastForSelection();editFields();load();}
function downloadCSV(){if(!run)return;const fields=['time','hs','tm','tp','waveDirection','wind','gust','windDirection','current','currentDirection','u','v','level','sst','airTemp','rain','pressure','day'];const rows=[['# UTC; viento/corriente m/s; temperaturas degC; precipitacion mm en hora anterior; presion MSL hPa; procedencia: '+run.sources.map(s=>s.provider+' '+s.model).join(' | ')+'; descarga '+run.downloadedAt].join(''),fields.join(','),...visibleRows().map(r=>fields.map(k=>r[k]??'').join(','))];const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${spot.id}-forecast.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function refreshAdmin(){
 adminState=await api('/admin/state');
 for(const id of ['marine-rule-list','marine-subscriber-list'])$(id).innerHTML=adminState.lists.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
 $('marine-subscribers').innerHTML=adminState.subscribers.map(s=>`<p>${esc(s.email)} · ${esc(s.status)} <button data-test="${esc(s.id)}">Correo de prueba</button><button data-unsubscribe="${esc(s.id)}">Dar de baja</button></p>`).join('');
 $('marine-alert-state').innerHTML=`<h3>Reglas</h3>${adminState.rules.map(r=>`<p>${esc(r.spot_id)} · ${r.enabled?'activa':'desactivada'} <button data-toggle-rule="${esc(r.id)}">${r.enabled?'Desactivar':'Activar'}</button><br>${esc(r.configuration)}</p>`).join('')||'<p>Sin reglas guardadas</p>'}<h3>Historial de envíos</h3>${adminState.deliveries.map(d=>`<p>${esc(local(d.created_at))} · ${esc(d.status)} · intentos ${d.attempts} ${esc(d.error||'')}</p>`).join('')||'<p>Sin envíos</p>'}<h3>Evaluaciones recientes</h3>${adminState.evaluations.map(e=>`<p>${esc(local(e.evaluated_at))}: ${esc(e.result)}</p>`).join('')}`;
 $('marine-subscribers').querySelectorAll('[data-test]').forEach(b=>b.onclick=async()=>{try{const r=await api('/admin/test-email',{method:'POST',data:{subscriberId:b.dataset.test}});message('Proveedor aceptó el mensaje '+r.providerId+'. Confirma recepción en el buzón.');}catch(e){message(e);}});
 $('marine-subscribers').querySelectorAll('[data-unsubscribe]').forEach(b=>b.onclick=async()=>{try{await api('/admin/subscribers',{method:'DELETE',data:{id:b.dataset.unsubscribe}});await refreshAdmin();}catch(e){message(e);}});
 $('marine-alert-state').querySelectorAll('[data-toggle-rule]').forEach(b=>b.onclick=async()=>{try{const r=adminState.rules.find(r=>r.id===b.dataset.toggleRule);await api('/admin/rules',{method:'POST',data:{id:r.id,spotId:r.spot_id,listId:r.list_id,enabled:!r.enabled,...JSON.parse(r.configuration)}});await refreshAdmin();}catch(e){message(e);}});
 backendSpots=adminState.spots.map(s=>({...s,database:'d1'}));combineForecastSpots();if(spot)editFields();
}
function formAction(id,path,transform=x=>x){$(id).onsubmit=async e=>{e.preventDefault();try{const data=transform(Object.fromEntries(new FormData(e.target)));await api(path,{method:'POST',data});await refreshAdmin();runs.clear();mapMarkers();if(spot)exposure=spot.localParameters?.sectors?.length?spot.localParameters:exposureSectors(spot,geography);message('Guardado en el servidor.');}catch(err){message(err);}};}
$('marine-login').onsubmit=async e=>{e.preventDefault();try{const url=new URL($('marine-api').value);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('HTTPS requerido');apiBase=url.origin;token=$('marine-token').value;$('marine-token').value='';await refreshAdmin();localStorage.setItem('marine.apiBase',apiBase);$('marine-diagnostics').textContent=JSON.stringify(await api('/health',{auth:false}),null,2);message('Sesión administrativa conectada.');}catch(err){token='';message(err);}};
$('marine-logout').onclick=()=>{token='';adminState=null;$('marine-subscribers').replaceChildren();$('marine-alert-state').textContent='Sesión cerrada.';location.reload();};
formAction('marine-list','/admin/lists');formAction('marine-subscriber','/admin/subscribers',b=>({...b,consent:b.consent==='on'}));
formAction('marine-rule','/admin/rules',b=>({...b,spotId:serverSpotId(),hours:Number($('marine-hours').value),cooldownHours:Number(b.cooldownHours),preferredHour:Number(b.preferredHour),enabled:b.enabled==='on',thresholds:rules}));
formAction('marine-edit','/admin/spots',b=>({...((b.id===spot.id)?spot:{}),...b,local:false,lat:Number(b.lat),lon:Number(b.lon),public:b.public==='on',localParameters:JSON.parse(b.localParameters||'{}'),thresholds:rules}));
$('marine-new').onclick=()=>{$('marine-edit').reset();$('marine-edit').elements.id.value=crypto.randomUUID();$('marine-edit').elements.localParameters.value='{}';};
$('marine-delete').onclick=async()=>{try{await api('/admin/spots',{method:'DELETE',data:{id:$('marine-edit').elements.id.value}});await refreshAdmin();mapMarkers();message('Ficha eliminada; registros originales conservados.');}catch(e){message(e);}};
$('marine-check').onclick=async()=>{try{message('Comprobando…');const r=await api('/admin/check',{method:'POST'});await refreshAdmin();message(r.status);}catch(e){message(e);}};
$('marine-spot').onchange=e=>selectSpot(e.target.value);$('marine-refresh').onclick=()=>load(true);$('marine-map').onclick=()=>{view('map');window.spearfishingMap.setView([spot.lat,spot.lon],15);};$('marine-csv').onclick=downloadCSV;
for(const id of ['marine-date','marine-hours','marine-unit'])$(id).onchange=()=>render();
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));setInterval(()=>{if(run&&!fresh(run))render();},60000);
async function boot(){
 try{
  geography=await fetch('data/coast.geojson').then(r=>r.json());

  $('marine-api').value=apiBase;
  try{await refreshForecastSpots();}catch(error){$('forecast-database-state').textContent='Base compartida no disponible. Pulsa ↻ para reintentar.';message(error);}
  spot=spots.find(s=>s.id===new URLSearchParams(location.hash.slice(1)).get('spot'))||spots.find(s=>s.id==='mundaka-pilot')||spots[0];
  exposure=spot?exposureSectors(spot,geography):{sectors:[],method:'Sin ubicación'};if(spot){$('marine-spot').value=spot.id;editFields();}renderSpotOptions();mapMarkers();initThresholds();

  if(location.hash.includes('spot=')||header.querySelector('[data-view="zones"]').getAttribute('aria-current')==='page')view('forecast');
 }catch(e){message(e);}
}
boot();
