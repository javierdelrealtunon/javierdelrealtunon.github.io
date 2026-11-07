/* Shared cartographic symbols. Glyphs: vendored Lucide, see assets/lucide/LICENSE. */
(function(){
 const assetBase=new URL('../assets/lucide/',document.currentScript.src).href;
 const kinds={
  fishing:{type:'Sitio de pesca',label:'Pesca',color:'#0D766E',glyph:'fish',shape:'round'},
  parking:{type:'Aparcamiento',label:'Aparcamiento',color:'#245FAD',glyph:'square-letter-p',shape:'square'},
  entry:{type:'Punto de entrada',label:'Acceso',color:'#A9491B',glyph:'arrow-down-to-line',shape:'entry'},
  photo:{type:'Foto',label:'Foto',color:'#596575',glyph:'camera',shape:'photo'},
  forecast:{type:'Previsión',label:'Previsión',color:'#7150B5',glyph:'cloud-sun',shape:'diamond'},
  cluster:{type:'Varios elementos',label:'Varios',color:'#354F69',glyph:'layers',shape:'round'},
  editing:{type:'Geometría en edición',label:'Edición',color:'#AD3265',glyph:'move',shape:'round'}
 };
 const aliases={'Sitio de pesca':'fishing',Aparcamiento:'parking','Punto de entrada':'entry',Foto:'photo','Previsión':'forecast','#5baaff':'fishing','#62f0cf':'parking','#f0b962':'photo','#f06262':'entry','#43e1bb':'forecast'};
 for(const [id,value] of Object.entries(kinds))aliases[value.color.toLowerCase()]=id;
 const resolve=value=>Object.hasOwn(kinds,value)?value:Object.hasOwn(aliases,value)?aliases[value]:Object.hasOwn(aliases,String(value).toLowerCase())?aliases[String(value).toLowerCase()]:'cluster';
 const glyph=(name,extra='')=>`<span class="map-symbol-glyph ${extra}" style="--symbol-glyph:url('${assetBase}${name}.svg')" aria-hidden="true"></span>`;
 function html(type,{assigned=false,active=false,photo=false,count=0,selectedCount=0,partialLabel=''}={}){
  const id=resolve(type),kind=kinds[id],state=assigned?'is-assigned':active?'is-active':selectedCount?'is-partial':'';
  return `<span class="map-symbol-body kind-${id} shape-${kind.shape} ${state}" style="--symbol-color:${kind.color}" aria-hidden="true"><span class="map-symbol-surface">${glyph(kind.glyph)}</span>${assigned?`<span class="map-symbol-check">${glyph('check')}</span>`:''}${count>1?`<span class="map-symbol-count">${partialLabel||Math.floor(count)}</span>`:''}${photo&&id!=='photo'?`<span class="map-symbol-photo">${glyph('camera')}</span>`:''}</span>`;
 }
 function icon(type,options={}){const size=options.size||34;return L.divIcon({className:'map-marker'+(options.className?' '+options.className:''),html:html(type,options),iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2],tooltipAnchor:[0,-size/2]});}
 function clusterIcon(elements,selectedCount){const types=new Set(elements.map(e=>resolve(e.type))),type=types.size===1?[...types][0]:'cluster',assignable=elements.filter(e=>!e.reference).length;return icon(type,{count:elements.length,selectedCount,partialLabel:selectedCount>0&&selectedCount<assignable?`${Math.floor(selectedCount)}/${assignable}`:'',assigned:assignable>0&&selectedCount===assignable,className:'zone-element-cluster',size:34});}
 function groups(items,project,distance=34){
  const pixels=items.map(project),parents=items.map((_,i)=>i),root=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(Math.hypot(pixels[i].x-pixels[j].x,pixels[i].y-pixels[j].y)<distance)parents[root(j)]=root(i);
  const result=new Map();items.forEach((item,i)=>{const id=root(i),group=result.get(id)||[];group.push(item);result.set(id,group);});return [...result.values()];
 }
 function key(type){return `<span class="map-symbol-key">${html(type)}</span>`;}
 function legend({forecast=true}={}){return `<div class="map-symbol-legend" aria-label="Leyenda de símbolos">${['fishing','parking','entry','photo',...(forecast?['forecast']:[])].map(id=>`<span>${key(id)}<span>${kinds[id].label}</span></span>`).join('')}</div>`;}
 function vertexIcon(){return L.divIcon({className:'geometry-vertex-handle map-vertex-icon',html:`<span class="map-vertex-grip">${glyph('grip')}</span>`,iconSize:[24,24],iconAnchor:[12,12]});}
 const areaStyle={color:kinds.fishing.color,weight:2.3,opacity:.95,fillColor:kinds.fishing.color,fillOpacity:.07,className:'map-fishing-area'};
 window.MapSymbols=Object.freeze({kinds,resolve,html,icon,key,legend,clusterIcon,vertexIcon,areaStyle,glyph,groups});
 document.querySelectorAll('[data-symbol-type]').forEach(node=>node.innerHTML=key(node.dataset.symbolType));
})();
