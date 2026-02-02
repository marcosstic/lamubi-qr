-- 🎯 LA MUBI QR - Desactivar RLS Completo para MVP
-- Ejecutar esto en SQL Editor de Supabase

-- =====================================================
-- 🔥 DESACTIVAR ROW LEVEL SECURITY COMPLETAMENTE
-- =====================================================

-- Desactivar RLS en todas las tablas principales
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE administradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Usuarios públicos pueden leer" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;

DROP POLICY IF EXISTS "Solo admins pueden ver administradores" ON administradores;
DROP POLICY IF EXISTS "Super admins pueden gestionar administradores" ON administradores;
DROP POLICY IF EXISTS "Admins lectura" ON administradores;
DROP POLICY IF EXISTS "Super admins gestión completa" ON administradores;

DROP POLICY IF EXISTS "Verificaciones inserción pública" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Verificaciones lectura para admins" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Verificaciones actualización para admins" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Permitir inserción anónima" ON verificaciones_pagos;

DROP POLICY IF EXISTS "Configuración pública lectura" ON configuracion_sistema;
DROP POLICY IF EXISTS "Admins pueden gestionar configuración" ON configuracion_sistema;

-- =====================================================
-- ✅ VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('usuarios', 'administradores', 'verificaciones_pagos', 'configuracion_sistema')
ORDER BY tablename;

-- Verificar que no hay políticas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('usuarios', 'administradores', 'verificaciones_pagos', 'configuracion_sistema')
ORDER BY tablename, policyname;

-- =====================================================
-- 🧪 PRUEBA DE INSERCIÓN (MVP)
-- =====================================================

-- Probar inserción directa
INSERT INTO verificaciones_pagos (
    email_temporal,
    metodo_pago,
    monto,
    tasa_dolar,
    fecha_pago,
    estado,
    datos_compra
) VALUES (
    'test@mvp.com',
    'pago-movil',
    6173,
    1234.56,
    venezuela_now(),
    'pendiente',
    '{"formData": {"nombre": "Test MVP", "correo": "test@mvp.com"}}'
) 
ON CONFLICT DO NOTHING
RETURNING id, email_temporal, monto, estado;

-- Limpiar datos de prueba
DELETE FROM verificaciones_pagos 
WHERE email_temporal = 'test@mvp.com';

-- =====================================================
-- 📝 COMENTARIOS
-- =====================================================

-- MVP: Sin seguridad Row Level Security
-- Ventajas:
-- ✅ Sin errores de permisos
-- ✅ Inserciones directas funcionan
-- ✅ Testing sin complicaciones
-- ✅ Demostración para cliente

-- Nota: Para producción, reactivar RLS con políticas adecuadas
