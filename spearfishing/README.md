# Spearfishing Forecast & Alerts

Ampliación progresiva del visor existente de pesca submarina para Mundaka y otros lugares. Leaflet, KML, Google Sheets y fotografías originales se conservan. Frontend estático compatible con GitHub Pages; backend Cloudflare Worker + D1 y Resend preparado para configurar.

```sh
cd spearfishing
node scripts/serve.mjs
node --test --test-isolation=none tests/*.test.mjs
```

Abrir `http://127.0.0.1:4173/spearfishing/`. Elegir Previsiones o el marcador turquesa de Mundaka. Sin credenciales funcionan consultas públicas reales, gráficos, unidades, exportación CSV/PNG, criterios y exposición geométrica. No se incluyen valores de demostración en la aplicación.

Para añadir otro punto: en el mapa pulsar **Añadir ubicación de previsión**, tocar la posición, escribir su nombre y confirmar **Compartir ubicación en este visor**. Se guarda y verifica en la base Google Sheets existente y se puede leer desde cualquier dispositivo con esta versión de la aplicación. **Editar ubicación** permite recolocarlo sin modificar los sitios de pesca originales. Las ubicaciones privadas requieren el backend D1 autenticado; nunca se envían a la base pública sin confirmar que se comparten.

El panel lateral permite activar la capa completa de previsiones, ocultar/mostrar el listado y activar cada ubicación por separado. Se han creado 36 previsiones: 9 fichas de pesca de Sheets y 27 zonas KML, reutilizando Mundaka. Las preferencias de capas permanecen en cada navegador; los datos están en la base compartida. En Previsiones, **Viento y rachas** abre velocidad, rachas y dirección.

**Zonas de pesca** reúne las 36 fichas, con selector y botones **Anterior / Siguiente**. En consulta muestra una ficha compacta, un mapa centrado en el polígono y sus elementos, fotografías con texto y gráficas reales de oleaje y viento. El intervalo se ajusta de 2 horas a 7 días; las ausencias y la cobertura disponible se mantienen explícitas. El candado desbloquea los campos existentes, la selección de elementos y las aportaciones fotográficas. **Guardar cambios** está siempre visible y se activa al desbloquear; publica y verifica una versión compartida sin modificar las filas ni el KML originales. Los enlaces y textos se guardan con la ficha. **Subir fotografía a la base** usa el servicio existente y solo confirma éxito después de releer una URL de imagen. Se requiere confirmar que se comparten los cambios. Cambiar de ficha con cambios pendientes permite cancelarlo.

La administración, destinatarios, persistencia y cron necesitan desplegar Worker, crear D1 y configurar Resend. Un correo aceptado por API requiere comprobar su recepción; no se ha enviado correo real ni activado producción durante esta implementación.

El mapa de cada ficha muestra los 12 elementos más cercanos, además de todos los seleccionados. En zonas KML se calcula la cercanía al polígono. El nombre se lee al pasar el cursor o enfocar un punto; al pulsarlo aparecen las casillas de asignación. Los números agrupan elementos superpuestos. El contorno indica un candidato y el relleno indica selección. Abre el candado, marca los elementos y pulsa **Guardar cambios**. El listado bajo el mapa ofrece las mismas casillas y permite localizar cada elemento. Las asignaciones son independientes por zona: un aparcamiento, acceso o fotografía puede pertenecer a varias zonas.

- [Arquitectura y auditoría](docs/ARCHITECTURE.md)
- [Configuración, despliegue, copias y rollback](docs/SETUP.md)
- [Fuentes, licencias, variables y metodología](docs/DATA-AND-METHOD.md)
- [Contratos API](docs/API.md)
- [Validación y limitaciones pendientes](docs/VALIDATION.md)
- [Simbología de los visores y revisión visual](docs/SYMBOLOGY.md)

La plataforma orienta la planificación, no certifica seguridad. No estima Hs local sin calibración, no resuelve las corrientes del canal de Urdaibai y no predice visibilidad submarina. No introducir coordenadas privadas en archivos públicos ni credenciales en JavaScript.

Las previsiones incluyen aire a 2 m (°C), agua superficial (°C), precipitación total de la hora anterior (mm) y presión reducida al nivel del mar (hPa). En las fichas se mantienen dos gráficas con selectores de variable; los cuatro valores aparecen en una fila compacta y en la tabla horaria. Previsiones incluye el filtro **Temperatura y tiempo**, las tablas y el CSV. Las ausencias permanecen sin dato, y la SST no representa la temperatura a profundidad de inmersión. Fuentes: [Weather API](https://open-meteo.com/en/docs) y [Marine API](https://open-meteo.com/en/docs/marine-weather-api) de Open-Meteo.

**Editar puntos / polígonos** abre un diálogo independiente sobre el mapa. Selecciona un aparcamiento, punto de entrada o polígono, o abre su edición desde la información del mapa y las fichas de zona. Arrastra el marcador para mover un punto; también puedes situarlo con un clic o escribir sus coordenadas. En un polígono, arrastra los vértices, usa **＋ Vértice** y pulsa el mapa para insertar, o **− Vértice** y pulsa un vértice para retirarlo. **Deshacer geometría** revierte los cambios del contorno o posición. **Cancelar edición** restaura la geometría anterior. **Guardar cambios** requiere compartir, verifica la persistencia y conserva los identificadores y asignaciones. Los contornos cruzados, abiertos o sin superficie no se guardan. En polígonos extensos, los tiradores se distribuyen por la vista; acércate para ajustar los vértices de una parte del contorno.
