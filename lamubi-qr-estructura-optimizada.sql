-- 🎯 LA MUBI QR - Estructura Optimizada de Base de Datos
-- Basado en análisis de código real vs documentación
-- Para Supabase project: lamubi-qr-classic

-- =====================================================
-- 🗄️ FUNCIONES AUXILIARES
-- =====================================================

-- Función para timestamp Venezuela
CREATE OR REPLACE FUNCTION venezuela_now() 
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Caracas';
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = venezuela_now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 👤 TABLA USUARIOS (DETECCIÓN Y MARKETING)
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    genero VARCHAR(10) CHECK (genero IN ('hombre', 'mujer', 'otro')),
    cedula VARCHAR(20),
    edad INTEGER,
    fuente VARCHAR(50) DEFAULT 'directo',
    status VARCHAR(20) DEFAULT 'lead',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_registro ON usuarios(fecha_registro);

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_usuarios_actualizar 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- 👤 TABLA ADMINISTRADORES (ADMIN)
-- =====================================================

CREATE TABLE IF NOT EXISTS administradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('super_admin', 'tickets_admin', 'marketing_admin')),
    permisos JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para administradores
CREATE INDEX IF NOT EXISTS idx_administradores_correo ON administradores(correo);
CREATE INDEX IF NOT EXISTS idx_administradores_activo ON administradores(activo);
CREATE INDEX IF NOT EXISTS idx_administradores_rol ON administradores(rol);

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_administradores_actualizar 
    BEFORE UPDATE ON administradores 
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- 🗄️ TABLA VERIFICACIONES_PAGOS (CENTRAL - CORAZÓN DEL SISTEMA)
-- =====================================================

CREATE TABLE IF NOT EXISTS verificaciones_pagos (
    -- Campos principales
    id SERIAL PRIMARY KEY,
    
    -- Información del usuario (puede ser registrado o temporal)
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    email_temporal VARCHAR(255),
    
    -- Información del pago
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('pago-movil', 'zelle')),
    monto DECIMAL(10,2) NOT NULL,
    tasa_dolar DECIMAL(10,2) NOT NULL,
    
    -- Datos específicos por método
    referencia VARCHAR(50), -- Para pago móvil
    confirmacion_zelle VARCHAR(50), -- Para Zelle
    email_remitente VARCHAR(100), -- Para Zelle
    
    -- Fechas importantes
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    fecha_verificacion TIMESTAMP WITH TIME ZONE,
    
    -- Estado y verificación
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    comprobante_url TEXT,
    comprobante_nombre VARCHAR(255),
    admin_notas TEXT,
    admin_id INTEGER REFERENCES administradores(id) ON DELETE SET NULL,
    
    -- Datos adicionales
    datos_compra JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraint para asegurar que haya usuario o email temporal
    CONSTRAINT verificaciones_usuario_o_email CHECK (
        (user_id IS NOT NULL) OR (email_temporal IS NOT NULL)
    )
);

-- Índices para verificaciones_pagos (CRÍTICOS para rendimiento)
CREATE INDEX IF NOT EXISTS idx_verificaciones_user_id ON verificaciones_pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_email_temporal ON verificaciones_pagos(email_temporal);
CREATE INDEX IF NOT EXISTS idx_verificaciones_estado ON verificaciones_pagos(estado);
CREATE INDEX IF NOT EXISTS idx_verificaciones_metodo_pago ON verificaciones_pagos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_verificaciones_fecha_creacion ON verificaciones_pagos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_verificaciones_fecha_pago ON verificaciones_pagos(fecha_pago);

-- Índice compuesto para búsquedas comunes en dashboard
CREATE INDEX IF NOT EXISTS idx_verificaciones_dashboard ON verificaciones_pagos(estado, metodo_pago, fecha_creacion);

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER trigger_verificaciones_actualizar 
    BEFORE UPDATE ON verificaciones_pagos 
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- ⚙️ TABLA CONFIGURACIÓN_SISTEMA (GLOBAL)
-- =====================================================

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now(),
    actualizado_por INTEGER REFERENCES administradores(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now()
);

-- Índices para configuración
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion_sistema(clave);
CREATE INDEX IF NOT EXISTS idx_configuracion_activo ON configuracion_sistema(activo);

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para USUARIOS
CREATE POLICY "Usuarios públicos pueden leer" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Admins pueden insertar usuarios" ON usuarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id = auth.uid()::text::integer
            AND administradores.activo = true
        )
    );

CREATE POLICY "Admins pueden actualizar usuarios" ON usuarios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id = auth.uid()::text::integer
            AND administradores.activo = true
        )
    );

-- Políticas para ADMINISTRADORES
CREATE POLICY "Solo admins pueden ver administradores" ON administradores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM administradores a2 
            WHERE a2.id = auth.uid()::text::integer
            AND a2.activo = true
        )
    );

CREATE POLICY "Super admins pueden gestionar administradores" ON administradores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administradores a2 
            WHERE a2.id = auth.uid()::text::integer
            AND a2.activo = true
            AND a2.rol = 'super_admin'
        )
    );

-- Políticas para VERIFICACIONES_PAGOS
CREATE POLICY "Usuarios anónimos pueden insertar verificaciones" ON verificaciones_pagos
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admins pueden ver todas las verificaciones" ON verificaciones_pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id = auth.uid()::text::integer
            AND administradores.activo = true
        )
    );

CREATE POLICY "Admins pueden actualizar verificaciones" ON verificaciones_pagos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id = auth.uid()::text::integer
            AND administradores.activo = true
        )
    );

-- Políticas para CONFIGURACIÓN_SISTEMA
CREATE POLICY "Todos pueden leer configuración activa" ON configuracion_sistema
    FOR SELECT USING (activo = true);

CREATE POLICY "Admins pueden gestionar configuración" ON configuracion_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administradores 
            WHERE administradores.id = auth.uid()::text::integer
            AND administradores.activo = true
        )
    );

-- =====================================================
-- 📊 VISTAS OPTIMIZADAS
-- =====================================================

-- Vista para dashboard de verificaciones
CREATE OR REPLACE VIEW dashboard_verificaciones AS
SELECT 
    vp.id,
    vp.fecha_creacion,
    vp.metodo_pago,
    vp.monto,
    vp.tasa_dolar,
    vp.estado,
    vp.fecha_verificacion,
    vp.user_id,
    vp.email_temporal,
    vp.referencia,
    vp.confirmacion_zelle,
    vp.comprobante_url,
    vp.admin_notas,
    -- Datos del usuario (si existe)
    COALESCE(u.nombre, 'Usuario no registrado') as usuario_nombre,
    COALESCE(u.correo, vp.email_temporal) as usuario_correo,
    u.telefono as usuario_telefono,
    u.status as usuario_status,
    -- Datos del validador (si existe)
    a.nombre as validador_nombre,
    a.rol as validador_rol
FROM verificaciones_pagos vp
LEFT JOIN usuarios u ON vp.user_id = u.id
LEFT JOIN administradores a ON vp.admin_id = a.id
ORDER BY vp.fecha_creacion DESC;

-- Vista para usuarios con verificaciones
CREATE OR REPLACE VIEW usuarios_con_verificaciones AS
SELECT 
    u.id,
    u.nombre,
    u.correo,
    u.telefono,
    u.status,
    u.fecha_registro,
    COUNT(vp.id) as total_verificaciones,
    COUNT(CASE WHEN vp.estado = 'aprobado' THEN 1 END) as verificaciones_aprobadas,
    MAX(vp.fecha_creacion) as ultima_verificacion,
    STRING_AGG(DISTINCT vp.metodo_pago, ', ') as metodos_pago_usados
FROM usuarios u
LEFT JOIN verificaciones_pagos vp ON u.id = vp.user_id
GROUP BY u.id, u.nombre, u.correo, u.telefono, u.status, u.fecha_registro
ORDER BY u.fecha_registro DESC;

-- Vista para estadísticas
CREATE OR REPLACE VIEW stats_verificaciones AS
SELECT 
    COUNT(*) as total_verificaciones,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobadas,
    COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazadas,
    COUNT(CASE WHEN metodo_pago = 'pago-movil' THEN 1 END) as pago_movil_count,
    COUNT(CASE WHEN metodo_pago = 'zelle' THEN 1 END) as zelle_count,
    AVG(monto) as monto_promedio,
    MAX(fecha_creacion) as ultima_verificacion,
    DATE_TRUNC('day', fecha_creacion) as fecha_grupo
FROM verificaciones_pagos
GROUP BY DATE_TRUNC('day', fecha_creacion)
ORDER BY fecha_grupo DESC;

-- =====================================================
-- 📊 INSERCIÓN DE DATOS INICIALES
-- =====================================================

-- Insertar administrador por defecto (super_admin)
INSERT INTO administradores (nombre, correo, password, rol, permisos) 
VALUES 
    ('Super Admin', 'admin@lamubi-qr.com', 'admin123', 'super_admin', '{"all": true}')
ON CONFLICT (correo) DO NOTHING;

-- Insertar configuración inicial
INSERT INTO configuracion_sistema (clave, valor, descripcion, activo) 
VALUES 
    ('tasa_dolar_bcv', '1.234,56', 'Tasa del dólar BCV para conversión de tickets', true),
    ('evento_nombre', 'LA MUBI 2024', 'Nombre del evento principal', true),
    ('evento_fecha', '2024-02-15', 'Fecha del evento principal', true),
    ('evento_hora', '20:00', 'Hora del evento principal', true),
    ('evento_ubicacion', 'Caracas, Venezuela', 'Ubicación del evento principal', true),
    ('ticket_precio_usd', '5.00', 'Precio base del ticket en USD', true),
    ('ticket_metodos_pago', '["pago-movil", "zelle"]', 'Métodos de pago aceptados', true)
ON CONFLICT (clave) DO UPDATE SET 
    valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    fecha_actualizacion = venezuela_now();

-- =====================================================
-- ✅ VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todo se creó correctamente
SELECT 
    'usuarios' as tabla_name, 
    COUNT(*) as total_registros 
FROM usuarios
UNION ALL
SELECT 
    'administradores' as tabla_name, 
    COUNT(*) as total_registros 
FROM administradores
UNION ALL
SELECT 
    'verificaciones_pagos' as tabla_name, 
    COUNT(*) as total_registros 
FROM verificaciones_pagos
UNION ALL
SELECT 
    'configuracion_sistema' as tabla_name, 
    COUNT(*) as total_registros 
FROM configuracion_sistema;

-- Verificar vistas
SELECT 
    table_name as vista_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('dashboard_verificaciones', 'usuarios_con_verificaciones', 'stats_verificaciones');

-- =====================================================
-- 🎯 COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE verificaciones_pagos IS 'Tabla central para guardar todas las verificaciones de pago de tickets LA MUBI QR';
COMMENT ON TABLE usuarios IS 'Tabla para detección de usuarios y datos de marketing';
COMMENT ON TABLE administradores IS 'Tabla para gestión de administradores del sistema';
COMMENT ON TABLE configuracion_sistema IS 'Tabla para configuraciones globales del sistema';

COMMENT ON COLUMN verificaciones_pagos.user_id IS 'ID del usuario registrado (si aplica)';
COMMENT ON COLUMN verificaciones_pagos.email_temporal IS 'Email temporal para usuarios no registrados';
COMMENT ON COLUMN verificaciones_pagos.metodo_pago IS 'Método de pago: pago-movil o zelle';
COMMENT ON COLUMN verificaciones_pagos.monto IS 'Monto en bolívares (para pago-móvil) o dólares (para zelle)';
COMMENT ON COLUMN verificaciones_pagos.tasa_dolar IS 'Tasa del dólar al momento del pago';
COMMENT ON COLUMN verificaciones_pagos.estado IS 'Estado: pendiente, aprobado, rechazado';
COMMENT ON COLUMN verificaciones_pagos.datos_compra IS 'Datos adicionales del formulario en formato JSON';

-- 🎯 ESTRUCTURA CREADA EXITOSAMENTE
-- 📋 Listo para conectar con el proyecto lamubi-qr
