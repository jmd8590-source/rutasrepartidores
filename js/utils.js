// ============================================================
//  UTILS.js — Utilidades globales
//  Pollos Fuentes
// ============================================================

'use strict';

const Utils = {

  // --- Identificadores ---
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // --- Criptografía ---
  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  generateToken(prefix = 'INV') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return prefix + '-' + Array.from(array).map(b => chars[b % chars.length]).join('');
  },

  // --- Formato de fecha/hora ---
  today() {
    return new Date().toISOString().split('T')[0];
  },

  now() {
    return new Date().toISOString();
  },

  formatDate(date, format = 'short') {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d)) return '—';
      switch (format) {
        case 'short': return d.toLocaleDateString('es-ES');
        case 'medium': return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        case 'full': return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case 'datetime': return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        case 'time': return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        case 'iso': return d.toISOString().split('T')[0];
        default: return d.toLocaleDateString('es-ES');
      }
    } catch { return '—'; }
  },

  timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return this.formatDate(date, 'short');
  },

  // --- Formato monetario ---
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  },

  formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num || 0);
  },

  // --- Seguridad HTML ---
  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  sanitize(str) {
    return str ? str.trim().replace(/<[^>]*>/g, '') : '';
  },

  // --- Validaciones ---
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  },

  isValidNIF(nif) {
    return /^[A-Za-z0-9]{7,10}$/.test(nif.trim());
  },

  isValidPostalCode(cp) {
    return /^\d{5}$/.test(cp.trim());
  },

  isValidPhone(phone) {
    return /^[6789]\d{8}$/.test(phone.replace(/\s/g, ''));
  },

  isValidPlate(plate) {
    return /^[0-9]{4}[A-Z]{3}$|^[A-Z]{1,3}[0-9]{4}[A-Z]{2}$/.test(plate.replace(/[-\s]/g, '').toUpperCase());
  },

  // --- Badges / Etiquetas ---
  statusBadge(status) {
    const map = {
      pendiente:       { label: 'Pendiente',       cls: 'badge--warning' },
      confirmado:      { label: 'Confirmado',       cls: 'badge--info' },
      en_preparacion:  { label: 'En preparación',   cls: 'badge--secondary' },
      preparado:       { label: 'Preparado',         cls: 'badge--primary' },
      en_reparto:      { label: 'En reparto',        cls: 'badge--accent' },
      entregado:       { label: 'Entregado',         cls: 'badge--success' },
      cancelado:       { label: 'Cancelado',         cls: 'badge--error' },
      incidencia:      { label: 'Incidencia',        cls: 'badge--error badge--pulse' },
    };
    const s = map[status] || { label: status, cls: 'badge--default' };
    return `<span class="badge ${s.cls}">${this.esc(s.label)}</span>`;
  },

  rolBadge(rol) {
    const map = {
      superadmin: { label: '👑 Superadmin',  cls: 'badge--primary' },
      repartidor: { label: '🚚 Repartidor',  cls: 'badge--accent' },
      cliente:    { label: '🏪 Cliente',     cls: 'badge--success' },
    };
    const r = map[rol] || { label: rol, cls: 'badge--default' };
    return `<span class="badge ${r.cls}">${r.label}</span>`;
  },

  clienteEstadoBadge(estado) {
    const map = {
      pendiente: { label: 'Pendiente',  cls: 'badge--warning' },
      activo:    { label: 'Activo',     cls: 'badge--success' },
      bloqueado: { label: 'Bloqueado',  cls: 'badge--error' },
      baja:      { label: 'Baja',       cls: 'badge--default' },
    };
    const s = map[estado] || { label: estado, cls: 'badge--default' };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  activeBadge(activo) {
    return activo
      ? `<span class="badge badge--success">Activo</span>`
      : `<span class="badge badge--default">Inactivo</span>`;
  },

  // --- Utilidades de array ---
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // --- Funciones de UI ---
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Icono de acción de auditoría
  auditIcon(accion) {
    const map = {
      LOGIN: '🔐', LOGOUT: '🚪',
      CREAR_RUTA: '🗺️', EDITAR_RUTA: '✏️', ELIMINAR_RUTA: '🗑️',
      CREAR_USUARIO: '👤', EDITAR_USUARIO: '✏️', ELIMINAR_USUARIO: '🗑️',
      CREAR_PRODUCTO: '📦', EDITAR_PRODUCTO: '✏️',
      APROBAR_CLIENTE: '✅', BLOQUEAR_CLIENTE: '🚫', CREAR_CLIENTE: '🏪', EDITAR_CLIENTE: '✏️',
      CREAR_PEDIDO: '🛒', CAMBIAR_ESTADO_PEDIDO: '🔄', CANCELAR_PEDIDO: '❌',
      CAMBIAR_PRECIO: '💰', CAMBIAR_DISPONIBILIDAD: '📋',
      CAMBIAR_CONTRASENA: '🔑', ELIMINAR_DATOS: '🗑️', RESET_PASSWORD: '🔑',
      CREAR_INVITACION: '🎫', EDITAR_RUTA: '✏️',
    };
    return map[accion] || '📝';
  },

  // Nombre legible de acción de auditoría
  auditLabel(accion) {
    const map = {
      LOGIN: 'Inicio de sesión', LOGOUT: 'Cierre de sesión',
      CREAR_RUTA: 'Ruta creada', EDITAR_RUTA: 'Ruta editada', ELIMINAR_RUTA: 'Ruta eliminada',
      CREAR_USUARIO: 'Usuario creado', EDITAR_USUARIO: 'Usuario editado',
      CREAR_PRODUCTO: 'Producto creado', EDITAR_PRODUCTO: 'Producto editado',
      APROBAR_CLIENTE: 'Cliente aprobado', BLOQUEAR_CLIENTE: 'Cliente bloqueado',
      CREAR_CLIENTE: 'Cliente registrado', EDITAR_CLIENTE: 'Cliente editado',
      CREAR_PEDIDO: 'Pedido creado', CAMBIAR_ESTADO_PEDIDO: 'Estado actualizado', CANCELAR_PEDIDO: 'Pedido cancelado',
      CAMBIAR_PRECIO: 'Precio modificado', CAMBIAR_DISPONIBILIDAD: 'Disponibilidad actualizada',
      CAMBIAR_CONTRASENA: 'Contraseña cambiada', ELIMINAR_DATOS: 'Datos eliminados',
      RESET_PASSWORD: 'Contraseña restablecida', CREAR_INVITACION: 'Invitación generada',
    };
    return map[accion] || accion;
  },

  // Nombre completo de un usuario por ID
  getUserName(userId) {
    const user = DB.findById('users', userId);
    if (!user) return 'Desconocido';
    return user.apellidos ? `${user.nombre} ${user.apellidos}` : user.nombre;
  },

  // Nombre de ruta por ID
  getRutaNombre(rutaId) {
    const ruta = DB.findById('rutas', rutaId);
    return ruta ? ruta.nombre : '—';
  },

  // Nombre de producto por ID
  getProductoNombre(productoId) {
    const prod = DB.findById('productos', productoId);
    return prod ? prod.nombre : '—';
  },

  // Nombre de categoría por ID
  getCategoriaNombre(catId) {
    const cat = DB.findById('categorias', catId);
    return cat ? cat.nombre : '—';
  },

  // Calcular totales de pedido
  calcularTotalPedido(lineas) {
    return lineas.reduce((acc, l) => acc + (parseFloat(l.subtotal) || 0), 0);
  },

  // Paginación simple
  paginate(array, page, perPage = 20) {
    const start = (page - 1) * perPage;
    return {
      data: array.slice(start, start + perPage),
      total: array.length,
      pages: Math.ceil(array.length / perPage),
      current: page
    };
  },

  paginationHTML(pagination, onPageChange) {
    if (pagination.pages <= 1) return '';
    let html = '<div class="pagination">';
    if (pagination.current > 1) html += `<button class="page-btn" data-page="${pagination.current - 1}">‹</button>`;
    for (let i = 1; i <= pagination.pages; i++) {
      html += `<button class="page-btn ${i === pagination.current ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (pagination.current < pagination.pages) html += `<button class="page-btn" data-page="${pagination.current + 1}">›</button>`;
    html += '</div>';
    return html;
  },

  // CSV Export
  exportCSV(data, filename) {
    if (!data.length) { if(typeof Toast!=='undefined') Toast.warning('No hay datos para exportar'); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Excel Export
  exportExcel(data, filename, sheetName = 'Datos') {
    if (!window.XLSX) { if(typeof Toast!=='undefined') Toast.warning('Excel no disponible (librería no cargada)'); return; }
    if (!data.length) { if(typeof Toast!=='undefined') Toast.warning('No hay datos para exportar'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename + '.xlsx');
  },

  // PDF Export básico
  exportPDF(title, content, filename) {
    if (!window.jspdf) { if(typeof Toast!=='undefined') Toast.warning('PDF no disponible'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${this.formatDate(new Date(), 'datetime')}`, 15, 28);
    doc.setFontSize(11);
    let y = 40;
    content.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 7;
    });
    doc.save(filename + '.pdf');
  },

  // Print helper
  printSection(html, title = 'Pollos Fuentes') {
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
      h1 { color: #F97316; font-size: 18px; border-bottom: 2px solid #F97316; padding-bottom: 8px; }
      h2 { font-size: 14px; margin-top: 16px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th { background: #F97316; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
      .total { font-weight: bold; font-size: 13px; margin-top: 10px; }
      @media print { body { padding: 0; } }
    </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  },

  // Obtener nombre y email del usuario actual
  getClienteProfile(usuarioId) {
    return DB.findOne('clientes', c => c.usuarioId === usuarioId);
  }
};
