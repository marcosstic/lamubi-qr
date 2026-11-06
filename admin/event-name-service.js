// ============================================================
// LA MUBI - Servicio de nombres de eventos para el admin
// Carga los eventos una vez y los mantiene en caché.
// ============================================================

(function () {
    'use strict';

    class EventNameService {
        constructor(supabase) {
            this.supabase = supabase;
            this.events = [];
            this.byId = new Map();
            this.loadedAt = 0;
            this.loading = null;
            this.ttl = 5 * 60 * 1000; // 5 minutos
        }

        async ensureLoaded(force = false) {
            if (!this.supabase) return;

            const now = Date.now();
            if (!force && this.loadedAt && (now - this.loadedAt) < this.ttl) {
                return;
            }

            if (this.loading) {
                return this.loading;
            }

            this.loading = (async () => {
                try {
                    const { data, error } = await this.supabase
                        .from('eventos')
                        .select('id, nombre, activo, fecha')
                        .order('fecha', { ascending: true });

                    if (error) throw error;

                    this.events = Array.isArray(data) ? data : [];
                    this.byId = new Map(
                        this.events.map((evento) => [Number(evento.id), evento])
                    );
                    this.loadedAt = Date.now();
                } catch (error) {
                    // Mantener la caché anterior si falla la consulta.
                    window.LAMUBI_UTILS?.debugLog?.('No se pudieron cargar los nombres de eventos', error);
                } finally {
                    this.loading = null;
                }
            })();

            return this.loading;
        }

        get(id) {
            if (id === null || typeof id === 'undefined' || id === '') {
                return null;
            }

            const evento = this.byId.get(Number(id));
            return evento?.nombre || null;
        }

        getLabel(id) {
            if (id === null || typeof id === 'undefined' || id === '') {
                return 'Sin evento';
            }

            return this.get(id) || `Evento #${id}`;
        }

        getActive() {
            return this.events.filter((evento) => evento.activo === true);
        }
    }

    window.EventNameService = EventNameService;
})();
