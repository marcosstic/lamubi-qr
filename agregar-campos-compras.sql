-- 🎯 LA MUBI - Agregar Campos Faltantes a Compras
-- Ejecutar después de crear tabla configuracion_sistema

-- =====================================================
-- 📋 AGREGAR CAMPOS FALTANTES A TABLA COMPRAS
-- =====================================================

-- 1. Agregar campo para URL del comprobante de pago
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

-- 2. Agregar campo para indicar si QR fue generado
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS qr_generado BOOLEAN DEFAULT false;

-- 3. Agregar campo para código único del ticket
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(255) UNIQUE;

-- 4. Agregar campo para indicar si email fue enviado (futuro)
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false;

-- =====================================================
-- ✅ VERIFICACIÓN DE CAMBIOS
-- =====================================================

-- Verificar que los campos se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compras' 
    AND column_name IN ('comprobante_url', 'qr_generado', 'codigo_unico', 'email_enviado')
ORDER BY ordinal_position;

-- =====================================================
-- 🎯 CONFIRMACIÓN
-- =====================================================

SELECT 'Campos agregados a tabla compras correctamente' as status;
