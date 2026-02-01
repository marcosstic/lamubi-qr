-- 🎯 LA MUBI - Crear Tabla Verificaciones Pagos
-- Sistema para guardar todas las verificaciones de pago de tickets
-- Compatible con estructura existente (usuarios.id es integer)

-- Crear tabla verificaciones_pagos
CREATE TABLE IF NOT EXISTS verificaciones_pagos (
    -- Campos principales
    id SERIAL PRIMARY KEY,  -- SERIAL para compatibilidad con usuarios.id (integer)
    
    -- Información del usuario
    user_id INTEGER REFERENCES usuarios(id),  -- Para usuarios registrados (integer)
    email_temporal VARCHAR(100),           -- Para usuarios no registrados
    
    -- Información del pago
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('pago-movil', 'zelle')),
    monto DECIMAL(10,2) NOT NULL,
    tasa_dolar DECIMAL(10,2) NOT NULL,     -- Tasa al momento del pago
    
    -- Datos específicos por método
    referencia VARCHAR(50),                -- Para Pago Móvil
    confirmacion_zelle VARCHAR(50),        -- Para Zelle
    email_remitente VARCHAR(100),          -- Email del remitente Zelle
    
    -- Timestamps
    fecha_pago TIMESTAMP NOT NULL,          -- Fecha y hora del pago (UTC-4)
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    
    -- Comprobante
    comprobante_url TEXT,                   -- URL del comprobante en Supabase Storage
    comprobante_nombre VARCHAR(255),        -- Nombre original del archivo
    
    -- Estado y gestión
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    admin_notas TEXT,                       -- Notas del administrador
    admin_id INTEGER,                          -- ID del admin que procesó (integer)
    
    -- Datos adicionales (flexible)
    datos_compra JSONB DEFAULT '{}',        -- Datos adicionales del formulario
    metadata JSONB DEFAULT '{}',            -- Metadata técnica
    
    -- Índices para rendimiento
    CONSTRAINT verificaciones_email_temporal_check CHECK (
        (user_id IS NOT NULL) OR (email_temporal IS NOT NULL)
    )
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_verificaciones_user_id ON verificaciones_pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_email_temporal ON verificaciones_pagos(email_temporal);
CREATE INDEX IF NOT EXISTS idx_verificaciones_estado ON verificaciones_pagos(estado);
CREATE INDEX IF NOT EXISTS idx_verificaciones_metodo_pago ON verificaciones_pagos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_verificaciones_fecha_creacion ON verificaciones_pagos(fecha_creacion);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_verificaciones_busqueda ON verificaciones_pagos(estado, metodo_pago, fecha_creacion);

-- Habilitar Row Level Security (RLS)
ALTER TABLE verificaciones_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- 1. Usuarios pueden ver sus propias verificaciones (solo si están autenticados)
CREATE POLICY "Usuarios ver propias verificaciones" ON verificaciones_pagos
    FOR SELECT USING (
        false -- Deshabilitado por ahora, solo admins pueden ver
    );

-- 2. Admins pueden ver todas las verificaciones
CREATE POLICY "Admins ver todas las verificaciones" ON verificaciones_pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id::text = auth.uid()::text -- Convertir ambos a texto
            AND administradores.activo = true
        )
    );

-- 3. Admins pueden insertar verificaciones
CREATE POLICY "Admins insertar verificaciones" ON verificaciones_pagos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id::text = auth.uid()::text -- Convertir ambos a texto
            AND administradores.activo = true
        )
    );

-- 4. Admins pueden actualizar verificaciones
CREATE POLICY "Admins actualizar verificaciones" ON verificaciones_pagos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id::text = auth.uid()::text -- Convertir ambos a texto
            AND administradores.activo = true
        )
    );

-- 5. Usuarios anónimos pueden insertar (para el formulario de verificación)
CREATE POLICY "Permitir inserción pública" ON verificaciones_pagos
    FOR INSERT TO anon
    WITH CHECK (true);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_verificaciones()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_verificaciones
    BEFORE UPDATE ON verificaciones_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_verificaciones();

-- Comentarios para documentación
COMMENT ON TABLE verificaciones_pagos IS 'Tabla para guardar todas las verificaciones de pago de tickets LA MUBI';
COMMENT ON COLUMN verificaciones_pagos.user_id IS 'ID del usuario registrado (si aplica)';
COMMENT ON COLUMN verificaciones_pagos.email_temporal IS 'Email temporal para usuarios no registrados';
COMMENT ON COLUMN verificaciones_pagos.metodo_pago IS 'Método de pago: pago-movil o zelle';
COMMENT ON COLUMN verificaciones_pagos.monto IS 'Monto en bolívares (para pago-móvil) o dólares (para zelle)';
COMMENT ON COLUMN verificaciones_pagos.tasa_dolar IS 'Tasa del dólar al momento del pago';
COMMENT ON COLUMN verificaciones_pagos.estado IS 'Estado: pendiente, aprobado, rechazado';
COMMENT ON COLUMN verificaciones_pagos.datos_compra IS 'Datos adicionales del formulario en formato JSON';

-- Vista para dashboard de admin
CREATE OR REPLACE VIEW dashboard_verificaciones AS
SELECT 
    vp.id,
    vp.metodo_pago,
    vp.monto,
    vp.tasa_dolar,
    vp.estado,
    vp.fecha_creacion,
    vp.fecha_pago,
    CASE 
        WHEN vp.user_id IS NOT NULL THEN u.nombre
        ELSE vp.email_temporal
    END as identificacion_usuario,
    CASE 
        WHEN vp.user_id IS NOT NULL THEN u.correo
        ELSE vp.email_temporal
    END as email_usuario,
    vp.referencia,
    vp.confirmacion_zelle,
    vp.comprobante_url,
    vp.admin_notas
FROM verificaciones_pagos vp
LEFT JOIN usuarios u ON vp.user_id = u.id
ORDER BY vp.fecha_creacion DESC;

COMMENT ON VIEW dashboard_verificaciones IS 'Vista para el dashboard de administración de verificaciones';
