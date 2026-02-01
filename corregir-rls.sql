-- 🎯 LA MUBI - Corregir Política RLS para Inserciones Públicas
-- Ejecutar esto en SQL Editor de Supabase

-- 1. Primero eliminar políticas existentes (si hay)
DROP POLICY IF EXISTS "Permitir inserción pública" ON verificaciones_pagos;
DROP POLICY IF EXISTS "Usuarios anónimos insertar verificaciones" ON verificaciones_pagos;

-- 2. Crear política CORRECTA para permitir inserciones públicas
CREATE POLICY "Permitir inserciones públicas" 
ON public.verificaciones_pagos 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 3. Verificar que la política se creó correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'verificaciones_pagos';
