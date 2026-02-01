-- 🎯 LA MUBI - Datos de Prueba para Panel Admin
-- Crear usuarios y compras de prueba para testing

-- =====================================================
-- 👤 CREAR USUARIO DE PRUEBA (si no existe)
-- =====================================================

INSERT INTO usuarios (nombre, correo, telefono, genero, cedula, edad, fuente, status)
VALUES 
    ('Usuario Prueba', 'usuario@prueba.com', '0414-1234567', 'hombre', 'V-12345678', 25, 'directo', 'cliente')
ON CONFLICT (correo) DO NOTHING;

-- =====================================================
-- 🎫 CREAR COMPRAS DE PRUEBA
-- =====================================================

-- Compra aprobada
INSERT INTO compras (usuario_id, payment_method, monto, verified, fecha_compra, fecha_verificacion, validador_id, qr_generado, codigo_unico, comprobante_url)
VALUES 
    ((SELECT id FROM usuarios WHERE correo = 'usuario@prueba.com' LIMIT 1), 
     'pago-movil', 5.00, true, 
     venezuela_now(), venezuela_now(), 
     (SELECT id FROM administradores WHERE correo = 'tickets@lamubi.com'), 
     true, 'LAMUBI_TEST_001', 
     'https://placeholder.com/comprobante1.jpg')
ON CONFLICT (codigo_unico) DO NOTHING;

-- Compra pendiente
INSERT INTO compras (usuario_id, payment_method, monto, verified, fecha_compra, comprobante_url)
VALUES 
    ((SELECT id FROM usuarios WHERE correo = 'usuario@prueba.com' LIMIT 1), 
     'zelle', 5.00, false, 
     venezuela_now(), 
     'https://placeholder.com/comprobante2.jpg')
ON CONFLICT DO NOTHING;

-- Compra esperando comprobante
INSERT INTO compras (usuario_id, payment_method, monto, verified, fecha_compra)
VALUES 
    ((SELECT id FROM usuarios WHERE correo = 'usuario@prueba.com' LIMIT 1), 
     'efectivo', 5.00, false, 
     venezuela_now())
ON CONFLICT DO NOTHING;

-- =====================================================
-- ✅ VERIFICACIÓN DE DATOS CREADOS
-- =====================================================

-- Ver usuarios creados
SELECT 'USUARIOS CREADOS:' as info;
SELECT id, nombre, correo, status, fecha_registro FROM usuarios WHERE correo = 'usuario@prueba.com';

-- Ver compras creadas
SELECT 'COMPRAS CREADAS:' as info;
SELECT id, usuario_id, payment_method, monto, verified, fecha_compra, qr_generado, codigo_unico FROM compras 
WHERE usuario_id = (SELECT id FROM usuarios WHERE correo = 'usuario@prueba.com' LIMIT 1);

-- Ver vista dashboard_tickets
SELECT 'VISTA DASHBOARD:' as info;
SELECT * FROM dashboard_tickets WHERE usuario_correo = 'usuario@prueba.com' ORDER BY fecha_compra DESC;

-- =====================================================
-- 🎯 RESULTADO ESPERADO
-- =====================================================

SELECT 'Datos de prueba creados correctamente. Recarga el panel admin para ver los datos.' as resultado;
