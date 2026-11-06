# REGLAS DE DESARROLLO — LA MUBI QR

> Estas reglas son obligatorias para cualquier cambio en este proyecto.
> Antes de modificar código, leerlas y aplicarlas.

---

## Regla 0 — Prioridad absoluta: no romper lo que funciona

Todo cambio debe ser **incremental y de bajo riesgo**. Ninguna modificación puede alterar el diseño visual ni el funcionamiento de flujos existentes.

Antes de tocar cualquier archivo, responder:

1. ¿Qué funcionalidades pueden verse afectadas?
2. ¿Qué flujo completo debo probar después?
3. ¿Puedo hacer el cambio en un archivo aislado y revertirlo con Git?

Si la respuesta no es clara, detenerse y preguntar.

---

## Regla 1 — Prohibido usar `sed` y herramientas destructivas similares

**No usar `sed`, `awk`, `perl -i`, `truncate`, `dd`, redirecciones que sobrescriban archivos completos (`> archivo`) ni comandos de borrado masivo (`rm -rf`).**

Motivo: pueden eliminar o corromper contenido importante sin dejar rastro.

Para editar archivos:

- Usar la herramienta de edición con contexto exacto (`edit`).
- Usar escritura completa solo cuando se vaya a reemplazar un archivo de forma intencional y revisada (`write`).
- Para leer o buscar, usar `read`, `grep` y `glob`.
- Si un cambio es masivo o repetitivo, hacerlo por bloques revisados, nunca con un stream editor ciego.

---

## Regla 2 — Cambios mínimos y enfocados

- Modificar solo los archivos necesarios.
- No reformatear archivos completos.
- No renombrar variables, clases o IDs sin autorización.
- No eliminar código “que parece no usarse” sin verificar dependencias.
- No mezclar refactors con correcciones o nuevas funcionalidades.

---

## Regla 3 — No alterar el diseño existente

- No cambiar colores, tipografías, tamaños, espaciados ni animaciones actuales.
- No eliminar secciones, tarjetas, botones ni textos sin autorización.
- Cualquier elemento nuevo debe integrarse con la identidad visual existente (paleta `#bb1175`, `#f43cb8`, `#f361e5`, fondo negro, Montserrat).
- Los cambios de UI deben ser aditivos y reversibles.

---

## Regla 4 — Respetar la arquitectura y las convenciones

- La configuración de eventos vive en `assets/events-config.js`.
- La presentación de eventos vive en `assets/events-ui.js`.
- No duplicar lógica de eventos en HTML si ya existe un módulo para eso.
- Mantener las claves de localStorage existentes:
  - `lamubi-evento-id`
  - `lamubi-form-data`
  - `lamubi-purchase`
  - `lamubi-verification-id`
  - `lamubi-admin-user`
- Mantener los nombres de tablas, columnas y estados de la base de datos.
- Respetar la zona horaria `America/Caracas` (UTC-4).

---

## Regla 5 — La base de datos se cambia con scripts revisados

- Todo cambio de esquema debe entregarse como archivo `.sql` legible y revisable.
- No ejecutar cambios destructivos (`DROP`, `ALTER` de columnas existentes, borrados) sin confirmación explícita.
- Antes de proponer un cambio de datos, verificar el estado real con una consulta de solo lectura.
- No asumir que un ID de evento existe: verificarlo en la tabla `eventos`.

---

## Regla 6 — No exponer ni empeorar la seguridad

- No agregar credenciales nuevas en el código.
- No introducir contraseñas, tokens ni claves en archivos versionados.
- No modificar la configuración de Supabase (RLS, policies, auth) sin autorización.
- Si se detecta un riesgo de seguridad, documentarlo y avisar; no corregirlo por cuenta propia dentro de un cambio funcional.

---

## Regla 7 — Probar antes de dar por terminado

Cada cambio debe verificarse contra este checklist, según aplique:

### Flujo de compra
- [ ] La landing carga sin errores en consola.
- [ ] El botón del evento abre `comprar.html` con el `evento_id` correcto.
- [ ] El formulario guarda los datos y avanza a `pago.html`.
- [ ] El resumen muestra evento, cantidad y precio correctos.
- [ ] El método de pago avanza a `verificacion.html`.
- [ ] La validación de monto funciona.
- [ ] El comprobante se sube correctamente.
- [ ] El ticket se inserta en `verificaciones_pagos`.
- [ ] `confirmacion.html` muestra datos, estado y QR.
- [ ] El QR escaneado en el validador encuentra el ticket.

### Panel admin
- [ ] El login funciona con un administrador activo.
- [ ] El dashboard carga métricas.
- [ ] Los pagos pendientes se listan.
- [ ] Aprobar cambia el estado a `aprobado`.
- [ ] Rechazar cambia el estado a `rechazado`.
- [ ] El filtro por evento funciona.
- [ ] La exportación a Excel descarga el archivo.

### Regresión visual
- [ ] La landing mantiene su diseño en móvil y escritorio.
- [ ] No se ocultaron secciones ni botones que antes funcionaban.
- [ ] Los textos y precios se muestran correctamente.

---

## Regla 8 — Git como red de seguridad

- Hacer commits pequeños y descriptivos.
- No mezclar archivos no relacionados en un mismo commit.
- No hacer `git reset --hard`, `git checkout -- .` ni `git clean -fd` sin autorización.
- No commitear binarios pesados ni archivos temporales.
- Antes de cambios grandes, verificar que el árbol esté limpio o que los cambios pendientes estén identificados.

---

## Regla 9 — Documentar lo que se cambia

- Si se agrega o reactiva un evento, actualizar `assets/events-config.js` y la documentación correspondiente.
- Si se agrega una regla de negocio, dejarla escrita en `CONTEXTO-PROYECTO.md` o en la documentación del módulo.
- Si algo queda pendiente o riesgoso, registrarlo explícitamente.

---

## Regla 10 — Ante la duda, preguntar

- No inventar fechas, precios, capacidades, nombres de eventos ni IDs.
- No asumir que un evento debe venderse: confirmar modo (`active`, `info`, `hidden`, `closed`).
- No tomar decisiones de diseño o negocio sin validación del responsable.

---

## Definición de “cambio seguro”

Un cambio es seguro cuando:

1. Está limitado a los archivos necesarios.
2. No modifica comportamiento existente sin autorización.
3. Fue probado en el flujo afectado.
4. Se puede revertir con Git.
5. Está documentado.
