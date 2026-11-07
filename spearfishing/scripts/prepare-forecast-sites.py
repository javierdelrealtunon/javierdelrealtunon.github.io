"""Derive one reproducible interior forecast point per existing KML placemark."""
from pathlib import Path
import hashlib,json,math,xml.etree.ElementTree as E

root=Path(__file__).resolve().parents[1]
ns={'k':'http://www.opengis.net/kml/2.2'}
tree=E.parse(root/'kml/sitios.kml')
pilot=json.loads((root/'data/spots.json').read_text(encoding='utf-8'))[0]

def inside(point,ring):
    x,y=point; result=False
    for a,b in zip(ring,ring[1:]+ring[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: result=not result
    return result

def interior_point(ring):
    lo=min(p[1] for p in ring); hi=max(p[1] for p in ring)
    scale=math.cos(math.radians((lo+hi)/2));best=None
    edges=list(zip(ring,ring[1:]+ring[:1]))
    for n in range(64):
        y=lo+(hi-lo)*(n+.5)/64
        xs=sorted(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]) for a,b in edges if (a[1]>y)!=(b[1]>y))
        for a,b in zip(xs[::2],xs[1::2]):
            point=((a+b)/2,y)
            if not inside(point,ring):continue
            distances=[]
            for start,end in edges:
                ax=(start[0]-point[0])*scale;ay=start[1]-point[1];dx=(end[0]-start[0])*scale;dy=end[1]-start[1]
                length=dx*dx+dy*dy
                t=max(0,min(1,-(ax*dx+ay*dy)/length)) if length else 0
                distances.append(math.hypot(ax+t*dx,ay+t*dy))
            score=min(distances)
            if best is None or score>best[0]:best=(score,point)
    if best is None:raise ValueError('No interior point found')
    return best[1]

spots=[]
for index,placemark in enumerate(tree.findall('.//k:Placemark',ns)):
    text=placemark.findtext('.//k:Polygon/k:outerBoundaryIs/k:LinearRing/k:coordinates',namespaces=ns)
    if not text:continue
    ring=[[float(v) for v in token.split(',')[:2]] for token in text.split()]
    if ring[-1]==ring[0]:ring=ring[:-1]
    fingerprint=hashlib.sha256(json.dumps(ring,separators=(',',':')).encode()).hexdigest()[:12]
    original=placemark.findtext('k:name',default='',namespaces=ns).strip()
    name=original if original and 'sin título' not in original.lower() else f'Zona de pesca KML {index+1:02d}'
    if index==7:
        spot={k:v for k,v in pilot.items() if k!='geometry'}
        spot['pointMethod']='punto piloto comprobado frente a costa OSM'
    else:
        lon,lat=interior_point(ring)
        spot={'id':f'forecast-kml-{fingerprint}','name':f'{name} — Previsión','lat':round(lat,8),'lon':round(lon,8),'public':True,
              'description':'Punto interior de la zona de pesca KML para consultar modelos regionales. Posición marina y acceso pendientes de comprobación local.',
              'localConfidence':'sin calibración; punto derivado de polígono','thresholds':None,'pointMethod':'punto interior por barrido de polígono'}
    spot.update({'generated':True,'sourceRefs':[f'kml/sitios.kml#placemark:{index}'],'originalSource':'kml/sitios.kml','originalId':f'placemark:{index}'})
    if not inside((spot['lon'],spot['lat']),ring):raise ValueError(f'Point outside polygon {index}')
    spots.append(spot)
(root/'data/forecast-sites.json').write_text(json.dumps(spots,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Prepared {len(spots)} forecast locations inside original KML polygons; pilot reused.')
