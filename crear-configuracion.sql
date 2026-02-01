-- 🎯 LA MUBI - Creación Inmediata de Tabla Configuración
-- Ejecutar esto primero para resolver el error

-- =====================================================
-- 🗄️ CREAR TABLA CONFIGURACIÓN SISTEMA (CRÍTICO)
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
-- ✅ VERIFICACIÓN INMEDIATA
-- =====================================================

-- Verificar que la tabla fue creada
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
-- 🎯 CONFIRMACIÓN
-- =====================================================

SELECT 'Tabla configuracion_sistema creada correctamente' as status;
