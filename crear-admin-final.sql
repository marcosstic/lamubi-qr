-- 🎯 LA MUBI - Crear Admin Tickets (POST ACTUALIZACIÓN)
-- Ejecutar DESPUÉS de actualizar el constraint

-- =====================================================
-- 👤 CREAR ADMINISTRADOR DE TICKETS
-- =====================================================

-- Insertar admin de tickets
INSERT INTO administradores (nombre, correo, password, rol, permisos, activo) 
VALUES 
    ('Tickets Admin', 'tickets@lamubi.com', 'tickets123', 'tickets_admin', 
     '{"verificar_compras": true, "configurar_tasa": true, "generar_qr": true, "ver_estadisticas": true}', 
     true);

-- =====================================================
-- ✅ VERIFICACIÓN
-- =====================================================

-- Verificar que el admin fue creado
SELECT 
    id,
    nombre,
    correo,
    rol,
    activo,
    fecha_creacion
FROM administradores 
WHERE correo = 'tickets@lamubi.com';

-- =====================================================
-- 🎯 CONFIRMACIÓN
-- =====================================================

SELECT 'Administrador tickets creado correctamente' as status;
