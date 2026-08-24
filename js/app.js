// ============================================================
//  APP.js — Motor principal de la aplicación
//  Pollos Frescos
// ============================================================
'use strict';

// ── Helpers globales de Modal y Toast ──────────────────────

const Modal = {
  show(title, body, buttons = [], sizeClass = '') {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (!overlay || !box) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    footerEl.innerHTML = '';

    // Botones
    buttons.filter(Boolean).forEach(btn => {
      const el = document.createElement('button');
      el.className = `btn ${btn.cls || ''}`;
      el.innerHTML = btn.text;
      el.addEventListener('click', btn.action);
      footerEl.appendChild(el);
    });

    // Tamaño
    box.className = `modal ${sizeClass}`;
    overlay.classList.remove('hidden');
    // Bind toggle passwords
    setTimeout(() => {
      document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = document.getElementById(btn.dataset.target);
          if (input) { input.type = input.type === 'password' ? 'text' : 'password'; btn.textContent = input.type === 'password' ? '👁' : '🙈'; }
        });
      });
    }, 0);
  },

  hide() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
};

// Toast is declared globally in js/notifications.js, so we do not declare it here to avoid SyntaxError.

// ── App Principal ──────────────────────────────────────────

const App = {
  _initDone: false,

  async init() {
    try {
      // Inicializar BD con datos demo
      await Seed.init();

      // Inicializar notificaciones
      Notify.init();

      // Configurar rutas
      this._setupRoutes();

      // Configurar eventos globales
      this._bindGlobalEvents();

      // Ocultar pantalla de carga
      await this._hideSplash();

      // Comprobar si viene un token de invitación en la URL (?token=INV-XXXXX o #token=INV-XXXXX)
      const urlParams = new URLSearchParams(window.location.search);
      let inviteToken = urlParams.get('token') || urlParams.get('invite');
      if (!inviteToken && window.location.hash) {
        const hashMatch = window.location.hash.match(/token=([a-zA-Z0-9_-]+)/i);
        if (hashMatch) inviteToken = hashMatch[1];
      }

      // Comprobar sesión
      const session = Auth.getSession();
      if (session && !inviteToken) {
        this.showApp(session);
      } else {
        this.showAuth(inviteToken ? 'register' : 'login');
        if (inviteToken) {
          setTimeout(() => {
            const input = document.getElementById('reg-token');
            if (input) {
              input.value = inviteToken.trim().toUpperCase();
              document.getElementById('verify-token-btn')?.click();
              Toast.info('Código de invitación cargado automáticamente desde el enlace / QR');
            }
          }, 350);
        }
      }

      // Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      this._initDone = true;
    } catch (err) {
      console.error('[App] Error crítico durante la inicialización:', err);
    }
  },

  _hideSplash() {
    return new Promise(resolve => {
      setTimeout(() => {
        const splash = document.getElementById('page-loading');
        if (splash) { splash.style.opacity = '0'; splash.style.transition = 'opacity .4s'; setTimeout(() => splash.remove(), 400); }
        resolve();
      }, 600);
    });
  },

  // ─── RUTAS ───────────────────────────────────────────────
  _setupRoutes() {
    Router.define({
      // Superadmin
      '/admin/dashboard':  () => SuperAdmin.renderDashboard(),
      '/admin/rutas':      () => SuperAdmin.renderRutas(),
      '/admin/usuarios':   () => SuperAdmin.renderUsuarios(),
      '/admin/clientes':   () => SuperAdmin.renderClientes(),
      '/admin/productos':  () => SuperAdmin.renderProductos(),
      '/admin/pedidos':    () => SuperAdmin.renderPedidos(),
      '/admin/informes':   () => SuperAdmin.renderInformes(),
      '/admin/auditoria':  () => SuperAdmin.renderAuditoria(),
      // Repartidor
      '/rep/dashboard':     () => Repartidor.renderDashboard(),
      '/rep/clientes':      () => Repartidor.renderClientes(),
      '/rep/disponibilidad':() => Repartidor.renderDisponibilidad(),
      '/rep/pedidos':       () => Repartidor.renderPedidos(),
      '/rep/resumen':       () => Repartidor.renderResumen(),
      // Cliente
      '/cliente/dashboard': () => Cliente.renderDashboard(),
      '/cliente/catalogo':  () => Cliente.renderCatalogo(),
      '/cliente/pedidos':   () => Cliente.renderPedidos(),
      '/cliente/perfil':    () => Cliente.renderPerfil(),
    }, (path) => {
      const container = document.getElementById('main-content');
      if (container) container.innerHTML = `<div class="empty-state"><div class="empty-icon">404</div><h3>Página no encontrada</h3><p>${Utils.esc(path)}</p></div>`;
    });
  },

  // ─── MOSTRAR APP ─────────────────────────────────────────
  showApp(session) {
    document.getElementById('auth-view')?.classList.add('hidden');
    document.getElementById('app-view')?.classList.remove('hidden');

    // Actualizar info de usuario en sidebar
    document.getElementById('nav-name').textContent = session.nombre + (session.apellidos ? ' ' + session.apellidos : '');
    document.getElementById('nav-role').textContent = this._roleLabel(session.rol);
    document.getElementById('nav-avatar').textContent = session.nombre[0]?.toUpperCase() || 'U';

    // Construir navegación
    this.buildNav(session.rol);

    // Navegar al dashboard
    const dashboardRoutes = {
      superadmin: '/admin/dashboard',
      repartidor: '/rep/dashboard',
      cliente: '/cliente/dashboard'
    };
    Router.go(dashboardRoutes[session.rol] || '/cliente/dashboard', { force: true });

    // Actualizar notificaciones
    Notify.refreshUI(session.userId);

    // Setup carrito (solo cliente)
    if (session.rol === 'cliente') {
      this._setupCart();
    }
  },

  showAuth(panel = 'login') {
    document.getElementById('app-view')?.classList.add('hidden');
    document.getElementById('auth-view')?.classList.remove('hidden');
    document.getElementById('auth-login')?.classList.add('hidden');
    document.getElementById('auth-register')?.classList.add('hidden');
    document.getElementById('auth-forgot')?.classList.add('hidden');
    document.getElementById('auth-privacy')?.classList.add('hidden');
    document.getElementById(`auth-${panel}`)?.classList.remove('hidden');
  },

  _roleLabel(rol) {
    return { superadmin: '👑 Superadministrador', repartidor: '🚚 Repartidor', cliente: '🏪 Cliente' }[rol] || rol;
  },

  // ─── NAVEGACIÓN ──────────────────────────────────────────
  buildNav(rol) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    const navItems = this._getNavItems(rol);
    nav.innerHTML = navItems.map(({ section, items }) => `
      ${section ? `<div class="nav-section-title">${section}</div>` : ''}
      ${items.map(item => `
        <button class="nav-item" data-route="${item.route}" onclick="Router.go('${item.route}')">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge" id="${item.badge.id}">${item.badge.val}</span>` : ''}
        </button>
      `).join('')}
    `).join('');
  },

  _getNavItems(rol) {
    if (rol === 'superadmin') return [
      { section: 'General', items: [
        { route: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { route: '/admin/informes',  icon: '📈', label: 'Informes' }
      ]},
      { section: 'Gestión', items: [
        { route: '/admin/rutas',     icon: '🗺️', label: 'Rutas' },
        { route: '/admin/usuarios',  icon: '👥', label: 'Usuarios' },
        { route: '/admin/clientes',  icon: '🏪', label: 'Clientes' },
        { route: '/admin/productos', icon: '📦', label: 'Productos' }
      ]},
      { section: 'Operativa', items: [
        { route: '/admin/pedidos',   icon: '🛒', label: 'Pedidos' },
        { route: '/admin/auditoria', icon: '📋', label: 'Auditoría' }
      ]}
    ];
    if (rol === 'repartidor') return [
      { section: 'Mi Ruta', items: [
        { route: '/rep/dashboard',      icon: '📊', label: 'Panel de Control' },
        { route: '/rep/disponibilidad', icon: '📋', label: 'Disponibilidad' },
        { route: '/rep/pedidos',        icon: '🛒', label: 'Pedidos' },
        { route: '/rep/resumen',        icon: '📈', label: 'Resumen Diario' }
      ]},
      { section: 'Clientes', items: [
        { route: '/rep/clientes', icon: '🏪', label: 'Mis Clientes' }
      ]}
    ];
    if (rol === 'cliente') return [
      { section: 'Mi Cuenta', items: [
        { route: '/cliente/dashboard', icon: '🏠', label: 'Inicio' },
        { route: '/cliente/catalogo',  icon: '🛒', label: 'Hacer Pedido' },
        { route: '/cliente/pedidos',   icon: '📋', label: 'Mis Pedidos' },
        { route: '/cliente/perfil',    icon: '⚙️', label: 'Mi Perfil' }
      ]}
    ];
    return [];
  },

  // ─── EVENTOS GLOBALES ────────────────────────────────────
  _bindGlobalEvents() {
    // ── Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('app-view')?.classList.toggle('sidebar-collapsed');
      document.getElementById('sidebar')?.classList.toggle('sidebar-collapsed');
    });

    // ── Mobile sidebar
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebar-overlay')?.classList.toggle('hidden');
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.add('hidden');
    });

    // ── Cerrar sesión
    const handleLogout = () => {
      Modal.show('🔐 Cerrar Sesión', '<p>¿Seguro que deseas cerrar sesión?</p>', [
        { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
        { text: 'Cerrar Sesión', cls: 'btn--error', action: () => {
          Auth.logout();
          Modal.hide();
          this.showAuth('login');
        }}
      ]);
    };
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);

    // ── Modal close
    document.getElementById('modal-close')?.addEventListener('click', () => Modal.hide());
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') Modal.hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Modal.hide();
    });

    // ── LOGIN FORM
    this._bindLoginForm();

    // ── REGISTER FORM
    this._bindRegisterForm();

    // ── FORGOT FORM
    this._bindForgotForm();

    // ── Navegación entre pantallas de auth
    document.getElementById('goto-register')?.addEventListener('click', () => this.showAuth('register'));
    document.getElementById('goto-login-reg')?.addEventListener('click', () => this.showAuth('login'));
    document.getElementById('goto-forgot')?.addEventListener('click', () => this.showAuth('forgot'));
    document.getElementById('goto-login-forgot')?.addEventListener('click', () => this.showAuth('login'));
    document.getElementById('open-privacy-reg')?.addEventListener('click', () => this._openPrivacy('reg'));
    document.getElementById('close-privacy')?.addEventListener('click', () => this.showAuth('register'));
    document.getElementById('accept-privacy')?.addEventListener('click', () => {
      const check = document.getElementById('rgpd-check');
      if (check) check.checked = true;
      this.showAuth('register');
    });

    // ── Toggle passwords en login
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) { input.type = input.type === 'password' ? 'text' : 'password'; btn.textContent = input.type === 'password' ? '👁' : '🙈'; }
      });
    });

    // ── Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('login-email').value = btn.dataset.email;
        document.getElementById('login-password').value = btn.dataset.pass;
      });
    });

    // ── Notificaciones
    document.getElementById('notif-bell')?.addEventListener('click', () => this._toggleNotifPanel());
    document.getElementById('mark-all-read')?.addEventListener('click', () => {
      const session = Auth.getSession();
      if (session) { Notify.markAllRead(session.userId); Notify.refreshUI(session.userId); }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-bell')) {
        document.getElementById('notif-panel')?.classList.add('hidden');
      }
    });

    // ── Carrito overlay
    document.getElementById('cart-overlay')?.addEventListener('click', () => Cliente.closeCart());
    document.getElementById('close-cart')?.addEventListener('click', () => Cliente.closeCart());
    document.getElementById('cart-checkout')?.addEventListener('click', () => Cliente.checkout());
  },

  _bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    let mfaRequired = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-password').value;
      const mfa = document.getElementById('login-mfa')?.value || null;
      const errorEl = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit');

      // Validaciones
      document.getElementById('login-email-err').textContent = '';
      document.getElementById('login-pass-err').textContent = '';
      if (!email) { document.getElementById('login-email-err').textContent = 'Email requerido'; return; }
      if (!pass) { document.getElementById('login-pass-err').textContent = 'Contraseña requerida'; return; }

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').classList.add('hidden');
      submitBtn.querySelector('.btn-loader').classList.remove('hidden');

      const result = await Auth.login(email, pass, mfa);

      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').classList.remove('hidden');
      submitBtn.querySelector('.btn-loader').classList.add('hidden');

      if (result.requiresMFA) {
        document.getElementById('mfa-group').style.display = 'block';
        document.getElementById('login-mfa').focus();
        errorEl.style.display = 'none';
        mfaRequired = true;
        return;
      }
      if (!result.success) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'flex';
        return;
      }

      errorEl.style.display = 'none';
      this.showApp(result.session);
    });
  },

  _bindRegisterForm() {
    document.getElementById('verify-token-btn')?.addEventListener('click', async () => {
      const token = document.getElementById('reg-token').value.trim().toUpperCase();
      if (!token) { document.getElementById('reg-token-err').textContent = 'Introduce el código'; return; }
      const inv = DB.findOne('invitaciones', i => i.token === token && !i.usada);
      if (!inv) { document.getElementById('reg-token-err').textContent = 'Código inválido o ya utilizado'; return; }
      if (new Date() > new Date(inv.expiraEn)) { document.getElementById('reg-token-err').textContent = 'Código caducado'; return; }
      document.getElementById('reg-token-err').textContent = '';
      const ruta = DB.findById('rutas', inv.rutaId);
      const info = document.getElementById('invite-info');
      if (info) info.textContent = `✅ Código válido para: ${ruta?.nombre || 'ruta asignada'}`;
      document.getElementById('register-fields')?.classList.remove('hidden');
    });

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('reg-token').value.trim().toUpperCase();
      const password = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;
      const rgpd = document.getElementById('rgpd-check')?.checked;
      const errEl = document.getElementById('register-error');
      errEl.style.display = 'none';

      if (password !== pass2) { document.getElementById('reg-pass2-err').textContent = 'Las contraseñas no coinciden'; return; }
      if (!rgpd) { document.getElementById('reg-rgpd-err').textContent = 'Debes aceptar la política de privacidad'; return; }

      const clienteData = {
        nombreNegocio:   Utils.sanitize(document.getElementById('reg-negocio').value),
        personaContacto: Utils.sanitize(document.getElementById('reg-contacto').value),
        nifCif:          Utils.sanitize(document.getElementById('reg-nif').value),
        telefono:        Utils.sanitize(document.getElementById('reg-tel').value),
        direccion:       Utils.sanitize(document.getElementById('reg-dir').value),
        localidad:       Utils.sanitize(document.getElementById('reg-loc').value),
        codigoPostal:    Utils.sanitize(document.getElementById('reg-cp').value),
        email:           document.getElementById('reg-email').value.trim().toLowerCase(),
        observacionesEntrega: Utils.sanitize(document.getElementById('reg-obs').value),
      };

      const btn = document.getElementById('register-submit');
      btn.disabled = true; btn.textContent = 'Creando cuenta...';
      const result = await Auth.registerClient(token, clienteData, password);
      btn.disabled = false; btn.textContent = 'Crear Cuenta';

      if (!result.success) { errEl.textContent = result.error; errEl.style.display = 'flex'; return; }
      Toast.success('¡Cuenta creada! Tu repartidor debe aprobarla antes de que puedas acceder.');
      setTimeout(() => this.showAuth('login'), 1500);
    });
  },

  _bindForgotForm() {
    document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim().toLowerCase();
      if (!email) return;

      // Demo: simular reset
      const user = DB.findOne('users', u => u.email === email);
      if (user) {
        const salt = Utils.generateSalt();
        const hash = await Utils.hashPassword('NuevaPass1!', salt);
        DB.update('users', user.id, { passwordHash: hash, passwordSalt: salt });
        Audit.log('RESET_PASSWORD', 'user', user.id, { email });
      }
      document.getElementById('forgot-success').style.display = 'flex';
    });
  },

  _openPrivacy(from) {
    if (from === 'reg') this._prevAuth = 'register';
    this.showAuth('privacy');
  },

  // ─── NOTIFICACIONES ──────────────────────────────────────
  _toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !isHidden);
    if (isHidden) {
      const session = Auth.getSession();
      if (session) this._renderNotifPanel(session.userId);
    }
  },

  _renderNotifPanel(userId) {
    const notifs = Notify.getForUser(userId);
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (!notifs.length) {
      list.innerHTML = '<div class="empty-state-sm">Sin notificaciones</div>';
      return;
    }
    const typeIcons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.leida ? '' : 'notif-item--unread'}">
        <div class="notif-icon">${typeIcons[n.tipo] || 'ℹ️'}</div>
        <div class="notif-body">
          <div class="notif-title">${Utils.esc(n.titulo)}</div>
          <div class="notif-msg">${Utils.esc(n.mensaje)}</div>
          <div class="notif-time">${Utils.timeAgo(n.creadaEn)}</div>
        </div>
        ${!n.leida ? `<button class="notif-read-btn" onclick="App._markNotifRead('${n.id}','${userId}')" title="Marcar como leída">●</button>` : ''}
      </div>
    `).join('');
  },

  _markNotifRead(notifId, userId) {
    Notify.markRead(notifId, userId);
    this._renderNotifPanel(userId);
    Notify.refreshUI(userId);
  },

  // ─── CARRITO ─────────────────────────────────────────────
  _setupCart() {
    const cartObs = document.getElementById('cart-obs');
    if (cartObs) {
      cartObs.addEventListener('input', (e) => { Cliente._cartObs = e.target.value; });
    }
  }
};

// ── Prevenir zoom accidental por doble toque o gestos en móvil ──
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    if (!e.target.closest('input:not(.qty-display), textarea, select, [contenteditable="true"]')) {
      e.preventDefault();
    }
  }
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

document.addEventListener('dblclick', (e) => {
  if (!e.target.closest('input:not(.qty-display), textarea, select, [contenteditable="true"]')) {
    e.preventDefault();
  }
});

// ── Inicializar al cargar DOM ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
