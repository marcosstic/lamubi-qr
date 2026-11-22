# Contexto para agentes — LA MUBI QR

> **Lee este archivo completo antes de modificar el proyecto.**
> Su objetivo es que una persona o un agente de IA pueda retomar el trabajo sin depender de la conversación original.

**Última actualización:** 22 de noviembre de 2026.

---

## 1. Datos rápidos

| Dato | Valor |
|---|---|
| Proyecto | Sistema de tickets QR de LA MUBI |
| Frontend | HTML5, CSS3 y JavaScript vanilla |
| Backend | Supabase / PostgreSQL |
| Hosting | Vercel (sitio estático, sin build) |
| Producción | https://lamubi-qr.vercel.app |
| Repositorio | https://github.com/marcosstic/lamubi-qr |
| Rama de producción | `main` |
| Zona horaria | America/Caracas (UTC-4) |
| Proyecto Supabase | `jayzsshngmbwvwdmizis` |

> `www.lamubimcbo.com` es un sitio de marketing distinto. El sistema de tickets vive en `lamubi-qr.vercel.app`.

---

## 2. Archivos importantes

| Archivo | Responsabilidad |
|---|---|
| `assets/events-config.js` | Configuración modular de eventos: fechas, precios, textos, lineup, countdown y contadores. |
| `assets/events-cards.js` | Renderiza las tarjetas activas, las ordena por fecha, crea countdowns y botones. |
| `assets/events-cards.css` | Estilos de tarjetas y acentos visuales (`pink`, `aqua`, `coco`, `red`). |
| `index.html` | Landing, lista fija de próximos eventos y precio mínimo. |
| `comprar.html` | Formulario del comprador. Lee `evento_id` desde `localStorage`. |
| `pago.html` | Resumen, precio según evento y selección de método de pago. |
| `verificacion.html` | Datos del pago, comprobante y creación del ticket pendiente. |
| `confirmacion.html` | Ticket QR final y código público. |
| `validador-ios.html` | Escáner QR principal para iPhone. |
| `validador.html` | Escáner alternativo para Android/escritorio. |
| `admin/` | Panel administrativo: pagos, tickets, configuración y filtros. |
| `migrations/` | Migraciones SQL aditivas y rollbacks. |
| `CONTEXTO-PROYECTO.md` | Contexto técnico general del proyecto. |
| `documentacion-eventos/` | Documentación operativa de eventos. |

---

## 3. Cómo funciona el sistema de eventos

### 3.1 Fuente de verdad del frontend

Los eventos visibles se definen en `assets/events-config.js`.

Cada evento tiene esta forma:

```js
claveInterna: {
    id: 9,
    nombre: 'TU ERES MALA - STUFFA',
    fecha: '2026-12-05',
    precioUsd: 5,
    ui: {
        mode: 'active',
        featured: false,
        dateLabel: 'SÁBADO 05 DE DICIEMBRE · MARACAIBO',
        buttonLabel: 'COMPRAR ENTRADA - $5',
        className: 'tu-eres-mala-button',
        infoText: 'ENTRADAS DISPONIBLES PARA TU ERES MALA EN STUFFA',
        countdownTarget: '2026-12-05T21:00:00-04:00',
        counter: { vendidas: 6, disponibles: 700 },
        card: {
            shortDate: '05 DE DICIEMBRE',
            eyebrow: 'MARACAIBO',
            title: 'TU ERES MALA',
            venue: 'Stuffa · Av. 5 de Julio con Calle 77',
            city: 'Maracaibo',
            priceLabel: '$5',
            badge: 'PREVENTA',
            accent: 'red',
            lineup: [
                { name: 'VALERO', note: 'Artista invitado' },
                { name: 'DIEGO HAZZE' },
                { name: 'ROYRF' },
                { name: 'TROCO' },
                { name: 'TOUCH' }
            ]
        }
    }
}
```

Campos opcionales de `ui.card`:

- `eyebrow`: texto pequeño sobre el título.
- `title`: título visible si no se quiere usar `nombre`.
- `note` dentro de `lineup`: texto secundario, por ejemplo “Artista invitado”.

### 3.2 Modos de un evento

| `ui.mode` | Tarjeta visible | Compra directa | Uso |
|---|---|---|---|
| `active` | Sí | Sí | Evento en venta. |
| `info` | No en tarjetas, pero puede mostrarse con modal | No directa | Evento informativo. |
| `hidden` | No | Sí | Oculto pero con acceso directo legacy. |
| `closed` | No | No | Evento finalizado o ventas cerradas. |

Para ocultar un evento sin borrar nada de la base de datos, usar `closed`.

### 3.3 Orden de las tarjetas

`assets/events-cards.js` ordena automáticamente por `fecha` ascendente.

No hace falta reordenar el HTML ni el CSS. Solo hay que usar fechas en formato `YYYY-MM-DD`.

### 3.4 Contadores

Los contadores de la landing son **manuales y de marketing**. No se calculan desde la base de datos.

Se editan aquí:

```js
counter: { vendidas: 6, disponibles: 700 }
```

Para consultar las ventas reales:

```sql
SELECT
    e.id,
    e.nombre,
    e.capacidad,
    COALESCE(
        SUM(vp.cantidad_entradas) FILTER (WHERE vp.estado = 'aprobado'),
        0
    ) AS vendidas
FROM public.eventos e
LEFT JOIN public.verificaciones_pagos vp
    ON vp.evento_id = e.id
WHERE e.id IN (6, 7, 8, 9)
GROUP BY e.id, e.nombre, e.capacidad
ORDER BY e.id;
```

---

## 4. Estado de los eventos al 22/11/2026

| ID | Evento | Fecha | Precio | Modo | Notas |
|---|---|---|---|---|---|
| 1 | LA MUBI EXPERIENCE | 2026-08-22 | $5 | `hidden` | Evento general histórico. |
| 2 | MARACAIBO - STUFFA | 2026-08-29 | $5 | — | Existe en BD, no está configurado en la landing. |
| 3 | LA MUBI POOL NIGHT BY NEON | 2026-10-03 | $5 | `hidden` | Histórico. |
| 4 | I LOVE REGGAETON - STUFFA | 2026-09-19 | $4 | `hidden` | Su botón se llamaba “Reggaeton Life - Club Quimico”. |
| 5 | LA MUBI DEL TERROR - STUFFA | 2026-10-24 | $5 | `closed` | Finalizado. |
| 6 | LA MUBI PERREO LAND | 2026-11-14 | $3 | `closed` | Vocas, Valera. BD y tickets conservados. |
| 7 | LA MUBI POOL NIGHT TRUJILLO | 2026-11-28 | $3 | `active` | Contador 39/700. |
| 8 | PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT | 2026-12-12 | $5 | `active` | Contador 114/1500. Acento `coco`. |
| 9 | TU ERES MALA - STUFFA | 2026-12-05 | $5 | `active` | Contador 27/700. Acento `red`. |

Orden visible actual de la landing:

1. Pool Night Trujillo — 28 de noviembre.
2. Tu Eres Mala — 5 de diciembre.
3. Platinium Club · Coco Bar — 12 de diciembre.

---

## 5. Cómo agregar un evento nuevo

### Paso 1: definir los datos

Necesitas como mínimo:

- Nombre del evento.
- Fecha (`YYYY-MM-DD`).
- Hora (`HH:MM`).
- Lugar y ciudad.
- Precio en USD.
- Capacidad.
- Contador inicial de marketing.
- Lineup.
- Paleta o acento visual.

### Paso 2: crear la fila en Supabase

No publiques una tarjeta de compra antes de crear la fila en `eventos`.

Primero consulta el máximo ID:

```sql
SELECT MAX(id) AS max_id FROM public.eventos;
```

Luego crea una migración aditiva en `migrations/` con el siguiente ID. Ejemplo:

```sql
BEGIN;

INSERT INTO public.eventos
    (id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo, orden)
VALUES
    (10, 'NOMBRE DEL EVENTO', DATE '2027-01-15', '21:00',
     'Lugar - Dirección', 'Maracaibo', 5.00, 700, true, 10)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    seq_name text := pg_get_serial_sequence('public.eventos', 'id');
    max_id bigint;
    seq_last bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM public.eventos;

    IF seq_name IS NOT NULL AND max_id IS NOT NULL THEN
        EXECUTE format('SELECT last_value FROM %s', seq_name) INTO seq_last;

        IF seq_last < max_id THEN
            PERFORM setval(seq_name::regclass, max_id, true);
        END IF;
    END IF;
END $$;

COMMIT;
```

Verifica después:

```sql
SELECT id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo
FROM public.eventos
WHERE id = 10;
```

### Paso 3: agregar el evento al frontend

En `assets/events-config.js`:

1. Agrega el bloque del evento.
2. Usa una fecha `YYYY-MM-DD`.
3. Define `ui.mode: 'active'`.
4. Define `countdownTarget` con offset de Venezuela: `T21:00:00-04:00`.
5. Define `ui.card` con `accent`.
6. Si el color es nuevo, agrega su bloque en `assets/events-cards.css`.

Acentos existentes:

- `pink` (por defecto).
- `aqua`.
- `coco`.
- `red`.

### Paso 4: actualizar el resto del frontend

1. `index.html`: agregar el evento a la lista fija de ENTRADAS, en orden de fecha.
2. `admin/index.html`: agregar la opción de respaldo del evento en el filtro.
3. `CONTEXTO-PROYECTO.md`: agregar el evento a la tabla.
4. `documentacion-eventos/`: documentar el evento.
5. `migrations/README.md`: registrar la migración.

### Paso 5: probar

Servidor local:

```bash
cd /home/marcos/Documentos/lamubi-qr
python3 -m http.server 8000 --bind 0.0.0.0
```

Abrir:

```text
http://localhost:8000
```

Probar:

1. La tarjeta aparece en el orden correcto.
2. El diseño no rompe escritorio ni móvil.
3. Clic en comprar guarda el `evento_id` correcto.
4. `comprar.html` muestra el nombre correcto.
5. `pago.html` muestra el precio correcto.
6. `verificacion.html` calcula el monto correcto.
7. El escáner sigue funcionando.

Para probar la cámara del iPhone en local, usar HTTPS temporal:

```bash
cloudflared tunnel --url http://localhost:8000 --no-autoupdate
```

La URL `https://...trycloudflare.com` que entrega Cloudflare es temporal.

### Paso 6: publicar

```bash
git add <archivos>
git commit -m "feat: agregar evento ..."
git push origin main
```

Vercel despliega automáticamente desde `main`.

Si el push por HTTPS pide credenciales, en esta máquina se ha usado la deploy key:

```bash
GIT_SSH_COMMAND='ssh -i ~/.ssh/lamubi_deploy_20261116 -o IdentitiesOnly=yes' \
git push git@github.com:marcosstic/lamubi-qr.git main
```

Verificar en producción:

- La tarjeta nueva aparece.
- El orden por fecha es correcto.
- El flujo de compra usa el `evento_id` correcto.
- El precio y el nombre vienen de Supabase.

---

## 6. Cómo modificar un evento existente

### Cambiar precio

1. Actualizar `eventos.precio_usd` con una migración.
2. Actualizar en `assets/events-config.js`:
   - `precioUsd`
   - `ui.buttonLabel`
   - `ui.card.priceLabel`
3. Probar `pago.html` y `verificacion.html`.
4. Publicar.

### Cambiar fecha u hora

1. Actualizar `fecha` y `hora` en Supabase con una migración.
2. Actualizar `fecha`, `ui.dateLabel`, `ui.countdownTarget`, `ui.card.shortDate` y `ui.card.eyebrow` si aplica.
3. Actualizar `index.html` y la documentación.
4. Publicar.

### Cambiar contador de marketing

Solo editar:

```js
counter: { vendidas: NUEVO_VALOR, disponibles: CAPACIDAD }
```

No requiere migración.

### Cambiar nombre

1. Crear una migración nueva. **No editar migraciones ya ejecutadas.**
2. Actualizar `nombre`, `ui.card.title` y textos visibles.
3. Actualizar admin y documentación.
4. Publicar.

### Desactivar un evento

En `assets/events-config.js`:

```js
mode: 'closed'
```

La tarjeta desaparece, la compra directa se bloquea y la fila de `eventos` se conserva.

**Nunca borrar la fila de `eventos` si el evento ya tiene tickets.**

---

## 7. Flujo de compra

1. La landing guarda `lamubi-evento-id` en `localStorage`.
2. `comprar.html` lee el ID y consulta `eventos`.
3. `pago.html` toma el precio desde `eventos.precio_usd`.
4. `verificacion.html` sube el comprobante y crea un registro pendiente.
5. El admin aprueba o rechaza.
6. Al aprobar, el ticket queda válido y se genera el QR.

Claves de `localStorage`:

- `lamubi-evento-id`
- `lamubi-form-data`
- `lamubi-purchase`

Regla crítica: si el evento no existe en `eventos`, el nombre y el precio pueden caer a valores por defecto y el ticket puede fallar. **Crear siempre la fila en Supabase antes de publicar la tarjeta.**

---

## 8. Escáner QR

- Principal: `validador-ios.html`.
- Alternativo: `validador.html`.
- Requiere HTTPS o `localhost` para usar la cámara.
- Requiere un usuario `admin_scanner` o `super_admin`.
- El QR contiene `LAMUBI:<uuid>`, no el ID numérico.
- El escáner valida `qr_token`, `estado`, `qr_usado` y `usos_restantes`.
- Para pruebas, no pulsar “Validar Ticket” si se está usando un ticket real: eso consume el ticket.

---

## 9. Migraciones

Reglas:

1. Aditivas.
2. Transaccionales.
3. Idempotentes.
4. Sin `DROP`, `TRUNCATE` ni `DELETE` de datos existentes en migraciones forward.
5. Con consultas de verificación de solo lectura.
6. Con rollback separado.
7. No editar una migración ya aplicada: crear una nueva.

Nombres usados:

- `20261116_001_add_evento_coco_bar.sql`
- `20261116_002_rename_evento_8.sql`
- `20261119_001_add_evento_tu_eres_mala.sql`

Las migraciones se ejecutan en **Supabase → SQL Editor**, nunca con la anon key del frontend.

---

## 10. Despliegue en Vercel

- Vercel publica desde `main`.
- No hay build ni instalación.
- `vercel.json` fuerza `no-cache` para que los cambios de eventos se vean de inmediato.
- `netlify.toml` es legado.
- Después de un `git push`, revisar https://lamubi-qr.vercel.app.

---

## 11. Pruebas y diagnóstico

### La tarjeta no aparece

Revisar:

1. `ui.mode === 'active'`.
2. `ui.card` existe.
3. La fecha es válida.
4. No hay errores de JavaScript en la consola.
5. El archivo `events-config.js` desplegado contiene el evento.

### La tarjeta aparece en orden incorrecto

Revisar que `fecha` esté en formato `YYYY-MM-DD`.

### La compra muestra otro nombre o precio

Revisar la fila de `eventos` en Supabase. Probablemente falta la migración o el ID no coincide.

### Se ven ventas en cero

1. Revisar el filtro del admin.
2. Confirmar el `evento_id` correcto.
3. Los contadores de la landing son manuales.
4. Los nombres comerciales pueden no coincidir con los nombres de la BD.
5. El evento histórico de Vocas usó `evento_id=1`, no el 6.

### El iPhone no abre la cámara

Usar HTTPS. En local, usar Cloudflare Tunnel.

---

## 12. Cómo recuperar esta conversación en OpenCode

Las sesiones de OpenCode **no se borran al cerrar la ventana**. Puedes volver a una sesión anterior así:

### Desde la TUI

- `/sessions` para ver y abrir sesiones existentes.
- `Ctrl+X`, luego `L` para volver a una sesión.
- `Ctrl+O` para abrir sesiones y proyectos recientes juntos.
- `Ctrl+Shift+T` para reabrir la última pestaña cerrada.
- `/new` para empezar una sesión nueva.

### Desde la CLI

```bash
opencode session list
opencode run --continue "Continúa el trabajo anterior"
opencode run --session ses_XXXXXXXX "Revisa el estado actual"
opencode mini --continue
```

También puedes exportar una sesión:

```bash
opencode session export ses_XXXXXXXX
opencode session export ses_XXXXXXXX --sanitize
```

### Recomendación práctica

No dependas solo del historial del chat. Para retomar el proyecto:

1. Abre una sesión nueva.
2. Adjunta o menciona `AGENTE-CONTEXTO.md`.
3. Usa este prompt:

```text
Lee AGENTE-CONTEXTO.md completo. Revisa git status y git log.
Después analiza el cambio que te voy a pedir, sin modificar nada todavía.
```

4. Revisa el estado actual con `git status` y `git log`.

---

## 13. Reglas para futuros agentes

1. Leer este documento antes de modificar.
2. Revisar `git status` y `git log`.
3. No borrar datos ni eventos con tickets.
4. No tocar archivos ajenos al cambio.
5. Mantener el diseño y los acentos existentes.
6. Crear migraciones aditivas, idempotentes y con rollback.
7. Ejecutar la migración antes de publicar la tarjeta.
8. Probar el flujo completo, no solo la landing.
9. No consumir tickets reales durante las pruebas.
10. Actualizar este documento cuando cambie la arquitectura, el estado de los eventos o el proceso de despliegue.

---

## 14. Limitaciones conocidas

- RLS y seguridad de administradores están pendientes de endurecer.
- Las contraseñas de admin están en texto plano.
- No hay tests automatizados ni CI.
- Los contadores de la landing son estáticos.
- Hay archivos pesados versionados, como el binario `ngrok`.
- La documentación histórica en `bd-documentacion/` y `ESTRUCTURA-*` puede estar desactualizada; este documento y `CONTEXTO-PROYECTO.md` son la referencia más reciente.
