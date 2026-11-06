// 🎯 LA MUBI - Renderer modular de eventos para la landing
// Lee assets/events-config.js y actualiza fecha, contador, countdown y botones.
// Si no hay eventos activos, no renderiza ningún botón y deja los valores en 0.

(function () {
    'use strict';

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function getFeatured() {
        return window.LAMUBI_EVENTS?.getFeatured?.() || null;
    }

    function renderDate() {
        const featured = getFeatured();
        setText('event-date-label', featured?.ui?.dateLabel || 'EVENTO PRÓXIMAMENTE');
    }

    function renderCounter() {
        const featured = getFeatured();
        const counter = featured?.ui?.counter || { vendidas: 0, disponibles: 0 };
        const vendidas = Number.isFinite(Number(counter.vendidas)) ? Number(counter.vendidas) : 0;
        const disponibles = Number.isFinite(Number(counter.disponibles)) ? Number(counter.disponibles) : 0;
        setText('event-counter-label', `${vendidas} vendidas de ${disponibles} disponibles`);
    }

    let countdownTimer = null;

    function renderCountdown() {
        const featured = getFeatured();
        const target = featured?.ui?.countdownTarget;
        const ids = ['days', 'hours', 'minutes', 'seconds'];

        const setZero = () => ids.forEach(id => setText(id, '0'));

        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

        if (!target) {
            setZero();
            return;
        }

        const end = new Date(target);
        if (Number.isNaN(end.getTime())) {
            setZero();
            return;
        }

        const tick = () => {
            const diff = end.getTime() - Date.now();

            if (diff <= 0) {
                setZero();
                if (countdownTimer) {
                    clearInterval(countdownTimer);
                    countdownTimer = null;
                }
                return;
            }

            setText('days', String(Math.floor(diff / 86400000)));
            setText('hours', String(Math.floor((diff % 86400000) / 3600000)));
            setText('minutes', String(Math.floor((diff % 3600000) / 60000)));
            setText('seconds', String(Math.floor((diff % 60000) / 1000)));
        };

        tick();
        countdownTimer = setInterval(tick, 1000);
    }

    function ensureInfoModal() {
        let modal = document.getElementById('event-info-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'event-info-modal';
        modal.className = 'modal';
        modal.style.display = 'none';

        const content = document.createElement('div');
        content.className = 'modal-content';

        const close = document.createElement('span');
        close.className = 'modal-close';
        close.id = 'event-info-modal-close';
        close.textContent = '×';

        const text = document.createElement('p');
        text.className = 'modal-text';
        text.id = 'event-info-modal-text';

        content.append(close, text);
        modal.appendChild(content);

        const container = document.querySelector('.main-cta-container') || document.body;
        container.appendChild(modal);

        const hide = () => { modal.style.display = 'none'; };
        close.addEventListener('click', hide);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) hide();
        });

        return modal;
    }

    function openInfoModal(message) {
        const modal = ensureInfoModal();
        const text = modal.querySelector('#event-info-modal-text');
        if (text) text.textContent = message || 'ENTRADAS DISPONIBLES EN PUERTA';
        modal.style.display = 'block';
    }

    function goToPurchase(eventoId) {
        try {
            localStorage.setItem('lamubi-evento-id', String(eventoId));
        } catch (error) {
            // Si localStorage no está disponible, la navegación igual funciona.
        }
        window.location.href = 'comprar.html';
    }

    function createButton(event) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `main-cta-button ${event.ui?.className || ''}`.trim();
        button.dataset.eventKey = event.key;

        const label = document.createElement('span');
        label.className = 'cta-text';
        label.textContent = event.ui?.buttonLabel || event.nombre || 'COMPRAR ENTRADA';

        const pulse = document.createElement('div');
        pulse.className = 'cta-pulse';

        button.append(label, pulse);

        button.addEventListener('click', () => {
            if (event.ui?.mode === 'active') {
                goToPurchase(event.id);
            } else if (event.ui?.mode === 'info') {
                openInfoModal(event.ui?.infoText);
            }
        });

        return button;
    }

    function renderActions() {
        const container = document.getElementById('event-actions');
        if (!container || !window.LAMUBI_EVENTS) return;

        container.innerHTML = '';

        // El hero muestra únicamente el evento destacado. Las tarjetas
        // independientes se encargan de los demás eventos activos.
        window.LAMUBI_EVENTS.getAll()
            .filter(event => event.ui?.featured)
            .filter(event => event.ui?.mode === 'active' || event.ui?.mode === 'info')
            .forEach(event => container.appendChild(createButton(event)));
    }

    function init() {
        if (!window.LAMUBI_EVENTS) return;

        renderDate();
        renderCounter();
        renderCountdown();
        renderActions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
