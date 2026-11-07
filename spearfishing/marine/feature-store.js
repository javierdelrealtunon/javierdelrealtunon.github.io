import {ZoneStore} from './zones.js';
import {featureRecordType,featureSchema,validateFeature,decodeFeatureRows} from './geometry.js';
export class FeatureStore{
 constructor(options={}){this.base=new ZoneStore(options);}
 async load(){const {rows}=await this.base.load();return {rows,records:decodeFeatureRows(rows)};}
 async save(input,{baseRevision=null,publicConsent=false}={}){
  const feature=validateFeature(input);if(!publicConsent)throw Error('Confirma que quieres compartir los cambios del elemento.');
  const snapshot=await this.load();if((snapshot.records.get(feature.sourceRef)?.revision||null)!==baseRevision)throw Error('Otra sesión ha editado este elemento. Cancela y vuelve a abrir su edición para cargar la última versión.');
  const revision=crypto.randomUUID(),point=feature.geometry.type==='Point'?feature.geometry.coordinates:feature.geometry.coordinates[0][0];
  await this.base.write({registro_id:`feature-event-${revision}`,tipo:featureRecordType,nombre:/^[=+@-]/.test(feature.name)?"'"+feature.name:feature.name,lat:String(point[1]).replace('.',','),lng:String(point[0]).replace('.',','),notas:JSON.stringify({schema:featureSchema,...feature,revision,updatedAt:new Date().toISOString()}),autor:'Spearfishing / Editor del visor',foto_url:'',coord_origen:feature.coordinateSource});
  for(let i=0;i<3;i++){if(i)await this.base.sleep(600*i);const data=await this.load();if(data.records.get(feature.sourceRef)?.revision===revision)return data;}
  throw Error('El servidor aceptó la edición, pero su lectura sigue sin verificar. Cancela y actualiza el visor antes de repetir.');
 }
}
