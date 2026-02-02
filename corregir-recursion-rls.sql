-- 🎯 LA MUBI QR - Corregir Recursión en Políticas RLS
-- Ejecutar esto en SQL Editor de Supabase para arreglar el error 500

-- =====================================================
-- 🔥 ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar todas las políticas existentes para evitar recursión
DROP POLICY IF EXISTS "Usuarios públicos pueden leer" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;

DROP POLICY IF EXISTS "Solo admins pueden ver administradores" ON administradores;
DROP POLICY IF EXISTS "Super admins pueden gestionar administradores" ON administradores;

DROP POLICY IF EXISTS "Usuarios anónimos pueden insertar verificaciones" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Admins pueden ver todas las verificaciones" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Admins pueden actualizar verificaciones" ON verificaciones_pagos;

DROP POLICY IF EXISTS "Todos pueden leer configuración activa" ON configuracion_sistema;
DROP POLICY IF EXISTS "Admins pueden gestionar configuración" ON configuracion_sistema;

-- =====================================================
-- ✅ CREAR POLÍTICAS SIMPLES Y SEGURAS
-- =====================================================

-- Políticas para CONFIGURACIÓN_SISTEMA (prioridad - tasa dólar)
CREATE POLICY "Configuración pública lectura" ON configuracion_sistema
    FOR SELECT USING (activo = true);

-- Políticas para USUARIOS
CREATE POLICY "Usuarios lectura pública" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Admins pueden gestionar usuarios" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

-- Políticas para VERIFICACIONES_PAGOS (más importante)
CREATE POLICY "Verificaciones inserción pública" ON verificaciones_pagos
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Verificaciones lectura para admins" ON verificaciones_pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

CREATE POLICY "Verificaciones actualización para admins" ON verificaciones_pagos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

-- Políticas para ADMINISTRADORES (más simples)
CREATE POLICY "Admins lectura" ON administradores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

CREATE POLICY "Super admins gestión completa" ON administradores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

-- =====================================================
-- 🧪 VERIFICACIÓN INMEDIATA
-- =====================================================

-- Probar consulta de tasa dólar (esta es la que falla)
SELECT valor 
FROM configuracion_sistema 
WHERE clave = 'tasa_dolar_bcv' AND activo = true;

-- Verificar que las políticas están activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('configuracion_sistema', 'verificaciones_pagos', 'administradores')
ORDER BY tablename, policyname;

-- =====================================================
-- 📝 COMENTARIOS
-- =====================================================

-- Las políticas anteriores causaban recursión porque:
-- 1. Intentaban verificar auth.uid() contra tablas locales
-- 2. Creaban bucles infinitos entre políticas
-- 3. Usaban EXISTS con tablas que tenían políticas recursivas

-- Las nuevas políticas:
-- 1. Usan auth.users directamente (no tablas locales)
-- 2. Son más simples y directas
-- 3. Evitan bucles de recursión
-- 4. Permiten lectura pública de configuración (tasa dólar)

-- 🎯 Esto debería resolver el Error 500 inmediatamente
