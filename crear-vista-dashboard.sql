-- 🎯 LA MUBI - Crear Vista Dashboard Tickets
-- Vista necesaria para el panel admin

-- =====================================================
-- 📊 CREAR VISTA DASHBOARD_TICKETS
-- =====================================================

-- Crear o reemplazar vista para dashboard de tickets
CREATE OR REPLACE VIEW dashboard_tickets AS
SELECT 
    c.id as compra_id,
    c.fecha_compra,
    c.payment_method,
    c.monto,
    c.verified,
    c.qr_generado,
    c.ticket_usado,
    c.codigo_unico,
    c.comprobante_url,
    u.nombre as usuario_nombre,
    u.correo as usuario_correo,
    u.telefono as usuario_telefono,
    u.status as usuario_status,
    a.nombre as validador_nombre,
    c.fecha_verificacion,
    CASE 
        WHEN c.verified = true THEN 'aprobado'
        WHEN c.comprobante_url IS NOT NULL THEN 'pendiente'
        ELSE 'esperando_comprobante'
    END as estado_compra
FROM compras c
LEFT JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN administradores a ON c.validador_id = a.id
ORDER BY c.fecha_compra DESC;

-- =====================================================
-- ✅ VERIFICACIÓN DE VISTA CREADA
-- =====================================================

-- Verificar que la vista fue creada
SELECT 
    table_name,
    'view' as table_type
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND table_name = 'dashboard_tickets';

-- =====================================================
-- 📊 VERIFICAR DATOS EN VISTA
-- =====================================================

-- Ver si hay datos en la vista
SELECT 'TOTAL REGISTROS EN DASHBOARD_TICKETS:' as info;
SELECT COUNT(*) as total_registros FROM dashboard_tickets;

-- Mostrar algunos datos si existen
SELECT 'MUESTRA DE DATOS (si hay):' as info;
SELECT * FROM dashboard_tickets LIMIT 5;

-- =====================================================
-- 🎯 CONFIRMACIÓN
-- =====================================================

SELECT 'Vista dashboard_tickets creada correctamente' as status;
