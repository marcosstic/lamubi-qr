// ============================================================
// LA MUBI - Tarjetas de próximos eventos
// Módulo aislado. Lee assets/events-config.js y renderiza
// las tarjetas activas con countdown y contador estático.
// ============================================================

(function () {
    'use strict';

    const COUNTDOWN_LABELS = ['DÍAS', 'HORAS', 'MIN', 'SEG'];
    const activeTimers = [];
    const reduceMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    function toSafeInt(value, fallback = 0) {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function setText(element, text) {
        if (element) element.textContent = text;
    }

    function goToPurchase(eventId) {
        try {
            localStorage.setItem('lamubi-evento-id', String(eventId));
        } catch (error) {
            // Si localStorage no está disponible, la navegación igual funciona.
        }

        window.location.href = 'comprar.html';
    }

    function trackCardClick(event) {
        if (!window.LAMUBI_ANALYTICS?.track) return;

        window.LAMUBI_ANALYTICS.track('event_card_click', {
            event_id: String(event.id),
            event_name: event.nombre || '',
            price_usd: Number(event.precioUsd) || 0
        });
    }

    function createLocationIcon() {
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        `;
        return icon;
    }

    function buildCountdown(container, targetIso) {
        const units = [];
        const target = new Date(targetIso).getTime();

        COUNTDOWN_LABELS.forEach((label) => {
            const unit = document.createElement('div');
            unit.className = 'event-countdown-unit';

            const value = document.createElement('span');
            value.className = 'event-countdown-value';
            value.textContent = '0';

            const caption = document.createElement('span');
            caption.className = 'event-countdown-label';
            caption.textContent = label;

            unit.append(value, caption);
            container.appendChild(unit);
            units.push(value);
        });

        container.setAttribute('role', 'timer');
        container.setAttribute(
            'aria-label',
            'Tiempo restante para el evento'
        );

        const setZero = () => {
            units.forEach((unit) => { unit.textContent = '0'; });
        };

        if (!Number.isFinite(target)) {
            setZero();
            return;
        }

        const tick = () => {
            const diff = target - Date.now();

            if (diff <= 0) {
                setZero();
                return false;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            units[0].textContent = String(days);
            units[1].textContent = String(hours).padStart(2, '0');
            units[2].textContent = String(minutes).padStart(2, '0');
            units[3].textContent = String(seconds).padStart(2, '0');
            return true;
        };

        if (!tick()) return;

        const timer = setInterval(() => {
            if (!tick()) clearInterval(timer);
        }, 1000);

        activeTimers.push(timer);
    }

    function buildCounter(event) {
        const counter = event.ui?.counter || {};
        const vendidas = Math.max(0, toSafeInt(counter.vendidas, 0));
        const disponibles = Math.max(0, toSafeInt(counter.disponibles, 0));
        const restantes = Math.max(0, disponibles - vendidas);
        const soldOut = disponibles > 0 && vendidas >= disponibles;
        const percent = disponibles > 0
            ? Math.min(100, (vendidas / disponibles) * 100)
            : 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'event-card-counter';

        const head = document.createElement('div');
        head.className = 'event-card-counter-head';

        const label = document.createElement('span');
        label.className = 'event-card-counter-label';
        label.textContent = `${vendidas} vendidas de ${disponibles} disponibles`;

        if (!soldOut && restantes > 0 && restantes <= 50) {
            label.classList.add('is-urgent');
        }

        const remain = document.createElement('span');
        remain.className = 'event-card-counter-remain';
        remain.textContent = soldOut ? 'Sin entradas' : `Quedan ${restantes}`;

        head.append(label, remain);

        const progress = document.createElement('div');
        progress.className = 'event-progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', String(Math.max(disponibles, vendidas, 0)));
        progress.setAttribute('aria-valuenow', String(disponibles > 0 ? Math.min(vendidas, disponibles) : vendidas));
        progress.setAttribute('aria-label', `Entradas vendidas de ${event.nombre || 'evento'}`);

        const fill = document.createElement('span');
        fill.className = 'event-progress-fill';
        fill.style.width = `${percent}%`;

        progress.appendChild(fill);
        wrapper.append(head, progress);

        return { wrapper, soldOut };
    }

    function setupTilt(card) {
        const canTilt = window.matchMedia
            ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
            : false;

        if (!canTilt || reduceMotion) return;

        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            const rotateX = (0.5 - y) * 6;
            const rotateY = (x - 0.5) * 6;

            card.style.transition = 'transform 0.08s linear';
            card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
            card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
            card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.transition = '';
            card.style.transform = '';
            card.style.setProperty('--mx', '50%');
            card.style.setProperty('--my', '0%');
        });
    }

    function buildCard(event, index) {
        const card = document.createElement('article');
        card.className = 'event-card';
        card.dataset.eventId = String(event.id);
        card.dataset.accent = event.ui?.card?.accent || 'pink';
        card.dataset.revealIndex = String(index);
        card.setAttribute('aria-label', event.nombre || 'Evento LA MUBI');

        const top = document.createElement('div');
        top.className = 'event-card-top';

        const date = document.createElement('span');
        date.className = 'event-card-date';
        date.textContent = event.ui?.card?.shortDate || 'PRÓXIMAMENTE';

        top.appendChild(date);

        if (event.ui?.card?.badge) {
            const tag = document.createElement('span');
            tag.className = 'event-card-tag';
            tag.textContent = event.ui.card.badge;
            top.appendChild(tag);
        }

        const title = document.createElement('h3');
        title.className = 'event-card-title';
        title.textContent = event.nombre || 'EVENTO LA MUBI';

        const location = document.createElement('p');
        location.className = 'event-card-location';
        location.appendChild(createLocationIcon());

        const locationText = document.createElement('span');
        const venue = event.ui?.card?.venue || '';
        const city = event.ui?.card?.city || '';
        locationText.textContent = city ? `${venue}, ${city}` : venue;
        location.appendChild(locationText);

        const lineup = document.createElement('div');
        lineup.className = 'event-card-lineup';

        (event.ui?.card?.lineup || []).forEach((dj) => {
            if (!dj || !dj.name) return;

            const chip = document.createElement('span');
            chip.className = 'event-card-dj';
            chip.textContent = dj.name;

            if (dj.note) {
                const note = document.createElement('span');
                note.className = 'event-card-dj-note';
                note.textContent = dj.note;
                chip.appendChild(note);
            }

            lineup.appendChild(chip);
        });

        const countdown = document.createElement('div');
        countdown.className = 'event-card-countdown';
        buildCountdown(countdown, event.ui?.countdownTarget);

        const counter = buildCounter(event);

        const footer = document.createElement('div');
        footer.className = 'event-card-footer';

        const priceRow = document.createElement('div');
        priceRow.className = 'event-card-price-row';

        const priceLabel = document.createElement('span');
        priceLabel.className = 'event-card-price-label';
        priceLabel.textContent = 'ENTRADA';

        const price = document.createElement('span');
        price.className = 'event-card-price';
        price.textContent = event.ui?.card?.priceLabel || `$${Number(event.precioUsd) || 0}`;

        priceRow.append(priceLabel, price);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'event-card-cta';
        button.textContent = counter.soldOut
            ? 'AGOTADO'
            : (event.ui?.buttonLabel || 'COMPRAR ENTRADA');
        button.setAttribute(
            'aria-label',
            counter.soldOut
                ? `Agotado: ${event.nombre || 'evento'}`
                : `Comprar entrada para ${event.nombre || 'evento'}`
        );

        if (counter.soldOut) {
            button.disabled = true;
            card.classList.add('is-soldout');
        } else {
            button.addEventListener('click', () => {
                trackCardClick(event);
                goToPurchase(event.id);
            });
        }

        const soldOutNote = document.createElement('p');
        soldOutNote.className = 'event-card-soldout-note';
        soldOutNote.textContent = 'Entradas agotadas';

        footer.append(priceRow, button, soldOutNote);

        card.append(top, title, location, lineup, countdown, counter.wrapper, footer);

        setupTilt(card);

        return card;
    }

    function revealCard(card, index) {
        if (reduceMotion) {
            card.classList.add('is-visible');
            return;
        }

        const delay = Math.min(index * 100, 400);
        setTimeout(() => card.classList.add('is-visible'), delay);
    }

    function observeCards(cards) {
        if (!('IntersectionObserver' in window)) {
            cards.forEach((card, index) => revealCard(card, index));
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const index = Number(entry.target.dataset.revealIndex) || 0;
                revealCard(entry.target, index);
                currentObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        cards.forEach((card) => observer.observe(card));
    }

    function render() {
        const container = document.getElementById('events-cards');
        if (!container || !window.LAMUBI_EVENTS?.getAll) return;

        const events = window.LAMUBI_EVENTS.getAll()
            .filter((event) => event.ui?.mode === 'active' && event.ui?.card);

        container.innerHTML = '';

        if (events.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'events-cards-empty';
            empty.textContent = 'Próximamente anunciaremos nuevos eventos.';
            container.appendChild(empty);
            return;
        }

        const cards = events.map((event, index) => {
            const card = buildCard(event, index);
            container.appendChild(card);
            return card;
        });

        observeCards(cards);

        // Failsafe: si el observer no dispara, las tarjetas deben verse igual.
        setTimeout(() => {
            cards.forEach((card) => card.classList.add('is-visible'));
        }, 1600);
    }

    function init() {
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('pagehide', () => {
        activeTimers.forEach((timer) => clearInterval(timer));
    }, { once: true });

    // Exponer un refresco controlado para futuras extensiones.
    window.LAMUBI_EVENT_CARDS = { refresh: init };
})();
