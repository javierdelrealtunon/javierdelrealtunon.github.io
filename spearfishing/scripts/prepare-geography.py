"""Rebuild derived pilot geometry from original KML and downloaded OSM XML (no credentials)."""
import json, pathlib, xml.etree.ElementTree as E
root=pathlib.Path(__file__).resolve().parents[1]
ns={'k':'http://www.opengis.net/kml/2.2'}
k=E.parse(root/'kml/sitios.kml')
p=k.findall('.//k:Placemark',ns)[7]
ring=[[float(v) for v in s.split(',')[:2]] for s in p.find('.//k:coordinates',ns).text.split()]
osm=E.parse(root/'data/coast.osm');nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in osm.findall('node')}
features=[]
for way in osm.findall('way'):
    tags={t.attrib['k']:t.attrib['v'] for t in way.findall('tag')}
    if tags.get('natural')=='coastline' or tags.get('man_made') in ('breakwater','groyne'):
        coords=[nodes[n.attrib['ref']] for n in way.findall('nd') if n.attrib['ref'] in nodes]
        if len(coords)>1:features.append({'type':'Feature','properties':{'osmWay':way.attrib['id'],**tags},'geometry':{'type':'LineString','coordinates':coords}})
geo={'type':'FeatureCollection','source':{'name':'OpenStreetMap contributors','license':'ODbL 1.0','downloadedAt':'2026-10-25','bbox':[-2.71,43.407,-2.69,43.424],'url':'https://api.openstreetmap.org/api/0.6/map?bbox=-2.71,43.407,-2.69,43.424'},'features':features}
(root/'data/coast.geojson').write_text(json.dumps(geo),encoding='utf-8')
spot={'id':'mundaka-pilot','name':'Mundaka — Zona piloto','lat':43.416,'lon':-2.7005,'public':True,'originalSource':'kml/sitios.kml','originalId':'placemark:7','description':'Punto de evaluación regional dentro del polígono KML existente. Corrientes estuarinas sin resolver.','geometry':{'type':'Polygon','coordinates':[ring]},'depthM':None,'access':None,'restrictions':'Consultar normativa y restricciones oficiales de Urdaibai antes de la salida.','localConfidence':'sin calibración','thresholds':None}
(root/'data/spots.json').write_text(json.dumps([spot],ensure_ascii=False,indent=2),encoding='utf-8')
print('Coastal features:',len(features),'KML ring vertices:',len(ring))
