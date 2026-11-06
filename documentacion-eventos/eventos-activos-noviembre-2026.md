# Eventos activos — Noviembre 2026

Documento operativo de los dos eventos habilitados en la landing.

---

## Evento 6 — LA MUBI PERREO LAND

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
| Estado | `active` y `featured` |

- Countdown: `2026-11-14T21:00:00-04:00`.
- Contador estático inicial: `0 vendidas de 700 disponibles`.
- Botón: `COMPRAR ENTRADA - $3`.

---

## Evento 7 — LA MUBI POOL NIGHT TRUJILLO

| Campo | Valor |
|---|---|
| ID | 7 |
| Fecha | Sábado 28/11/2026 |
| Hora | 9:00 PM (America/Caracas, UTC-4) |
| Ciudad | Trujillo |
| Lugar | 11:11 Good Vibes - Snack and Bar, Trujillo |
| Precio | $5 preventa |
| Capacidad | 700 |
| DJs | Abrahan, Troco y Yeibeat |
| Estado | `active` |

- Countdown: `2026-11-28T21:00:00-04:00`.
- Contador estático inicial: `0 vendidas de 700 disponibles`.
- Botón: `COMPRAR ENTRADA - $5`.

---

## Cómo actualizar el contador

El contador es estático. Para actualizarlo:

1. Ejecutar `migrations/consultar-contadores-eventos.sql` en Supabase.
2. Leer la columna `vendidas` para el evento correspondiente.
3. Editar `assets/events-config.js`:
   ```js
   counter: { vendidas: NUEVO_VALOR, disponibles: 700 }
   ```
4. Guardar y publicar.

La landing no consulta la base de datos para los contadores.

---

## Cómo cambiar el precio

Si termina la preventa de Perreo Land:

1. Actualizar `eventos.precio_usd` en la base de datos para el ID 6.
2. Actualizar `precioUsd`, `ui.buttonLabel` y `ui.card.priceLabel` en `assets/events-config.js`.
3. Publicar.

El flujo de pago toma el precio de `eventos.precio_usd` para los eventos distintos de 1.

---

## Cómo desactivar un evento

En `assets/events-config.js`:

- Cambiar `ui.mode` a `'closed'` para bloquear la compra y ocultar el botón.
- Cambiar `ui.mode` a `'info'` para mostrarlo con modal informativo.
- Cambiar `ui.mode` a `'hidden'` para ocultarlo sin bloquear el acceso directo.

No es necesario tocar HTML ni CSS.
