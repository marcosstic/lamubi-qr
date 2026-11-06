# LA MUBI QR

Sistema de venta y validación de tickets digitales con códigos QR para eventos **LA MUBI**.

El flujo completo es: landing → datos del comprador → selección de pago → verificación con comprobante → ticket QR → validación en puerta. Incluye panel de administración para aprobar/rechazar pagos, gestionar tickets y configurar la tasa del dólar y el precio de la entrada.

## Stack

- **Frontend:** HTML5, CSS3 y JavaScript vanilla.
- **Backend:** Supabase (PostgreSQL + Storage).
- **QR:** `qrcodejs` para generar y `html5-qrcode` para escanear.
- **Reportes:** SheetJS (`xlsx.min.js`) para exportar tickets aprobados.
- **Hosting:** sitio estático (Netlify / Vercel / Cloudflare Pages).

## Estado actual

MVP funcional en producción para eventos puntuales. La venta se controla por evento desde `assets/events-config.js`.

> Importante: este proyecto es un MVP. La seguridad (RLS, autenticación de administradores y contraseñas) está pendiente de endurecerse antes de un uso masivo.

## Estructura principal

```text
index.html                 Landing y acceso a la compra
comprar.html               Formulario de datos del comprador
pago.html                  Resumen y selección de método de pago
verificacion.html          Verificación de pago y subida de comprobante
confirmacion.html          Ticket QR y descarga
validador.html             Escáner QR (Android/desktop)
validador-ios.html         Escáner QR optimizado para iOS
actualizar-ticket.html     Utilidad de actualización de tickets
config.js                  Configuración de Supabase y utilidades
assets/events-config.js    Configuración modular de eventos
assets/events-ui.js        Render de fecha, contador, countdown y botones
admin/                     Login, dashboard, pagos, tickets y configuración
```

## Flujo de compra

1. El usuario elige un evento en la landing.
2. Completa sus datos en `comprar.html`.
3. Selecciona el método de pago en `pago.html`.
4. Sube el comprobante en `verificacion.html`; el ticket queda en estado `pendiente`.
5. Un administrador aprueba o rechaza el pago desde `admin/`.
6. Al aprobarse, el ticket QR queda válido para el validador.

## Ejecución local

El proyecto no requiere build. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

> La cámara del validador requiere `https` o `localhost`.

## Despliegue

El archivo `netlify.toml` publica la raíz del proyecto y desactiva la caché. Para Netlify basta con conectar el repositorio; no hay comando de build.

## Documentación

- `CONTEXTO-PROYECTO.md`: resumen técnico y funcional del estado actual.
- `REGLAS-DESARROLLO.md`: reglas obligatorias para cualquier cambio.
- `documentacion-lamubi-28-marzo-2026/`: arquitectura, lógica de negocio y diseño.
- `documentacion-eventos/`: guía para agregar o reactivar eventos.
- `migrations/`: migraciones de base de datos y rollbacks seguros.
- `multi-evento-documentacion/`: plan de implementación multi-evento.
- `PLANIFICACION-TELEGRAM-NOTIFICATIONS.md`: diseño de notificaciones (pendiente).
