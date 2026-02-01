-- 🎯 LA MUBI - Verificar Estado Actual de Datos
-- Consultas para entender por qué el panel muestra 0

-- =====================================================
-- 👤 CONTAR USUARIOS
-- =====================================================

SELECT 'TOTAL USUARIOS:' as info;
SELECT COUNT(*) as total_usuarios FROM usuarios;

SELECT 'USUARIOS CON COMPRAS:' as info;
SELECT COUNT(*) as usuarios_con_compras FROM usuarios_con_compras WHERE compra_id IS NOT NULL;

-- =====================================================
-- 🎫 CONTAR COMPRAS
-- =====================================================

SELECT 'TOTAL COMPRAS:' as info;
SELECT COUNT(*) as total_compras FROM compras;

SELECT 'COMPRAS POR ESTADO:' as info;
SELECT 
    CASE 
        WHEN verified = true THEN 'aprobadas'
        WHEN comprobante_url IS NOT NULL THEN 'pendientes'
        ELSE 'esperando_comprobante'
    END as estado,
    COUNT(*) as total
FROM compras 
GROUP BY estado;

-- =====================================================
-- ⚙️ VERIFICAR CONFIGURACIÓN
-- =====================================================

SELECT 'TASA DÓLAR ACTUAL:' as info;
SELECT clave, valor, fecha_actualizacion FROM configuracion_sistema WHERE clave = 'tasa_dolar_bcv';

-- =====================================================
-- 📊 VERIFICAR VISTAS
-- =====================================================

SELECT 'VISTA DASHBOARD_TICKETS:' as info;
SELECT COUNT(*) as total_registros FROM dashboard_tickets;

SELECT 'VISTA FUNNEL_COMPLETO:' as info;
SELECT COUNT(*) as total_registros FROM funnel_completo;

-- =====================================================
-- 🎯 ANÁLISIS FINAL
-- =====================================================

SELECT 'ANÁLISIS COMPLETO:' as info;

SELECT 
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM compras) as total_compras,
    (SELECT COUNT(*) FROM compras WHERE verified = true) as compras_aprobadas,
    (SELECT COUNT(*) FROM compras WHERE verified = false AND comprobante_url IS NOT NULL) as compras_pendientes,
    (SELECT COUNT(*) FROM compras WHERE verified = false AND comprobante_url IS NULL) as esperando_comprobante,
    (SELECT valor FROM configuracion_sistema WHERE clave = 'tasa_dolar_bcv') as tasa_dolar;
