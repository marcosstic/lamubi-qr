-- 🎯 LA MUBI - MVP Tickets QR - Día 1: Fundamentos
-- Script para agregar campos faltantes a la base de datos

-- =====================================================
-- 📋 AGREGAR CAMPOS FALTANTES A TABLA COMPRAS
-- =====================================================

-- 1. Agregar campo para URL del comprobante de pago
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

-- 2. Agregar campo para indicar si QR fue generado
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS qr_generado BOOLEAN DEFAULT false;

-- 3. Agregar campo para código único del ticket
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(255) UNIQUE;

-- 4. Agregar campo para indicar si email fue enviado (futuro)
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false;

-- =====================================================
-- 🗄️ CREAR TABLA CONFIGURACIÓN SISTEMA
-- =====================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS configuracion_sistema (
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

-- =====================================================
-- 📊 INSERTAR CONFIGURACIÓN INICIAL
-- =====================================================

-- Insertar tasa dólar inicial
INSERT INTO configuracion_sistema (clave, valor, descripcion, activo) 
VALUES 
    ('tasa_dolar_bcv', '1.234,56', 'Tasa del dólar BCV para conversión de tickets', true)
ON CONFLICT (clave) DO UPDATE SET 
    valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    fecha_actualizacion = venezuela_now();

-- Insertar configuración del evento
INSERT INTO configuracion_sistema (clave, valor, descripcion, activo) 
VALUES 
    ('evento_nombre', 'LA MUBI 2024', 'Nombre del evento principal', true),
    ('evento_fecha', '2024-02-15', 'Fecha del evento principal', true),
    ('evento_hora', '20:00', 'Hora del evento principal', true),
    ('evento_ubicacion', 'Caracas, Venezuela', 'Ubicación del evento principal', true),
    ('ticket_precio_usd', '5.00', 'Precio base del ticket en USD', true),
    ('ticket_metodos_pago', '["pago-movil", "zelle", "efectivo", "qr"]', 'Métodos de pago aceptados', true)
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- 🔐 AGREGAR ROL TICKETS_ADMIN (si no existe)
-- =====================================================

-- Actualizar CHECK constraint para incluir tickets_admin
DO $$
BEGIN
    -- Verificar si el constraint existe
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'administradores_rol_check'
    ) THEN
        -- Eliminar constraint actual
        ALTER TABLE administradores DROP CONSTRAINT administradores_rol_check;
        
        -- Crear nuevo constraint con tickets_admin
        ALTER TABLE administradores 
        ADD CONSTRAINT administradores_rol_check 
        CHECK (rol::text = ANY (ARRAY['super_admin'::character varying, 'marketing_admin'::character varying, 'tickets_admin'::character varying]::text[]));
    END IF;
END $$;

-- =====================================================
-- 👤 CREAR USUARIO TICKETS_ADMIN (si no existe)
-- =====================================================

-- Insertar admin de tickets
INSERT INTO administradores (nombre, correo, password, rol, permisos, activo) 
VALUES 
    ('Tickets Admin', 'tickets@lamubi.com', 'tickets123', 'tickets_admin', 
     '{"verificar_compras": true, "configurar_tasa": true, "generar_qr": true, "ver_estadisticas": true}', 
     true)
ON CONFLICT (correo) DO NOTHING;

-- =====================================================
-- 📊 CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índice para búsquedas de usuarios por email
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);

-- Índice para búsquedas de compras por usuario
CREATE INDEX IF NOT EXISTS idx_compras_usuario_id ON compras(usuario_id);

-- Índice para búsquedas de compras por estado
CREATE INDEX IF NOT EXISTS idx_compras_verified ON compras(verified);

-- Índice para búsquedas de compras por QR
CREATE INDEX IF NOT EXISTS idx_compras_qr_code ON compras(qr_code);

-- Índice para configuración activa
CREATE INDEX IF NOT EXISTS idx_configuracion_activa ON configuracion_sistema(activo) WHERE activo = true;

-- =====================================================
-- 📊 VISTA PARA DASHBOARD TICKETS (mejorada)
-- =====================================================

-- Crear o reemplazar vista para dashboard de tickets
CREATE OR REPLACE VIEW dashboard_tickets AS
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

-- =====================================================
-- ✅ VERIFICACIÓN DE CAMBIOS
-- =====================================================

-- Verificar que los campos se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compras' 
    AND column_name IN ('comprobante_url', 'qr_generado', 'codigo_unico', 'email_enviado')
ORDER BY ordinal_position;

-- Verificar que la tabla configuracion_sistema existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'configuracion_sistema';

-- Verificar configuración inicial
SELECT 
    clave,
    valor,
    descripcion,
    activo,
    fecha_actualizacion
FROM configuracion_sistema 
WHERE activo = true 
ORDER BY clave;

-- =====================================================
-- 📈 ESTADÍSTICAS ACTUALES
-- =====================================================

-- Conteo de compras por estado
SELECT 
    CASE 
        WHEN verified = true THEN 'aprobadas'
        WHEN comprobante_url IS NOT NULL THEN 'pendientes'
        ELSE 'sin_comprobante'
    END as estado,
    COUNT(*) as total
FROM compras 
GROUP BY estado
ORDER BY total DESC;

-- Conteo de usuarios por status
SELECT 
    status,
    COUNT(*) as total
FROM usuarios 
GROUP BY status
ORDER BY total DESC;

-- =====================================================
-- 🎯 RESUMEN DE CAMBIOS
-- =====================================================

/*
✅ CAMBIOS REALIZADOS:
1. 4 campos agregados a tabla compras
2. Tabla configuracion_sistema creada
3. Configuración inicial insertada
4. Rol tickets_admin agregado
5. Usuario tickets_admin creado
6. Índices de rendimiento creados
7. Vista dashboard_tickets mejorada

📊 ESTADO ACTUAL:
- Base de datos lista para MVP
- Campos QR disponibles
- Configuración centralizada
- Dashboard optimizado

🚀 PRÓXIMO PASO:
- Probar conexión desde frontend
- Implementar panel admin
- Crear formulario inteligente
*/

-- Confirmar que todo está listo
SELECT 'Base de datos configurada correctamente para MVP Tickets QR' as status;
