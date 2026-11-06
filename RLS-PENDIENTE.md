# RLS pendiente — Plan de endurecimiento de seguridad

> Documento de trabajo para después de los eventos de noviembre 2026.
> No implementar RLS de golpe: primero hay que migrar los accesos del frontend.
> Última actualización: 6 de noviembre de 2026.

---

## 1. Estado actual

- RLS está **desactivado** en las tablas de `public`.
- El frontend usa la **anon key** para leer y escribir directamente.
- El login de administradores consulta `administradores` y compara contraseña en texto plano.
- `validador-ios.html` tiene su propio login contra `administradores`.
- `validador.html` no tiene autenticación.
- `verificaciones_pagos` es legible y actualizable con la anon key.
- El bucket de comprobantes se usa con URLs públicas.
- La Opción A agregó `qr_token` a `verificaciones_pagos`, pero mientras RLS siga desactivado ese token es legible por cualquiera con la anon key.

Esto es funcional para el MVP, pero no es seguro para producción a escala.

---

## 2. Por qué no se puede activar RLS hoy

Activar RLS sin migrar el frontend rompería:

- La compra y el `INSERT` en `verificaciones_pagos`.
- La lectura del ticket en `confirmacion.html`.
- El escáner de `validador.html` y `validador-ios.html`.
- El panel admin: dashboard, pagos, tickets, configuración.
- La lectura de `eventos` y `configuracion_sistema`.
- La detección de usuarios por correo.
- La lectura de comprobantes.

La anon key es pública por diseño. Sin RLS, esa key puede listar tickets, usuarios y administradores.

---

## 3. Arquitectura objetivo

### 3.1 Autenticación

- Migrar administradores y staff a **Supabase Auth**.
- Mantener el mismo formulario visual de login.
- Guardar el rol en `app_metadata` o vincular `administradores.auth_user_id`.
- Eliminar la comparación de contraseña en texto plano.
- El JWT de Supabase Auth tendrá `auth.uid()` y el rol.

### 3.2 RPCs para operaciones públicas

El frontend deja de acceder directamente a `verificaciones_pagos`.

| RPC | Quién | Qué hace |
|---|---|---|
| `create_ticket(payload jsonb)` | anon | Inserta un ticket pendiente y devuelve `id`, `qr_token`. |
| `get_ticket_public(qr_token)` | anon | Devuelve solo el ticket del comprador. |
| `validate_ticket(qr_token)` | staff autenticado | Valida y descuenta usos de forma atómica. |
| `find_user_minimal(email)` | anon | Devuelve solo `id`, `nombre`, `existe`; nunca datos sensibles. |
| `get_public_config()` | anon | Devuelve solo tasa, precio y flags públicas. |
| `get_active_events()` | anon | Devuelve eventos activos. |

### 3.3 RLS por tabla

| Tabla | anon | authenticated staff | admin |
|---|---|---|---|
| `eventos` | SELECT solo activos | SELECT | ALL |
| `configuracion_sistema` | SELECT solo claves públicas | SELECT | ALL |
| `verificaciones_pagos` | sin acceso directo | vía RPC | SELECT/UPDATE |
| `verificaciones_pagos_archive` | sin acceso | sin acceso | SELECT |
| `usuarios` | sin acceso | sin acceso | SELECT/UPDATE |
| `administradores` | sin acceso | perfil propio | ALL |

### 3.4 Storage

- Bucket de comprobantes **privado**.
- anon puede subir, pero no listar ni leer.
- Admin usa URLs firmadas.
- El campo `comprobante_url` deja de ser público.

---

## 4. Fases de implementación

### Fase 1 — Auth + RPCs (1-2 días)

1. Crear usuarios de Supabase Auth para cada administrador.
2. Agregar `auth_user_id` a `administradores`.
3. Migrar `admin/login.js` a `supabase.auth.signInWithPassword`.
4. Migrar `validador-ios.html` al mismo Auth.
5. Crear RPC `create_ticket`.
6. Crear RPC `get_ticket_public`.
7. Crear RPC `validate_ticket`.
8. Crear RPC `find_user_minimal`.
9. Crear RPC `get_public_config`.
10. Crear RPC `get_active_events`.
11. Ajustar `confirmacion.html`, `verificacion.html`, `comprar.html`, `pago.html` y validadores para usar RPCs.
12. Mantener RLS desactivado durante esta fase.

### Fase 2 — RLS en tablas públicas (1 día)

1. Activar RLS en `eventos`.
2. Activar RLS en `configuracion_sistema`.
3. Activar RLS en `verificaciones_pagos`.
4. Activar RLS en `usuarios`.
5. Activar RLS en `administradores`.
6. Probar compra, confirmación, admin y escáner.
7. Revisar logs y errores 401/403.

### Fase 3 — Storage (0.5 día)

1. Hacer privado el bucket `lamubi-qr-comprobantes`.
2. Crear policies de subida para anon.
3. Bloquear listado/lectura anon.
4. Migrar el panel admin a URLs firmadas.
5. Probar visualización y descarga de comprobantes.

### Fase 4 — Pruebas y limpieza (0.5-1 día)

1. Regresión completa en staging.
2. Prueba de compra real controlada.
3. Prueba de aprobación/rechazo.
4. Prueba de escáner en iPhone.
5. Prueba de intento de acceso anon a tablas.
6. Documentar y desplegar.

---

## 5. Consultas de auditoría previas

Ejecutar en el SQL Editor antes de la Fase 1.

```sql
-- RLS por tabla
SELECT n.nspname AS schema, c.relname AS table, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Grants
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- Columnas
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Funciones
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Storage
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'storage';
```

---

## 6. Criterios de aceptación

- Una compra crea el ticket sin acceso directo a la tabla.
- La confirmación funciona con `qr_token`.
- El escáner solo acepta tokens válidos y staff autenticado.
- El admin solo funciona con Supabase Auth.
- La anon key no puede listar tickets, usuarios ni administradores.
- La anon key no puede modificar configuración ni aprobar pagos.
- Los comprobantes no son públicos.
- El diseño y los flujos visuales no cambian.
- Existe rollback documentado.

---

## 7. Rollback

Por fase:

```sql
ALTER TABLE public.verificaciones_pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema DISABLE ROW LEVEL SECURITY;
```

Además:

- Revertir el frontend al commit anterior.
- Mantener las RPCs y columnas nuevas; son aditivas.
- Restaurar el bucket público solo si es estrictamente necesario.

---

## 8. Riesgos

- Activar RLS antes de migrar el frontend rompe la operación.
- El login actual con contraseña en texto plano no es compatible con RLS.
- El escáner sin autenticación no puede protegerse solo con políticas.
- Storage público expone comprobantes de pago.
- Los cambios de Auth requieren coordinar contraseñas/reseteos con los administradores.

---

## 9. Decisión pendiente

Antes de empezar la Fase 1, definir:

1. ¿Se migran los administradores a Supabase Auth con contraseñas nuevas?
2. ¿El validador de escritorio (`validador.html`) también exigirá login?
3. ¿Los comprobantes serán privados con URLs firmadas?
4. ¿Se hará primero en staging y luego en producción?

---

## 10. Relación con la Opción A

La Opción A ya dejó `qr_token` en `verificaciones_pagos`.

Cuando se active RLS:

- El token seguirá existiendo.
- La tabla dejará de ser legible por anon.
- El escáner usará `validate_ticket(qr_token)` en lugar de consultar la tabla.
- La confirmación usará `get_ticket_public(qr_token)`.
- El token quedará protegido por RLS y RPCs.

Hasta entonces, la Opción A mejora la resistencia contra QR adivinados, pero no sustituye a RLS.
