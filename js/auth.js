// ============================================================
//  AUTH.js — Autenticación y gestión de sesiones
//  Pollos Fuentes
// ============================================================

'use strict';

const Auth = {
  SESSION_KEY: 'pf_session',
  MAX_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  SESSION_HOURS: 8,

  // --- Login ---
  async login(email, password, mfaCode = null) {
    const users = DB.get('users');
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }

    // Comprobar si la cuenta está bloqueada
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const minLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return { success: false, error: `Cuenta bloqueada temporalmente. Inténtalo en ${minLeft} minuto(s).` };
    }

    // Comprobar si está activo
    if (!user.activo) {
      return { success: false, error: 'Tu cuenta está desactivada. Contacta con el administrador.' };
    }

    // Verificar contraseña
    const hash = await Utils.hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      const attempts = (user.loginAttempts || 0) + 1;
      const updates = { loginAttempts: attempts };
      if (attempts >= this.MAX_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + this.LOCKOUT_MINUTES * 60 * 1000).toISOString();
        updates.loginAttempts = 0;
      }
      DB.update('users', user.id, updates);
      const remaining = this.MAX_ATTEMPTS - attempts;
      return {
        success: false,
        error: remaining > 0
          ? `Credenciales incorrectas. Te quedan ${remaining} intento(s).`
          : `Cuenta bloqueada por ${this.LOCKOUT_MINUTES} minutos por exceso de intentos.`
      };
    }

    // MFA para superadmin
    if (user.rol === 'superadmin' && user.mfaEnabled) {
      if (!mfaCode) {
        return { success: false, requiresMFA: true };
      }
      if (!this.verifyMFA(mfaCode, user.mfaSecret)) {
        return { success: false, error: 'Código MFA incorrecto.' };
      }
    }

    // Crear sesión
    const session = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellidos: user.apellidos || '',
      rutaId: user.rutaId || null,
      token: Utils.generateToken('tok'),
      createdAt: Utils.now(),
      expiresAt: new Date(Date.now() + this.SESSION_HOURS * 3600 * 1000).toISOString()
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    // Actualizar último acceso y resetear intentos
    DB.update('users', user.id, {
      ultimoAcceso: Utils.now(),
      loginAttempts: 0,
      lockedUntil: null
    });

    Audit.log('LOGIN', 'user', user.id, { email: user.email, rol: user.rol });

    return { success: true, session };
  },

  // --- Logout ---
  logout() {
    const session = this.getSession();
    if (session) {
      Audit.log('LOGOUT', 'user', session.userId, { email: session.email });
    }
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  // --- Obtener sesión activa ---
  getSession() {
    try {
      const data = sessionStorage.getItem(this.SESSION_KEY);
      if (!data) return null;
      const session = JSON.parse(data);
      if (!session || !session.expiresAt) return null;
      if (new Date() > new Date(session.expiresAt)) {
        sessionStorage.removeItem(this.SESSION_KEY);
        return null;
      }
      return session;
    } catch { return null; }
  },

  // --- Verificar autenticación ---
  isAuthenticated() {
    return this.getSession() !== null;
  },

  // --- Verificar rol ---
  hasRole(...roles) {
    const session = this.getSession();
    return session && roles.includes(session.rol);
  },

  // --- Verificar MFA (simplificado para demo) ---
  verifyMFA(code, secret) {
    if (!code) return false;
    // Para demo: acepta '123456' o el código de 6 dígitos del secret
    return code === '123456' || (secret && code === secret.slice(-6));
  },

  // --- Cambiar contraseña ---
  async changePassword(userId, currentPassword, newPassword) {
    const user = DB.findById('users', userId);
    if (!user) return { success: false, error: 'Usuario no encontrado.' };

    const hash = await Utils.hashPassword(currentPassword, user.passwordSalt);
    if (hash !== user.passwordHash) {
      return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    if (!Utils.isValidPassword(newPassword)) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' };
    }

    const newSalt = Utils.generateSalt();
    const newHash = await Utils.hashPassword(newPassword, newSalt);
    DB.update('users', userId, { passwordHash: newHash, passwordSalt: newSalt });
    Audit.log('CAMBIAR_CONTRASENA', 'user', userId, {});
    return { success: true };
  },

  // --- Registro de cliente con token de invitación ---
  async registerClient(tokenInv, clienteData, password) {
    // Buscar invitación
    const inv = DB.findOne('invitaciones', i => i.token === tokenInv && !i.usada);
    if (!inv) {
      return { success: false, error: 'Código de invitación inválido o ya utilizado.' };
    }
    if (new Date() > new Date(inv.expiraEn)) {
      return { success: false, error: 'El código de invitación ha caducado. Solicita uno nuevo.' };
    }

    // Validaciones
    if (!Utils.isValidEmail(clienteData.email)) {
      return { success: false, error: 'El email no es válido.' };
    }
    if (DB.findOne('users', u => u.email.toLowerCase() === clienteData.email.toLowerCase())) {
      return { success: false, error: 'Ya existe una cuenta con ese email.' };
    }
    if (!Utils.isValidPassword(password)) {
      return { success: false, error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.' };
    }

    // Crear usuario
    const salt = Utils.generateSalt();
    const hash = await Utils.hashPassword(password, salt);
    const user = DB.insert('users', {
      id: Utils.uuid(), rol: 'cliente',
      email: clienteData.email,
      passwordHash: hash, passwordSalt: salt,
      nombre: clienteData.nombreNegocio, apellidos: '',
      mfaEnabled: false, mfaSecret: null,
      activo: true, loginAttempts: 0, lockedUntil: null,
      consentimientoRGPD: true,
      consentimientoFecha: Utils.now()
    });

    // Crear perfil de cliente
    const cliente = DB.insert('clientes', {
      id: Utils.uuid(), usuarioId: user.id,
      nombreNegocio: Utils.sanitize(clienteData.nombreNegocio),
      personaContacto: Utils.sanitize(clienteData.personaContacto),
      nifCif: Utils.sanitize(clienteData.nifCif).toUpperCase(),
      direccion: Utils.sanitize(clienteData.direccion),
      localidad: Utils.sanitize(clienteData.localidad),
      codigoPostal: Utils.sanitize(clienteData.codigoPostal),
      telefono: Utils.sanitize(clienteData.telefono),
      email: clienteData.email,
      observacionesEntrega: Utils.sanitize(clienteData.observacionesEntrega || ''),
      rutaId: inv.rutaId,
      estado: 'pendiente',
      tokenInvitacion: tokenInv
    });

    // Marcar invitación como usada
    DB.update('invitaciones', inv.id, { usada: true, usadaEn: Utils.now(), clienteId: cliente.id });

    // Notificar al repartidor
    const ruta = DB.findById('rutas', inv.rutaId);
    if (ruta && ruta.repartidorId) {
      Notify.add(ruta.repartidorId,
        'Nuevo Cliente Registrado',
        `${clienteData.nombreNegocio} se ha registrado y está pendiente de aprobación.`,
        'info');
    }

    // Notificar a admins
    const admins = DB.find('users', u => u.rol === 'superadmin');
    admins.forEach(a => Notify.add(a.id, 'Nuevo Cliente Pendiente',
      `${clienteData.nombreNegocio} solicita acceso a la ${ruta ? ruta.nombre : 'ruta asignada'}.`,
      'info'));

    Audit.log('CREAR_CLIENTE', 'cliente', cliente.id, { nombreNegocio: clienteData.nombreNegocio, rutaId: inv.rutaId });
    return { success: true, cliente, userId: user.id };
  },

  // --- Crear invitación ---
  createInvitation(rutaId, creadorId) {
    const token = Utils.generateToken('INV');
    const inv = DB.insert('invitaciones', {
      id: Utils.uuid(), token, rutaId, creadorId,
      usada: false, clienteId: null,
      creadaEn: Utils.now(),
      expiraEn: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7 días
    });
    Audit.log('CREAR_INVITACION', 'invitacion', inv.id, { token, rutaId });
    return inv;
  },

  // --- Eliminar/anonimizar datos de un usuario (RGPD) ---
  anonymizeUser(userId) {
    const session = this.getSession();
    if (!session) return;

    DB.update('users', userId, {
      email: `anonimizado-${userId}@borrado.local`,
      nombre: 'ANONIMIZADO', apellidos: '',
      telefono: null, matricula: null,
      activo: false
    });

    const cliente = DB.findOne('clientes', c => c.usuarioId === userId);
    if (cliente) {
      DB.update('clientes', cliente.id, {
        nombreNegocio: 'ANONIMIZADO',
        personaContacto: 'ANONIMIZADO',
        nifCif: 'ANONIMIZADO', direccion: 'ANONIMIZADO',
        localidad: 'ANONIMIZADO', codigoPostal: '00000',
        telefono: '000000000', email: 'anonimizado@borrado.local',
        observacionesEntrega: ''
      });
    }

    // Eliminar notificaciones personales
    DB.find('notificaciones', n => n.usuarioId === userId).forEach(n =>
      DB.delete('notificaciones', n.id)
    );

    Audit.log('ELIMINAR_DATOS', 'user', userId, { motivo: 'Solicitud RGPD' });
    return { success: true };
  }
};
