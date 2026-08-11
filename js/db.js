// ============================================================
//  DB.js — Capa de datos (localStorage)
//  Pollos Frescos
// ============================================================

'use strict';

const DB = {
  PREFIX: 'pf_',
  SUPABASE_CONFIG: {
    url: 'https://dyogkkwjqrujedggpcez.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b2dra3dqcXJ1amVkZ2dwY2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODEsImV4cCI6MjEwMTQ5Mzk4MX0._HYFljzTtJXbOh9zy2-UhZ1UmVk-XbcjPcwOcfHhhds'
  },

  _key(collection) {
    return this.PREFIX + collection;
  },

  // Obtener toda la colección
  get(collection) {
    try {
      return JSON.parse(localStorage.getItem(this._key(collection)) || '[]');
    } catch (e) {
      console.error('DB.get error:', e);
      return [];
    }
  },

  // Reemplazar toda la colección
  set(collection, data) {
    try {
      localStorage.setItem(this._key(collection), JSON.stringify(data));
    } catch (e) {
      console.error('DB.set error:', e);
    }
  },

  // Buscar todos los registros
  findAll(collection) {
    return this.get(collection);
  },

  // Buscar por ID
  findById(collection, id) {
    return this.get(collection).find(item => item.id === id) || null;
  },

  // Buscar con predicado
  find(collection, predicate) {
    return this.get(collection).filter(predicate);
  },

  // Buscar uno con predicado
  findOne(collection, predicate) {
    return this.get(collection).find(predicate) || null;
  },

  // Insertar un nuevo registro
  insert(collection, item) {
    const data = this.get(collection);
    if (!item.id) item.id = this._uuid();
    if (!item.creadoEn) item.creadoEn = new Date().toISOString();
    data.push(item);
    this.set(collection, data);
    return item;
  },

  // Actualizar un registro por ID
  update(collection, id, updates) {
    const data = this.get(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates, modificadoEn: new Date().toISOString() };
    this.set(collection, data);
    return data[index];
  },

  // Eliminar un registro por ID
  delete(collection, id) {
    const data = this.get(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    this.set(collection, data);
    return true;
  },

  // Contar registros
  count(collection, predicate = null) {
    const data = this.get(collection);
    return predicate ? data.filter(predicate).length : data.length;
  },

  // Contar con suma de campo
  sum(collection, field, predicate = null) {
    const data = predicate ? this.get(collection).filter(predicate) : this.get(collection);
    return data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
  },

  // Limpiar colección
  clear(collection) {
    this.set(collection, []);
  },

  // UUID simple
  _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Exportar toda la base de datos (para auditoría y backup)
  exportAll() {
    const collections = ['users', 'rutas', 'clientes', 'categorias', 'productos', 'disponibilidad', 'pedidos', 'notificaciones', 'auditoria', 'invitaciones'];
    const backup = {};
    collections.forEach(c => { backup[c] = this.get(c); });
    backup._timestamp = new Date().toISOString();
    return backup;
  },

  // Obtener estadísticas de uso del storage
  storageStats() {
    let total = 0;
    Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX)).forEach(k => {
      total += (localStorage.getItem(k) || '').length;
    });
    return {
      usedBytes: total,
      usedKB: Math.round(total / 1024),
      usedMB: (total / 1024 / 1024).toFixed(2)
    };
  }
};
