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
| `20261106_003_add_qr_token.sql` | Agrega el token aleatorio `qr_token` para los QR seguros. |
| `20261106_003_rollback.sql` | Elimina `qr_token` si se decide volver al QR numérico. |
| `20261106_004_add_public_ticket_code.sql` | Agrega el código público `LM-XXXXXXXXXXXX` para mostrar en el ticket. |
| `20261106_004_rollback.sql` | Elimina el código público si se decide volver al ID visible. |
| `20261107_005_update_evento_7_precio.sql` | Cambia el precio del evento 7 de $5 a $3. |
| `20261107_005_rollback.sql` | Restaura el precio del evento 7 a $5. |
| `20261116_001_add_evento_coco_bar.sql` | Inserta el evento 8: Platinium Club x Coco Bar - La Mubi Pool Night. |
| `20261116_001_rollback.sql` | Revierte solo el evento 8, únicamente si no tiene tickets. |
| `consultar-contadores-eventos.sql` | Consulta de solo lectura para actualizar los contadores estáticos. |

## Cómo ejecutar

> Importante: ejecutar la migración **antes** de publicar el frontend. Las tarjetas ya están en el código, pero el flujo de pago consulta `eventos.precio_usd`; si las filas no existen, el precio puede caer al valor por defecto.

1. Abrir Supabase → SQL Editor.
2. Ejecutar `20261106_001_add_eventos_perreo_pool_trujillo.sql`.
3. Revisar las consultas de verificación incluidas al final.
4. Confirmar que los eventos 6 y 7 existen con los datos correctos.
5. Ejecutar `20261106_003_add_qr_token.sql` **antes** de publicar el frontend con QR por token.
6. Confirmar que todos los tickets tienen `qr_token` único.
7. Ejecutar `20261106_004_add_public_ticket_code.sql` **antes** de publicar el ticket con código público.
8. Confirmar que todos los tickets tienen `public_code` único.
9. Ejecutar `20261116_001_add_evento_coco_bar.sql` **antes** de publicar la tarjeta de Platinium Club x Coco Bar.
10. Confirmar que el evento 8 existe con los datos correctos y que el evento 6 sigue intacto.

> Las migraciones 003 y 004 son obligatorias antes de desplegar el frontend nuevo. Si el frontend se publica sin ellas, la confirmación y los validadores fallarán al buscar `qr_token` o `public_code`.

> La migración 005 debe ejecutarse antes de publicar la landing con el precio de Pool Night Trujillo en $3. Si se publica antes, la landing mostraría $3 pero el pago seguiría cobrando $5.

> La migración 20261116_001 debe ejecutarse antes de publicar la tarjeta de Platinium Club x Coco Bar. Si se publica antes, el pago usaría el precio por defecto y el ticket podría quedar sin un evento válido.

La migración 20261106_001 inserta IDs explícitos (6 y 7) y luego sincroniza la secuencia `eventos_id_seq` solo si está por detrás del máximo ID. Así los próximos eventos no chocan con estos IDs.

La migración 20261116_001 inserta el ID explícito 8 y repite la sincronización de la secuencia. No modifica ni elimina el evento 6: sus tickets históricos y su fila en la BD se conservan.

## Cómo revertir

Solo si es necesario:

1. Ejecutar `20261106_001_rollback.sql`.
2. Si hay tickets asociados, el script se detendrá y no borrará nada.
3. Revisar que los eventos 6 y 7 ya no existan.
4. Para el evento 8, ejecutar `20261116_001_rollback.sql`. También se detendrá si ya tiene tickets.

## Contadores estáticos

El contador de la landing se actualiza manualmente en `assets/events-config.js`.
Para saber el número real de entradas aprobadas por evento, ejecutar `consultar-contadores-eventos.sql` y copiar el valor de `vendidas`.
