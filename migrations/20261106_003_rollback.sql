-- ============================================================
-- LA MUBI QR — Rollback 20261106_003
-- Elimina la columna qr_token y su índice.
--
-- ADVERTENCIA:
--   - Solo usar si se decide volver al QR numérico.
--   - Los QR con token dejarán de funcionar.
--   - No modifica IDs ni tickets.
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS public.idx_verificaciones_qr_token;

ALTER TABLE public.verificaciones_pagos
    DROP COLUMN IF EXISTS qr_token;

DO $$
BEGIN
    IF to_regclass('public.verificaciones_pagos_archive') IS NOT NULL THEN
        EXECUTE 'DROP INDEX IF EXISTS public.idx_verificaciones_archive_qr_token';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive DROP COLUMN IF EXISTS qr_token';
    END IF;
END $$;

COMMIT;

SELECT 'Rollback 003 aplicado' AS status;
