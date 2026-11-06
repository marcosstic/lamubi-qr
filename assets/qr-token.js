// ============================================================
// LA MUBI - Utilidades de token para QR
// El QR contiene un token aleatorio, no el ID numérico.
// Formato: LAMUBI:<uuid>
// ============================================================

(function () {
    'use strict';

    const PREFIX = 'LAMUBI';
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    function clean(value) {
        return String(value ?? '').trim();
    }

    function stripPrefix(value) {
        const raw = clean(value);
        const prefix = `${PREFIX}:`;

        if (raw.toUpperCase().startsWith(prefix.toUpperCase())) {
            return raw.slice(prefix.length).trim();
        }

        return raw;
    }

    function isToken(value) {
        return UUID_PATTERN.test(clean(value));
    }

    function isLegacyNumeric(value) {
        return /^\d+$/.test(clean(value));
    }

    function buildQrText(token) {
        const normalized = clean(token).toLowerCase();
        if (!isToken(normalized)) return null;
        return `${PREFIX}:${normalized}`;
    }

    function extractToken(value) {
        const candidate = stripPrefix(value);
        if (!isToken(candidate)) return null;
        return candidate.toLowerCase();
    }

    function getPayloadForTicket(ticket) {
        if (!ticket || !ticket.qr_token) return null;
        return buildQrText(ticket.qr_token);
    }

    window.LAMUBI_QR_TOKEN = Object.freeze({
        PREFIX,
        isToken,
        isLegacyNumeric,
        buildQrText,
        extractToken,
        getPayloadForTicket
    });
})();
