-- ============================================================
-- LA MUBI QR — Rollback 20261106_004
-- Elimina el código público del ticket.
--
-- ADVERTENCIA:
--   - Solo usar si se decide volver al ID numérico visible.
--   - No afecta el QR ni el token.
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS public.idx_verificaciones_public_code;

ALTER TABLE public.verificaciones_pagos
    DROP COLUMN IF EXISTS public_code;

DO $$
BEGIN
    IF to_regclass('public.verificaciones_pagos_archive') IS NOT NULL THEN
        EXECUTE 'DROP INDEX IF EXISTS public.idx_verificaciones_archive_public_code';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive DROP COLUMN IF EXISTS public_code';
    END IF;
END $$;

DROP FUNCTION IF EXISTS public.generate_public_ticket_code();

COMMIT;

SELECT 'Rollback 004 aplicado' AS status;
