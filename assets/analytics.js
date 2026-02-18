(function () {
  const STORAGE_KEY = 'lamubi-utm';

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function pick(obj, keys) {
    const out = {};
    for (const k of keys) {
      const v = obj.get(k);
      if (v !== null && v !== '') out[k] = v;
    }
    return out;
  }

  function readUtmFromUrl() {
    const params = new URLSearchParams(window.location.search || '');
    return pick(params, [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term'
    ]);
  }

  function persistUtm(utm) {
    if (!utm || Object.keys(utm).length === 0) return;

    const currentRaw = window.localStorage.getItem(STORAGE_KEY);
    const current = currentRaw ? safeParse(currentRaw) : null;

    const nowIso = new Date().toISOString();
    const merged = {
      ...(current || {}),
      ...utm,
      last_seen_at: nowIso,
      first_seen_at: current?.first_seen_at || nowIso
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  function getUtm() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? safeParse(raw) : null;
  }

  function track(eventName, params) {
    try {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', eventName, params || {});
    } catch {
      // ignore
    }
  }

  const utm = readUtmFromUrl();
  persistUtm(utm);

  window.LAMUBI_ANALYTICS = {
    getUtm,
    track
  };
})();
