(() => {
  'use strict';

  const HOST_ID = 'lamubi-wa-host';
  if (document.getElementById(HOST_ID)) return;

  const cfg = {
    title: '¿Necesitas ayuda?',
    options: {
      cliente: {
        label: 'Soporte Cliente',
        detail: 'Verificación de pagos',
        phone: '584140659985',
        msg: 'Hola, necesito ayuda con la verificación de mi pago en LA MUBI.'
      },
      admin: {
        label: 'Soporte Cliente',
        detail: 'Soporte general',
        phone: '584146889461',
        msg: 'Hola, necesito soporte general con LA MUBI.'
      }
    }
  };

  const waUrl = (phone, msg) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .root{position:fixed;right:20px;bottom:max(20px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;pointer-events:none}
    .fab{pointer-events:auto;width:60px;height:60px;border:0;border-radius:999px;background:#25D366;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,.25);transition:transform .16s ease,box-shadow .22s ease;animation:pulse 2.2s ease-in-out infinite}
    .fab:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 14px 35px rgba(0,0,0,.28)}
    .icon{width:28px;height:28px;display:block}
    @keyframes pulse{0%{box-shadow:0 10px 25px rgba(0,0,0,.25),0 0 0 0 rgba(37,211,102,.35)}50%{box-shadow:0 14px 35px rgba(0,0,0,.28),0 0 0 14px rgba(37,211,102,0)}100%{box-shadow:0 10px 25px rgba(0,0,0,.25),0 0 0 0 rgba(37,211,102,0)}}
    .overlay{pointer-events:auto;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box}
    .overlay[data-open="1"]{opacity:1;visibility:visible}
    .sheet{width:min(520px,100%);background:#0b0b0f;color:#fff;border-radius:18px 18px 0 0;border:1px solid rgba(244,60,184,.18);box-shadow:0 24px 60px rgba(0,0,0,.55);transform:translateY(18px);opacity:0;transition:transform .2s ease,opacity .2s ease;overflow:hidden}
    .overlay[data-open="1"] .sheet{transform:translateY(0);opacity:1}
    .head{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px}
    .title{font-weight:800;letter-spacing:.2px}
    .close{border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px}
    .body{padding:0 14px 14px}
    .btn{width:100%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:14px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:2px;margin-top:10px;text-align:left}
    .b1{font-weight:800}
    .b2{font-size:12px;opacity:.8}
    @media(min-width:768px){.overlay{align-items:flex-end;justify-content:flex-end;padding:0 20px 96px;background:rgba(0,0,0,.35);backdrop-filter:blur(4px)}.sheet{border-radius:18px}}
    @media(max-width:480px){.root{right:15px}.fab{width:56px;height:56px}}
  `;
  shadow.appendChild(style);

  const root = document.createElement('div');
  root.className = 'root';

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'fab';
  fab.setAttribute('aria-label', 'WhatsApp Soporte');
  fab.innerHTML = '<svg class="icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M19.11 17.18c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.68-.5h-.58c-.2 0-.53.07-.8.38-.27.3-1.05 1.03-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.44.25-.71.25-1.32.18-1.44-.07-.12-.27-.2-.57-.35z"/><path fill="currentColor" d="M16.04 3C9.4 3 4 8.27 4 14.76c0 2.3.68 4.43 1.85 6.24L4 29l8.32-1.79a12.4 12.4 0 0 0 3.72.57c6.64 0 12.04-5.27 12.04-11.76S22.68 3 16.04 3zm0 22.5c-1.23 0-2.43-.23-3.54-.68l-.45-.18-4.94 1.06 1.05-4.74-.2-.44a10.35 10.35 0 0 1-1.32-5.06c0-5.71 4.76-10.36 10.4-10.36 5.63 0 10.4 4.65 10.4 10.36 0 5.71-4.77 10.36-10.4 10.36z"/></svg>';

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.setAttribute('data-open', '0');

  const sheet = document.createElement('div');
  sheet.className = 'sheet';

  const head = document.createElement('div');
  head.className = 'head';

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = cfg.title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.textContent = '×';

  head.appendChild(title);
  head.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'body';

  const btnCliente = document.createElement('button');
  btnCliente.type = 'button';
  btnCliente.className = 'btn';
  btnCliente.innerHTML = `<div class="b1">${cfg.options.cliente.label}</div><div class="b2">${cfg.options.cliente.detail}</div>`;

  const btnAdmin = document.createElement('button');
  btnAdmin.type = 'button';
  btnAdmin.className = 'btn';
  btnAdmin.innerHTML = `<div class="b1">${cfg.options.admin.label}</div><div class="b2">${cfg.options.admin.detail}</div>`;

  body.appendChild(btnCliente);
  body.appendChild(btnAdmin);

  sheet.appendChild(head);
  sheet.appendChild(body);
  overlay.appendChild(sheet);

  root.appendChild(fab);
  shadow.appendChild(root);
  shadow.appendChild(overlay);

  const openWhatsApp = (url) => {
    const win = window.open(url, '_blank', 'noopener');
    if (win) return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) window.location.href = url;
  };

  const open = () => {
    overlay.setAttribute('data-open', '1');
  };

  const close = () => {
    overlay.setAttribute('data-open', '0');
  };

  fab.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.getAttribute('data-open') === '1') close();
  });

  btnCliente.addEventListener('click', () => {
    openWhatsApp(waUrl(cfg.options.cliente.phone, cfg.options.cliente.msg));
    close();
  });

  btnAdmin.addEventListener('click', () => {
    openWhatsApp(waUrl(cfg.options.admin.phone, cfg.options.admin.msg));
    close();
  });
})();
