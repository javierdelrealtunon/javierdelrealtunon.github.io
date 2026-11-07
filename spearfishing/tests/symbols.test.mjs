import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync,existsSync} from 'node:fs';
const context={window:{},URL,L:{divIcon:value=>value},document:{currentScript:{src:'https://example.test/spearfishing/marine/map-symbols.js'},querySelectorAll:()=>[]}};
vm.runInNewContext(readFileSync(new URL('../marine/map-symbols.js',import.meta.url),'utf8'),context);const symbols=context.window.MapSymbols;
function luminance(hex){const channels=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('map categories have distinct glyphs and forecast and parking cannot resolve to the same symbol',()=>{
 const types=['fishing','parking','entry','photo','forecast'];assert.equal(new Set(types.map(t=>symbols.kinds[t].glyph)).size,5);assert.equal(new Set(types.map(t=>symbols.kinds[t].color)).size,5);assert.notEqual(symbols.resolve('#62f0cf'),symbols.resolve('#43e1bb'));assert.equal(symbols.resolve('Aparcamiento'),'parking');assert.equal(symbols.resolve('Punto de entrada'),'entry');assert.equal(symbols.resolve('__proto__'),'cluster');assert.equal(symbols.resolve('<img onerror=alert(1)>'),'cluster');
});
test('symbol glyphs maintain strong contrast on their light surfaces and selected glyphs on ink',()=>{
 for(const type of Object.values(symbols.kinds))assert.ok(contrast(type.color,'#FFFFFF')>=4.5,`${type.type} contrast`);const ink=readFileSync(new URL('../marine/symbology.css',import.meta.url),'utf8').match(/--map-ink:(#[a-f\d]{6})/i)[1];assert.ok(contrast(ink,'#FFFFFF')>10);
});
test('assignment and mixed groups have explicit non-colour indicators without changing category',()=>{
 const assigned=symbols.icon('parking',{assigned:true});assert.match(assigned.html,/kind-parking/);assert.match(assigned.html,/map-symbol-check/);assert.match(assigned.html,/is-assigned/);
 const mixed=symbols.clusterIcon([{type:'Aparcamiento'},{type:'Punto de entrada'}],1);assert.match(mixed.html,/kind-cluster/);assert.match(mixed.html,/is-partial/);assert.match(mixed.html,/>1\/2<\/span>/);assert.doesNotMatch(mixed.html,/is-assigned/);
 const same=symbols.clusterIcon([{type:'Aparcamiento'},{type:'Aparcamiento'}],2);assert.match(same.html,/kind-parking/);assert.match(same.html,/map-symbol-check/);
});
test('every cartographic glyph is an available local library asset, including operational states',()=>{
 const names=new Set([...Object.values(symbols.kinds).map(k=>k.glyph),'check','grip','navigation-2']);for(const name of names)assert.ok(existsSync(new URL(`../assets/lucide/${name}.svg`,import.meta.url)),name);assert.ok(existsSync(new URL('../assets/lucide/LICENSE',import.meta.url)));assert.doesNotMatch(symbols.icon('parking').html,/<svg/);assert.match(symbols.legend(),/Leyenda de símbolos/);
});

test('screen-distance grouping removes overlap and separates symbols when zoom increases without altering data',()=>{
 const items=[{id:'parking',x:0,y:0},{id:'entry',x:20,y:0},{id:'photo',x:100,y:0}],before=JSON.stringify(items);
 const near=symbols.groups(items,e=>({x:e.x,y:e.y}));assert.equal(near.length,2);assert.equal(near[0].length,2);const zoomed=symbols.groups(items,e=>({x:e.x*4,y:e.y*4}));assert.equal(zoomed.length,3);assert.equal(JSON.stringify(items),before);
 const group=symbols.clusterIcon([{type:'Aparcamiento'},{type:'Previsión',reference:true}],1);assert.match(group.html,/is-assigned/);
});
