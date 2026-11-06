# Migraciones de base de datos — LA MUBI QR

Esta carpeta contiene los cambios de base de datos del proyecto.

## Reglas

1. Toda migración debe ser **aditiva** y **transaccional**.
2. No se permite `DROP`, `TRUNCATE`, `ALTER` destructivo ni `DELETE` de datos existentes en una migración forward.
3. Cada migración debe poder verificarse con consultas de solo lectura.
4. Cada migración debe tener un rollback separado y condicionado.
5. Antes de ejecutar, hacer respaldo de las tablas afectadas.
6. Ejecutar desde el SQL Editor de Supabase con un rol de servicio, nunca con la anon key.

## Archivos

| Archivo | Propósito |
|---|---|
| `20261106_001_add_eventos_perreo_pool_trujillo.sql` | Inserta los eventos 6 y 7. |
| `20261106_001_rollback.sql` | Revierte solo esos dos eventos, únicamente si no tienen tickets. |
| `20261106_002_update_evento_7_ubicacion.sql` | Actualiza la ubicación del evento 7 a 11:11 Good Vibes - Snack and Bar. |
| `20261106_002_rollback.sql` | Restaura la ubicación anterior del evento 7. |
| `consultar-contadores-eventos.sql` | Consulta de solo lectura para actualizar los contadores estáticos. |

## Cómo ejecutar

> Importante: ejecutar la migración **antes** de publicar el frontend. Las tarjetas ya están en el código, pero el flujo de pago consulta `eventos.precio_usd`; si las filas no existen, el precio puede caer al valor por defecto.

1. Abrir Supabase → SQL Editor.
2. Ejecutar `20261106_001_add_eventos_perreo_pool_trujillo.sql`.
3. Revisar las consultas de verificación incluidas al final.
4. Confirmar que los eventos 6 y 7 existen con los datos correctos.

La migración inserta IDs explícitos (6 y 7) y luego sincroniza la secuencia `eventos_id_seq` solo si está por detrás del máximo ID. Así los próximos eventos no chocan con estos IDs.

## Cómo revertir

Solo si es necesario:

1. Ejecutar `20261106_001_rollback.sql`.
2. Si hay tickets asociados, el script se detendrá y no borrará nada.
3. Revisar que los eventos 6 y 7 ya no existan.

## Contadores estáticos

El contador de la landing se actualiza manualmente en `assets/events-config.js`.
Para saber el número real de entradas aprobadas por evento, ejecutar `consultar-contadores-eventos.sql` y copiar el valor de `vendidas`.
