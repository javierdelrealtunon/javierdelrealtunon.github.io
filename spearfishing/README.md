# Spearfishing Forecast & Alerts

Ampliación progresiva del visor existente de pesca submarina para Mundaka y otros lugares. Leaflet, KML, Google Sheets y fotografías originales se conservan. Frontend estático compatible con GitHub Pages; backend Cloudflare Worker + D1 y Resend preparado para configurar.

```sh
cd spearfishing
node scripts/serve.mjs
node --test --test-isolation=none tests/*.test.mjs
```

Abrir `http://127.0.0.1:4173/spearfishing/`. Elegir Previsiones o el marcador turquesa de Mundaka. Sin credenciales funcionan consultas públicas reales, gráficos, unidades, exportación CSV/PNG, criterios y exposición geométrica. No se incluyen valores de demostración en la aplicación.

La administración, destinatarios, persistencia y cron necesitan desplegar Worker, crear D1 y configurar Resend. Un correo aceptado por API requiere comprobar su recepción; no se ha enviado correo real ni activado producción durante esta implementación.

- [Arquitectura y auditoría](docs/ARCHITECTURE.md)
- [Configuración, despliegue, copias y rollback](docs/SETUP.md)
- [Fuentes, licencias, variables y metodología](docs/DATA-AND-METHOD.md)
- [Contratos API](docs/API.md)
- [Validación y limitaciones pendientes](docs/VALIDATION.md)

La plataforma orienta la planificación, no certifica seguridad. No estima Hs local sin calibración, no resuelve las corrientes del canal de Urdaibai y no predice visibilidad submarina. No introducir coordenadas privadas en archivos públicos ni credenciales en JavaScript.
