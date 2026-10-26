"""Stage tracked public site files, preserving other websites and excluding server/tooling data."""
from pathlib import Path
import subprocess, shutil
repo=Path(__file__).resolve().parents[2]
target=repo/'.pages-release'
if target.exists():
    raise SystemExit('Output already exists; review or move .pages-release before packaging again.')
files=subprocess.check_output(['git','ls-files','-z'],cwd=repo).decode().split('\0')
allowed={'index.html','app.js','photo-patch.js','style.css','manifest.json','sw.js','icon-192.png','icon-512.png','config.js','data/spots.json','data/coast.geojson'}
count=0
for item in filter(None,files):
    path=Path(item)
    if any(part.startswith('.') for part in path.parts):
        if item not in ('.nojekyll','CNAME'):continue
    if path.parts[0]=='spearfishing':
        rel=path.relative_to('spearfishing').as_posix()
        if rel not in allowed and not rel.startswith(('marine/','kml/')):continue
    if path.suffix.lower() in ('.sqlite','.sql','.toml') or 'node_modules' in path.parts:continue
    source=repo/path
    if source.is_file():
        dest=target/path;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest);count+=1
(target/'.nojekyll').touch()
print(f'Prepared {count} tracked public files in {target}')
