-- ============================================================
-- LA MUBI QR — Migración 20261106_003
-- Agrega un token aleatorio para el QR de cada ticket.
--
-- Seguridad:
--   - Solo agrega una columna y un índice.
--   - No cambia IDs ni secuencias.
--   - No elimina datos.
--   - Rellena los tickets existentes con UUID aleatorios.
--   - El QR dejará de contener el ID numérico.
-- ============================================================

BEGIN;

-- 1) Verificar que la tabla principal exista.
DO $$
BEGIN
    IF to_regclass('public.verificaciones_pagos') IS NULL THEN
        RAISE EXCEPTION 'La tabla public.verificaciones_pagos no existe';
    END IF;
END $$;

-- 2) Agregar la columna y rellenar los tickets existentes.
ALTER TABLE public.verificaciones_pagos
    ADD COLUMN IF NOT EXISTS qr_token uuid;

UPDATE public.verificaciones_pagos
SET qr_token = gen_random_uuid()
WHERE qr_token IS NULL;

ALTER TABLE public.verificaciones_pagos
    ALTER COLUMN qr_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.verificaciones_pagos
    ALTER COLUMN qr_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_verificaciones_qr_token
    ON public.verificaciones_pagos (qr_token);

-- 3) Hacer lo mismo con la tabla de archivo, si existe.
DO $$
BEGIN
    IF to_regclass('public.verificaciones_pagos_archive') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ADD COLUMN IF NOT EXISTS qr_token uuid';
        EXECUTE 'UPDATE public.verificaciones_pagos_archive SET qr_token = gen_random_uuid() WHERE qr_token IS NULL';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ALTER COLUMN qr_token SET DEFAULT gen_random_uuid()';
        EXECUTE 'ALTER TABLE public.verificaciones_pagos_archive ALTER COLUMN qr_token SET NOT NULL';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_verificaciones_archive_qr_token ON public.verificaciones_pagos_archive (qr_token)';
    END IF;
END $$;

COMMIT;

-- ============================================================
-- Verificación posterior
-- ============================================================

SELECT
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE qr_token IS NULL) AS tickets_sin_token,
    COUNT(DISTINCT qr_token) AS tokens_unicos
FROM public.verificaciones_pagos;

SELECT id, qr_token
FROM public.verificaciones_pagos
ORDER BY id DESC
LIMIT 5;
