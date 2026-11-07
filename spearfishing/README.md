# Spearfishing Forecast & Alerts

Ampliación progresiva del visor existente de pesca submarina para Mundaka y otros lugares. Leaflet, KML, Google Sheets y fotografías originales se conservan. Frontend estático compatible con GitHub Pages; backend Cloudflare Worker + D1 y Resend preparado para configurar.

```sh
cd spearfishing
node scripts/serve.mjs
node --test --test-isolation=none tests/*.test.mjs
```

Abrir `http://127.0.0.1:4173/spearfishing/`. Elegir Previsiones o el marcador turquesa de Mundaka. Sin credenciales funcionan consultas públicas reales, gráficos, unidades, exportación CSV/PNG, criterios y exposición geométrica. No se incluyen valores de demostración en la aplicación.

Para añadir otro punto: en el mapa pulsar **Añadir ubicación de previsión**, tocar la posición y escribir su nombre. Se guarda en este navegador, aparece en el selector y dispone de previsiones reales para sus coordenadas. Se puede cambiar su punto desde **Editar ubicación local**. Estas ubicaciones no se publican ni se añaden a Google Sheets; para alertas del servidor se debe guardar su ficha en Administración. En Previsiones, **Viento y rachas** abre las series de velocidad, rachas y dirección.

La administración, destinatarios, persistencia y cron necesitan desplegar Worker, crear D1 y configurar Resend. Un correo aceptado por API requiere comprobar su recepción; no se ha enviado correo real ni activado producción durante esta implementación.

- [Arquitectura y auditoría](docs/ARCHITECTURE.md)
- [Configuración, despliegue, copias y rollback](docs/SETUP.md)
- [Fuentes, licencias, variables y metodología](docs/DATA-AND-METHOD.md)
- [Contratos API](docs/API.md)
- [Validación y limitaciones pendientes](docs/VALIDATION.md)

La plataforma orienta la planificación, no certifica seguridad. No estima Hs local sin calibración, no resuelve las corrientes del canal de Urdaibai y no predice visibilidad submarina. No introducir coordenadas privadas en archivos públicos ni credenciales en JavaScript.
