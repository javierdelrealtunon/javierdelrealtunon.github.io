# Visor GLB

Web estatica para ver archivos `.glb` y `.gltf` en el navegador con Three.js.

## Uso

1. Mete tu modelo en `models/nave.glb`.
2. Abre `index.html` desde GitHub Pages.
3. La web cargara automaticamente `nave.glb`.

Tambien puedes arrastrar otro `.glb` al visor o usar el boton para elegirlo.

La ruta y el nombre tienen que coincidir exactamente:

```text
models/nave.glb
```

En GitHub Pages importan las mayusculas. `Nave.glb`, `nave.GLB` o `Models/nave.glb` no son lo mismo.

## Publicar en GitHub Pages

1. Sube estos archivos a un repositorio:
   - `index.html`
   - `styles.css`
   - `viewer.js`
   - `README.md`
   - `models/nave.glb`
2. En GitHub entra en `Settings > Pages`.
3. En `Build and deployment`, elige `Deploy from a branch`.
4. Selecciona la rama `main` y la carpeta `/root`.
5. Guarda. GitHub te dara la URL publica del visor.

No requiere build, npm ni servidor propio.
