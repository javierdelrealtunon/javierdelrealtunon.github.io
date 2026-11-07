# Validación de la primera versión

Ampliación meteorológica y editor del visor del 7/11/2026: 66 pruebas correctas y compilación Wrangler con `--dry-run` satisfactoria, sin desplegar. Consultadas las fuentes reales de Mundaka: 168 valores de aire, SST, precipitación y presión; unidades °C, mm y hPa verificadas. Se prueban temperaturas negativas y cero, precipitación cero, ausencias, conversión de unidades y persistencia SQLite con invalidación de caché anterior.

Geometría: pruebas de puntos válidos/inválidos, cierre, cruces, superficie, referencias estables tras mover un punto heredado, lectura desde otra sesión, conservación del KML original y precedencia de textos actualizados desde la ficha. En navegador se comprobó arrastre de aparcamiento y vértice, añadir un vértice (400→401), retirar otro (400→399), deshacer (400) y cancelar restaurando el estado. No se han guardado movimientos de prueba en la base real. Los 27 contornos originales se han inspeccionado con el validador: 26 válidos; el placemark 17 presenta un cruce y requiere corregirlo en el editor antes de guardar su contorno. No se ha modificado automáticamente.

También se abrió un punto de entrada desde la ventana de elementos cercanos, se situó con un clic en el mapa y se deshizo/canceló. Comprobado el bloqueo nativo de Guardar sin consentimiento de compartir. El diálogo es independiente y permite seguir interactuando con el mapa; en pantallas estrechas se coloca abajo y limita los tiradores simultáneos para mantener espacio de trabajo. Los nombres y autores ya aportados en las fichas se conservan al editar su polígono.

Asignación espacial del 7/11/2026: 56 pruebas automatizadas correctas. El visor de ficha incorpora los 12 candidatos más próximos y conserva visibles las selecciones alejadas. La búsqueda espacial no asigna elementos ni modifica la selección. Se prueba la distancia al borde del polígono y la persistencia de un aparcamiento compartido entre dos zonas, incluida su retirada de una sin afectar a la otra. Los nombres se muestran con tooltip, los puntos superpuestos se agrupan y las casillas se sincronizan entre mapa, listado cercano y selector general.

En navegador real se seleccionó un aparcamiento desde su ventana en el mapa, se verificó la sincronización de las tres casillas y se retiró desde el listado. Tooltip de nombre comprobado con foco de teclado. Comprobada una agrupación real de tres elementos con casillas independientes y una ventana de asignación que cabe en el visor móvil de 390 px sin desbordamiento. Los cambios de prueba se descartaron sin escribir en la base compartida.

Sección de zonas del 7/11/2026: 54 pruebas automatizadas correctas. Incluye persistencia y lectura entre clientes, edición de textos de foto, detección de revisiones obsoletas, consentimiento previo a cualquier escritura, verificación de URL tras subida, rechazo de eventos malformados, conservación de geometría y registros originales, asociación espacial de elementos y límites de 2 a 168 horas. Las pruebas de escritura y subida usan un servicio simulado; no se han publicado fichas ni fotografías ficticias en la base real. La consulta del navegador utiliza las 36 zonas y las previsiones reales. El adaptador de la nueva sección pide solo oleaje y viento, sin descargar corrientes innecesarias.

Navegador: comprobados candado y activación del botón Guardar, bloqueo por falta de consentimiento, avance/retroceso, aviso de cambios pendientes con conservación al cancelar y descarte explícito, asociación temporal de una foto existente y edición de su texto sin publicar. Gráficas probadas a 2 horas (3 muestras de frontera) y 7 días (156 muestras disponibles en la consulta real, sin rellenar las restantes). Vista de 1366 px y móvil de 390 px revisadas; sin desbordamiento horizontal en consulta ni edición y sin errores de consola en la sesión. Las asociaciones y textos de prueba se descartaron.

Ampliación de sincronización del 7/11/2026: 44 pruebas automatizadas. Guardadas y releídas 36 ubicaciones reales en la base compartida: 9 fichas de pesca y 27 zonas KML, con el piloto reutilizado. La base pasó de 86 a 122 registros mediante 36 eventos nuevos; los 86 registros de otros tipos se conservan. Se verifican dos clientes independientes, reducción de versiones sin duplicados, bajas sin alterar originales, bloqueo de coordenadas privadas en el adaptador público y normalización de microgrados. El panel lateral incorpora capa general, listado activable y casillas por ubicación. Se retiró el encabezado lateral solicitado.

Actualización del 7 de noviembre de 2026: 37 pruebas correctas. Añadida selección manual de ubicaciones sobre el mapa, almacenamiento local privado, edición del punto y comprobación de persistencia tras recargar. El adaptador regional rechaza ubicaciones fuera de su cobertura. El viento dispone de acceso directo, conteo de horas disponibles y un reintento acotado ante fallos transitorios. Las unidades de las gráficas de viento y corriente siguen el selector. Al cambiar de ubicación se retiran los valores de la selección anterior mientras llegan los nuevos datos.

Comprobaciones del 25–26 de octubre de 2026. No se ha activado producción ni enviado correo a destinatarios reales.

## Evidencia

- 27 pruebas automatizadas correctas, Node 24 y SQLite real en memoria mediante adaptador del contrato D1. Fixtures sintéticos etiquetados y direcciones `.test`.
- Dirección de procedencia/destino, conversión de velocidades, interpolación U/V, nulls, celdas sin datos, series desordenadas, caducidad, restricciones críticas y huecos temporales.
- Piloto dentro del polígono original y en lado marino de costa OSM; sin coeficientes locales arbitrarios.
- Autenticación y CORS, exclusión de fichas privadas en API pública, destinatarios sin tokens de baja en respuestas, persistencia, baja con POST, límites, idempotencia y reintentos con payload estable.
- Resúmenes diarios/semanales en Europe/Madrid y aviso de empeoramiento solo con evaluación anterior válida.
- Migración aplicada a D1 **local** con Wrangler: 23 instrucciones correctas. Compilación final Worker `wrangler deploy --dry-run` correcta, sin publicación.
- Integración con runtime `workerd` real y D1 local: 168 horas, las tres fuentes Open-Meteo y WAM, persistencia de evaluación, una sola entrega tras dos comprobaciones. Sin configuración Resend: estado `retry` y error explícito, sin envío externo. Destinatario de prueba dado de baja y regla desactivada al terminar.
- Navegador real: mapa, marcadores existentes, navegación, métricas, seis gráficos, tabla y rosa. A 390 px no hay desbordamiento horizontal de página. No errores/warnings de JavaScript en la sesión revisada.
- Exportación CSV real descargada y leída: UTC, cabeceras, unidades SI, ausencias vacías y fecha de descarga. PNG está implementado mediante exportación ECharts; la verificación automatizada de descarga PNG queda pendiente.
- La página que quedó abierta hasta el día siguiente mostró `DATOS CADUCADOS`, retiró puntuación y suspendió ventanas, manteniendo trazabilidad de la descarga anterior.
- Empaquetado estático: 143 archivos públicos, conserva el resto del sitio, excluye backend, pruebas, dependencias y OSM bruto. Verificación de exclusiones correcta. KML sin modificaciones y ningún registro de Google Sheets migrado ni borrado.

Repetir pruebas con `node --test --test-isolation=none tests/*.test.mjs`. `scripts/probe.mjs` verifica proveedores en vivo (consume solicitudes). Para repetir la prueba de runtime local, ver los parámetros de origen y credencial **ficticia** de `scripts/test-runtime.mjs`; aplicarlos solo a Wrangler local, sin credenciales Resend reales.

## Criterios de aceptación y pendientes

| Criterio | Estado |
|---|---|
| 1. Aplicación existente | Visor y lectura de marcadores comprobados; escritura/fotos Apps Script preservadas, sin prueba de escritura contra datos reales. |
| 2. Mundaka seleccionable | Comprobado; polígono original referenciado. |
| 3–5. Datos, gráficos y procedencia | Comprobados con respuestas reales; periodos de pico ausentes quedan null. |
| 6–7. Exposición y distinción regional/local | Implementadas; cobertura de costa limitada y sin corrección cuantitativa ni calibración. |
| 8–9. Criterios y ventanas | Implementados y probados. |
| 10. Reglas y destinatarios persistentes | Probados en D1 real local; falta crear y configurar D1 de producción. |
| 11. Correo de prueba real y recepción | Pendiente de Resend, remitente verificado y destinatario autorizado. No se ha enviado correo real. |
| 12. Alertas sin web abierta | Handler cron y cola probados localmente; falta despliegue y comprobación de ejecución programada en Cloudflare. |
| 13. Privacidad | Endpoints nuevos con permisos y exclusión de fichas privadas probados. Seguridad del Apps Script heredado requiere revisión en su servidor. |
| 14. Móvil | Vista de 390 px comprobada; falta prueba física en iOS/Android e instalación PWA. |
| 15. Despliegue reproducible | Infraestructura, lockfile, migración, CI, empaquetado y publicación manual preparados. Producción pendiente de configuración y revisión. |

No se considera cumplida la aceptación completa de producción mientras falten correo real, cron desplegado y pruebas sobre dispositivos y servicios externos.

## Mejoras posteriores

Prioridad: validar WAM y SMOC contra observaciones representativas y revisar el origen de tiempos WAM irregulares; ampliar costa/obstáculos y datos batimétricos con licencia y datum controlados; añadir productos IBI probados; introducir OIDC/MFA para más administradores; webhook firmado de entrega/rebote y política de conservación de datos; consolidar varios sitios en un único resumen; periodicidad por regla; caracterización de relieve; modelos costeros anidados validados. No se ha realizado simulación SWAN ni se presentan estas funciones como operativas.
