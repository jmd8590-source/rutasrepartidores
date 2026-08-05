// ============================================================
//  ROUTER.js — Enrutador SPA
//  Pollos Fuentes
// ============================================================
'use strict';

const Router = {
  _current: null,
  _routes: {},
  _notFound: null,

  define(routes, notFound) {
    this._routes = routes;
    this._notFound = notFound || null;
  },

  go(path, opts = {}) {
    if (!Auth.isAuthenticated() && path !== '/login') { App.showAuth('login'); return; }
    if (this._current === path && !opts.force) return;
    this._current = path;

    const handler = this._routes[path];
    if (!handler) {
      if (this._notFound) this._notFound(path);
      return;
    }

    // Actualizar nav activo
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === path);
    });

    // Renderizar contenido
    const container = document.getElementById('main-content');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      const html = handler();
      container.innerHTML = html || '';
      // Activar tabs si existen
      this._bindTabs(container);
      // Scroll al inicio
      container.scrollTop = 0;
    } catch (err) {
      console.error('[Router] Error al renderizar:', path, err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Error al cargar la sección</h3>
          <p style="font-size:.875rem;color:var(--muted)">${err.message}</p>
          <button class="btn btn--primary mt-4" onclick="Router.go('${path}',{force:true})">🔄 Reintentar</button>
        </div>
      `;
    }
  },

  _bindTabs(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (!tabId) return;
        // Desactivar todos dentro del mismo padre
        const parent = btn.closest('.card, .main-content, .content-body') || container;
        parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tabContent = document.getElementById(tabId);
        if (tabContent) tabContent.classList.add('active');
      });
    });
  },

  current() { return this._current; }
};
