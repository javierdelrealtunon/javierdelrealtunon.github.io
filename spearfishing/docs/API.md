# API v1

## Edición geográfica compartida

`FeatureStore` añade eventos `tipo: Edición de elemento`, con `schema: spearfishing.feature.v1`, referencia estable `sourceRef` al punto original de Sheets o placemark KML, nombre, tipo, notas, autor, origen, geometría GeoJSON, revisión y fecha. Los puntos editables son Aparcamiento y Punto de entrada; los polígonos conservan el tipo Sitio de pesca. Se admiten contornos simples cerrados de 3 a 1000 vértices, sin cruces ni vértices repetidos. El transporte heredado limita la URL codificada a 28 000 caracteres; un exceso devuelve un error explícito sin escribir.

Las ediciones se aplican al mapa principal, a los elementos próximos y al contorno mostrado en las fichas. El identificador original permanece aunque cambien nombre y coordenadas, incluidas las filas heredadas sin registro_id. Las asignaciones a varias zonas no se reescriben. El campo `zoneRevision` conserva la relación con los textos de la ficha usados al abrir el editor; una edición posterior de esa ficha conserva sus textos y mantiene el contorno actualizado. Las filas y archivos KML originales permanecen intactos. Como las fichas, el guardado comprueba la revisión y verifica la relectura; Apps Script no ofrece comparación y escritura atómicas.

## Variables meteorológicas adicionales

`airTemp` y `sst` se normalizan a °C; `rain` es precipitación total de la hora anterior en mm y `pressure` es presión reducida al nivel medio del mar en hPa. Se solicitan unidades explícitas para meteorología, se convierten unidades equivalentes conocidas y las ausencias se conservan como null. Las fichas piden una fuente SST independiente con solo temperatura superficial; las previsiones generales reutilizan la fuente oceánica. `variablesVersion:2` invalida cachés de pronósticos anteriores que no incluían estos campos. D1 almacena airTemp/sst como degC, rain como mm y pressure como hPa. No se añaden automáticamente estos campos a los criterios de favorabilidad existentes.

## Fichas compartidas de zonas

`marine/zones.js` utiliza el mismo contrato de lectura y escritura de Apps Script. Cada guardado añade `tipo: Ficha de zona`, un `registro_id: zone-event-UUID` y notas JSON con `schema: spearfishing.zone.v1`, ID estable de zona, revisión, fecha ISO, nombre, tipo, coordenadas, notas, autor, origen de coordenadas, elementos asociados y fotografías `{id,url,caption}`. El lector aplica la última versión válida sobre la ficha de origen. Las filas originales y el KML se conservan; los eventos de ficha y foto se excluyen de los marcadores heredados. Una versión compartida se muestra en la nueva sección; no reescribe los archivos KML ni los puntos de previsión independientes.

Antes de guardar, se compara la revisión leída con la que se está editando. Si ya cambió, el guardado se rechaza y el formulario se conserva. Esto detecta ediciones previas de otra sesión; el servicio heredado no dispone de una operación atómica de comparación y escritura para garantizar exclusión entre envíos simultáneos. Después de escribir se relee la revisión antes de confirmar éxito.

Las subidas crean `tipo: Fotografía de zona` con `schema: spearfishing.zone-photo.v1`, zona y texto. La imagen JPEG se adjunta mediante el contrato existente POST `action=attach_photo`, `registro_id`, `foto_nombre`, `foto_tipo`, `foto_base64`. Una respuesta opaca no se considera prueba de guardado: se relee la fila hasta encontrar una URL HTTPS. Si no aparece tras los intentos acotados, se informa de que la subida sigue sin verificar. El navegador reduce las imágenes a 1600 px y elimina sus metadatos al convertirlas a JPEG. Límite de entrada: 20 MB; hasta 24 fotografías por ficha. Solo se aceptan enlaces HTTPS sin credenciales y textos de hasta 300 caracteres.

La edición y la subida requieren una confirmación explícita en la ficha de que los cambios se comparten en este visor. No se escriben datos durante la consulta, navegación o cambio de intervalo. Los elementos iniciales se proponen por pertenencia al polígono o por un radio de 1 km para fichas puntuales; después puede guardarse una selección explícita.

## Adaptador de ubicaciones compartidas

La configuración inicial `spotStorage:'sheets'` utiliza la URL Apps Script ya existente. Lectura: GET sin acción, con respuesta de filas en orden de inserción. Escritura: GET `action=write`, `registro_id=forecast-event-UUID`, `tipo=Ubicación de previsión`, nombre, coordenadas, notas JSON y metadatos de origen. No requiere cambios de esquema en la hoja actual. Se conserva este contrato heredado; el resto de rutas de esta página corresponde al Worker opcional.

Las notas incluyen `schema:spearfishing.forecast.v1`, identificador lógico estable, revisión, visibilidad pública, referencias de origen y `deleted`. Una edición o baja añade un evento nuevo y no modifica los originales. El lector filtra exclusivamente este tipo y reduce sus eventos por identificador. Los errores de escritura o verificación se muestran y no se presentan como un guardado local exitoso. Las fichas privadas se rechazan antes de realizar una petición al adaptador público.

Los registros de este adaptador son visibles para todos los usuarios del visor. Las listas de correo, secretos y destinatarios nunca se guardan en él. D1 conserva sus controles de acceso para operaciones privadas.

JSON UTF-8, `Cache-Control: no-store`. Identificadores estables; el código SQL usa parámetros. Rutas administrativas requieren `Authorization: Bearer <ADMIN_TOKEN>` y origen permitido; nunca colocar token en URL. Límite: 60 solicitudes por IP y primer segmento de ruta por minuto. Errores JSON con `error`, estados 400/401/403/404/429/503.

| Método / ruta | Contrato |
|---|---|
| GET /health | Estado de configuración de correo, cron y proveedores; sin secretos |
| GET /spots | Fichas públicas no eliminadas; crea el piloto una sola vez mediante INSERT OR IGNORE |
| GET /forecast?spot=ID | Serie normalizada, fuentes, incidencias, comparación WAM cuando responde; solo ID público, no coordenadas arbitrarias |
| GET /unsubscribe?token=TOKEN | Página de confirmación; no modifica estado |
| POST /unsubscribe?token=TOKEN | Baja del destinatario; respuesta genérica |
| GET /admin/state | Fichas, listas, destinatarios sin token de baja, reglas, últimas 100 entregas y 30 evaluaciones |
| GET /admin/forecast?spot=ID | Previsión autorizada, incluidas fichas privadas |
| POST /admin/spots | Crear/actualizar: id, name, lat, lon, public boolean explícito, description, thresholds y metadatos opcionales |
| PUT /admin/spots | Mismo contrato que POST |
| DELETE /admin/spots | `{id}`; eliminación lógica, no modifica Sheets/KML |
| POST /admin/lists | `{name}`; devuelve id |
| POST /admin/subscribers | `{listId,email,consent:true}`; validación y unicidad lista/correo |
| DELETE /admin/subscribers | `{id}`; desactivación lógica |
| POST /admin/rules | `{id?,spotId,listId,enabled,hours,cooldownHours,type,preferredHour,thresholds}` |
| POST /admin/check | Evaluación persistente y procesamiento de cola |
| POST /admin/refresh | `{spotId}`; fuerza descarga para un lugar |
| POST /admin/test-email | `{subscriberId}`; envío real a suscriptor activo y autorizado; devuelve aceptación e ID Resend, no confirma recepción |

`hours`: 24, 48, 72 o 168, limitado por cobertura real. `type`: opportunity, daily, weekly, deterioration. `preferredHour`: entero 0–21, Europe/Madrid. `cooldownHours`: 3–168. El periodo de consulta del servidor es global y está en `wrangler.toml`.

`thresholds`: hs, wind, gust, current, period, minHours, daylight, weights por variable y critical (lista de variables críticas). Los lugares pueden guardar umbrales propios; al guardar una regla se toma una copia explícita de los criterios configurados. No hay endpoint público de alta ni de consulta de destinatarios.

En una respuesta forecast: `rows` conserva ausencias como null o campo ausente, `sources` registra coordenadas/resoluciones y descarga, `comparison.rows` conserva tiempos nativos WAM y su fuente. No hay endpoint de observaciones ni garantía de que todas las variables existan durante todo el horizonte.
