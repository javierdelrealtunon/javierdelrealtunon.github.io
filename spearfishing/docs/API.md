# API v1

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
