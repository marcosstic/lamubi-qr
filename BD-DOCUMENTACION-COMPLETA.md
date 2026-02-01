# 🗄️ LA MUBI - Documentación Completa de Base de Datos

## 📋 Tabla de Contenidos
- [Tablas Principales](#tablas-principales)
- [Tablas de Configuración](#tablas-de-configuración)
- [Vistas del Sistema](#vistas-del-sistema)
- [Campos Agregados (MVP)](#campos-agregados-mvp)
- [Relaciones y Claves Foráneas](#relaciones-y-claves-foráneas)
- [Índices de Rendimiento](#índices-de-rendimiento)

---

## 🗃️ Tablas Principales

### 👥 usuarios
**Tabla principal para almacenar información de usuarios/clientes**

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    genero VARCHAR(10),
    cedula VARCHAR(20),
    edad INTEGER,
    fuente VARCHAR(50) DEFAULT 'directo',
    status VARCHAR(20) DEFAULT 'cliente',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    metadata JSONB DEFAULT '{}'::jsonb
);
```

**Campos Importantes:**
- `id`: Identificador único del usuario
- `correo`: Email único (clave para login/detección)
- `fuente`: Origen del usuario (directo, instagram, etc.)
- `status`: Estado actual (cliente, lead, etc.)
- `metadata`: Datos adicionales flexibles

---

### 🎫 compras
**Tabla central para registrar todas las compras de tickets**

```sql
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    payment_method VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) DEFAULT 5.00,
    verified BOOLEAN DEFAULT false,
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    fecha_verificacion TIMESTAMP WITH TIME ZONE,
    validador_id INTEGER REFERENCES administradores(id),
    
    -- Campos agregados para MVP
    comprobante_url TEXT,
    qr_generado BOOLEAN DEFAULT false,
    ticket_usado BOOLEAN DEFAULT false,
    codigo_unico VARCHAR(255) UNIQUE,
    email_enviado BOOLEAN DEFAULT false,
    
    datos_verificacion JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

**Campos MVP Agregados:**
- `comprobante_url`: URL del comprobante de pago en Supabase Storage
- `qr_generado`: Indica si el QR fue generado
- `ticket_usado`: Indica si el ticket ya fue utilizado
- `codigo_unico`: Código único del ticket QR
- `email_enviado`: Indica si se envió confirmación por email
- `datos_verificacion`: Datos del proceso de verificación
- `validador_id`: ID del admin que verificó la compra

---

### 👤 administradores
**Tabla para gestión de administradores del sistema**

```sql
CREATE TABLE administradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('super_admin', 'marketing_admin', 'tickets_admin')),
    permisos JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

**Roles Disponibles:**
- `super_admin`: Acceso completo a todo el sistema
- `tickets_admin`: Gestión de tickets y verificación de pagos
- `marketing_admin`: Gestión de marketing y leads

---

## ⚙️ Tablas de Configuración

### 🔧 configuracion_sistema
**Tabla central para configuraciones globales del sistema**

```sql
CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    actualizado_por INTEGER REFERENCES administradores(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now()
);
```

**Configuraciones Clave:**
- `tasa_dolar_bcv`: Tasa del dólar para conversión
- `evento_nombre`: Nombre del evento principal
- `evento_fecha`: Fecha del evento
- `evento_hora`: Hora del evento
- `evento_ubicacion`: Ubicación del evento
- `ticket_precio_usd`: Precio base del ticket
- `ticket_metodos_pago`: Métodos de pago aceptados

---

## 📊 Vistas del Sistema

### 🎫 dashboard_tickets
**Vista optimizada para el panel de administración de tickets**

```sql
CREATE VIEW dashboard_tickets AS
SELECT 
    c.id as compra_id,
    c.fecha_compra,
    c.payment_method,
    c.monto,
    c.verified,
    c.qr_generado,
    c.ticket_usado,
    c.codigo_unico,
    c.comprobante_url,
    u.nombre as usuario_nombre,
    u.correo as usuario_correo,
    u.telefono as usuario_telefono,
    u.status as usuario_status,
    a.nombre as validador_nombre,
    c.fecha_verificacion,
    CASE 
        WHEN c.verified = true THEN 'aprobado'
        WHEN c.comprobante_url IS NOT NULL THEN 'pendiente'
        ELSE 'esperando_comprobante'
    END as estado_compra
FROM compras c
LEFT JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN administradores a ON c.validador_id = a.id
ORDER BY c.fecha_compra DESC;
```

**Utilidad:**
- Consultas optimizadas para el dashboard
- Información consolidada de compras y usuarios
- Estados calculados automáticamente

### 👥 usuarios_con_compras
**Vista para relacionar usuarios con sus compras**

```sql
CREATE VIEW usuarios_con_compras AS
SELECT 
    u.id,
    u.nombre,
    u.correo,
    u.telefono,
    u.status,
    u.fecha_registro,
    c.id as compra_id,
    c.fecha_compra,
    c.payment_method,
    c.monto,
    c.verified,
    c.codigo_unico
FROM usuarios u
LEFT JOIN compras c ON u.id = c.usuario_id;
```

---

## 🔍 Campos Agregados (MVP)

### A compras table:
```sql
-- Campos agregados para MVP Tickets QR
ALTER TABLE compras ADD COLUMN IF NOT EXISTS comprobante_url TEXT;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS qr_generado BOOLEAN DEFAULT false;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS ticket_usado BOOLEAN DEFAULT false;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(255) UNIQUE;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS validador_id INTEGER REFERENCES administradores(id);
ALTER TABLE compras ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP WITH TIME ZONE;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS datos_verificacion JSONB DEFAULT '{}'::jsonb;
```

### A administradores table:
```sql
-- Constraint de roles actualizado
ALTER TABLE administradores DROP CONSTRAINT IF EXISTS administradores_rol_check;
ALTER TABLE administradores ADD CONSTRAINT administradores_rol_check 
CHECK (rol::text = ANY (ARRAY['super_admin'::character varying, 'marketing_admin'::character varying, 'tickets_admin'::character varying]::text[]));
```

---

## 🔗 Relaciones y Claves Foráneas

### Diagrama de Relaciones:
```
usuarios (1) ←→ (N) compras
    └── usuario_id → id

administradores (1) ←→ (N) compras
    └── validador_id → id

administradores (1) ←→ (N) configuracion_sistema
    └── actualizado_por → id
```

### Relaciones Importantes:
1. **usuarios → compras**: Un usuario puede tener muchas compras
2. **administradores → compras**: Un admin puede verificar muchas compras
3. **administradores → configuracion_sistema**: Un admin puede actualizar configuraciones

---

## 📈 Índices de Rendimiento

### Índices Creados:
```sql
-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- Índices para compras
CREATE INDEX IF NOT EXISTS idx_compras_usuario_id ON compras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compras_verified ON compras(verified);
CREATE INDEX IF NOT EXISTS idx_compras_fecha_compra ON compras(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_compras_codigo_unico ON compras(codigo_unico);

-- Índices para administradores
CREATE INDEX IF NOT EXISTS idx_administradores_correo ON administradores(correo);
CREATE INDEX IF NOT EXISTS idx_administradores_activo ON administradores(activo);

-- Índices para configuración
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion_sistema(clave);
CREATE INDEX IF NOT EXISTS idx_configuracion_activo ON configuracion_sistema(activo);
```

---

## 📋 Datos Iniciales

### Administrador por Defecto:
```sql
INSERT INTO administradores (nombre, correo, password, rol, permisos, activo) 
VALUES 
    ('Tickets Admin', 'tickets@lamubi.com', 'tickets123', 'tickets_admin', 
     '{"verificar_compras": true, "configurar_tasa": true, "generar_qr": true, "ver_estadisticas": true}', 
     true);
```

### Configuración Inicial:
```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion, activo) 
VALUES 
    ('tasa_dolar_bcv', '1.234,56', 'Tasa del dólar BCV para conversión de tickets', true),
    ('evento_nombre', 'LA MUBI 2024', 'Nombre del evento principal', true),
    ('evento_fecha', '2024-02-15', 'Fecha del evento principal', true),
    ('evento_hora', '20:00', 'Hora del evento principal', true),
    ('evento_ubicacion', 'Caracas, Venezuela', 'Ubicación del evento principal', true),
    ('ticket_precio_usd', '5.00', 'Precio base del ticket en USD', true),
    ('ticket_metodos_pago', '["pago-movil", "zelle", "efectivo", "qr"]', 'Métodos de pago aceptados', true);
```

---

## 🔧 Funciones Útiles

### Función de Tiempo Venezuela:
```sql
CREATE OR REPLACE FUNCTION venezuela_now() 
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Caracas';
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Estadísticas Actuales (Última Verificación)

### Resumen de Datos:
- **Usuarios totales**: 167
- **Usuarios con compras**: 2
- **Compras totales**: 2
- **Compras aprobadas**: 2
- **Compras pendientes**: 0
- **Tasa dólar actual**: 1.234,56

---

## 🚀 Consideraciones de Rendimiento

### Optimizaciones Aplicadas:
1. **Vistas materializadas** para consultas frecuentes
2. **Índices compuestos** para búsquedas múltiples
3. **JSONB** con índices GIN para metadatos
4. **Partitioning** futuro para grandes volúmenes

### Monitoreo Recomendado:
- **Tamaño de tablas** y crecimiento
- **Consultas lentas** con EXPLAIN ANALYZE
- **Uso de índices** con pg_stat_user_indexes

---

## 📝 Notas de Mantenimiento

### Backups:
- **Automatizados** vía pg_dump
- **Frecuencia**: Diaria para datos, semanal para estructura
- **Retención**: 30 días

### Limpieza:
- **Logs de auditoría** - Retener 90 días
- **Datos temporales** - Limpiar mensualmente
- **Archivos obsoletos** - Revisar trimestralmente

---

## 🔄 Versiones y Cambios

### v1.0 - MVP Tickets QR (Ene 2026):
- ✅ Creación de estructura base
- ✅ Campos MVP en compras
- ✅ Sistema de configuración
- ✅ Vistas de dashboard
- ✅ Índices de rendimiento

### Próximas Versiones:
- 🔄 Auditoría completa
- 🔄 Sistema de notificaciones
- 🔄 Analytics avanzado
- 🔄 Integración pagos

---

## 📞 Contacto de Soporte

### Para consultas sobre la BD:
- **Documentación**: Este archivo
- **Scripts**: `/sql/` directory
- **Backups**: `/backups/` directory
- **Logs**: `/logs/` directory

---

*Última actualización: 29 de Enero de 2026*
*Versión: 1.0-MVP*
*Estado: Producción*
