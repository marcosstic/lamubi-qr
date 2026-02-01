-- 🎯 LA MUBI - Solución Definitiva RLS
-- Desactivar RLS temporalmente para permitir inserciones públicas
-- Ejecutar esto en SQL Editor de Supabase

-- 1. Desactivar Row Level Security completamente
ALTER TABLE verificaciones_pagos DISABLE ROW Level Security;

-- 2. Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'verificaciones_pagos';

-- 3. Probar inserción simple (opcional)
-- INSERT INTO verificaciones_pagos (metodo_pago, monto, tasa_dolar, fecha_pago)
-- VALUES ('pago-movil', 2250, 450, NOW())
-- RETURNING id;
