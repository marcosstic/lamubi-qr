# Eventos activos — Noviembre/Diciembre 2026

Documento operativo de los eventos configurados en la landing.

---

## Evento 6 — LA MUBI PERREO LAND (finalizado)

| Campo | Valor |
|---|---|
| ID | 6 |
| Fecha | Sábado 14/11/2026 |
| Hora | 9:00 PM (America/Caracas, UTC-4) |
| Ciudad | Valera |
| Lugar | Discoteca Vocas Bistro Bar |
| Precio | $3 preventa |
| Capacidad | 700 |
| DJs | BJ, Troco y Touch |
| Estado | `closed` (tarjeta oculta) |

- La tarjeta ya no se muestra porque el evento terminó.
- La configuración se conserva en `assets/events-config.js`.
- La fila del evento y sus tickets históricos se conservan en Supabase.
- Si alguien entra directo con `lamubi-evento-id=6`, la compra se bloquea con el mensaje de ventas cerradas.

---

## Evento 7 — LA MUBI POOL NIGHT TRUJILLO

| Campo | Valor |
|---|---|
| ID | 7 |
| Fecha | Sábado 28/11/2026 |
| Hora | 9:00 PM (America/Caracas, UTC-4) |
| Ciudad | Trujillo |
| Lugar | 11:11 Good Vibes - Snack and Bar, Trujillo |
| Precio | $3 preventa |
| Capacidad | 700 |
| DJs | Abrahan, Troco y Yeibeat |
| Estado | `active` |

- Countdown: `2026-11-28T21:00:00-04:00`.
- Contador estático de marketing: `56 vendidas de 700 disponibles`.
- Botón: `COMPRAR ENTRADA - $3`.
- El ticket 1325, ya aprobado antes del cambio, conserva su monto original de $5.

---

## Evento 9 — TU ERES MALA - STUFFA

| Campo | Valor |
|---|---|
| ID | 9 |
| Fecha | Sábado 05/12/2026 |
| Hora | 9:00 PM (America/Caracas, UTC-4) |
| Ciudad | Maracaibo |
| Lugar | Stuffa - Av. 5 de Julio con Calle 77 |
| Precio | $5 preventa |
| Capacidad | 700 |
| Lineup | Valero (artista invitado), Diego Hazze, Royrf, Troco y Touch |
| Estado | `active` |

- Countdown: `2026-12-05T21:00:00-04:00`.
- Contador estático de marketing: `6 vendidas de 700 disponibles`.
- Botón: `COMPRAR ENTRADA - $5`.
- Acento visual: `red` (rojo/negro/blanco del flyer).
- La migración `migrations/20261119_001_add_evento_tu_eres_mala.sql` debe ejecutarse **antes** de publicar la tarjeta.

---

## Evento 8 — PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT

| Campo | Valor |
|---|---|
| ID | 8 |
| Fecha | Sábado 12/12/2026 |
| Hora | 7:00 PM (America/Caracas, UTC-4) |
| Ciudad | Maracaibo |
| Lugar | Platinium Club - Coco Bar |
| Precio | $5 preventa |
| Capacidad | 1500 |
| DJs | Troco, Diego Hazze, Touch y Roderick Potella |
| Estado | `active` y `featured` |

- Countdown: `2026-12-12T19:00:00-04:00`.
- Contador estático de marketing: `36 vendidas de 1500 disponibles`.
- Botón: `COMPRAR ENTRADA - $5`.
- Acento visual: `coco` (amarillo y verde del logo Coco Bar).
- La migración `migrations/20261116_001_add_evento_coco_bar.sql` debe ejecutarse **antes** de publicar la tarjeta.
- La migración `migrations/20261116_002_rename_evento_8.sql` actualiza el nombre del evento a `PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT`.

---

## Cómo actualizar el contador

El contador es estático. Para actualizarlo:

1. Ejecutar `migrations/consultar-contadores-eventos.sql` en Supabase.
2. Leer la columna `vendidas` para el evento correspondiente.
3. Editar `assets/events-config.js`:
   ```js
   counter: { vendidas: NUEVO_VALOR, disponibles: CAPACIDAD }
   ```
4. Guardar y publicar.

La landing no consulta la base de datos para los contadores.

---

## Cómo cambiar el precio

1. Actualizar `eventos.precio_usd` en la base de datos para el ID correspondiente.
2. Actualizar `precioUsd`, `ui.buttonLabel` y `ui.card.priceLabel` en `assets/events-config.js`.
3. Publicar.

El flujo de pago toma el precio de `eventos.precio_usd` para los eventos distintos de 1.

---

## Cómo desactivar un evento

En `assets/events-config.js`:

- Cambiar `ui.mode` a `'closed'` para bloquear la compra y ocultar la tarjeta.
- Cambiar `ui.mode` a `'info'` para mostrarlo con modal informativo.
- Cambiar `ui.mode` a `'hidden'` para ocultarlo sin bloquear el acceso directo.

No es necesario tocar HTML ni CSS. No se debe eliminar la fila de `eventos` si el evento ya tiene tickets.
