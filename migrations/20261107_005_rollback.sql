-- ============================================================
-- LA MUBI QR — Rollback 20261107_005
-- Restaura el precio del evento 7 a $5.00.
-- ============================================================

BEGIN;

UPDATE public.eventos
SET precio_usd = 5.00
WHERE id = 7;

COMMIT;

SELECT id, nombre, precio_usd
FROM public.eventos
WHERE id = 7;
