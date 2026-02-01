-- 🎯 LA MUBI - Actualizar Constraint de Roles
-- Solución al error de tickets_admin no permitido

-- =====================================================
-- 🔧 ACTUALIZAR CHECK CONSTRAINT PARA ROLES
-- =====================================================

-- Primero eliminar el constraint actual
DO $$
BEGIN
    -- Verificar si el constraint existe
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'administradores_rol_check'
    ) THEN
        -- Eliminar constraint actual
        ALTER TABLE administradores DROP CONSTRAINT administradores_rol_check;
        
        -- Crear nuevo constraint con tickets_admin incluido
        ALTER TABLE administradores 
        ADD CONSTRAINT administradores_rol_check 
        CHECK (rol::text = ANY (ARRAY['super_admin'::character varying, 'marketing_admin'::character varying, 'tickets_admin'::character varying]::text[]));
        
        RAISE NOTICE 'Constraint actualizado correctamente';
    ELSE
        -- Si no existe, crearlo con todos los roles
        ALTER TABLE administradores 
        ADD CONSTRAINT administradores_rol_check 
        CHECK (rol::text = ANY (ARRAY['super_admin'::character varying, 'marketing_admin'::character varying, 'tickets_admin'::character varying]::text[]));
        
        RAISE NOTICE 'Constraint creado correctamente';
    END IF;
END $$;

-- =====================================================
-- ✅ VERIFICACIÓN DEL CONSTRAINT
-- =====================================================

-- Verificar que el constraint fue actualizado
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'administradores_rol_check';

-- =====================================================
-- 🎯 CONFIRMACIÓN
-- =====================================================

SELECT 'Constraint de roles actualizado correctamente' as status;
