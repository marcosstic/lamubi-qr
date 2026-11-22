// 🎯 LA MUBI - Configuración modular de eventos (solo frontend)
// Para activar un evento: cambiar ui.mode a 'active' y ajustar dateLabel,
// buttonLabel, countdownTarget y counter. No hace falta tocar HTML/CSS.
// Campos opcionales de ui.card: eyebrow, title, venue, city, priceLabel,
// badge, accent (pink | aqua | coco | red) y lineup.

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
                featured: false,
                dateLabel: 'EVENTO PRÓXIMAMENTE',
                buttonLabel: 'LA MUBI DEL TERROR - STUFFA - $5 - COMPRAR ENTRADA',
                className: 'terror-button',
                infoText: 'ENTRADAS DISPONIBLES SOLO EN PUERTA EN STUFFA',
                countdownTarget: null, // null = mostrar 0; usar ISO con offset para activar
                counter: { vendidas: 0, disponibles: 0 }
            }
        },

        perreo: {
            id: 6,
            nombre: 'LA MUBI PERREO LAND',
            fecha: '2026-11-14',
            precioUsd: 3,
            ui: {
                mode: 'closed', // Evento finalizado (14/11/2026). Se conserva la configuración y su fila en la BD.
                featured: false,
                dateLabel: 'SÁBADO 14 DE NOVIEMBRE · VALERA',
                buttonLabel: 'COMPRAR ENTRADA - $3',
                className: 'perreo-button',
                infoText: 'EVENTO FINALIZADO - YA NO HAY ENTRADAS DISPONIBLES',
                countdownTarget: '2026-11-14T21:00:00-04:00',
                counter: { vendidas: 104, disponibles: 700 },
                card: {
                    shortDate: '14 DE NOVIEMBRE',
                    venue: 'Discoteca Vocas Bistro Bar',
                    city: 'Valera',
                    priceLabel: '$3',
                    badge: 'PREVENTA',
                    accent: 'pink',
                    lineup: [
                        { name: 'BJ' },
                        { name: 'TROCO' },
                        { name: 'TOUCH' }
                    ]
                }
            }
        },

        poolTrujillo: {
            id: 7,
            nombre: 'LA MUBI POOL NIGHT TRUJILLO',
            fecha: '2026-11-28',
            precioUsd: 3,
            ui: {
                mode: 'active',
                featured: false,
                dateLabel: 'SÁBADO 28 DE NOVIEMBRE · TRUJILLO',
                buttonLabel: 'COMPRAR ENTRADA - $3',
                className: 'pool-trujillo-button',
                infoText: 'ENTRADAS DISPONIBLES PARA LA MUBI POOL NIGHT TRUJILLO',
                countdownTarget: '2026-11-28T21:00:00-04:00',
                counter: { vendidas: 76, disponibles: 700 },
                card: {
                    shortDate: '28 DE NOVIEMBRE',
                    venue: '11:11 Good Vibes - Snack and Bar',
                    city: 'Trujillo',
                    priceLabel: '$3',
                    badge: 'PREVENTA',
                    accent: 'aqua',
                    lineup: [
                        { name: 'ABRAHAN' },
                        { name: 'TROCO' },
                        { name: 'YEIBEAT' }
                    ]
                }
            }
        },

        tuEresMala: {
            id: 9,
            nombre: 'TU ERES MALA - STUFFA',
            fecha: '2026-12-05',
            precioUsd: 5,
            ui: {
                mode: 'active',
                featured: false,
                dateLabel: 'SÁBADO 05 DE DICIEMBRE · MARACAIBO',
                buttonLabel: 'COMPRAR ENTRADA - $5',
                className: 'tu-eres-mala-button',
                infoText: 'ENTRADAS DISPONIBLES PARA TU ERES MALA EN STUFFA',
                countdownTarget: '2026-12-05T21:00:00-04:00',
                counter: { vendidas: 27, disponibles: 700 },
                card: {
                    shortDate: '05 DE DICIEMBRE',
                    eyebrow: 'MARACAIBO',
                    title: 'TU ERES MALA',
                    venue: 'Stuffa · Av. 5 de Julio con Calle 77',
                    city: 'Maracaibo',
                    priceLabel: '$5',
                    badge: 'PREVENTA',
                    accent: 'red',
                    lineup: [
                        { name: 'VALERO', note: 'Artista invitado' },
                        { name: 'DIEGO HAZZE' },
                        { name: 'ROYRF' },
                        { name: 'TROCO' },
                        { name: 'TOUCH' }
                    ]
                }
            }
        },

        cocoBar: {
            id: 8,
            nombre: 'PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT',
            fecha: '2026-12-12',
            precioUsd: 5,
            ui: {
                mode: 'active',
                featured: true,
                dateLabel: 'SÁBADO 12 DE DICIEMBRE · MARACAIBO',
                buttonLabel: 'COMPRAR ENTRADA - $5',
                className: 'coco-button',
                infoText: 'ENTRADAS DISPONIBLES PARA LA MUBI POOL NIGHT EN PLATINIUM CLUB',
                countdownTarget: '2026-12-12T19:00:00-04:00',
                counter: { vendidas: 114, disponibles: 1500 },
                card: {
                    shortDate: '12 DE DICIEMBRE',
                    eyebrow: 'LA MUBI POOL NIGHT',
                    title: 'PLATINIUM CLUB · COCO BAR',
                    venue: 'Platinium Club · Coco Bar',
                    city: 'Maracaibo',
                    priceLabel: '$5',
                    badge: 'PREVENTA',
                    accent: 'coco',
                    lineup: [
                        { name: 'TROCO' },
                        { name: 'DIEGO HAZZE' },
                        { name: 'TOUCH' },
                        { name: 'RODERICK POTELLA' }
                    ]
                }
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
