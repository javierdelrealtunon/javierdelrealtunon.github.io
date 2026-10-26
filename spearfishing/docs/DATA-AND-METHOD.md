# Fuentes, variables y metodología

Revisión de interfaces realizada el 25 de octubre de 2026. Las verificaciones son del momento de consulta, no garantías permanentes de disponibilidad.

| Fuente | Resultado y uso | Licencia / acceso |
|---|---|---|
| [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) | Respuestas reales MFWAM y SMOC verificadas. Celda marina distinta para cada modelo; distancias visibles. | Datos CC BY 4.0; [API gratuita](https://open-meteo.com/en/pricing) para uso no comercial, 10.000 llamadas/día, 5.000/hora, 600/minuto; revisar contrato vigente para explotación comercial. |
| [Open-Meteo Weather](https://open-meteo.com/en/docs) | Viento, racha, precipitación y luz diurna best_match. Ciclo y resolución efectiva no publicados en esa respuesta. | Atribución Open-Meteo y fuentes del modelo, incluyendo DWD. |
| [WAM EuskOOS](https://www.euskoos.eus/erddap/info/EuskalmetWAMBasqueCoast/index.json) | Dataset y variables hs/tp/tm/sd/ws/wd comprobados en vivo. Catálogo tenía cobertura 25–29/10/2026, malla 0,02°. Celda más cercana sin datos; una celda hacia el norte respondió. Serie con tiempos irregulares, conservados. Uso de comparación, pendiente validar contra observaciones antes de convertirla en referencia automática de las reglas. | Atribuir Euskalmet-AZTI; metadatos ERDDAP permiten reutilización y redistribución con exclusión de garantías. Conservar licencia de cada extracción. |
| [IBI Waves EuskOOS](https://www.euskoos.eus/erddap/info/IBI_ANALYSIS_FORECAST_WAV_005_005/index.json) | ID vigente en este servidor; VHM0, VTPK, VTM02, VMDR, VPED, tiempos horarios y malla ~0,02778°. Catálogo comprobado; no adaptador operativo. | Ver licencia del catálogo y producto Copernicus; requiere comprobar celdas y ciclos. |
| [IBI Physics EuskOOS](https://www.euskoos.eus/erddap/info/IBI_ANALYSISFORECAST_PHY_005_001/index.json) | ID vigente; uo, vo, thetao, zos. La primera extracción próxima al piloto dio null. No se usa como corriente puntual. | Acceso y atribución según metadatos y [Copernicus Marine](https://data.marine.copernicus.eu/). |
| [PORTUS](https://portus.puertos.es/) / [Portuscopia](https://portuscopia.puertos.es/) | Portales accesibles; no interfaz de datos documentada validada en este trabajo. No se añade un endpoint interno como dependencia. | Pendiente acuerdo o interfaz oficial y condiciones de reutilización. |
| [EMODnet OWS](https://ows.emodnet-bathymetry.eu/) | WMS disponible como capa opcional de visualización. WCS/WFS requieren descarga y control de datum/resolución antes de análisis numérico. La carga visual depende de disponibilidad del servidor externo. | Atribuir EMODnet Bathymetry y revisar licencias del DTM/datasets fuente. |
| [OSM API](https://wiki.openstreetmap.org/wiki/API_v0.6) | Recorte costero real en `coast.geojson`, IDs de vías, fecha y bbox incluidos. Algunas peticiones devolvieron 429; se conserva un recorte pequeño verificado. | © OpenStreetMap contributors, ODbL 1.0; [atribución](https://www.openstreetmap.org/copyright). |
| GeoEuskadi, IHM, IHPT, OpenSeaMap, Esri | Capas originales conservadas. No se extraen cifras ni profundidades de imágenes. GeoEuskadi pendiente de selección/verificación de servicio y licencia. | Atribuciones originales. Revisar derechos y restricciones de los servicios antes de redistribuir teselas o añadir usos comerciales. |

## Diccionario normalizado

| Campo | Unidad / significado |
|---|---|
| time | ISO UTC; salida visual Europe/Madrid mediante Intl, incluido cambio de hora |
| hs | m, altura significativa regional total |
| tm / tp | s, periodo medio / de pico; ausentes se mantienen null, nunca se intercambian en la etiqueta |
| waveDirection | grados al norte, procedencia |
| windWave / swell / secondarySwell | m, componentes; direcciones y periodos con prefijos correspondientes |
| wind / gust | m/s, viento 10 m / racha |
| windDirection | grados, procedencia |
| current | m/s, velocidad superficial regional |
| currentDirection | grados, destino de circulación |
| u / v | m/s, corriente positiva este / norte, derivadas de velocidad y dirección |
| level | m sobre nivel medio global (SMOC); no cero hidrográfico ni marea astronómica aislada |
| sst | °C, temperatura superficial modelada |
| rain | mm, precipitación horaria modelada; no turbidez ni visibilidad observada |
| day | 0/1, indicador de luz diurna del proveedor |

Cada fuente conserva proveedor/modelo, consulta, resoluciones, celda y distancia. Ciclo/generación desconocidos se guardan como null. `generationtime_ms` es duración de cómputo HTTP, **no fecha de generación**. La vigencia de seis horas controla antigüedad de descarga y cobertura; no certifica un ciclo que el proveedor no expone.

Oleaje MFWAM: resolución original ~8 km / 3 h; respuesta horaria interpolada por el proveedor. SMOC: ~8 km / 1 h, SST 6 h. La salida horaria no convierte una simulación de tres horas en nuevas simulaciones. No se rellena una variable ausente ni se mezclan puntos WAM irregulares con horas exactas.

## Local Marine Exposure Engine

1. Proyección local equirectangular limitada a 20 km. Rayos cada 15° por defecto, intersección con costa y obstáculos emergidos.
2. Distancia a primera intersección; clasificación geométrica: obstruido <500 m, parcial <2 km, abierto a mayor distancia. Son categorías cartográficas configurables, **no factores físicos de atenuación**.
3. Sin intersección: solo límite del alcance/recorte disponible; no se afirma fetch oceánico. En Mundaka el recorte es muy pequeño y limita fuertemente la rosa. No se han inferido profundidad, pendiente ni relieve a partir de WMS.
4. Comprobación de agua: lado derecho de costa OSM orientada, distancia mínima 30 m, solo dentro del bbox. El piloto 43,416 / −2,7005 está dentro del polígono KML y a ~69 m del lado marino de la costa. No certifica profundidad ni entrada al agua.
5. Hs y viento locales quedan sin estimar. Las corrientes nunca reciben factores de protección de oleaje. No se calcula velocidad de canal a partir de geometría.
6. Contrato futuro: `localEstimate(row, exposure, {method:'validated-nested-model',validationId,time,hs})`; solo acepta valor no negativo con validación y tiempo coincidente. Hace falta un proceso de validación externo; el navegador no ejecuta SWAN.

## Spearfishing Conditions Engine

Puntuación por variable: `max(0,100*(1−valor/(2*umbral)))`, media por pesos configurables. Es un índice operativo interpretable, no una probabilidad ni una medida calibrada de seguridad. Los umbrales por defecto son ejemplos modificables. Cualquier incumplimiento crítico bloquea favorable, aunque su peso sea cero; preferencias incumplidas producen intermedio. Sin datos de las variables necesarias o sin vigencia: desconocido y sin puntuación. Día obligatorio si está activado. El periodo usa Tp si existe y Tm como alternativa declarada para el criterio; los gráficos siguen distinguiéndolos.

Una ventana requiere horas consecutivas exactas, todos los criterios, luz y duración mínima. No se unen huecos; no se usan horas pasadas para alertas. La exposición cualitativa no mejora artificialmente la puntuación del modelo regional. No se ha realizado validación con boyas/radar ni calibración local; es trabajo posterior necesario para cuantificar confianza.
