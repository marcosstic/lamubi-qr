# CONTEXTO DEL PROYECTO — LA MUBI QR

> Documento de referencia rápida para retomar el proyecto sin tener que reconstruir el contexto.
> Última actualización: 6 de noviembre de 2026.

---

## 1. Resumen ejecutivo

**LA MUBI QR** es un sistema de venta y validación de tickets QR para eventos. Está construido como sitio estático (HTML/CSS/JS vanilla) con **Supabase** como base de datos y almacenamiento. No tiene backend propio ni proceso de build.

Flujo principal:

```text
Landing (index.html)
  → Datos del comprador (comprar.html)
  → Método de pago (pago.html)
  → Verificación + comprobante (verificacion.html)
  → Ticket QR (confirmacion.html)
  → Validación en puerta (validador.html / validador-ios.html)
```

Panel administrativo (`admin/`) para aprobar/rechazar pagos, consultar tickets, exportar a Excel y ajustar tasa/precio.

**Naturaleza del proyecto:** MVP funcional, con deuda técnica y de seguridad conocida. El objetivo inmediato es mantenerlo operativo para eventos concretos; una reescritura más robusta queda para una fase futura.

---

## 2. Stack y servicios

| Componente | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript vanilla (ES6+) |
| Base de datos | Supabase / PostgreSQL 17.x |
| Storage | Supabase Storage, bucket `lamubi-qr-comprobantes` |
| Generación QR | `qrcodejs` (CDN) |
| Escaneo QR | `html5-qrcode` + helpers de cámara |
| Reportes | SheetJS local (`admin/xlsx.min.js`) |
| Analytics | Google Analytics 4 + `assets/analytics.js` (UTM) |
| Hosting | Sitio estático (Netlify / Vercel / Cloudflare Pages) |

- Proyecto Supabase: `jayzsshngmbwvwdmizis`.
- Zona horaria de negocio: **America/Caracas (UTC-4)**.
- `netlify.toml`: publica la raíz y fuerza `no-cache`.

---

## 3. Estado del repositorio

- Rama principal: `main`.
- Ramas existentes: `feature/multi-evento`, `feature/multi-tickets`.
- Último commit relevante: `93ef112` — modularización de botones de eventos y cierre del evento Terror.
- No hay `.gitignore`; hay archivos pesados versionados (por ejemplo el binario `ngrok`).
- No hay tests automatizados ni pipeline de CI.

---

## 4. Estructura de archivos

### Páginas del flujo

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Landing. Hero con fecha, contador, countdown y botones de eventos renderizados por JS. Tarjeta GENERAL con botón inerte. |
| `comprar.html` | Formulario de datos (nombre, documento, edad, género, correo, teléfono). Multi-entradas opcional. Valida y guarda en localStorage. |
| `pago.html` | Resumen de compra, cálculo de precio híbrido y selección de método (actualmente Pago Móvil y Binance). |
| `verificacion.html` | Formulario específico por método, validación de monto, subida de comprobante e inserción en BD. |
| `confirmacion.html` | Carga el ticket por ID, muestra datos, genera el QR (contiene solo el ID numérico) y permite descargar. |
| `validador.html` | Escáner QR estándar. Valida estado, descuenta usos y marca el ticket como usado. |
| `validador-ios.html` | Variante optimizada para iOS. |
| `actualizar-ticket.html` | Utilidad de actualización manual de datos de ticket. |
| `admin/index.html` | Panel administrativo (dashboard, pagos, tickets, configuración). |
| `admin/login.html` | Login de administradores. |

### JavaScript compartido

| Archivo | Responsabilidad |
|---|---|
| `config.js` | Credenciales Supabase, cliente global, helpers de fecha/moneda, precio del ticket, feature flags. |
| `assets/events-config.js` | Fuente de verdad de la configuración de eventos. |
| `assets/events-ui.js` | Módulo legacy del hero. Ya no se carga en la landing; la landing muestra solo el logo y las tarjetas. |
| `assets/events-cards.js` | Renderiza las tarjetas de eventos activos con countdown y contador propios. |
| `assets/events-cards.css` | Estilos aislados de las tarjetas de eventos. |
| `validacion-campos.js` | Validaciones de formularios y lógica híbrida de precio. |
| `verificacion-upload.js` | Compresión y subida de comprobantes a Supabase Storage. |
| `tasa-dolar-verificacion.js` | Lectura de `tasa_dolar_bcv` y cálculo de montos en bolívares. |
| `user-detection-api.js` | Detección de usuarios registrados por correo. |
| `mubi-scanner.js` | Wrapper de `html5-qrcode` para el validador. |
| `*-camera-helper.js` | Helpers de cámara para Android, iOS y universal. |
| `supabase-storage.js` | Utilidades de Storage. |
| `assets/analytics.js` | Tracking GA4 y persistencia de UTM. |
| `assets/whatsapp-widget.js` | Widget de contacto por WhatsApp. |

---

## 5. Flujo de compra en detalle

### 5.1 Selección de evento

- `assets/events-ui.js` guarda `localStorage['lamubi-evento-id']` y navega a `comprar.html`.
- Modos de evento en `assets/events-config.js`:
  - `active`: visible y permite compra.
  - `info`: visible, muestra modal informativo y no vende.
  - `hidden`: oculto, pero permite acceso directo (comportamiento legacy).
  - `closed`: oculto y bloquea la compra en `comprar.html` y `verificacion.html`.

### 5.2 Datos del comprador

`comprar.html` guarda:

- `localStorage['lamubi-form-data']`: datos personales + `eventoId` + `paymentMethod`.
- `localStorage['lamubi-purchase']`: `cantidadEntradas`, `hombres`, `mujeres`.

El multi-ticket se activa con el feature flag `multi_tickets_enabled`. Permite hasta 10 entradas y exige que `hombres + mujeres = cantidadEntradas`.

### 5.3 Precio

Lógica híbrida:

- `evento_id === 1` → `configuracion_sistema.ticket_precio_usd_actual`.
- Cualquier otro evento → `eventos.precio_usd`.

El total es `precio_unitario × cantidad_entradas`.

### 5.4 Verificación y comprobante

| Método | Datos exigidos | Monto guardado |
|---|---|---|
| Pago Móvil | Referencia, fecha, monto en Bs., comprobante | Monto en Bs. |
| Binance | Confirmación, email remitente, fecha, comprobante | Total en USD |
| Zelle | Confirmación, email remitente, fecha, comprobante | Total en USD |

- Para Pago Móvil el monto debe ser exactamente `Math.round(tasa × totalUSD)`.
- El comprobante se comprime y se sube a `lamubi-qr-comprobantes` (máx. 5 MB; JPG/PNG/WebP/HEIC).
- La fila se inserta en `verificaciones_pagos` con `estado = 'pendiente'`.
- Se guarda `localStorage['lamubi-verification-id']` y se redirige a `confirmacion.html`.

> Zelle sigue implementado en `verificacion.html`, pero hoy no se ofrece en `pago.html`. Los métodos visibles son Pago Móvil y Binance.

### 5.5 Ticket y validación

- El QR contiene **solo el ID numérico** del ticket.
- `confirmacion.html` carga la fila por ID y muestra el estado del pago y del QR.
- El validador:
  1. Extrae los dígitos del QR.
  2. Busca el ticket en `verificaciones_pagos`.
  3. Rechaza si `qr_usado = true`, si `usos_restantes <= 0` o si `estado != 'aprobado'`.
  4. Al confirmar, decrementa `usos_restantes` y marca `qr_usado = true` cuando llega a cero.

---

## 6. Base de datos

### 6.1 Tablas principales

| Tabla | Uso |
|---|---|
| `eventos` | Catálogo de eventos. Columnas: `id`, `nombre`, `fecha`, `hora`, `ubicacion`, `ciudad`, `precio_usd`, `capacidad`, `activo`, `orden`. |
| `verificaciones_pagos` | Tickets y pagos. Incluye `evento_id`, `estado`, `qr_usado`, `usos_restantes`, cantidades y `datos_compra` JSONB. |
| `verificaciones_pagos_archive` | Copia histórica con `archived_at`. |
| `usuarios` | Datos de compradores registrados. |
| `administradores` | Login y roles del panel. |
| `configuracion_sistema` | Claves/valores globales. |

### 6.2 Estados de pago

`pendiente`, `aprobado`, `rechazado`.

### 6.3 Vistas

- `dashboard_verificaciones`
- `stats_verificaciones`
- `usuarios_con_verificaciones`
- `validador_tickets_activos`

### 6.4 Configuración usada

| Clave | Uso |
|---|---|
| `tasa_dolar_bcv` | Tasa oficial para convertir USD a Bs. |
| `ticket_precio_usd_actual` | Precio del evento General (id 1). |
| `multi_tickets_enabled` | Activa el selector de múltiples entradas. |

> Las claves `evento_nombre`, `evento_fecha`, `evento_hora`, `evento_ubicacion` y `ticket_precio_usd` existen en scripts antiguos, pero son legacy.

### 6.5 Seguridad

- **RLS desactivado** en todas las tablas.
- El login de administradores compara contraseña en texto plano desde el cliente.
- La sesión admin vive en `localStorage['lamubi_admin_user']`.
- La anon key está expuesta en el frontend (normal en Supabase), pero sin RLS permite lectura/escritura amplia.

Esto es aceptable para el MVP actual, pero debe corregirse antes de escalar.

---

## 7. Multi-evento y estado actual

`assets/events-config.js` define hoy:

| ID | Evento | Modo | Destacado |
|---|---|---|---|
| 1 | LA MUBI EXPERIENCE | `hidden` | No |
| 3 | LA MUBI POOL NIGHT BY NEON | `hidden` | No |
| 4 | I LOVE REGGAETON - STUFFA | `hidden` | No |
| 5 | LA MUBI DEL TERROR - STUFFA | `closed` | No |
| 6 | LA MUBI PERREO LAND | `active` | Sí |
| 7 | LA MUBI POOL NIGHT TRUJILLO | `active` | No |

Estado de los eventos nuevos:

- **Evento 6 — LA MUBI PERREO LAND:** sábado 14/11/2026, 9:00 PM, Discoteca Vocas Bistro Bar, Valera. Precio de preventa: **$3**. Capacidad: 700. DJs: BJ Troco (dueño de La Mubi) y DJ Touch.
- **Evento 7 — LA MUBI POOL NIGHT TRUJILLO:** sábado 28/11/2026, 9:00 PM, Trujillo. Precio: **$5**. Capacidad: 700. DJs: Abrahan, Troco y Yeibeat. La sede exacta queda pendiente.

Comportamiento actual de la landing:

- El hero muestra únicamente el logo de LA MUBI, sin fecha, countdown, contador ni botón.
- Justo debajo del logo aparece la sección “PRÓXIMOS EVENTOS” con las tarjetas de `assets/events-cards.js`.
- Cada tarjeta tiene su propio countdown, contador, precio y botón de compra.
- Los contadores son **estáticos** y se editan en `events-config.js`; no se calculan desde la base de datos.
- Para actualizar los contadores reales se usa `migrations/consultar-contadores-eventos.sql` y se copia el valor de `vendidas` en la configuración.

---

## 8. Panel administrativo

- Login contra `administradores` (`correo`, `password`, `activo`).
- Roles: `super_admin`, `tickets_admin`, `marketing_admin`, `admin_scanner`.
- Secciones:
  - **Dashboard:** total de tickets aprobados, total de compras, pendientes y tasa actual.
  - **Verificación de pagos:** pendientes, búsqueda, filtro por método, ver comprobante, detalle, aprobar y rechazar.
  - **Gestión de tickets:** todos los tickets, búsqueda, filtros por estado/método/evento, orden y exportación a Excel.
  - **Configuración:** tasa del dólar y precio del ticket (precio restringido a `super_admin`).
- El filtro de eventos del admin está **hardcodeado** con los IDs 1, 3, 4 y 5.

---

## 9. Documentación existente

| Documento | Contenido |
|---|---|
| `documentacion-lamubi-28-marzo-2026/` | Arquitectura, lógica de negocio, BD, diseño y guía de desarrollo. Es la documentación más completa, pero previa al multi-evento. |
| `documentacion-eventos/` | Guía para agregar y reactivar eventos. |
| `multi-evento-documentacion/` | Plan por fases y análisis del panel admin multi-evento. |
| `PLANIFICACION-TELEGRAM-NOTIFICATIONS.md` | Diseño de notificaciones Telegram; no implementado. |
| `PLAN-MODULO-LICOR-SIMPLE-30-marzo-2026.md` | Propuesta de mesas/licor por WhatsApp; no implementada. |
| `bd-documentacion/`, `ESTRUCTURA-*`, `MVP-*`, `PROGRESO-*` | Snapshots históricos; algunos desactualizados. |

---

## 10. Hallazgos y deuda técnica

1. **Sin CTA de compra activo** en la landing con la configuración actual.
2. Contadores de la landing estáticos y en cero; no reflejan la BD.
3. Contadores y fechas deben actualizarse manualmente en `assets/events-config.js`.
4. RLS desactivado y contraseñas de admin en texto plano.
5. Credenciales Supabase duplicadas inline en `confirmacion.html`.
6. `confirmacion.html` tenía logs de depuración sin commitear.
7. Documentación de BD desactualizada: no refleja `eventos` ni `evento_id`.
8. El plan multi-evento original usaba IDs 1 y 2 (Trujillo/Maracaibo), distintos de los IDs actuales 1/3/4/5.
9. `getUsersWithTickets()` del dashboard cuenta tickets aprobados, no usuarios únicos, y consulta el estado `'usado'`, que no existe en el CHECK.
10. `Zelle` está implementado pero no ofrecido actualmente.
11. No hay `.gitignore`, tests ni build.
12. `README.md` tenía un conflicto de merge (resuelto el 6-nov-2026).

---

## 11. Prioridades inmediatas

1. Ejecutar `migrations/20261106_001_add_eventos_perreo_pool_trujillo.sql` en Supabase.
2. Verificar los IDs 6 y 7 en la tabla `eventos`.
3. Probar el flujo completo de compra para ambos eventos.
4. Actualizar el contador estático en `assets/events-config.js` cuando haya ventas.
5. Mantener intactos el diseño y las funcionalidades actuales.
6. Futuro: endurecer seguridad, automatizar contadores y reescribir con una arquitectura más mantenible.

---

## 12. Reglas de trabajo

Las reglas obligatorias para cualquier cambio están en `REGLAS-DESARROLLO.md`. Deben leerse antes de tocar el proyecto.
