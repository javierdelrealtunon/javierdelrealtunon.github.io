# Configuración, pruebas y operación

## Frontend local

Requiere Node.js 24 o posterior. Desde `spearfishing`:

```sh
node scripts/serve.mjs
node --test --test-isolation=none tests/*.test.mjs
```

Abrir `http://127.0.0.1:4173/spearfishing/`. Sin Worker se pueden consultar los lugares públicos del archivo `data/spots.json`, previsiones, criterios y comparador. La administración indica el requisito de servidor; no simula guardados. Las fuentes pueden limitar peticiones y el acceso directo depende de CORS. El Worker elimina esa dependencia del navegador y comparte resultados tres horas.

## Cloudflare y Resend

1. Instalar dependencias con `pnpm install --frozen-lockfile`. Ejecutar `pnpm exec wrangler login` en una sesión propia de Cloudflare.
2. Crear D1: `pnpm exec wrangler d1 create spearfishing`. Copiar el ID devuelto a `wrangler.toml`.
3. Aplicar migración: `pnpm exec wrangler d1 migrations apply spearfishing --remote`. Para pruebas locales sustituir `--remote` por `--local`.
4. Crear una credencial administrativa aleatoria de al menos 32 caracteres con un gestor de contraseñas. Guardarla mediante `pnpm exec wrangler secret put ADMIN_TOKEN`. No pegarla en código ni archivos versionados.
5. Verificar un dominio remitente en Resend y registrar la clave mediante `pnpm exec wrangler secret put RESEND_API_KEY`.
6. Configurar `MAIL_FROM` con el remitente verificado, `ALLOWED_ORIGIN` con `https://javierdelrealtunon.github.io`, `PUBLIC_APP_URL` con la URL de Pages y añadir `WORKER_URL` con la URL HTTPS final del Worker a `[vars]` de `wrangler.toml`. `WORKER_URL` se usa para enlaces de baja; es imprescindible para encolar avisos.
7. Comprobar compilación con `pnpm exec wrangler deploy --dry-run --outdir .worker-dist`. Tras revisar los cambios, publicar con `pnpm exec wrangler deploy`.
8. Configurar `config.js` con `apiBase` igual a la URL del Worker. Alternativamente introducir esa URL en Administración (queda en este navegador). La credencial no se guarda en almacenamiento local.
9. Entrar en Administración, crear lista, añadir destinatario autorizado, guardar regla y enviar correo de prueba. La UI informa de aceptación de Resend; comprobar recepción en el buzón y registrar el resultado.
10. Activar la regla y comprobar manualmente. Revisar evaluaciones e historial, cron en Cloudflare y ejecución con el navegador cerrado. No activar avisos hasta completar estas comprobaciones reales.

Para desarrollo Worker: crear `.dev.vars` ignorado por Git, con secretos de prueba propios; `pnpm exec wrangler dev`. Ajustar el origen permitido al puerto local para esa ejecución. No reutilizar direcciones reales en pruebas automáticas.

Prueba de integración local reproducible (sin credenciales reales de correo):

```sh
pnpm exec wrangler d1 migrations apply spearfishing --local
pnpm exec wrangler dev --port 8787 --var ALLOWED_ORIGIN:http://127.0.0.1:4173 --var ADMIN_TOKEN:local-test-only-token-00000000000000000000 --var WORKER_URL:http://127.0.0.1:8787
# En otra terminal, desde spearfishing:
node scripts/test-runtime.mjs
```

La credencial anterior es una fixture pública exclusiva de localhost. Nunca utilizarla en un despliegue. El script impide ejecutarse si el servidor informa de correo configurado.

## Reglas

Los umbrales del formulario se guardan inicialmente en el navegador. Al guardar una regla se copian al servidor junto con lugar, lista, horizonte, tipo y espera mínima (3–168 horas). Se pueden activar/desactivar reglas en Alertas. Para varios lugares, crear una regla por lugar asociada a la misma lista.

- Oportunidad: primera ventana que cumple criterios durante el mínimo de horas consecutivas.
- Diario: resumen con datos completos en la primera ejecución dentro de las tres horas siguientes a la hora preferida de Madrid.
- Semanal: mismo criterio, lunes. Hora permitida 0–21 para que el intervalo de envío no cruce el día.
- Empeoramiento: caída de al menos 15 puntos o nueva restricción crítica respecto a la evaluación anterior completa.

Se mantiene una entrega por lugar/regla/destinatario/huella. Bloqueo del trabajo, reclamación atómica de cada entrega, clave de idempotencia de Resend, tres intentos y espera creciente. La cron cada tres horas determina el instante efectivo de los reintentos. La idempotencia externa tiene una ventana de 24 h; no reactivar manualmente entregas antiguas sin consultar Resend.

Estados: `pending`, `sending`, `retry`, `accepted`, `failed`, `cancelled`. `accepted` significa aceptación por la API, no entrega ni lectura. No se ha implementado webhook de rebotes/entrega; consultar Resend para confirmar entrega. Los resúmenes se envían por lugar; no se consolidan aún varios lugares en un solo mensaje. La configuración de periodicidad de consulta es global (tres horas), no individual.

## Copia, despliegue y rollback

Antes de migraciones, exportar D1 a un archivo privado fuera del repositorio público:

```sh
pnpm exec wrangler d1 export spearfishing --remote --output backups/private-backup.sql
```

`backups/` está ignorado. Proteger y cifrar el archivo según la política del operador. Restaurar primero en una base de ensayo mediante `wrangler d1 execute NUEVA_BASE --remote --file backups/private-backup.sql` y comprobar recuentos, listas, reglas y relaciones antes de cambiar el binding. No se ha ejecutado exportación ni migración contra cuentas reales.

La acción `spearfishing-ci.yml` valida Node y compilación en rama/PR. La acción manual `spearfishing-pages.yml` prepara el sitio completo, conserva las otras webs y excluye backend, pruebas, herramientas, dependencias y archivos privados. Cambiar Pages a GitHub Actions en Settings solo cuando se vaya a desplegar; ejecutar manualmente desde la rama revisada. No se activa producción automáticamente al hacer push de esta rama.

Rollback frontend: volver al commit anterior desde GitHub, o restaurar los archivos `spearfishing` de `backup/spearfishing-before-forecast-20261025` en una rama y desplegar tras revisar. No usar reset destructivo sobre trabajo ajeno. Los datos de Sheets y KML siguen intactos. Worker: desactivar reglas y volver a una versión anterior desde Cloudflare; mantener D1 y su copia, sin borrar datos.

## Añadir un lugar / proveedor

Lugar: Administración → nueva ficha → identificador estable, coordenadas, notas y visibilidad explícita. Verificar el punto en ortofoto y costa antes de usarlo. Sectores manuales: `localParameters.sectors`, objetos con `bearing` (grados), `fetchM`, `classification` y `censored`, acompañados de método y fuente. Sin geometría disponible se muestra incertidumbre. Se pueden conservar en el JSON geometría, profundidad, acceso, restricciones e identificadores originales. No guardar puntos privados en `data/spots.json`.

Proveedor: crear adaptador que devuelva el contrato de `normalize()` (`provider`, `model`, `kind`, `downloadedAt`, celda, resoluciones, unidades, `rows`). Comprobar cobertura, máscara marina, unidades, ausencias, convención angular y fecha de ejecución. Registrar proveedor, probar fixtures etiquetados y comparar con observaciones representativas antes de darle prioridad. No basta con que un catálogo responda HTTP 200.
