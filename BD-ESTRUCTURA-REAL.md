# Estructura de Base de Datos Real - LA MUBI QR
**Versión: v1.0**
**Fecha: 2026-02-07**
*Generado desde Supabase (schema: public)*
*Esta documentación se versionará con cada cambio significativo en el esquema.*

## Resumen
- **Tablas principales**: 4 (usuarios, administradores, verificaciones_pagos, configuracion_sistema)
- **Vistas**: 4 (dashboard_verificaciones, stats_verificaciones, usuarios_con_verificaciones, validador_tickets_activos)
- **RLS**: Deshabilitado en todas las tablas
- **Triggers**: Actualización automática de `fecha_actualizacion` en 3 tablas
- **Funciones**: 2 (venezuela_now, actualizar_timestamp)

## Tablas

### 1. usuarios
*Usuarios registrados en el sistema.*

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | integer | NO | nextval('usuarios_id_seq') | PK |
| nombre | varchar | NO | null | Nombre completo |
| correo | varchar | NO | null | Email único |
| telefono | varchar | YES | null | Teléfono |
| genero | varchar | YES | null | hombre/mujer/otro (check) |
| cedula | varchar | YES | null | Cédula |
| edad | integer | YES | null | Edad |
| fuente | varchar | YES | 'directo' | Origen del registro |
| status | varchar | YES | 'lead' | Estado del usuario |
| fecha_registro | timestamp tz | YES | venezuela_now() | Fecha registro |
| fecha_actualizacion | timestamp tz | YES | venezuela_now() | Última modificación |
| metadata | jsonb | YES | '{}' | Datos adicionales |

**Constraints**:
- PK: id
- UNIQUE: correo
- CHECK: genero IN ('hombre', 'mujer', 'otro')

**Índices**:
- idx_usuarios_correo (correo)
- idx_usuarios_fecha_registro (fecha_registro)
- idx_usuarios_status (status)
- usuarios_correo_key (unique, correo)
- usuarios_pkey (unique, id)

**Triggers**:
- trigger_usuarios_actualizar: BEFORE UPDATE -> actualizar_timestamp()

### 2. administradores
*Administradores del sistema con roles específicos.*

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | integer | NO | nextval('administradores_id_seq') | PK |
| nombre | varchar | NO | null | Nombre |
| correo | varchar | NO | null | Email único |
| password | varchar | NO | null | Contraseña (hasheada?) |
| rol | varchar | NO | null | super_admin/tickets_admin/marketing_admin (check) |
| permisos | jsonb | YES | '{}' | Permisos específicos |
| activo | boolean | YES | true | Activo/inactivo |
| fecha_creacion | timestamp tz | YES | venezuela_now() | Fecha creación |
| ultimo_acceso | timestamp tz | YES | null | Último login |
| fecha_actualizacion | timestamp tz | YES | venezuela_now() | Última modificación |
| metadata | jsonb | YES | '{}' | Datos adicionales |

**Constraints**:
- PK: id
- UNIQUE: correo
- CHECK: rol IN ('super_admin', 'tickets_admin', 'marketing_admin')

**Índices**:
- idx_administradores_activo (activo)
- idx_administradores_correo (correo)
- idx_administradores_rol (rol)
- administradores_correo_key (unique, correo)
- administradores_pkey (unique, id)

**Triggers**:
- trigger_administradores_actualizar: BEFORE UPDATE -> actualizar_timestamp()

### 3. verificaciones_pagos
*Tickets de pago verificados (core del sistema QR).*

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | integer | NO | nextval('verificaciones_pagos_id_seq') | PK (QR code) |
| user_id | integer | YES | null | FK a usuarios.id |
| email_temporal | varchar | YES | null | Email si no registrado |
| metodo_pago | varchar | NO | null | pago-movil/zelle (check) |
| monto | numeric | NO | null | Monto en Bs |
| tasa_dolar | numeric | NO | null | Tasa USD usada |
| referencia | varchar | YES | null | Ref pago móvil |
| confirmacion_zelle | varchar | YES | null | Código Zelle |
| email_remitente | varchar | YES | null | Email remitente Zelle |
| fecha_pago | timestamp tz | NO | null | Fecha del pago |
| fecha_creacion | timestamp tz | YES | venezuela_now() | Fecha creación |
| fecha_actualizacion | timestamp tz | YES | venezuela_now() | Última modificación |
| fecha_verificacion | timestamp tz | YES | null | Fecha aprobación/rechazo |
| estado | varchar | YES | 'pendiente' | pendiente/aprobado/rechazado (check) |
| comprobante_url | text | YES | null | URL del comprobante |
| comprobante_nombre | varchar | YES | null | Nombre del archivo |
| admin_notas | text | YES | null | Notas del admin |
| admin_id | integer | YES | null | FK a administradores.id |
| datos_compra | jsonb | YES | '{}' | Detalles compra |
| metadata | jsonb | YES | '{}' | Datos adicionales |
| qr_usado | boolean | YES | false | Usado en validador |
| fecha_uso | timestamp tz | YES | null | Fecha validación |
| validador_nombre | varchar | YES | 'Validador MVP' | Nombre del validador |
| ubicacion_validacion | varchar | YES | 'Entrada Principal' | Lugar validación |

**Constraints**:
- PK: id
- FK: user_id -> usuarios.id (SET NULL)
- FK: admin_id -> administradores.id (SET NULL)
- CHECK: estado IN ('pendiente', 'aprobado', 'rechazado')
- CHECK: metodo_pago IN ('pago-movil', 'zelle')
- CHECK: user_id IS NOT NULL OR email_temporal IS NOT NULL

**Índices**:
- idx_verificaciones_dashboard (estado, metodo_pago, fecha_creacion)
- idx_verificaciones_email_temporal (email_temporal)
- idx_verificaciones_estado (estado)
- idx_verificaciones_fecha_creacion (fecha_creacion)
- idx_verificaciones_fecha_pago (fecha_pago)
- idx_verificaciones_id_qr (id)
- idx_verificaciones_metodo_pago (metodo_pago)
- idx_verificaciones_qr_no_usados (qr_usado) WHERE qr_usado = false
- idx_verificaciones_user_id (user_id)
- verificaciones_pagos_pkey (unique, id)

**Triggers**:
- trigger_verificaciones_actualizar: BEFORE UPDATE -> actualizar_timestamp()

### 4. configuracion_sistema
*Configuraciones globales del sistema.*

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | integer | NO | nextval('configuracion_sistema_id_seq') | PK |
| clave | varchar | NO | null | Clave única |
| valor | text | NO | null | Valor |
| descripcion | text | YES | null | Descripción |
| activo | boolean | YES | true | Activo |
| fecha_actualizacion | timestamp tz | YES | venezuela_now() | Última modificación |
| actualizado_por | integer | YES | null | FK a administradores.id |
| metadata | jsonb | YES | '{}' | Datos adicionales |
| created_at | timestamp tz | YES | venezuela_now() | Fecha creación |

**Constraints**:
- PK: id
- UNIQUE: clave
- FK: actualizado_por -> administradores.id (SET NULL)

**Índices**:
- idx_configuracion_activo (activo)
- idx_configuracion_clave (clave)
- configuracion_sistema_clave_key (unique, clave)
- configuracion_sistema_pkey (unique, id)

## Vistas

### dashboard_verificaciones
*Vista para el panel de administración (tickets con datos de usuario/admin).*
- Campos: id, fecha_creacion, metodo_pago, monto, tasa_dolar, estado, fecha_verificacion, user_id, email_temporal, referencia, confirmacion_zelle, comprobante_url, admin_notas, usuario_nombre, usuario_correo, usuario_telefono, usuario_status, validador_nombre, validador_rol, fecha_uso, ubicacion_validacion

### stats_verificaciones
*Estadísticas generales (conteos por estado/método).*
- Campos: total_verificaciones, pendientes, aprobadas, rechazadas, pago_movil_count, zelle_count, monto_promedio, ultima_verificacion, fecha_grupo

### usuarios_con_verificaciones
*Usuarios con resumen de verificaciones.*
- Campos: id, nombre, correo, telefono, status, fecha_registro, total_verificaciones, verificaciones_aprobadas, ultima_verificacion, metodos_pago_usados

### validador_tickets_activos
*Vista para el validador QR (tickets aprobados no usados).*
- Campos: id, email_temporal, metodo_pago, monto, estado, qr_usado, fecha_uso, validador_nombre, ubicacion_validacion, fecha_creacion

## Funciones

### venezuela_now()
*Retorna timestamp en zona horaria Venezuela (America/Caracas).*

### actualizar_timestamp()
*Trigger function: actualiza fecha_actualizacion en UPDATE.*

## Seguridad
- **RLS**: Deshabilitado en todas las tablas (rls_enabled=false).
- **Policies existentes** (no aplican hasta activar RLS):
  - usuarios: Lectura pública, gestión por admins (roles=public, cual ambiguo).
- **Riesgos**: Seguridad depende de anon key y frontend. Recomendable activar RLS + policies restrictivas para producción.

## Notas de alineación con código
- Validador usa `qr_usado` para bloquear reuso.
- Admin panel consulta vistas como `dashboard_verificaciones`.
- Triggers mantienen `fecha_actualizacion` consistente.
- Constraints evitan estados inválidos.
- Índices optimizan búsquedas por estado/fecha/email.
