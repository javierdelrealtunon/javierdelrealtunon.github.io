# Visor GLB

Web estatica para ver archivos `.glb` y `.gltf` en el navegador con Three.js.

## Uso

1. Abre `index.html` desde GitHub Pages.
2. Arrastra un archivo `.glb` al visor o usa el boton para elegirlo.
3. Para `.gltf`, selecciona a la vez el `.gltf`, su `.bin` y sus texturas.

## Publicar en GitHub Pages

1. Sube estos archivos a un repositorio:
   - `index.html`
   - `styles.css`
   - `viewer.js`
   - `README.md`
2. En GitHub entra en `Settings > Pages`.
3. En `Build and deployment`, elige `Deploy from a branch`.
4. Selecciona la rama `main` y la carpeta `/root`.
5. Guarda. GitHub te dara la URL publica del visor.

No requiere build, npm ni servidor propio.
