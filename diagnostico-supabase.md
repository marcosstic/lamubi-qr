# 🔍 DIAGNÓSTICO SUPABASE - ESTADO ACTUAL

## 📋 Objetivo
Analizar estado real de tablas para planificación MVP 4 días

## 🗄️ Información Recopilada

### Tablas Encontradas (8 totales):
✅ administradores - Panel admin
✅ compras - Core del sistema tickets
✅ eventos - Gestión de eventos
✅ funnel_completo - [PENDIENTE - sin schema]
✅ interacciones - Tracking de usuarios
✅ stats_marketing - [PENDIENTE - sin schema]
✅ usuarios - Base de usuarios
✅ usuarios_con_compras - [PENDIENTE - sin schema]

### Estado Tablas Clave:

#### 👥 administradores - ✅ PERFECTO
```sql
- id, nombre, correo, password
- rol: super_admin, marketing_admin
- permisos: jsonb (expandible)
- fecha_creacion, ultimo_acceso, activo
- metadata: jsonb
```

#### 🎫 compras - ✅ 90% PERFECTO PARA QR
```sql
- id, usuario_id, payment_method, monto (5.00)
- verified (boolean), datos_verificacion (jsonb)
- fecha_compra, fecha_verificacion
- qr_code (UNIQUE) - ¡Ya existe!
- ticket_usado, validador_id, metodo_validacion
- metadata: jsonb
```

#### 🎪 eventos - ✅ ÚTIL
```sql
- id, nombre, descripcion, fecha_evento
- ubicacion, capacidad, precio_base
- activo, metadata, fechas control
```

#### 👤 usuarios - ✅ COMPLETO
```sql
- id, nombre, correo, telefono
- genero, cedula, edad, fuente
- status: lead (por defecto)
- fecha_registro, etiquetas (jsonb), notas
```

#### 📊 interacciones - ✅ ÚTIL PARA MARKETING
```sql
- id, usuario_id, tipo, fuente
- detalles (jsonb), fecha
- metadata (jsonb)
```

### Tablas sin Schema (3 pendientes) - ✅ RESUELTO:
✅ funnel_completo - VISTA (usuarios + compras + funnel_stage)
✅ stats_marketing - VISTA (estadísticas por fuente/status)
✅ usuarios_con_compras - VISTA (usuarios con última compra)

### Análisis Detallado:

#### 📊 funnel_completo - ✅ MUY ÚTIL
```sql
-- Vista que combina usuarios + compras + etapa del funnel
SELECT u.id, u.nombre, u.correo, u.status, u.fecha_registro,
       c.id AS compra_id, c.fecha_compra, c.verified,
       CASE 
         WHEN c.verified = true THEN 'compra_verificada'
         WHEN c.id IS NOT NULL THEN 'compra_pendiente'
         WHEN u.status = 'cliente' THEN 'cliente_sin_compra'
         WHEN u.status = 'prospecto' THEN 'prospecto'
         ELSE 'lead'
       END AS funnel_stage
FROM usuarios u LEFT JOIN compras c ON u.id = c.usuario_id;
```
**🎯 Uso MVP:** Perfecto para dashboard de conversión

#### 📈 stats_marketing - ✅ ÚTIL
```sql
-- Vista de estadísticas por fuente y status
SELECT fuente, status, count(*) AS total,
       count(DISTINCT date(fecha_registro)) AS dias_activos,
       min(fecha_registro) AS primer_registro,
       max(fecha_registro) AS ultimo_registro
FROM usuarios GROUP BY fuente, status;
```
**🎯 Uso MVP:** Estadísticas básicas para dashboard

#### 👥 usuarios_con_compras - ✅ MUY ÚTIL
```sql
-- Vista de usuarios con su última compra
SELECT u.*, c.id AS compra_id, c.payment_method, 
       c.monto, c.verified, c.fecha_compra
FROM usuarios u LEFT JOIN LATERAL (
  SELECT * FROM compras 
  WHERE compras.usuario_id = u.id 
  ORDER BY fecha_compra DESC LIMIT 1
) c ON true;
```
**🎯 Uso MVP:** Dashboard de usuarios con tickets

### Storage:
- **Bucket lamubi-comprobantes**: [PENDIENTE - confirmar]
- **Políticas**: [PENDIENTE - confirmar]
- **Espacio usado**: [PENDIENTE - confirmar]

## 🎯 Análisis y Decisiones

### Tablas Esenciales MVP (MANTENER):
✅ usuarios - Base para tickets
✅ compras - Core del sistema QR
✅ administradores - Panel admin
✅ eventos - Información del evento

### Tablas Útiles (MANTENER):
✅ interacciones - Tracking para marketing
✅ funnel_completo - Dashboard conversión
✅ stats_marketing - Estadísticas marketing
✅ usuarios_con_compras - Dashboard usuarios + tickets

### Tablas a Eliminar (NINGUNA):
✅ Todas las vistas son útiles para el MVP

### Campos Faltantes para MVP:
```sql
-- Tabla compras (agregar solo 4 campos):
ALTER TABLE compras ADD COLUMN comprobante_url TEXT;
ALTER TABLE compras ADD COLUMN qr_generado BOOLEAN DEFAULT false;
ALTER TABLE compras ADD COLUMN codigo_unico VARCHAR(255) UNIQUE;
ALTER TABLE compras ADD COLUMN email_enviado BOOLEAN DEFAULT false;

-- Tabla configuracion_sistema (crear si no existe):
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now()
);
```

## 📊 Conclusiones

### ✅ Buenas Noticias:
- **90% del trabajo ya está hecho**
- **Campos QR ya existen** (qr_code, ticket_usado)
- **Relaciones completas** (usuario → compra → admin)
- **Estructura enterprise-level**

### 🔧 Trabajo Mínimo Requerido:
- **Agregar 4 campos a compras**
- **Crear tabla configuracion_sistema**
- **Investigar 3 tablas pendientes**

## 🚀 Plan de Acción Inmediato

### Paso 1: Investigar tablas pendientes
### Paso 2: Agregar campos faltantes
### Paso 3: Crear tabla configuración
### Paso 4: Empezar implementación MVP

---
*Fecha: $(date)*
*Estado: Análisis completado - Listo para planificación*
