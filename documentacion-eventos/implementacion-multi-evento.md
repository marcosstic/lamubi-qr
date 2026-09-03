# Guía de Implementación Multi-Evento - LA MUBI

## Arquitectura del Sistema Multi-Evento

### Conceptos Clave
- **evento_id**: Identificador único para cada evento en la tabla `eventos`
- **Lógica híbrida de precio**: evento_id=1 usa `configuracion_sistema`, otros usan `eventos.precio_usd`
- **localStorage**: Claves `lamubi-evento-id`, `lamubi-form-data`, `lamubi-purchase`
- **Supabase**: Consultas dinámicas a tabla `eventos` para nombres y precios

### Flujo de Datos
1. index.html → seleccionar evento → guardar `evento_id` en localStorage
2. comprar.html → leer `evento_id` → consultar nombre evento → guardar en formData
3. pago.html → leer `evento_id` → consultar nombre y precio → mostrar dinámicamente
4. verificacion.html → leer `evento_id` → aplicar lógica híbrida de precio → validar
5. confirmacion.html → leer `evento_id` del ticket → consultar nombre → mostrar en ticket

## Fases de Implementación

### Fase 1: Base de Datos
```sql
-- Crear evento Pool Night
INSERT INTO eventos (nombre, precio_usd, capacidad, activo, fecha_evento)
VALUES ('LA MUBI POOL NIGHT BY NEON', 5.00, 2500, true, '2026-12-31');

-- Corregir nombre del evento General (id=1)
UPDATE eventos SET nombre = 'LA MUBI EXPERIENCE' WHERE id = 1;
```

### Fase 2: index.html
- Agregar botón para Pool Night con `onclick` que establece `evento_id=3` en localStorage
- Mantener botón General con `evento_id=1`

### Fase 3: comprar.html
- Leer `evento_id` de localStorage
- Consultar nombre del evento en tabla `eventos`
- Mostrar dinámicamente: si `evento_id=1` mostrar texto genérico, si no mostrar nombre del evento
- Guardar `evento_id` en formData

### Fase 4: pago.html
- Leer `evento_id` de formData
- Implementar lógica híbrida de precio:
  - `evento_id=1`: usar `window.LAMUBI_UTILS.getTicketPriceUSD()` (configuracion_sistema)
  - `evento_id=3`: consultar `eventos.precio_usd`
- Mostrar nombre del evento dinámicamente
- Calcular total: `precio_unitario * cantidad_entradas`

### Fase 5: verificacion.html
- Leer `evento_id` de formData
- Implementar lógica híbrida de precio en TODOS los lugares donde se calcula `ticketPriceUsd`
- Actualizar mensaje de error de validación con monto esperado correcto
- Guardar `evento_id` en `verificaciones_pagos`

### Fase 6: confirmacion.html
- Leer `evento_id` de datos del ticket
- Consultar nombre del evento en tabla `eventos`
- Mostrar nombre del evento en el ticket de confirmación

### Fase 7: Admin Panel
- Agregar filtro por `evento_id` en tabla `verificaciones_pagos`
- Mostrar nombre del evento en lugar de solo el ID

## Errores Encontrados y Soluciones

### Error 1: Redeclaration de const formData
**Problema:** Múltiples declaraciones de `const formData` en el mismo scope en verificacion.html
**Solución:** Renombrar variables con nombres descriptivos (`formDataEvento`, `formDataPayment`)
**Ubicaciones:** líneas 742, 791, 1018, 1061

### Error 2: Validación de monto incorrecta
**Problema:** validacion-campos.js usaba precio de configuracion_sistema para todos los eventos
**Solución:** Implementar lógica híbrida de precio en validacion-campos.js (líneas 197-224, 367-394)
**Impacto:** Cache del monto esperado ahora usa precio correcto para cada evento

### Error 3: Mensaje de error estático
**Problema:** Mensaje "Monto incorrecto. Debe ser exactamente: Bs. 5.700,00" estaba hardcodeado en HTML
**Solución:** Actualizar dinámicamente el mensaje con `montoEsperado` calculado
**Ubicación:** verificacion.html línea 840-844

### Error 4: confirmacion.html no mostraba nombre correcto
**Problema:** Intentaba usar `window.LAMUBI_UTILS?.supabase` que no estaba disponible
**Solución:** Usar instancia local `lamubiSupabase` definida en confirmacion.html
**Ubicación:** confirmacion.html línea 629-646

## Guía Paso a Paso para Agregar Nuevo Evento

### Paso 1: Base de Datos
```sql
-- Insertar nuevo evento
INSERT INTO eventos (nombre, precio_usd, capacidad, activo, fecha_evento)
VALUES ('NOMBRE DEL EVENTO', PRECIO_USD, CAPACIDAD, true, 'FECHA');
-- Ejemplo:
INSERT INTO eventos (nombre, precio_usd, capacidad, activo, fecha_evento)
VALUES ('LA MUBI BEACH PARTY', 7.00, 3000, true, '2027-01-15');
```

### Paso 2: index.html
- Agregar botón para el nuevo evento
- Establecer `evento_id` correspondiente en localStorage

### Paso 3: Verificar archivos
- **comprar.html**: Ya tiene lógica genérica, no requiere cambios
- **pago.html**: Ya tiene lógica híbrida, no requiere cambios
- **verificacion.html**: Ya tiene lógica híbrida, no requiere cambios
- **confirmacion.html**: Ya tiene lógica genérica, no requiere cambios
- **validacion-campos.js**: Ya tiene lógica híbrida, no requiere cambios

### Paso 4: Admin Panel
- El filtro por evento_id ya funciona automáticamente para nuevos eventos

## Checklist de Verificación

Para cada nuevo evento, verificar:

- [ ] Evento creado en base de datos con nombre, precio, capacidad correctos
- [ ] Botón en index.html establece `evento_id` correcto en localStorage
- [ ] comprar.html muestra nombre del evento (o texto genérico si es General)
- [ ] pago.html muestra nombre del evento y precio correcto
- [ ] pago.html calcula total correctamente (precio × cantidad)
- [ ] verificacion.html muestra precio total correcto
- [ ] verificacion.html valida monto transferido correctamente
- [ ] confirmacion.html muestra nombre del evento en el ticket
- [ ] Admin panel puede filtrar tickets por evento_id
- [ ] No hay errores de redeclaration en consola
- [ ] Validaciones de monto funcionan correctamente

## Archivos Modificados

1. **index.html**: Agregar botón para nuevo evento
2. **comprar.html**: Lógica genérica para mostrar nombre (ya implementado)
3. **pago.html**: Lógica híbrida de precio (ya implementado)
4. **verificacion.html**: Lógica híbrida de precio + validaciones (ya implementado)
5. **confirmacion.html**: Consulta dinámica de nombre (ya implementado)
6. **validacion-campos.js**: Lógica híbrida de precio (ya implementado)
7. **admin/admin-panel.js**: Filtro por evento_id (ya implementado)

## Notas Importantes

- **Lógica híbrida**: Solo evento_id=1 usa configuracion_sistema. Todos los demás eventos usan eventos.precio_usd
- **Tasa del dólar**: Es global (configuracion_sistema), aplica a todos los eventos
- **Precio unitario**: Se consulta dinámicamente de la base de datos, no está hardcodeado
- **Nombre del evento**: Se consulta dinámicamente de la base de datos
- **LocalStorage**: Clave `lamubi-evento-id` persiste a través del flujo de compra
