// ============================================================
//  SEED DATA — Pollos Fuentes
//  Datos de demostración para pruebas
// ============================================================

window.Seed = {

  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async init() {
    if (localStorage.getItem('pf_seed_version') === 'v3') return;
    console.log('🌱 Inicializando datos de demostración...');

    // --- Hashes de contraseñas ---
    const adminHash    = await this.hashPassword('Admin1234!',    'salt-admin-001');
    const rep1Hash     = await this.hashPassword('Ruta1234!',     'salt-rep-001');
    const rep2Hash     = await this.hashPassword('Ruta1234!',     'salt-rep-002');
    const rep3Hash     = await this.hashPassword('Ruta1234!',     'salt-rep-003');
    const cli1Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-001');
    const cli2Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-002');
    const cli3Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-003');
    const cli4Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-004');
    const cli5Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-005');
    const cli6Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-006');
    const cli7Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-007');
    const cli8Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-008');
    const cli9Hash     = await this.hashPassword('Cliente1234!',  'salt-cli-009');
    const cli10Hash    = await this.hashPassword('Cliente1234!',  'salt-cli-010');

    // --- USUARIOS ---
    const users = [
      {
        id: 'user-admin-001', rol: 'superadmin',
        email: 'admin@pollosfuentes.es',
        passwordHash: adminHash, passwordSalt: 'salt-admin-001',
        nombre: 'Administrador', apellidos: 'Principal',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-01-01T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-01-01T09:00:00Z'
      },
      {
        id: 'user-rep-001', rol: 'repartidor',
        email: 'ruta1@pollosfuentes.es',
        passwordHash: rep1Hash, passwordSalt: 'salt-rep-001',
        nombre: 'Carlos', apellidos: 'García Martínez',
        telefono: '611234567', matricula: '1234-ABC', rutaId: 'ruta-001',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-01-05T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-01-05T09:00:00Z'
      },
      {
        id: 'user-rep-002', rol: 'repartidor',
        email: 'ruta2@pollosfuentes.es',
        passwordHash: rep2Hash, passwordSalt: 'salt-rep-002',
        nombre: 'María', apellidos: 'López Sánchez',
        telefono: '622345678', matricula: '5678-DEF', rutaId: 'ruta-002',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-01-05T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-01-05T09:00:00Z'
      },
      {
        id: 'user-rep-003', rol: 'repartidor',
        email: 'ruta3@pollosfuentes.es',
        passwordHash: rep3Hash, passwordSalt: 'salt-rep-003',
        nombre: 'Pedro', apellidos: 'Martínez Ruiz',
        telefono: '633456789', matricula: '9012-GHI', rutaId: 'ruta-003',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-01-06T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-01-06T09:00:00Z'
      },
      // Clientes
      {
        id: 'user-cli-001', rol: 'cliente',
        email: 'cliente1@demo.es',
        passwordHash: cli1Hash, passwordSalt: 'salt-cli-001',
        nombre: 'Carnicería El Buen Corte', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-01T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-01T09:00:00Z'
      },
      {
        id: 'user-cli-002', rol: 'cliente',
        email: 'cliente2@demo.es',
        passwordHash: cli2Hash, passwordSalt: 'salt-cli-002',
        nombre: 'Supermercado La Esquina', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-02T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-02T09:00:00Z'
      },
      {
        id: 'user-cli-003', rol: 'cliente',
        email: 'cliente3@demo.es',
        passwordHash: cli3Hash, passwordSalt: 'salt-cli-003',
        nombre: 'Restaurante El Corral', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-03T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-03T09:00:00Z'
      },
      {
        id: 'user-cli-004', rol: 'cliente',
        email: 'cliente4@demo.es',
        passwordHash: cli4Hash, passwordSalt: 'salt-cli-004',
        nombre: 'Pollería San Isidro', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-04T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-04T09:00:00Z'
      },
      {
        id: 'user-cli-005', rol: 'cliente',
        email: 'cliente5@demo.es',
        passwordHash: cli5Hash, passwordSalt: 'salt-cli-005',
        nombre: 'Hostal La Parada', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-05T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-05T09:00:00Z'
      },
      {
        id: 'user-cli-006', rol: 'cliente',
        email: 'cliente6@demo.es',
        passwordHash: cli6Hash, passwordSalt: 'salt-cli-006',
        nombre: 'Carnicería Los Hermanos', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-06T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-06T09:00:00Z'
      },
      {
        id: 'user-cli-007', rol: 'cliente',
        email: 'cliente7@demo.es',
        passwordHash: cli7Hash, passwordSalt: 'salt-cli-007',
        nombre: 'Mercado Central Stand 12', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-07T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-07T09:00:00Z'
      },
      {
        id: 'user-cli-008', rol: 'cliente',
        email: 'cliente8@demo.es',
        passwordHash: cli8Hash, passwordSalt: 'salt-cli-008',
        nombre: 'Restaurante Asador Pepe', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-08T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-08T09:00:00Z'
      },
      {
        id: 'user-cli-009', rol: 'cliente',
        email: 'cliente9@demo.es',
        passwordHash: cli9Hash, passwordSalt: 'salt-cli-009',
        nombre: 'Charcutería La Rioja', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-09T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-09T09:00:00Z'
      },
      {
        id: 'user-cli-010', rol: 'cliente',
        email: 'cliente10@demo.es',
        passwordHash: cli10Hash, passwordSalt: 'salt-cli-010',
        nombre: 'Cafetería El Descanso', apellidos: '',
        mfaEnabled: false, mfaSecret: null,
        activo: false, loginAttempts: 0, lockedUntil: null,
        creadoEn: '2025-02-10T09:00:00Z', ultimoAcceso: null,
        consentimientoRGPD: true, consentimientoFecha: '2025-02-10T09:00:00Z'
      }
    ];
    localStorage.setItem('pf_users', JSON.stringify(users));

    // --- RUTAS ---
    const rutas = [
      {
        id: 'ruta-001', nombre: 'Ruta Madrid Norte',
        descripcion: 'Zona norte de Madrid: Hortaleza, Barajas, San Blas',
        repartidorId: 'user-rep-001', activa: true,
        horaLimitePedido: '08:00', creadaEn: '2025-01-05T10:00:00Z'
      },
      {
        id: 'ruta-002', nombre: 'Ruta Madrid Sur',
        descripcion: 'Zona sur de Madrid: Vallecas, Villaverde, Usera',
        repartidorId: 'user-rep-002', activa: true,
        horaLimitePedido: '07:30', creadaEn: '2025-01-05T10:00:00Z'
      },
      {
        id: 'ruta-003', nombre: 'Ruta Corredor Henares',
        descripcion: 'Alcalá, Torrejón, Coslada, Mejorada',
        repartidorId: 'user-rep-003', activa: true,
        horaLimitePedido: '08:30', creadaEn: '2025-01-06T10:00:00Z'
      }
    ];
    localStorage.setItem('pf_rutas', JSON.stringify(rutas));

    // --- PERFILES DE CLIENTE ---
    const clientes = [
      {
        id: 'cli-001', usuarioId: 'user-cli-001',
        nombreNegocio: 'Carnicería El Buen Corte',
        personaContacto: 'Antonio López', nifCif: 'B12345678',
        direccion: 'Calle del Prado, 15', localidad: 'Hortaleza', codigoPostal: '28032',
        telefono: '912345678', email: 'cliente1@demo.es',
        observacionesEntrega: 'Entregar antes de las 9:00. Llamar antes.',
        rutaId: 'ruta-001', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-01T09:00:00Z'
      },
      {
        id: 'cli-002', usuarioId: 'user-cli-002',
        nombreNegocio: 'Supermercado La Esquina',
        personaContacto: 'Carmen Ruiz', nifCif: 'B23456789',
        direccion: 'Av. de América, 22', localidad: 'San Blas', codigoPostal: '28037',
        telefono: '913456789', email: 'cliente2@demo.es',
        observacionesEntrega: 'Acceso por la trasera. Muelle de carga.',
        rutaId: 'ruta-001', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-02T09:00:00Z'
      },
      {
        id: 'cli-003', usuarioId: 'user-cli-003',
        nombreNegocio: 'Restaurante El Corral',
        personaContacto: 'Miguel Hernández', nifCif: 'B34567890',
        direccion: 'Plaza Mayor, 8', localidad: 'Barajas', codigoPostal: '28042',
        telefono: '914567890', email: 'cliente3@demo.es',
        observacionesEntrega: 'Solo entregas entre 6:00 y 9:00.',
        rutaId: 'ruta-001', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-03T09:00:00Z'
      },
      {
        id: 'cli-004', usuarioId: 'user-cli-004',
        nombreNegocio: 'Pollería San Isidro',
        personaContacto: 'Rosa Martínez', nifCif: 'B45678901',
        direccion: 'Calle Vallecas, 45', localidad: 'Vallecas', codigoPostal: '28038',
        telefono: '915678901', email: 'cliente4@demo.es',
        observacionesEntrega: 'Tocar timbre 2 veces.',
        rutaId: 'ruta-002', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-04T09:00:00Z'
      },
      {
        id: 'cli-005', usuarioId: 'user-cli-005',
        nombreNegocio: 'Hostal La Parada',
        personaContacto: 'Juan García', nifCif: 'B56789012',
        direccion: 'Calle Villaverde, 10', localidad: 'Villaverde', codigoPostal: '28021',
        telefono: '916789012', email: 'cliente5@demo.es',
        observacionesEntrega: 'Cocina por la puerta trasera.',
        rutaId: 'ruta-002', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-05T09:00:00Z'
      },
      {
        id: 'cli-006', usuarioId: 'user-cli-006',
        nombreNegocio: 'Carnicería Los Hermanos',
        personaContacto: 'Luis y Pedro García', nifCif: 'B67890123',
        direccion: 'Av. Usera, 33', localidad: 'Usera', codigoPostal: '28026',
        telefono: '917890123', email: 'cliente6@demo.es',
        observacionesEntrega: 'Contactar siempre con Luis.',
        rutaId: 'ruta-002', estado: 'pendiente',
        tokenInvitacion: null, creadoEn: '2025-02-06T09:00:00Z'
      },
      {
        id: 'cli-007', usuarioId: 'user-cli-007',
        nombreNegocio: 'Mercado Central Stand 12',
        personaContacto: 'Eva Sánchez', nifCif: 'B78901234',
        direccion: 'Mercado Central, Puesto 12', localidad: 'Alcalá de Henares', codigoPostal: '28801',
        telefono: '918901234', email: 'cliente7@demo.es',
        observacionesEntrega: 'Abren a las 7:00. Entrar por acceso mercado.',
        rutaId: 'ruta-003', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-07T09:00:00Z'
      },
      {
        id: 'cli-008', usuarioId: 'user-cli-008',
        nombreNegocio: 'Restaurante Asador Pepe',
        personaContacto: 'José Pérez', nifCif: 'B89012345',
        direccion: 'Calle Mayor, 55', localidad: 'Torrejón de Ardoz', codigoPostal: '28850',
        telefono: '919012345', email: 'cliente8@demo.es',
        observacionesEntrega: 'Preguntar por Pepe en cocina.',
        rutaId: 'ruta-003', estado: 'activo',
        tokenInvitacion: null, creadoEn: '2025-02-08T09:00:00Z'
      },
      {
        id: 'cli-009', usuarioId: 'user-cli-009',
        nombreNegocio: 'Charcutería La Rioja',
        personaContacto: 'Ana Fernández', nifCif: 'B90123456',
        direccion: 'Calle Coslada, 8', localidad: 'Coslada', codigoPostal: '28820',
        telefono: '910123456', email: 'cliente9@demo.es',
        observacionesEntrega: 'Cámara frigorífica disponible para dejar pedido.',
        rutaId: 'ruta-003', estado: 'bloqueado',
        tokenInvitacion: null, creadoEn: '2025-02-09T09:00:00Z'
      },
      {
        id: 'cli-010', usuarioId: 'user-cli-010',
        nombreNegocio: 'Cafetería El Descanso',
        personaContacto: 'Francisco Torres', nifCif: 'B01234567',
        direccion: 'Plaza del Ayuntamiento, 1', localidad: 'Mejorada del Campo', codigoPostal: '28840',
        telefono: '911234560', email: 'cliente10@demo.es',
        observacionesEntrega: '',
        rutaId: 'ruta-003', estado: 'baja',
        tokenInvitacion: null, creadoEn: '2025-02-10T09:00:00Z'
      }
    ];
    localStorage.setItem('pf_clientes', JSON.stringify(clientes));

    // --- CATEGORÍAS ---
    const categorias = [
      { id: 'cat-001', nombre: 'Pollos Enteros', descripcion: 'Pollos enteros de diferente gramaje y calidad', orden: 1 },
      { id: 'cat-002', nombre: 'Piezas y Despiece', descripcion: 'Porciones y piezas individuales de pollo', orden: 2 },
      { id: 'cat-003', nombre: 'Menudillos y Vísceras', descripcion: 'Hígados, mollejas, corazones y carcasas', orden: 3 },
      { id: 'cat-004', nombre: 'Productos Elaborados', descripcion: 'Fileteados, deshuesados, adobados y elaborados', orden: 4 }
    ];
    localStorage.setItem('pf_categorias', JSON.stringify(categorias));

    // --- PRODUCTOS ---
    const productos = [
      {
        id: 'prod-001', categoriaId: 'cat-001',
        nombre: 'Pollo Entero Premium', descripcion: 'Pollo entero de crianza en suelo, peso medio 1,8–2,2 kg',
        formato: 'Unidad (aprox. 2 kg)', unidadVenta: 'kg', precioBase: 3.20,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-002', categoriaId: 'cat-001',
        nombre: 'Pollo Entero Estándar', descripcion: 'Pollo entero de producción convencional, peso 1,5–1,8 kg',
        formato: 'Unidad (aprox. 1,6 kg)', unidadVenta: 'kg', precioBase: 2.80,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-003', categoriaId: 'cat-002',
        nombre: 'Medio Pollo', descripcion: 'Medio pollo partido por la mitad, ideal para asados',
        formato: 'Medio pollo', unidadVenta: 'ud', precioBase: 1.90,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-004', categoriaId: 'cat-002',
        nombre: 'Pechuga Entera con Hueso', descripcion: 'Pechuga entera con costillar, jugosa y versátil',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 4.50,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-005', categoriaId: 'cat-002',
        nombre: 'Contramuslo', descripcion: 'Contramuslo de pollo, piel incluida. Tierno y jugoso',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 2.80,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-006', categoriaId: 'cat-002',
        nombre: 'Muslo de Pollo', descripcion: 'Muslo entero con hueso y piel',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 2.60,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-007', categoriaId: 'cat-002',
        nombre: 'Ala de Pollo', descripcion: 'Alitas de pollo enteras, perfectas para brasa',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 2.20,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-008', categoriaId: 'cat-003',
        nombre: 'Carcasa de Pollo', descripcion: 'Carcasa con restos de carne, ideal para caldos y sopas',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 0.80,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-009', categoriaId: 'cat-003',
        nombre: 'Hígado de Pollo', descripcion: 'Hígados frescos, limpios y envasados',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 1.50,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-010', categoriaId: 'cat-003',
        nombre: 'Molleja de Pollo', descripcion: 'Mollejas limpias y preparadas para cocinar',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 1.80,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-011', categoriaId: 'cat-003',
        nombre: 'Corazón de Pollo', descripcion: 'Corazones frescos, nutritivos y económicos',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 1.60,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-012', categoriaId: 'cat-004',
        nombre: 'Pechuga Fileteada', descripcion: 'Filetes de pechuga finos, listos para la plancha',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 5.00,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-013', categoriaId: 'cat-004',
        nombre: 'Pollo Deshuesado Entero', descripcion: 'Pollo completamente deshuesado y limpio',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 5.50,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-014', categoriaId: 'cat-004',
        nombre: 'Alitas al Ajillo Adobadas', descripcion: 'Alitas marinadas en ajillo, listas para asar o freír',
        formato: 'Por kilogramo', unidadVenta: 'kg', precioBase: 4.20,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      },
      {
        id: 'prod-015', categoriaId: 'cat-004',
        nombre: 'Croquetas de Pollo (congeladas)', descripcion: 'Croquetas caseras de pollo y jamón, 1 kg por caja',
        formato: 'Caja 1 kg', unidadVenta: 'caja', precioBase: 3.80,
        imagen: null, activo: true, creadoEn: '2025-01-10T09:00:00Z'
      }
    ];
    localStorage.setItem('pf_productos', JSON.stringify(productos));

    // --- DISPONIBILIDAD DIARIA ---
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const disponibilidades = [];
    const rutasIds = ['ruta-001', 'ruta-002', 'ruta-003'];
    const productoIds = productos.map(p => p.id);

    rutasIds.forEach(rutaId => {
      productoIds.forEach((productoId, idx) => {
        const prod = productos.find(p => p.id === productoId);
        // Algunos productos no disponibles en ciertas rutas
        const disponible = !(rutaId === 'ruta-002' && ['prod-013', 'prod-015'].includes(productoId));
        // Precio ligeramente diferente por ruta
        const precioOffset = rutaId === 'ruta-001' ? 0 : rutaId === 'ruta-002' ? 0.05 : 0.10;

        [today, yesterday].forEach(fecha => {
          disponibilidades.push({
            id: `disp-${rutaId}-${productoId}-${fecha}`,
            rutaId, productoId, fecha,
            disponible,
            precio: parseFloat((prod.precioBase + precioOffset).toFixed(2)),
            cantidadDisponible: idx < 5 ? 100 : null,
            limitePorCliente: null,
            creadoEn: fecha + 'T06:00:00Z'
          });
        });
      });
    });
    localStorage.setItem('pf_disponibilidad', JSON.stringify(disponibilidades));

    // --- PEDIDOS ---
    const pedidos = [
      {
        id: 'ped-001', clienteId: 'cli-001', rutaId: 'ruta-001', fecha: today,
        estado: 'confirmado',
        lineas: [
          { productoId: 'prod-001', nombre: 'Pollo Entero Premium', cantidad: 10, precioUnitario: 3.20, unidadVenta: 'kg', subtotal: 32.00 },
          { productoId: 'prod-004', nombre: 'Pechuga Entera', cantidad: 5, precioUnitario: 4.50, unidadVenta: 'kg', subtotal: 22.50 }
        ],
        observaciones: 'Urgente para apertura del local',
        total: 54.50, creadoEn: today + 'T07:15:00Z', modificadoEn: today + 'T07:16:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: today + 'T07:15:00Z', usuario: 'user-cli-001' },
          { estado: 'confirmado', fecha: today + 'T07:16:00Z', usuario: 'user-rep-001' }
        ]
      },
      {
        id: 'ped-002', clienteId: 'cli-002', rutaId: 'ruta-001', fecha: today,
        estado: 'en_preparacion',
        lineas: [
          { productoId: 'prod-002', nombre: 'Pollo Estándar', cantidad: 20, precioUnitario: 2.80, unidadVenta: 'kg', subtotal: 56.00 },
          { productoId: 'prod-007', nombre: 'Ala de Pollo', cantidad: 8, precioUnitario: 2.20, unidadVenta: 'kg', subtotal: 17.60 },
          { productoId: 'prod-009', nombre: 'Hígado', cantidad: 3, precioUnitario: 1.50, unidadVenta: 'kg', subtotal: 4.50 }
        ],
        observaciones: '',
        total: 78.10, creadoEn: today + 'T06:45:00Z', modificadoEn: today + 'T07:30:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: today + 'T06:45:00Z', usuario: 'user-cli-002' },
          { estado: 'confirmado', fecha: today + 'T07:00:00Z', usuario: 'user-rep-001' },
          { estado: 'en_preparacion', fecha: today + 'T07:30:00Z', usuario: 'user-rep-001' }
        ]
      },
      {
        id: 'ped-003', clienteId: 'cli-003', rutaId: 'ruta-001', fecha: today,
        estado: 'pendiente',
        lineas: [
          { productoId: 'prod-005', nombre: 'Contramuslo', cantidad: 15, precioUnitario: 2.80, unidadVenta: 'kg', subtotal: 42.00 }
        ],
        observaciones: 'Si no hay contramuslo, substituir por muslo',
        total: 42.00, creadoEn: today + 'T07:55:00Z', modificadoEn: today + 'T07:55:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: today + 'T07:55:00Z', usuario: 'user-cli-003' }
        ]
      },
      {
        id: 'ped-004', clienteId: 'cli-004', rutaId: 'ruta-002', fecha: today,
        estado: 'preparado',
        lineas: [
          { productoId: 'prod-001', nombre: 'Pollo Premium', cantidad: 30, precioUnitario: 3.25, unidadVenta: 'kg', subtotal: 97.50 }
        ],
        observaciones: '',
        total: 97.50, creadoEn: today + 'T06:30:00Z', modificadoEn: today + 'T07:45:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: today + 'T06:30:00Z', usuario: 'user-cli-004' },
          { estado: 'confirmado', fecha: today + 'T06:45:00Z', usuario: 'user-rep-002' },
          { estado: 'en_preparacion', fecha: today + 'T07:15:00Z', usuario: 'user-rep-002' },
          { estado: 'preparado', fecha: today + 'T07:45:00Z', usuario: 'user-rep-002' }
        ]
      },
      {
        id: 'ped-005', clienteId: 'cli-007', rutaId: 'ruta-003', fecha: today,
        estado: 'en_reparto',
        lineas: [
          { productoId: 'prod-012', nombre: 'Pechuga Fileteada', cantidad: 10, precioUnitario: 5.10, unidadVenta: 'kg', subtotal: 51.00 },
          { productoId: 'prod-014', nombre: 'Alitas Adobadas', cantidad: 5, precioUnitario: 4.30, unidadVenta: 'kg', subtotal: 21.50 }
        ],
        observaciones: '',
        total: 72.50, creadoEn: today + 'T07:00:00Z', modificadoEn: today + 'T08:15:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: today + 'T07:00:00Z', usuario: 'user-cli-007' },
          { estado: 'confirmado', fecha: today + 'T07:10:00Z', usuario: 'user-rep-003' },
          { estado: 'en_preparacion', fecha: today + 'T07:45:00Z', usuario: 'user-rep-003' },
          { estado: 'preparado', fecha: today + 'T08:00:00Z', usuario: 'user-rep-003' },
          { estado: 'en_reparto', fecha: today + 'T08:15:00Z', usuario: 'user-rep-003' }
        ]
      },
      // Pedido de ayer - entregado
      {
        id: 'ped-006', clienteId: 'cli-001', rutaId: 'ruta-001', fecha: yesterday,
        estado: 'entregado',
        lineas: [
          { productoId: 'prod-001', nombre: 'Pollo Premium', cantidad: 8, precioUnitario: 3.20, unidadVenta: 'kg', subtotal: 25.60 },
          { productoId: 'prod-006', nombre: 'Muslo', cantidad: 10, precioUnitario: 2.60, unidadVenta: 'kg', subtotal: 26.00 }
        ],
        observaciones: '',
        total: 51.60, creadoEn: yesterday + 'T07:20:00Z', modificadoEn: yesterday + 'T10:30:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: yesterday + 'T07:20:00Z', usuario: 'user-cli-001' },
          { estado: 'confirmado', fecha: yesterday + 'T07:30:00Z', usuario: 'user-rep-001' },
          { estado: 'en_preparacion', fecha: yesterday + 'T08:00:00Z', usuario: 'user-rep-001' },
          { estado: 'preparado', fecha: yesterday + 'T08:45:00Z', usuario: 'user-rep-001' },
          { estado: 'en_reparto', fecha: yesterday + 'T09:00:00Z', usuario: 'user-rep-001' },
          { estado: 'entregado', fecha: yesterday + 'T10:30:00Z', usuario: 'user-rep-001' }
        ]
      },
      // Pedido con incidencia
      {
        id: 'ped-007', clienteId: 'cli-008', rutaId: 'ruta-003', fecha: yesterday,
        estado: 'incidencia',
        lineas: [
          { productoId: 'prod-003', nombre: 'Medio Pollo', cantidad: 20, precioUnitario: 1.90, unidadVenta: 'ud', subtotal: 38.00 }
        ],
        observaciones: 'Cliente no disponible en la hora acordada',
        total: 38.00, creadoEn: yesterday + 'T06:50:00Z', modificadoEn: yesterday + 'T10:00:00Z',
        historialEstados: [
          { estado: 'pendiente', fecha: yesterday + 'T06:50:00Z', usuario: 'user-cli-008' },
          { estado: 'confirmado', fecha: yesterday + 'T07:00:00Z', usuario: 'user-rep-003' },
          { estado: 'en_preparacion', fecha: yesterday + 'T07:30:00Z', usuario: 'user-rep-003' },
          { estado: 'preparado', fecha: yesterday + 'T08:15:00Z', usuario: 'user-rep-003' },
          { estado: 'en_reparto', fecha: yesterday + 'T08:30:00Z', usuario: 'user-rep-003' },
          { estado: 'incidencia', fecha: yesterday + 'T10:00:00Z', usuario: 'user-rep-003' }
        ]
      }
    ];
    localStorage.setItem('pf_pedidos', JSON.stringify(pedidos));

    // --- NOTIFICACIONES ---
    const notificaciones = [
      {
        id: 'notif-001', usuarioId: 'user-cli-001',
        tipo: 'info', titulo: 'Pedido Confirmado',
        mensaje: 'Tu pedido #ped-001 ha sido confirmado por el repartidor.',
        leida: false, creadoEn: today + 'T07:16:00Z', pedidoId: 'ped-001'
      },
      {
        id: 'notif-002', usuarioId: 'user-rep-001',
        tipo: 'warning', titulo: 'Nuevo Pedido',
        mensaje: 'El cliente Carnicería El Buen Corte ha realizado un nuevo pedido.',
        leida: false, creadoEn: today + 'T07:55:00Z', pedidoId: 'ped-003'
      },
      {
        id: 'notif-003', usuarioId: 'user-admin-001',
        tipo: 'error', titulo: 'Incidencia en Pedido',
        mensaje: 'Pedido #ped-007 de Restaurante Asador Pepe marcado como incidencia.',
        leida: false, creadoEn: yesterday + 'T10:00:00Z', pedidoId: 'ped-007'
      },
      {
        id: 'notif-004', usuarioId: 'user-admin-001',
        tipo: 'info', titulo: 'Nuevo Cliente Pendiente',
        mensaje: 'Carnicería Los Hermanos está pendiente de aprobación.',
        leida: false, creadoEn: '2025-02-06T09:00:00Z', pedidoId: null
      }
    ];
    localStorage.setItem('pf_notificaciones', JSON.stringify(notificaciones));

    // --- AUDITORÍA ---
    const auditoria = [
      {
        id: 'aud-001', usuarioId: 'user-admin-001', accion: 'CREAR_RUTA',
        entidad: 'ruta', entidadId: 'ruta-001',
        detalles: { nombre: 'Ruta Madrid Norte' },
        timestamp: '2025-01-05T10:00:00Z'
      },
      {
        id: 'aud-002', usuarioId: 'user-admin-001', accion: 'CREAR_USUARIO',
        entidad: 'usuario', entidadId: 'user-rep-001',
        detalles: { email: 'ruta1@pollosfuentes.es', rol: 'repartidor' },
        timestamp: '2025-01-05T10:05:00Z'
      },
      {
        id: 'aud-003', usuarioId: 'user-rep-001', accion: 'APROBAR_CLIENTE',
        entidad: 'cliente', entidadId: 'cli-001',
        detalles: { nombreNegocio: 'Carnicería El Buen Corte' },
        timestamp: '2025-02-01T10:00:00Z'
      }
    ];
    localStorage.setItem('pf_auditoria', JSON.stringify(auditoria));

    // --- INVITACIONES ---
    localStorage.setItem('pf_invitaciones', JSON.stringify([]));

    localStorage.setItem('pf_seed_version', 'v3');
    console.log('✅ Datos de demostración inicializados');
  },

  reset() {
    Object.keys(localStorage).filter(k => k.startsWith('pf_')).forEach(k => localStorage.removeItem(k));
    console.log('🔄 Datos resetados. Recarga la página para reinicializar.');
  }
};
