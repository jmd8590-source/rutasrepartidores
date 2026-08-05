// ============================================================
//  AUDIT.js — Registro de Auditoría
//  Pollos Fuentes
// ============================================================

'use strict';

const Audit = {

  log(accion, entidad, entidadId, detalles = {}) {
    try {
      const session = Auth ? Auth.getSession() : null;
      const record = {
        id: Utils.uuid(),
        usuarioId: session ? session.userId : 'system',
        usuarioEmail: session ? session.email : 'system',
        usuarioRol: session ? session.rol : 'system',
        accion,
        entidad,
        entidadId: entidadId || '',
        detalles,
        timestamp: new Date().toISOString()
      };
      DB.insert('auditoria', record);
    } catch (e) {
      console.warn('Audit.log error:', e);
    }
  },

  // Obtener registros con filtros
  getFiltered({ usuarioId, accion, entidad, desde, hasta, search } = {}) {
    let records = DB.get('auditoria');

    if (usuarioId) records = records.filter(r => r.usuarioId === usuarioId);
    if (accion) records = records.filter(r => r.accion === accion);
    if (entidad) records = records.filter(r => r.entidad === entidad);
    if (desde) records = records.filter(r => r.timestamp >= desde);
    if (hasta) records = records.filter(r => r.timestamp <= hasta + 'T23:59:59Z');
    if (search) {
      const s = search.toLowerCase();
      records = records.filter(r =>
        r.accion.toLowerCase().includes(s) ||
        r.entidad.toLowerCase().includes(s) ||
        r.usuarioEmail.toLowerCase().includes(s) ||
        JSON.stringify(r.detalles || {}).toLowerCase().includes(s)
      );
    }

    // Ordenar por más reciente primero
    return records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  // Acciones disponibles para filtro
  getAcciones() {
    const all = DB.get('auditoria').map(r => r.accion);
    return [...new Set(all)].sort();
  },

  // Exportar auditoría a CSV
  exportCSV(records) {
    const data = records.map(r => ({
      'Fecha/Hora': Utils.formatDate(r.timestamp, 'datetime'),
      'Usuario': r.usuarioEmail,
      'Rol': r.usuarioRol,
      'Acción': Utils.auditLabel(r.accion),
      'Entidad': r.entidad,
      'ID Entidad': r.entidadId,
      'Detalles': JSON.stringify(r.detalles || {})
    }));
    Utils.exportCSV(data, 'auditoria_' + Utils.today());
  }
};
