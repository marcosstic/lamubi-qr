// 🎯 LA MUBI - Configuración modular de eventos (solo frontend)
// Para activar un evento: cambiar ui.mode a 'active' y ajustar dateLabel,
// buttonLabel, countdownTarget y counter. No hace falta tocar HTML/CSS.

(function () {
    'use strict';

    const EVENTS = {
        general: {
            id: 1,
            nombre: 'LA MUBI EXPERIENCE',
            ui: {
                // 'active'  = visible y con venta
                // 'info'    = visible, muestra modal y no permite compra directa
                // 'hidden'  = oculto, pero permite acceso directo (comportamiento legacy)
                // 'closed'  = oculto y bloquea la compra directa
                mode: 'hidden',
                featured: false,
                dateLabel: 'EVENTO PRÓXIMAMENTE',
                buttonLabel: 'COMPRAR ENTRADA GENERAL',
                className: 'general-button',
                infoText: 'ENTRADAS DISPONIBLES EN PUERTA',
                countdownTarget: null,
                counter: { vendidas: 0, disponibles: 0 }
            }
        },

        poolnight: {
            id: 3,
            nombre: 'LA MUBI POOL NIGHT BY NEON',
            ui: {
                mode: 'hidden',
                featured: false,
                dateLabel: 'EVENTO PRÓXIMAMENTE',
                buttonLabel: 'POOL NIGHT - $5 - COMPRAR ENTRADA',
                className: 'pool-night-button',
                infoText: 'ENTRADAS DISPONIBLES EN PUERTA - LA MUBI POOL NIGHT BY NEON',
                countdownTarget: null,
                counter: { vendidas: 0, disponibles: 0 }
            }
        },

        reggaeton: {
            id: 4,
            nombre: 'I LOVE REGGAETON - STUFFA',
            ui: {
                mode: 'hidden',
                featured: false,
                dateLabel: 'EVENTO PRÓXIMAMENTE',
                buttonLabel: 'REGGAETON LIFE - CLUB QUIMICO - $4 - COMPRAR ENTRADA',
                className: 'reggaeton-button',
                infoText: 'ENTRADAS DISPONIBLES EN PUERTA Y POR WHATSAPP',
                countdownTarget: null,
                counter: { vendidas: 0, disponibles: 0 }
            }
        },

        terror: {
            id: 5,
            nombre: 'LA MUBI DEL TERROR - STUFFA',
            fecha: '2026-10-24',
            precioUsd: 5,
            ui: {
                mode: 'closed', // Cambiar a 'active' para reactivar la venta
                featured: true,
                dateLabel: 'EVENTO PRÓXIMAMENTE',
                buttonLabel: 'LA MUBI DEL TERROR - STUFFA - $5 - COMPRAR ENTRADA',
                className: 'terror-button',
                infoText: 'ENTRADAS DISPONIBLES SOLO EN PUERTA EN STUFFA',
                countdownTarget: null, // null = mostrar 0; usar ISO con offset para activar
                counter: { vendidas: 0, disponibles: 0 }
            }
        }
    };

    const entries = Object.entries(EVENTS);
    const byId = new Map(entries.map(([key, event]) => [Number(event.id), { key, ...event }]));

    window.LAMUBI_EVENTS = {
        events: EVENTS,

        getAll() {
            return entries.map(([key, event]) => ({ key, ...event }));
        },

        getByKey(key) {
            return EVENTS[key] ? { key, ...EVENTS[key] } : null;
        },

        getById(id) {
            return byId.get(Number(id)) || null;
        },

        getFeatured() {
            const found = entries.find(([, event]) => event.ui && event.ui.featured);
            return found ? { key: found[0], ...found[1] } : null;
        },

        isPurchasable(id) {
            const event = byId.get(Number(id));
            if (!event || !event.ui) return true; // Eventos no configurados mantienen el comportamiento legacy
            return event.ui.mode === 'active' || event.ui.mode === 'hidden';
        },

        getDisabledText(id, fallback = 'VENTAS CERRADAS') {
            const event = byId.get(Number(id));
            return (event && event.ui && event.ui.infoText) || fallback;
        }
    };
})();
