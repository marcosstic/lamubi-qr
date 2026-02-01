-- 🔍 INVESTIGACIÓN DE TABLAS PENDIENTES
-- Copia y pega estas consultas en el SQL Editor de Supabase

-- 1. Verificar si son tablas o vistas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('funnel_completo', 'stats_marketing', 'usuarios_con_compras')
ORDER BY table_name;

-- 2. Ver estructura de funnel_completo
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'funnel_completo'
ORDER BY ordinal_position;

-- 3. Ver estructura de stats_marketing
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'stats_marketing'
ORDER BY ordinal_position;

-- 4. Ver estructura de usuarios_con_compras
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'usuarios_con_compras'
ORDER BY ordinal_position;

-- 5. Ver si tienen datos
SELECT 
    'funnel_completo' as table_name,
    COUNT(*) as row_count
FROM funnel_completo
UNION ALL
SELECT 
    'stats_marketing' as table_name,
    COUNT(*) as row_count
FROM stats_marketing
UNION ALL
SELECT 
    'usuarios_con_compras' as table_name,
    COUNT(*) as row_count
FROM usuarios_con_compras;

-- 6. Ver definición de vistas (si son vistas)
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND table_name IN ('funnel_completo', 'stats_marketing', 'usuarios_con_compras');
