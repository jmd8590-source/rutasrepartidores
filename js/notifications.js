// ============================================================
//  NOTIFICATIONS.js — Sistema de notificaciones
//  Pollos Fuentes
// ============================================================

'use strict';

// Toast notifications (temporales, esquina)
const Toast = {
  container: null,

  _getContainer() {
    if (!this.container) this.container = document.getElementById('toast-container');
    return this.container;
  },

  show(message, type = 'info', duration = 4000) {
    const container = this._getContainer();
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${Utils.esc(message)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); }
};

// Notificaciones persistentes (campana)
const Notify = {
  init() {
    this.refreshBell();
  },

  // Agregar notificación a la base de datos
  add(usuarioId, titulo, mensaje, tipo = 'info', pedidoId = null) {
    const notif = {
      id: Utils.uuid(),
      usuarioId, titulo, mensaje, tipo,
      leida: false,
      creadoEn: Utils.now(),
      pedidoId
    };
    DB.insert('notificaciones', notif);
    this.refreshBell();
    return notif;
  },

  // Notificación de cambio de estado de pedido
  notifyOrderStatus(pedido, nuevoEstado, actorId) {
    const cliente = DB.findById('clientes', pedido.clienteId);
    const ruta = DB.findById('rutas', pedido.rutaId);
    const labels = {
      confirmado:     'Tu pedido ha sido confirmado ✅',
      en_preparacion: 'Tu pedido está en preparación 🔧',
      preparado:      'Tu pedido está listo para reparto 📦',
      en_reparto:     'Tu pedido está en camino 🚚',
      entregado:      'Tu pedido ha sido entregado ✅',
      cancelado:      'Tu pedido ha sido cancelado ❌',
      incidencia:     'Hay una incidencia con tu pedido ⚠️'
    };

    const msg = labels[nuevoEstado] || `Estado del pedido actualizado: ${nuevoEstado}`;

    // Notificar al cliente
    if (cliente) {
      this.add(cliente.usuarioId, 'Actualización de Pedido', msg, this._tipoFromEstado(nuevoEstado), pedido.id);
    }

    // Notificar al repartidor si no es él quien lo cambió
    if (ruta && ruta.repartidorId && ruta.repartidorId !== actorId) {
      this.add(ruta.repartidorId, 'Estado de Pedido Actualizado',
        `Pedido de ${cliente ? cliente.nombreNegocio : 'cliente'}: ${labels[nuevoEstado] || nuevoEstado}`,
        this._tipoFromEstado(nuevoEstado), pedido.id);
    }

    // Notificar al admin si es incidencia
    if (nuevoEstado === 'incidencia') {
      const admins = DB.find('users', u => u.rol === 'superadmin');
      admins.forEach(admin => {
        this.add(admin.id, 'Incidencia en Pedido',
          `Incidencia registrada en pedido de ${cliente ? cliente.nombreNegocio : 'cliente'}`,
          'error', pedido.id);
      });
    }
  },

  _tipoFromEstado(estado) {
    if (['cancelado', 'incidencia'].includes(estado)) return 'error';
    if (estado === 'entregado') return 'success';
    return 'info';
  },

  // Obtener no leídas de un usuario
  getUnread(usuarioId) {
    return DB.find('notificaciones', n => n.usuarioId === usuarioId && !n.leida);
  },

  // Obtener todas de un usuario
  getAll(usuarioId) {
    const all = DB.find('notificaciones', n => n.usuarioId === usuarioId);
    return all.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  },

  // Marcar como leída
  markRead(id) {
    DB.update('notificaciones', id, { leida: true });
    this.refreshBell();
  },

  // Marcar todas como leídas
  markAllRead(usuarioId) {
    const unread = this.getUnread(usuarioId);
    unread.forEach(n => DB.update('notificaciones', n.id, { leida: true }));
    this.refreshBell();
    this.renderPanel(usuarioId);
  },

  refreshUI(usuarioId) {
    this.refreshBell();
    this.renderPanel(usuarioId);
  },

  // Actualizar badge de la campana
  refreshBell() {
    const session = Auth.getSession();
    if (!session) return;
    const count = this.getUnread(session.userId).length;
    const badge = document.getElementById('notif-count');
    const bell = document.getElementById('notif-bell');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.toggle('hidden', count === 0);
    }
    if (bell) bell.classList.toggle('has-notifications', count > 0);
  },

  // Renderizar panel de notificaciones
  renderPanel(usuarioId) {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const notifs = this.getAll(usuarioId);
    if (!notifs.length) {
      list.innerHTML = '<div class="empty-state-sm"><p>No tienes notificaciones</p></div>';
      return;
    }
    list.innerHTML = notifs.slice(0, 20).map(n => `
      <div class="notif-item ${n.leida ? '' : 'notif-item--unread'}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon--${n.tipo}">
          ${n.tipo === 'success' ? '✅' : n.tipo === 'error' ? '❌' : n.tipo === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="notif-body">
          <div class="notif-title">${Utils.esc(n.titulo)}</div>
          <div class="notif-msg">${Utils.esc(n.mensaje)}</div>
          <div class="notif-time">${Utils.timeAgo(n.creadoEn)}</div>
        </div>
        ${!n.leida ? `<button class="notif-read-btn" data-notif-id="${n.id}" title="Marcar como leída">•</button>` : ''}
      </div>
    `).join('');
  },

  // Toggle panel
  togglePanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      const session = Auth.getSession();
      if (session) this.renderPanel(session.userId);
    }
  }
};
