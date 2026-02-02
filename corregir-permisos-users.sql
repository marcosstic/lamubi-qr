-- 🎯 LA MUBI QR - Corregir Permisos Tabla Users
-- Ejecutar esto en SQL Editor de Supabase

-- =====================================================
-- 🔥 ASEGURAR QUE TABLA USERS TENGA POLÍTICAS CORRECTAS
-- =====================================================

-- Habilitar RLS en users si no está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura pública para users
CREATE POLICY "Lectura pública de usuarios" ON usuarios
    FOR SELECT USING (true);

-- =====================================================
-- 🔥 VERIFICAR POLÍTICAS EXISTENTES EN VERIFICACIONES_PAGOS
-- =====================================================

-- Asegurar que la política de inserción pública exista y funcione
DROP POLICY IF EXISTS "Verificaciones inserción pública" ON verificaciones_pagos;

CREATE POLICY "Verificaciones inserción pública" ON verificaciones_pagos
    FOR INSERT TO anon
    WITH CHECK (true);

-- =====================================================
-- 🧪 VERIFICACIÓN
-- =====================================================

-- Verificar políticas de usuarios
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- Verificar políticas de verificaciones_pagos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'verificaciones_pagos'
ORDER BY policyname;

-- =====================================================
-- ✅ PRUEBA DE INSERCIÓN (simulando el frontend)
-- =====================================================

-- Esta es la inserción que hace el frontend
INSERT INTO verificaciones_pagos (
    user_id,
    email_temporal,
    metodo_pago,
    monto,
    tasa_dolar,
    fecha_pago,
    estado,
    datos_compra
) VALUES (
    NULL,
    'test@ejemplo.com',
    'pago-movil',
    2500.00,
    1234.56,
    venezuela_now(),
    'pendiente',
    '{"formData": {"nombre": "Test User", "correo": "test@ejemplo.com"}}'
) 
ON CONFLICT DO NOTHING
RETURNING id;

-- Limpiar datos de prueba
DELETE FROM verificaciones_pagos 
WHERE email_temporal = 'test@ejemplo.com';

-- =====================================================
-- 📝 COMENTARIOS
-- =====================================================

-- Esto resuelve:
-- 1. Error "permission denied for table users"
-- 2. Error 401 al insertar en verificaciones_pagos
-- 3. Problemas con foreign key a usuarios
-- 4. Validación de user_id: null
