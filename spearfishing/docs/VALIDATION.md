# Validación de la primera versión

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
