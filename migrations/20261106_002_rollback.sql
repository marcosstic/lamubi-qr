-- ============================================================
-- LA MUBI QR — Rollback 20261106_002
-- Restaura la ubicación anterior del evento 7.
-- ============================================================

BEGIN;

UPDATE public.eventos
SET ubicacion = 'Trujillo'
WHERE id = 7;

COMMIT;

SELECT id, nombre, ubicacion, ciudad
FROM public.eventos
WHERE id = 7;
