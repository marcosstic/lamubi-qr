-- ============================================================
-- LA MUBI QR — Migración 20261106_004
-- Agrega un código público aleatorio para mostrar en el ticket.
--
-- Ejemplo: LM-7F3K9Q2A1B4C
--
-- Seguridad:
--   - El código público es solo una referencia humana.
--   - El QR sigue usando el token UUID.
--   - No cambia IDs, secuencias ni tickets.
--   - Migración aditiva y reversible.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.generate_public_ticket_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
    SELECT 'LM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

ALTER TABLE public.verificaciones_pagos
    ADD COLUMN IF NOT EXISTS public_code text;

UPDATE public.verificaciones_pagos
SET public_code = public.generate_public_ticket_code()
WHERE public_code IS NULL;

ALTER TABLE public.verificaciones_pagos
    ALTER COLUMN public_code SET DEFAULT public.generate_public_ticket_code();

ALTER TABLE public.verificaciones_pagos
    ALTER COLUMN public_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_verificaciones_public_code
    ON public.verificaciones_pagos (public_code);

DO $$
BEGIN
    IF to_regclass('public.verificaciones_pagos_archive') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ADD COLUMN IF NOT EXISTS public_code text';
        EXECUTE 'UPDATE public.verificaciones_pagos_archive SET public_code = public.generate_public_ticket_code() WHERE public_code IS NULL';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ALTER COLUMN public_code SET DEFAULT public.generate_public_ticket_code()';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ALTER COLUMN public_code SET NOT NULL';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_verificaciones_archive_public_code ON public.verificaciones_pagos_archive (public_code)';
    END IF;
END $$;

COMMIT;

-- Verificación
SELECT
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE public_code IS NULL) AS sin_codigo,
    COUNT(DISTINCT public_code) AS codigos_unicos
FROM public.verificaciones_pagos;

SELECT id, public_code, qr_token
FROM public.verificaciones_pagos
ORDER BY id DESC
LIMIT 5;
