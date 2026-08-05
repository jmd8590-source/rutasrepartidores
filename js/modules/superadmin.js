// ============================================================
//  SUPERADMIN.js — Módulo del Superadministrador
//  Pollos Fuentes
// ============================================================
'use strict';

const SuperAdmin = {

  // ─── DASHBOARD ───────────────────────────────────────────
  renderDashboard() {
    const today = Utils.today();
    const pedidos = DB.get('pedidos');
    const todayPedidos = pedidos.filter(p => p.fecha === today);
    const clientes = DB.get('clientes');
    const rutas = DB.get('rutas');
    const incidencias = pedidos.filter(p => p.estado === 'incidencia');
    const ventasHoy = todayPedidos.reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
    const ventasTotal = pedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + (p.total || 0), 0);
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
    const pendientesAprobacion = clientes.filter(c => c.estado === 'pendiente').length;

    // Top productos
    const prodCount = {};
    pedidos.forEach(p => (p.lineas || []).forEach(l => {
      prodCount[l.productoId] = (prodCount[l.productoId] || 0) + (l.cantidad || 0);
    }));
    const topProds = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, qty]) => ({
      nombre: Utils.getProductoNombre(id), qty
    }));

    // Últimos pedidos
    const ultimosPedidos = [...pedidos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 5);

    document.getElementById('page-title').textContent = 'Panel de Control';
    document.getElementById('page-subtitle').textContent = `Hoy, ${Utils.formatDate(new Date(), 'full')}`;
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary btn--sm" onclick="Router.go('/admin/informes')">📊 Ver Informes</button>
    `;

    return `
      <div class="kpi-grid" style="margin-bottom:1.5rem">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--orange">🛒</div>
          <div class="kpi-info">
            <div class="kpi-value">${todayPedidos.length}</div>
            <div class="kpi-label">Pedidos hoy</div>
            <div class="kpi-trend kpi-trend--up">↑ ${todayPedidos.filter(p => p.estado === 'confirmado').length} confirmados</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--green">💶</div>
          <div class="kpi-info">
            <div class="kpi-value">${Utils.formatCurrency(ventasHoy)}</div>
            <div class="kpi-label">Ventas hoy</div>
            <div class="kpi-trend">Total: ${Utils.formatCurrency(ventasTotal)}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--blue">🏪</div>
          <div class="kpi-info">
            <div class="kpi-value">${clientesActivos}</div>
            <div class="kpi-label">Clientes activos</div>
            ${pendientesAprobacion > 0 ? `<div class="kpi-trend kpi-trend--down">⚠️ ${pendientesAprobacion} pendientes</div>` : '<div class="kpi-trend kpi-trend--up">↑ Sin pendientes</div>'}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--purple">🗺️</div>
          <div class="kpi-info">
            <div class="kpi-value">${rutas.filter(r => r.activa).length}</div>
            <div class="kpi-label">Rutas activas</div>
            <div class="kpi-trend">de ${rutas.length} totales</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--red">⚠️</div>
          <div class="kpi-info">
            <div class="kpi-value ${incidencias.length > 0 ? 'text-error' : ''}">${incidencias.length}</div>
            <div class="kpi-label">Incidencias abiertas</div>
            ${incidencias.length > 0 ? `<div class="kpi-trend kpi-trend--down">Requieren atención</div>` : '<div class="kpi-trend kpi-trend--up">Sin incidencias</div>'}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--cyan">📦</div>
          <div class="kpi-info">
            <div class="kpi-value">${DB.count('productos', p => p.activo)}</div>
            <div class="kpi-label">Productos activos</div>
            <div class="kpi-trend">${DB.count('categorias')} categorías</div>
          </div>
        </div>
      </div>

      <div class="grid-2" style="gap:1.5rem">
        <div class="card">
          <div class="card-header">
            <h3>📋 Últimos Pedidos</h3>
            <button class="btn btn--outline btn--sm" onclick="Router.go('/admin/pedidos')">Ver todos</button>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr>
                <th>Cliente</th><th>Ruta</th><th>Total</th><th>Estado</th>
              </tr></thead>
              <tbody>
                ${ultimosPedidos.length ? ultimosPedidos.map(p => {
                  const cli = DB.findById('clientes', p.clienteId);
                  return `<tr>
                    <td>${Utils.esc(cli ? cli.nombreNegocio : '—')}</td>
                    <td><span style="font-size:.8rem">${Utils.esc(Utils.getRutaNombre(p.rutaId))}</span></td>
                    <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                    <td>${Utils.statusBadge(p.estado)}</td>
                  </tr>`;
                }).join('') : '<tr><td colspan="4" class="text-center text-muted">No hay pedidos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>🏆 Top Productos</h3>
            <button class="btn btn--outline btn--sm" onclick="Router.go('/admin/informes')">Más detalles</button>
          </div>
          <div class="card-body">
            ${topProds.length ? topProds.map((p, i) => `
              <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--border-light)">
                <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-100);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:var(--primary-dark);flex-shrink:0">${i + 1}</div>
                <div style="flex:1;font-size:.875rem;font-weight:500">${Utils.esc(p.nombre)}</div>
                <div style="font-size:.875rem;font-weight:700;color:var(--primary)">${Utils.formatNumber(p.qty, 0)} uds</div>
              </div>
            `).join('') : '<p class="text-muted text-sm">Sin datos</p>'}
          </div>
        </div>
      </div>

      ${incidencias.length > 0 ? `
      <div class="card mt-4" style="border-color:var(--error)">
        <div class="card-header" style="background:var(--error-bg)">
          <h3 style="color:var(--error)">⚠️ Incidencias Pendientes</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Cliente</th><th>Ruta</th><th>Fecha</th><th>Total</th><th>Acción</th></tr></thead>
            <tbody>
              ${incidencias.map(p => {
                const cli = DB.findById('clientes', p.clienteId);
                return `<tr>
                  <td>${Utils.esc(cli ? cli.nombreNegocio : '—')}</td>
                  <td>${Utils.esc(Utils.getRutaNombre(p.rutaId))}</td>
                  <td>${Utils.formatDate(p.fecha)}</td>
                  <td>${Utils.formatCurrency(p.total)}</td>
                  <td><button class="btn btn--warning btn--xs" onclick="SuperAdmin.showPedidoDetalle('${p.id}')">Ver</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      ${pendientesAprobacion > 0 ? `
      <div class="card mt-4" style="border-color:var(--warning)">
        <div class="card-header" style="background:var(--warning-bg)">
          <h3 style="color:#92400E">🕐 Clientes Pendientes de Aprobación</h3>
          <button class="btn btn--warning btn--sm" onclick="Router.go('/admin/clientes')">Gestionar</button>
        </div>
        <div class="card-body">
          ${DB.find('clientes', c => c.estado === 'pendiente').map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border-light)">
              <div>
                <div style="font-weight:600;font-size:.875rem">${Utils.esc(c.nombreNegocio)}</div>
                <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(c.localidad)} · ${Utils.esc(Utils.getRutaNombre(c.rutaId))}</div>
              </div>
              <div style="display:flex;gap:.5rem">
                <button class="btn btn--success btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','activo')">✅ Aprobar</button>
                <button class="btn btn--error btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','bloqueado')">❌ Rechazar</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    `;
  },

  // ─── RUTAS ───────────────────────────────────────────────
  renderRutas() {
    document.getElementById('page-title').textContent = 'Gestión de Rutas';
    document.getElementById('page-subtitle').textContent = 'Crear, editar y gestionar rutas de reparto';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" id="btn-nueva-ruta">➕ Nueva Ruta</button>
    `;

    const rutas = DB.get('rutas');
    const repartidores = DB.find('users', u => u.rol === 'repartidor');

    setTimeout(() => {
      document.getElementById('btn-nueva-ruta')?.addEventListener('click', () => this.showRutaForm());
    }, 0);

    return `
      <div class="card">
        <div class="card-header">
          <h3>Rutas Configuradas <span class="badge badge--primary">${rutas.length}</span></h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>Nombre</th><th>Repartidor Asignado</th><th>Hora Límite</th>
              <th>Clientes</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${rutas.length ? rutas.map(r => {
                const rep = DB.findById('users', r.repartidorId);
                const numClientes = DB.count('clientes', c => c.rutaId === r.id && c.estado === 'activo');
                return `<tr>
                  <td>
                    <div style="font-weight:600">${Utils.esc(r.nombre)}</div>
                    <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(r.descripcion || '')}</div>
                  </td>
                  <td>
                    ${rep ? `<div style="display:flex;align-items:center;gap:.5rem">
                      <div class="avatar avatar--orange" style="width:28px;height:28px;font-size:.75rem">${rep.nombre[0]}</div>
                      <div>
                        <div style="font-size:.875rem;font-weight:500">${Utils.esc(rep.nombre + ' ' + (rep.apellidos || ''))}</div>
                        <div style="font-size:.75rem;color:var(--muted)">${Utils.esc(rep.matricula || '—')}</div>
                      </div>
                    </div>` : '<span class="text-muted text-sm">Sin asignar</span>'}
                  </td>
                  <td><span style="font-weight:600">${r.horaLimitePedido || '—'}</span></td>
                  <td><span class="badge badge--info">${numClientes} clientes</span></td>
                  <td>${Utils.activeBadge(r.activa)}</td>
                  <td class="actions-cell">
                    <button class="btn btn--primary btn--xs" onclick="SuperAdmin.generarQRParaRuta('${r.id}')">📲 QR Cliente</button>
                    <button class="btn btn--outline btn--xs" onclick="SuperAdmin.showRutaForm('${r.id}')">✏️ Editar</button>
                    <button class="btn btn--${r.activa ? 'warning' : 'success'} btn--xs" onclick="SuperAdmin.toggleRuta('${r.id}')">
                      ${r.activa ? '⏸ Desactivar' : '▶ Activar'}
                    </button>
                    <button class="btn btn--error btn--xs" onclick="SuperAdmin.confirmDeleteRuta('${r.id}')">🗑️ Eliminar</button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">No hay rutas configuradas</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showRutaForm(rutaId = null) {
    const ruta = rutaId ? DB.findById('rutas', rutaId) : null;
    const repartidores = DB.find('users', u => u.rol === 'repartidor');
    const repActual = ruta?.repartidorId ? DB.findById('users', ruta.repartidorId) : null;

    Modal.show(ruta ? `✏️ Editar Ruta — ${Utils.esc(ruta.nombre)}` : '🗺️ Nueva Ruta', `
      <form id="ruta-form">

        <!-- ── DATOS DE LA RUTA ── -->
        <div class="form-section-title" style="font-weight:700;color:var(--primary);font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;padding-bottom:.35rem;border-bottom:2px solid var(--primary-100)">📍 Datos de la Ruta</div>
        <div class="form-row">
          <div class="form-group">
            <label>Nombre de la Ruta *</label>
            <input type="text" id="ruta-nombre" value="${Utils.esc(ruta?.nombre || '')}" placeholder="Ej: Ruta Norte" required>
            <span class="field-error" id="ruta-nombre-err"></span>
          </div>
          <div class="form-group">
            <label>Hora Límite de Pedidos</label>
            <input type="time" id="ruta-hora" value="${ruta?.horaLimitePedido || '08:00'}">
            <span class="form-hint">Los clientes no podrán pedir después de esta hora</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Descripción</label>
            <textarea id="ruta-desc" rows="2" placeholder="Zonas que cubre esta ruta...">${Utils.esc(ruta?.descripcion || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="ruta-activa">
              <option value="true" ${ruta?.activa !== false ? 'selected' : ''}>✅ Activa</option>
              <option value="false" ${ruta?.activa === false ? 'selected' : ''}>⏸ Inactiva</option>
            </select>
          </div>
        </div>

        <!-- ── CONDUCTOR / REPARTIDOR ── -->
        <div class="form-section-title" style="font-weight:700;color:var(--primary);font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;margin:1.25rem 0 .75rem;padding-bottom:.35rem;border-bottom:2px solid var(--primary-100)">🚚 Conductor Asignado</div>

        <!-- Tabs selector -->
        <div style="display:flex;gap:.5rem;margin-bottom:1rem">
          <button type="button" class="btn btn--primary btn--sm" id="tab-seleccionar" onclick="SuperAdmin._switchRepTab('seleccionar')">
            Seleccionar existente
          </button>
          <button type="button" class="btn btn--outline btn--sm" id="tab-nuevo" onclick="SuperAdmin._switchRepTab('nuevo')">
            ➕ Crear nuevo conductor
          </button>
        </div>

        <!-- Tab A: Seleccionar existente -->
        <div id="rep-tab-seleccionar">
          <div class="form-group">
            <label>Repartidor *</label>
            <select id="ruta-rep">
              <option value="">— Seleccionar repartidor —</option>
              ${repartidores.map(r => `<option value="${r.id}" ${ruta?.repartidorId === r.id ? 'selected' : ''}>${Utils.esc(r.nombre + ' ' + (r.apellidos || ''))} · ${Utils.esc(r.matricula || 'Sin matrícula')} · ${Utils.esc(r.email)}</option>`).join('')}
            </select>
            <span class="field-error" id="ruta-rep-err"></span>
            ${repartidores.length === 0 ? '<p style="font-size:.8rem;color:var(--warning);margin-top:.35rem">⚠️ No hay conductores registrados. Usa la pestaña <strong>"Crear nuevo conductor"</strong>.</p>' : ''}
          </div>
        </div>

        <!-- Tab B: Crear nuevo conductor -->
        <div id="rep-tab-nuevo" style="display:none">
          <div class="alert alert--info mb-3" style="font-size:.85rem">
            Se creará una cuenta de acceso para el conductor con los datos introducidos.
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" id="new-rep-nombre" placeholder="Nombre">
              <span class="field-error" id="new-rep-nombre-err"></span>
            </div>
            <div class="form-group">
              <label>Apellidos *</label>
              <input type="text" id="new-rep-apellidos" placeholder="Apellidos">
              <span class="field-error" id="new-rep-apellidos-err"></span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email (usuario de acceso) *</label>
              <input type="email" id="new-rep-email" placeholder="conductor@empresa.es">
              <span class="field-error" id="new-rep-email-err"></span>
            </div>
            <div class="form-group">
              <label>Contraseña inicial *</label>
              <div class="input-wrapper">
                <input type="password" id="new-rep-pass" placeholder="Mín. 8 caracteres">
                <button type="button" class="toggle-password" data-target="new-rep-pass" tabindex="-1">👁</button>
              </div>
              <span class="form-hint">El conductor podrá cambiarla en su perfil</span>
              <span class="field-error" id="new-rep-pass-err"></span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" id="new-rep-tel" placeholder="6XX XXX XXX">
            </div>
            <div class="form-group">
              <label>Matrícula Furgoneta *</label>
              <input type="text" id="new-rep-matricula" placeholder="Ej: 1234-ABC" style="text-transform:uppercase">
              <span class="field-error" id="new-rep-matricula-err"></span>
            </div>
          </div>
        </div>

      </form>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: rutaId ? '💾 Guardar Cambios' : '✅ Crear Ruta', cls: 'btn--primary', action: () => this.saveRuta(rutaId) }
    ], 'modal--lg');

    // Si no hay repartidores existentes, ir directamente a "Crear nuevo"
    if (!repartidores.length && !rutaId) {
      setTimeout(() => this._switchRepTab('nuevo'), 50);
    }

    // Bind toggle-password dentro del modal
    setTimeout(() => {
      document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const inp = document.getElementById(btn.dataset.target);
          if (inp) { inp.type = inp.type === 'password' ? 'text' : 'password'; btn.textContent = inp.type === 'password' ? '👁' : '🙈'; }
        });
      });
    }, 50);
  },

  _switchRepTab(tab) {
    const isNuevo = tab === 'nuevo';
    document.getElementById('rep-tab-seleccionar').style.display = isNuevo ? 'none' : '';
    document.getElementById('rep-tab-nuevo').style.display = isNuevo ? '' : 'none';
    document.getElementById('tab-seleccionar').className = isNuevo ? 'btn btn--outline btn--sm' : 'btn btn--primary btn--sm';
    document.getElementById('tab-nuevo').className = isNuevo ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm';
  },

  async saveRuta(rutaId) {
    const nombre   = Utils.sanitize(document.getElementById('ruta-nombre').value);
    const desc     = Utils.sanitize(document.getElementById('ruta-desc').value);
    const hora     = document.getElementById('ruta-hora').value;
    const activa   = document.getElementById('ruta-activa').value === 'true';

    // Detectar tab activo
    const modoNuevo = document.getElementById('rep-tab-nuevo')?.style.display !== 'none';

    // ── Validaciones comunes ──
    let valid = true;
    if (!nombre) {
      document.getElementById('ruta-nombre-err').textContent = 'El nombre es obligatorio';
      valid = false;
    } else {
      document.getElementById('ruta-nombre-err').textContent = '';
    }

    let finalRepId = null;

    if (!modoNuevo) {
      // ── Modo: seleccionar existente ──
      finalRepId = document.getElementById('ruta-rep').value;
      if (!finalRepId) {
        document.getElementById('ruta-rep-err').textContent = 'Selecciona un repartidor';
        valid = false;
      } else {
        document.getElementById('ruta-rep-err').textContent = '';
      }
      if (!valid) return;

    } else {
      // ── Modo: crear nuevo conductor ──
      const repNombre    = Utils.sanitize(document.getElementById('new-rep-nombre').value);
      const repApellidos = Utils.sanitize(document.getElementById('new-rep-apellidos').value);
      const repEmail     = document.getElementById('new-rep-email').value.trim().toLowerCase();
      const repPass      = document.getElementById('new-rep-pass').value;
      const repTel       = Utils.sanitize(document.getElementById('new-rep-tel').value);
      const repMatricula = Utils.sanitize(document.getElementById('new-rep-matricula').value).toUpperCase();

      // Validar campos del conductor
      if (!repNombre)    { document.getElementById('new-rep-nombre-err').textContent    = 'Nombre obligatorio';    valid = false; }
      else               { document.getElementById('new-rep-nombre-err').textContent    = ''; }
      if (!repApellidos) { document.getElementById('new-rep-apellidos-err').textContent = 'Apellidos obligatorios';valid = false; }
      else               { document.getElementById('new-rep-apellidos-err').textContent = ''; }
      if (!repEmail || !Utils.isValidEmail(repEmail)) {
        document.getElementById('new-rep-email-err').textContent = 'Email válido obligatorio'; valid = false;
      } else if (DB.findOne('users', u => u.email === repEmail)) {
        document.getElementById('new-rep-email-err').textContent = 'Ese email ya está registrado'; valid = false;
      } else {
        document.getElementById('new-rep-email-err').textContent = '';
      }
      if (!repPass || repPass.length < 8) {
        document.getElementById('new-rep-pass-err').textContent = 'Mínimo 8 caracteres'; valid = false;
      } else {
        document.getElementById('new-rep-pass-err').textContent = '';
      }
      if (!repMatricula) { document.getElementById('new-rep-matricula-err').textContent = 'Matrícula obligatoria'; valid = false; }
      else               { document.getElementById('new-rep-matricula-err').textContent = ''; }
      if (!valid) return;

      // Crear usuario repartidor
      const salt = Utils.generateSalt();
      const hash = await Utils.hashPassword(repPass, salt);
      const newUser = DB.insert('users', {
        rol: 'repartidor',
        email: repEmail,
        nombre: repNombre,
        apellidos: repApellidos,
        telefono: repTel,
        matricula: repMatricula,
        passwordHash: hash,
        passwordSalt: salt,
        activo: true,
        mfaEnabled: false,
        loginAttempts: 0,
        creadoEn: Utils.now(),
        consentimientoRGPD: true,
        consentimientoFecha: Utils.now()
      });
      finalRepId = newUser.id;
      Audit.log('CREAR_USUARIO', 'user', newUser.id, { email: repEmail, rol: 'repartidor' });
    }

    // ── Guardar Ruta ──
    if (rutaId) {
      const old = DB.findById('rutas', rutaId);
      DB.update('rutas', rutaId, { nombre, descripcion: desc, repartidorId: finalRepId, horaLimitePedido: hora, activa });
      if (old.repartidorId && old.repartidorId !== finalRepId) {
        DB.update('users', old.repartidorId, { rutaId: null });
      }
      DB.update('users', finalRepId, { rutaId });
      Audit.log('EDITAR_RUTA', 'ruta', rutaId, { nombre });
      Toast.success('Ruta actualizada correctamente');
    } else {
      const ruta = DB.insert('rutas', { nombre, descripcion: desc, repartidorId: finalRepId, horaLimitePedido: hora, activa: true });
      DB.update('users', finalRepId, { rutaId: ruta.id });
      Audit.log('CREAR_RUTA', 'ruta', ruta.id, { nombre });
      Toast.success(modoNuevo ? '✅ Ruta y conductor creados correctamente' : '✅ Ruta creada correctamente');
    }

    Modal.hide();
    Router.go('/admin/rutas');
  },

  toggleRuta(rutaId) {
    const ruta = DB.findById('rutas', rutaId);
    if (!ruta) return;
    DB.update('rutas', rutaId, { activa: !ruta.activa });
    Audit.log('EDITAR_RUTA', 'ruta', rutaId, { activa: !ruta.activa });
    Toast.success(ruta.activa ? 'Ruta desactivada' : 'Ruta activada');
    Router.go('/admin/rutas');
  },

  // DOBLE CONFIRMACIÓN para eliminar ruta
  confirmDeleteRuta(rutaId) {
    const ruta = DB.findById('rutas', rutaId);
    if (!ruta) return;
    const clientes = DB.count('clientes', c => c.rutaId === rutaId);
    const pedidos = DB.count('pedidos', p => p.rutaId === rutaId);

    Modal.show('⚠️ Confirmar Eliminación de Ruta', `
      <div class="alert alert--warning">
        <strong>¡Atención!</strong> Estás a punto de eliminar la ruta <strong>${Utils.esc(ruta.nombre)}</strong>.
        <br><br>
        Esta ruta tiene <strong>${clientes} cliente(s)</strong> y <strong>${pedidos} pedido(s)</strong> asociados.
        Esta acción <strong>no se puede deshacer</strong>.
      </div>
      <div class="form-group mt-4">
        <label>Para confirmar, escribe el nombre exacto de la ruta:</label>
        <input type="text" id="confirm-ruta-name" placeholder="${Utils.esc(ruta.nombre)}" class="mt-2">
        <span class="field-error" id="confirm-ruta-err"></span>
      </div>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      {
        text: '🗑️ Eliminar Definitivamente', cls: 'btn--error',
        action: () => {
          const input = document.getElementById('confirm-ruta-name').value;
          if (input !== ruta.nombre) {
            document.getElementById('confirm-ruta-err').textContent = 'El nombre no coincide. Escríbelo exactamente.';
            return;
          }
          this.deleteRuta(rutaId, ruta.nombre);
        }
      }
    ]);
  },

  deleteRuta(rutaId, nombre) {
    DB.delete('rutas', rutaId);
    DB.find('users', u => u.rutaId === rutaId).forEach(u => DB.update('users', u.id, { rutaId: null }));
    Audit.log('ELIMINAR_RUTA', 'ruta', rutaId, { nombre });
    Modal.hide();
    Toast.success('Ruta eliminada correctamente');
    Router.go('/admin/rutas');
  },

  // ─── USUARIOS ────────────────────────────────────────────
  renderUsuarios() {
    document.getElementById('page-title').textContent = 'Gestión de Usuarios';
    document.getElementById('page-subtitle').textContent = 'Administradores y repartidores del sistema';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" id="btn-nuevo-user">➕ Nuevo Usuario</button>
    `;

    const users = DB.find('users', u => u.rol !== 'cliente');
    const rutas = DB.get('rutas');

    setTimeout(() => {
      document.getElementById('btn-nuevo-user')?.addEventListener('click', () => this.showUserForm());
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <div class="search-input">
            <span class="search-icon">🔍</span>
            <input type="text" id="user-search" placeholder="Buscar por nombre o email..." class="filter-input">
          </div>
          <select id="user-rol-filter" class="filter-select">
            <option value="">Todos los roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="repartidor">Repartidor</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table class="data-table" id="users-table">
            <thead><tr>
              <th>Usuario</th><th>Rol</th><th>Ruta Asignada</th><th>Último Acceso</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${users.map(u => `<tr data-name="${Utils.esc((u.nombre + ' ' + (u.apellidos || '') + ' ' + u.email).toLowerCase())}">
                <td>
                  <div style="display:flex;align-items:center;gap:.75rem">
                    <div class="avatar avatar--${u.rol === 'superadmin' ? 'orange' : 'blue'}">${u.nombre[0]}</div>
                    <div>
                      <div style="font-weight:600">${Utils.esc(u.nombre + ' ' + (u.apellidos || ''))}</div>
                      <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(u.email)}</div>
                    </div>
                  </div>
                </td>
                <td>${Utils.rolBadge(u.rol)}</td>
                <td>${u.rutaId ? `<span style="font-size:.875rem">${Utils.esc(Utils.getRutaNombre(u.rutaId))}</span>` : '<span class="text-muted text-sm">—</span>'}</td>
                <td style="font-size:.8rem">${u.ultimoAcceso ? Utils.formatDate(u.ultimoAcceso, 'datetime') : 'Nunca'}</td>
                <td>${Utils.activeBadge(u.activo)}</td>
                <td class="actions-cell">
                  <button class="btn btn--outline btn--xs" onclick="SuperAdmin.showUserForm('${u.id}')">✏️ Editar</button>
                  <button class="btn btn--${u.activo ? 'warning' : 'success'} btn--xs" onclick="SuperAdmin.toggleUser('${u.id}')">
                    ${u.activo ? '⏸' : '▶'}
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showUserForm(userId = null) {
    const user = userId ? DB.findById('users', userId) : null;
    const rutas = DB.get('rutas');

    Modal.show(user ? 'Editar Usuario' : 'Nuevo Usuario', `
      <form id="user-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="u-nombre" value="${Utils.esc(user?.nombre || '')}" required>
          </div>
          <div class="form-group">
            <label>Apellidos</label>
            <input type="text" id="u-apellidos" value="${Utils.esc(user?.apellidos || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="u-email" value="${Utils.esc(user?.email || '')}" required>
          <span class="field-error" id="u-email-err"></span>
        </div>
        <div class="form-group">
          <label>Rol *</label>
          <select id="u-rol">
            <option value="superadmin" ${user?.rol === 'superadmin' ? 'selected' : ''}>👑 Superadmin</option>
            <option value="repartidor" ${user?.rol === 'repartidor' ? 'selected' : ''}>🚚 Repartidor</option>
          </select>
        </div>
        <div id="rep-fields" style="display:${user?.rol === 'repartidor' || !user ? 'block' : 'none'}">
          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" id="u-tel" value="${Utils.esc(user?.telefono || '')}" placeholder="612345678">
            </div>
            <div class="form-group">
              <label>Matrícula Furgoneta</label>
              <input type="text" id="u-matricula" value="${Utils.esc(user?.matricula || '')}" placeholder="1234-ABC" style="text-transform:uppercase">
            </div>
          </div>
          <div class="form-group">
            <label>Ruta Asignada</label>
            <select id="u-ruta">
              <option value="">— Sin ruta asignada —</option>
              ${rutas.map(r => `<option value="${r.id}" ${user?.rutaId === r.id ? 'selected' : ''}>${Utils.esc(r.nombre)}</option>`).join('')}
            </select>
          </div>
        </div>
        ${!userId ? `
        <div class="form-row">
          <div class="form-group">
            <label>Contraseña *</label>
            <div class="input-wrapper">
              <input type="password" id="u-pass" placeholder="Mín. 8 caracteres" required>
              <button type="button" class="toggle-password" data-target="u-pass">👁</button>
            </div>
            <span class="field-error" id="u-pass-err"></span>
          </div>
          <div class="form-group">
            <label>Confirmar Contraseña *</label>
            <div class="input-wrapper">
              <input type="password" id="u-pass2" placeholder="Repite la contraseña" required>
              <button type="button" class="toggle-password" data-target="u-pass2">👁</button>
            </div>
          </div>
        </div>` : ''}
      </form>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: userId ? '💾 Guardar' : '✅ Crear', cls: 'btn--primary', action: () => this.saveUser(userId) }
    ]);

    // Mostrar/ocultar campos de repartidor
    setTimeout(() => {
      document.getElementById('u-rol')?.addEventListener('change', (e) => {
        document.getElementById('rep-fields').style.display = e.target.value === 'repartidor' ? 'block' : 'none';
      });
      // Toggle passwords
      document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = document.getElementById(btn.dataset.target);
          if (input) { input.type = input.type === 'password' ? 'text' : 'password'; btn.textContent = input.type === 'password' ? '👁' : '🙈'; }
        });
      });
    }, 0);
  },

  async saveUser(userId) {
    const nombre = Utils.sanitize(document.getElementById('u-nombre').value);
    const apellidos = Utils.sanitize(document.getElementById('u-apellidos').value);
    const email = document.getElementById('u-email').value.trim().toLowerCase();
    const rol = document.getElementById('u-rol').value;
    const tel = Utils.sanitize(document.getElementById('u-tel')?.value || '');
    const matricula = Utils.sanitize(document.getElementById('u-matricula')?.value || '').toUpperCase();
    const rutaId = document.getElementById('u-ruta')?.value || null;

    let valid = true;
    if (!nombre) { Toast.error('El nombre es obligatorio'); valid = false; }
    if (!Utils.isValidEmail(email)) { document.getElementById('u-email-err').textContent = 'Email inválido'; valid = false; }
    else document.getElementById('u-email-err').textContent = '';
    if (!valid) return;

    if (!userId) {
      const pass = document.getElementById('u-pass')?.value;
      const pass2 = document.getElementById('u-pass2')?.value;
      if (!Utils.isValidPassword(pass)) { document.getElementById('u-pass-err').textContent = 'Mín. 8 chars, 1 mayúscula, 1 número'; return; }
      if (pass !== pass2) { Toast.error('Las contraseñas no coinciden'); return; }
      if (DB.findOne('users', u => u.email === email)) { document.getElementById('u-email-err').textContent = 'Ya existe un usuario con ese email'; return; }

      const salt = Utils.generateSalt();
      const hash = await Utils.hashPassword(pass, salt);
      const u = DB.insert('users', {
        nombre, apellidos, email, rol,
        passwordHash: hash, passwordSalt: salt,
        telefono: tel, matricula, rutaId: rutaId || null,
        mfaEnabled: false, mfaSecret: null,
        activo: true, loginAttempts: 0, lockedUntil: null,
        consentimientoRGPD: true, consentimientoFecha: Utils.now()
      });
      if (rutaId) DB.update('rutas', rutaId, { repartidorId: u.id });
      Audit.log('CREAR_USUARIO', 'user', u.id, { email, rol });
      Toast.success('Usuario creado correctamente');
    } else {
      const existEmail = DB.findOne('users', u => u.email === email && u.id !== userId);
      if (existEmail) { document.getElementById('u-email-err').textContent = 'Ya existe un usuario con ese email'; return; }
      const old = DB.findById('users', userId);
      DB.update('users', userId, { nombre, apellidos, email, rol, telefono: tel, matricula, rutaId: rutaId || null });
      if (rutaId && rutaId !== old.rutaId) {
        if (old.rutaId) DB.update('rutas', old.rutaId, { repartidorId: null });
        DB.update('rutas', rutaId, { repartidorId: userId });
      }
      Audit.log('EDITAR_USUARIO', 'user', userId, { email, rol });
      Toast.success('Usuario actualizado');
    }
    Modal.hide();
    Router.go('/admin/usuarios');
  },

  toggleUser(userId) {
    const u = DB.findById('users', userId);
    if (!u) return;
    DB.update('users', userId, { activo: !u.activo });
    Audit.log('EDITAR_USUARIO', 'user', userId, { activo: !u.activo });
    Toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
    Router.go('/admin/usuarios');
  },

  // ─── CLIENTES (vista admin) ──────────────────────────────
  renderClientes() {
    document.getElementById('page-title').textContent = 'Gestión de Clientes';
    document.getElementById('page-subtitle').textContent = 'Todos los clientes del sistema';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" onclick="SuperAdmin.showGenerarQRModal()">📲 Generar QR / Enlace Cliente</button>
    `;

    const clientes = DB.get('clientes');
    const rutas = DB.get('rutas');

    // Adjuntar listeners de filtros tras renderizar el DOM
    setTimeout(() => {
      const searchEl  = document.getElementById('cli-search');
      const estadoEl  = document.getElementById('cli-estado-filter');
      const rutaEl    = document.getElementById('cli-ruta-filter');

      const applyFilters = () => {
        const search = (searchEl?.value || '').toLowerCase().trim();
        const estado = estadoEl?.value || '';
        const rutaId = rutaEl?.value || '';

        document.querySelectorAll('#clientes-table tbody tr').forEach(row => {
          const nameMatch  = !search || (row.dataset.name || '').includes(search);
          const estadoMatch = !estado || row.dataset.estado === estado;
          const rutaMatch   = !rutaId  || row.dataset.ruta  === rutaId;
          row.style.display = (nameMatch && estadoMatch && rutaMatch) ? '' : 'none';
        });
      };

      searchEl?.addEventListener('input', applyFilters);
      estadoEl?.addEventListener('change', applyFilters);
      rutaEl?.addEventListener('change', applyFilters);
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <div class="search-input" style="flex:1">
            <span class="search-icon">🔍</span>
            <input type="text" id="cli-search" placeholder="Buscar cliente..." class="filter-input">
          </div>
          <select id="cli-estado-filter" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="pendiente">Pendientes</option>
            <option value="bloqueado">Bloqueados</option>
            <option value="baja">Baja</option>
          </select>
          <select id="cli-ruta-filter" class="filter-select">
            <option value="">Todas las rutas</option>
            ${rutas.map(r => `<option value="${r.id}">${Utils.esc(r.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="table-wrapper">
          <table class="data-table" id="clientes-table">
            <thead><tr>
              <th>Negocio</th><th>Contacto</th><th>Localidad</th><th>Ruta</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${clientes.length ? clientes.map(c => `
              <tr data-estado="${c.estado}" data-ruta="${c.rutaId || ''}"
                  data-name="${Utils.esc((c.nombreNegocio + ' ' + c.personaContacto + ' ' + c.localidad).toLowerCase())}">
                <td>
                  <div style="font-weight:600">${Utils.esc(c.nombreNegocio)}</div>
                  <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(c.nifCif)}</div>
                </td>
                <td>
                  <div style="font-size:.875rem">${Utils.esc(c.personaContacto)}</div>
                  <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(c.telefono)}</div>
                </td>
                <td>${Utils.esc(c.localidad)}</td>
                <td><span style="font-size:.8rem">${Utils.esc(Utils.getRutaNombre(c.rutaId))}</span></td>
                <td>${Utils.clienteEstadoBadge(c.estado)}</td>
                <td class="actions-cell">
                  <button class="btn btn--outline btn--xs" onclick="SuperAdmin.showClienteDetalle('${c.id}')">👁 Ver</button>
                  ${c.estado === 'pendiente' ? `<button class="btn btn--success btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','activo')">✅ Aprobar</button>` : ''}
                  ${c.estado === 'activo' ? `<button class="btn btn--warning btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','bloqueado')">🚫 Bloquear</button>` : ''}
                  ${c.estado === 'bloqueado' ? `<button class="btn btn--success btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','activo')">✅ Activar</button>` : ''}
                  ${['activo','bloqueado'].includes(c.estado) ? `<button class="btn btn--error btn--xs" onclick="SuperAdmin.cambiarEstadoCliente('${c.id}','baja')">⬇ Baja</button>` : ''}
                </td>
              </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">No hay clientes</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showClienteDetalle(clienteId) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    const user = DB.findById('users', c.usuarioId);
    const pedidos = DB.find('pedidos', p => p.clienteId === clienteId);

    Modal.show(`🏪 ${Utils.esc(c.nombreNegocio)}`, `
      <div class="detail-grid mb-4">
        <div class="detail-item"><label>Negocio</label><p>${Utils.esc(c.nombreNegocio)}</p></div>
        <div class="detail-item"><label>Contacto</label><p>${Utils.esc(c.personaContacto)}</p></div>
        <div class="detail-item"><label>NIF/CIF</label><p>${Utils.esc(c.nifCif)}</p></div>
        <div class="detail-item"><label>Teléfono</label><p>${Utils.esc(c.telefono)}</p></div>
        <div class="detail-item"><label>Email</label><p>${Utils.esc(c.email)}</p></div>
        <div class="detail-item"><label>Estado</label><p>${Utils.clienteEstadoBadge(c.estado)}</p></div>
        <div class="detail-item"><label>Ruta</label><p>${Utils.esc(Utils.getRutaNombre(c.rutaId))}</p></div>
        <div class="detail-item"><label>Alta</label><p>${Utils.formatDate(c.creadoEn, 'datetime')}</p></div>
      </div>
      <div class="detail-item mb-3"><label>Dirección</label><p>${Utils.esc(c.direccion)}, ${Utils.esc(c.localidad)} ${Utils.esc(c.codigoPostal)}</p></div>
      ${c.observacionesEntrega ? `<div class="detail-item mb-3"><label>Observaciones de Entrega</label><p>${Utils.esc(c.observacionesEntrega)}</p></div>` : ''}
      <hr class="divider">
      <div style="font-weight:600;margin-bottom:.75rem">📋 Últimos Pedidos (${pedidos.length})</div>
      ${pedidos.slice(-5).reverse().map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid var(--border-light);font-size:.875rem">
          <span>${Utils.formatDate(p.fecha)}</span>
          <span>${Utils.formatCurrency(p.total)}</span>
          ${Utils.statusBadge(p.estado)}
        </div>
      `).join('') || '<p class="text-muted text-sm">Sin pedidos</p>'}
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      c.estado === 'pendiente' ? { text: '✅ Aprobar', cls: 'btn--success', action: () => { this.cambiarEstadoCliente(clienteId, 'activo'); Modal.hide(); } } : null,
      c.estado === 'activo' ? { text: '🚫 Bloquear', cls: 'btn--warning', action: () => { this.cambiarEstadoCliente(clienteId, 'bloqueado'); Modal.hide(); } } : null,
    ].filter(Boolean), 'modal--lg');
  },

  cambiarEstadoCliente(clienteId, nuevoEstado) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    DB.update('clientes', clienteId, { estado: nuevoEstado });
    if (c.usuarioId) DB.update('users', c.usuarioId, { activo: nuevoEstado === 'activo' });

    const labels = { activo: 'aprobado', bloqueado: 'bloqueado', baja: 'dado de baja', pendiente: 'vuelto a pendiente' };
    Audit.log('APROBAR_CLIENTE', 'cliente', clienteId, { estado: nuevoEstado, nombreNegocio: c.nombreNegocio });
    Toast.success(`Cliente ${labels[nuevoEstado] || nuevoEstado}`);
    Router.go('/admin/clientes');
  },

  generarQRParaRuta(rutaId) {
    const session = Auth.getSession();
    if (!session) return;
    const inv = Auth.createInvitation(rutaId, session.userId);
    Repartidor.showQRModal(inv.token);
  },

  showGenerarQRModal() {
    const rutas = DB.find('rutas', r => r.activa);
    if (!rutas.length) { Toast.warning('Debes crear primero al menos una ruta activa'); return; }

    Modal.show('📱 Generar QR / Enlace de Registro', `
      <div class="form-group mb-3">
        <label>Seleccionar Ruta para el Cliente *</label>
        <select id="qr-select-ruta" class="filter-select" style="width:100%">
          ${rutas.map(r => `<option value="${r.id}">${Utils.esc(r.nombre)}</option>`).join('')}
        </select>
        <span class="form-hint">El cliente quedará vinculado automáticamente a la ruta seleccionada</span>
      </div>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '⚡ Generar QR y Enlace', cls: 'btn--primary', action: () => {
        const rutaId = document.getElementById('qr-select-ruta')?.value;
        const session = Auth.getSession();
        if (!rutaId || !session) return;
        Modal.hide();
        const inv = Auth.createInvitation(rutaId, session.userId);
        Repartidor.showQRModal(inv.token);
      }}
    ]);
  },

  // ─── PRODUCTOS ───────────────────────────────────────────
  renderProductos() {
    document.getElementById('page-title').textContent = 'Catálogo de Productos';
    document.getElementById('page-subtitle').textContent = 'Productos y categorías del sistema';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--outline btn--sm" id="btn-nueva-cat">🏷️ Nueva Categoría</button>
      <button class="btn btn--primary btn--sm" id="btn-nuevo-prod">➕ Nuevo Producto</button>
    `;

    const categorias = DB.get('categorias');
    const productos = DB.get('productos');

    setTimeout(() => {
      document.getElementById('btn-nueva-cat')?.addEventListener('click', () => this.showCatForm());
      document.getElementById('btn-nuevo-prod')?.addEventListener('click', () => this.showProductoForm());
    }, 0);

    return `
      <div class="tab-nav">
        <button class="tab-btn active" data-tab="tab-productos">📦 Productos (${productos.length})</button>
        <button class="tab-btn" data-tab="tab-categorias">🏷️ Categorías (${categorias.length})</button>
      </div>

      <div id="tab-productos" class="tab-content active">
        <div class="card">
          <div class="filters-bar">
            <div class="search-input" style="flex:1">
              <span class="search-icon">🔍</span>
              <input type="text" id="prod-search" placeholder="Buscar producto...">
            </div>
            <select id="prod-cat-filter" class="filter-select">
              <option value="">Todas las categorías</option>
              ${categorias.map(c => `<option value="${c.id}">${Utils.esc(c.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="table-wrapper">
            <table class="data-table" id="prod-table">
              <thead><tr><th>Nombre</th><th>Categoría</th><th>Formato</th><th>Precio Base</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${productos.map(p => `
                <tr data-cat="${p.categoriaId}" data-name="${Utils.esc(p.nombre.toLowerCase())}">
                  <td>
                    <div style="font-weight:600">${Utils.esc(p.nombre)}</div>
                    <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(p.descripcion?.slice(0, 60) || '')}</div>
                  </td>
                  <td>${Utils.esc(Utils.getCategoriaNombre(p.categoriaId))}</td>
                  <td>${Utils.esc(p.formato)} / ${Utils.esc(p.unidadVenta)}</td>
                  <td><strong>${Utils.formatCurrency(p.precioBase)}</strong></td>
                  <td>${Utils.activeBadge(p.activo)}</td>
                  <td class="actions-cell">
                    <button class="btn btn--outline btn--xs" onclick="SuperAdmin.showProductoForm('${p.id}')">✏️</button>
                    <button class="btn btn--${p.activo ? 'warning' : 'success'} btn--xs" onclick="SuperAdmin.toggleProducto('${p.id}')">
                      ${p.activo ? '⏸' : '▶'}
                    </button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="tab-categorias" class="tab-content">
        <div class="grid-auto">
          ${categorias.map(c => {
            const count = DB.count('productos', p => p.categoriaId === c.id);
            return `
            <div class="card">
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div style="font-weight:700;font-size:1rem">${Utils.esc(c.nombre)}</div>
                    <div style="font-size:.8rem;color:var(--muted);margin-top:.25rem">${Utils.esc(c.descripcion || '')}</div>
                    <div style="margin-top:.75rem"><span class="badge badge--primary">${count} productos</span></div>
                  </div>
                  <div style="display:flex;gap:.5rem">
                    <button class="btn btn--outline btn--xs" onclick="SuperAdmin.showCatForm('${c.id}')">✏️</button>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  showCatForm(catId = null) {
    const cat = catId ? DB.findById('categorias', catId) : null;
    Modal.show(cat ? 'Editar Categoría' : 'Nueva Categoría', `
      <form id="cat-form">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="cat-nombre" value="${Utils.esc(cat?.nombre || '')}" required>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="cat-desc">${Utils.esc(cat?.descripcion || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Orden</label>
          <input type="number" id="cat-orden" value="${cat?.orden || 1}" min="1">
        </div>
      </form>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: catId ? '💾 Guardar' : '✅ Crear', cls: 'btn--primary', action: () => {
        const nombre = Utils.sanitize(document.getElementById('cat-nombre').value);
        if (!nombre) { Toast.error('El nombre es obligatorio'); return; }
        const desc = Utils.sanitize(document.getElementById('cat-desc').value);
        const orden = parseInt(document.getElementById('cat-orden').value) || 1;
        if (catId) {
          DB.update('categorias', catId, { nombre, descripcion: desc, orden });
          Toast.success('Categoría actualizada');
        } else {
          DB.insert('categorias', { nombre, descripcion: desc, orden });
          Toast.success('Categoría creada');
        }
        Modal.hide();
        Router.go('/admin/productos');
      }}
    ]);
  },

  showProductoForm(prodId = null) {
    const prod = prodId ? DB.findById('productos', prodId) : null;
    const categorias = DB.get('categorias');
    Modal.show(prod ? 'Editar Producto' : 'Nuevo Producto', `
      <form id="prod-form">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="p-nombre" value="${Utils.esc(prod?.nombre || '')}" required>
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select id="p-cat">
            <option value="">— Seleccionar —</option>
            ${categorias.map(c => `<option value="${c.id}" ${prod?.categoriaId === c.id ? 'selected' : ''}>${Utils.esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="p-desc">${Utils.esc(prod?.descripcion || '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Formato</label>
            <input type="text" id="p-formato" value="${Utils.esc(prod?.formato || '')}" placeholder="Ej: Por kilogramo, Unidad...">
          </div>
          <div class="form-group">
            <label>Unidad de Venta</label>
            <select id="p-unidad">
              <option value="kg" ${prod?.unidadVenta === 'kg' ? 'selected' : ''}>Kilogramo (kg)</option>
              <option value="ud" ${prod?.unidadVenta === 'ud' ? 'selected' : ''}>Unidad (ud)</option>
              <option value="caja" ${prod?.unidadVenta === 'caja' ? 'selected' : ''}>Caja</option>
              <option value="bandeja" ${prod?.unidadVenta === 'bandeja' ? 'selected' : ''}>Bandeja</option>
              <option value="lote" ${prod?.unidadVenta === 'lote' ? 'selected' : ''}>Lote</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Precio Base (€) *</label>
          <input type="number" id="p-precio" value="${prod?.precioBase || ''}" step="0.01" min="0" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="p-activo">
            <option value="true" ${prod?.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${prod?.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </form>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: prodId ? '💾 Guardar' : '✅ Crear', cls: 'btn--primary', action: () => {
        const nombre = Utils.sanitize(document.getElementById('p-nombre').value);
        const catId = document.getElementById('p-cat').value;
        const precio = parseFloat(document.getElementById('p-precio').value);
        if (!nombre) { Toast.error('El nombre es obligatorio'); return; }
        if (!catId) { Toast.error('Selecciona una categoría'); return; }
        if (!precio || precio < 0) { Toast.error('El precio debe ser mayor que 0'); return; }
        const data = {
          nombre,
          categoriaId: catId,
          descripcion: Utils.sanitize(document.getElementById('p-desc').value),
          formato: Utils.sanitize(document.getElementById('p-formato').value),
          unidadVenta: document.getElementById('p-unidad').value,
          precioBase: precio,
          activo: document.getElementById('p-activo').value === 'true'
        };
        if (prodId) {
          DB.update('productos', prodId, data);
          Audit.log('EDITAR_PRODUCTO', 'producto', prodId, { nombre, precio });
          Toast.success('Producto actualizado');
        } else {
          const p = DB.insert('productos', { ...data });
          Audit.log('CREAR_PRODUCTO', 'producto', p.id, { nombre });
          Toast.success('Producto creado');
        }
        Modal.hide();
        Router.go('/admin/productos');
      }}
    ]);
  },

  toggleProducto(prodId) {
    const p = DB.findById('productos', prodId);
    if (!p) return;
    DB.update('productos', prodId, { activo: !p.activo });
    Toast.success(p.activo ? 'Producto desactivado' : 'Producto activado');
    Router.go('/admin/productos');
  },

  // ─── PEDIDOS (vista admin) ────────────────────────────────
  renderPedidos() {
    document.getElementById('page-title').textContent = 'Todos los Pedidos';
    document.getElementById('page-subtitle').textContent = 'Gestión global de pedidos';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--outline btn--sm" id="btn-export-ped">📥 Exportar CSV</button>
    `;

    const pedidos = DB.get('pedidos').sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    const rutas = DB.get('rutas');

    setTimeout(() => {
      // Filtros
      const search = document.getElementById('ped-search');
      const estadoSel = document.getElementById('ped-estado-filter');
      const rutaSel = document.getElementById('ped-ruta-filter');
      const fechaSel = document.getElementById('ped-fecha-filter');
      const apply = () => {
        const s = search?.value.toLowerCase() || '';
        const e = estadoSel?.value || '';
        const r = rutaSel?.value || '';
        const f = fechaSel?.value || '';
        document.querySelectorAll('#ped-table tbody tr').forEach(row => {
          const name = row.dataset.name || '';
          const estado = row.dataset.estado || '';
          const ruta = row.dataset.ruta || '';
          const fecha = row.dataset.fecha || '';
          const show = (!s || name.includes(s)) && (!e || estado === e) && (!r || ruta === r) && (!f || fecha === f);
          row.style.display = show ? '' : 'none';
        });
      };
      [search, estadoSel, rutaSel, fechaSel].forEach(el => el?.addEventListener('input', apply));
      document.getElementById('btn-export-ped')?.addEventListener('click', () => {
        const data = pedidos.map(p => {
          const cli = DB.findById('clientes', p.clienteId);
          return { Fecha: p.fecha, Cliente: cli?.nombreNegocio || '', Ruta: Utils.getRutaNombre(p.rutaId), Estado: p.estado, Total: p.total, Observaciones: p.observaciones || '' };
        });
        Utils.exportCSV(data, 'pedidos_' + Utils.today());
      });
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <div class="search-input" style="flex:1">
            <span class="search-icon">🔍</span>
            <input type="text" id="ped-search" placeholder="Buscar cliente...">
          </div>
          <select id="ped-estado-filter" class="filter-select">
            <option value="">Todos los estados</option>
            ${['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado','cancelado','incidencia'].map(e =>
              `<option value="${e}">${e.replace('_', ' ')}</option>`
            ).join('')}
          </select>
          <select id="ped-ruta-filter" class="filter-select">
            <option value="">Todas las rutas</option>
            ${rutas.map(r => `<option value="${r.id}">${Utils.esc(r.nombre)}</option>`).join('')}
          </select>
          <input type="date" id="ped-fecha-filter" value="${Utils.today()}" class="filter-select" style="min-width:140px">
        </div>
        <div class="table-wrapper">
          <table class="data-table" id="ped-table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Ruta</th><th>Líneas</th><th>Total</th><th>Estado</th><th>Acc.</th></tr></thead>
            <tbody>
              ${pedidos.map(p => {
                const cli = DB.findById('clientes', p.clienteId);
                return `<tr data-estado="${p.estado}" data-ruta="${p.rutaId}" data-fecha="${p.fecha}"
                          data-name="${Utils.esc((cli?.nombreNegocio || '').toLowerCase())}">
                  <td style="font-size:.875rem">${Utils.formatDate(p.fecha)}</td>
                  <td><div style="font-weight:600;font-size:.875rem">${Utils.esc(cli?.nombreNegocio || '—')}</div></td>
                  <td style="font-size:.8rem">${Utils.esc(Utils.getRutaNombre(p.rutaId))}</td>
                  <td style="font-size:.8rem">${(p.lineas || []).length} líneas</td>
                  <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                  <td>${Utils.statusBadge(p.estado)}</td>
                  <td><button class="btn btn--outline btn--xs" onclick="SuperAdmin.showPedidoDetalle('${p.id}')">Ver</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showPedidoDetalle(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = DB.findById('clientes', p.clienteId);
    const estados = ['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado','cancelado','incidencia'];
    const session = Auth.getSession();

    Modal.show(`📋 Pedido — ${cli?.nombreNegocio || ''}`, `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;gap:1rem;flex-wrap:wrap">
        <div>
          <div style="font-size:.8rem;color:var(--muted);font-weight:600">PEDIDO</div>
          <div style="font-size:.75rem;color:var(--muted)">${p.id}</div>
        </div>
        <div style="text-align:right">
          <div>${Utils.statusBadge(p.estado)}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-top:.25rem">${Utils.formatDate(p.creadoEn, 'datetime')}</div>
        </div>
      </div>

      <div class="detail-grid mb-4">
        <div class="detail-item"><label>Cliente</label><p>${Utils.esc(cli?.nombreNegocio || '—')}</p></div>
        <div class="detail-item"><label>Fecha</label><p>${Utils.formatDate(p.fecha)}</p></div>
        <div class="detail-item"><label>Ruta</label><p>${Utils.esc(Utils.getRutaNombre(p.rutaId))}</p></div>
        <div class="detail-item"><label>Total</label><p style="font-weight:700;color:var(--primary);font-size:1.1rem">${Utils.formatCurrency(p.total)}</p></div>
      </div>

      ${p.observaciones ? `<div class="alert alert--info mb-3">💬 ${Utils.esc(p.observaciones)}</div>` : ''}

      <table class="data-table mb-4">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${(p.lineas || []).map(l => `<tr>
            <td>${Utils.esc(l.nombre || Utils.getProductoNombre(l.productoId))}</td>
            <td>${Utils.formatNumber(l.cantidad, 0)} ${Utils.esc(l.unidadVenta || '')}</td>
            <td>${Utils.formatCurrency(l.precioUnitario)}</td>
            <td><strong>${Utils.formatCurrency(l.subtotal)}</strong></td>
          </tr>`).join('')}
          <tr class="summary-total-row"><td colspan="3"><strong>Total</strong></td><td><strong>${Utils.formatCurrency(p.total)}</strong></td></tr>
        </tbody>
      </table>

      <div class="form-group">
        <label>Cambiar Estado</label>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${estados.map(e => `<button class="btn btn--${e === p.estado ? 'primary' : 'outline'} btn--sm" onclick="SuperAdmin.cambiarEstadoPedido('${p.id}','${e}')">${Utils.statusBadge(e)}</button>`).join('')}
        </div>
      </div>

      <div class="mt-4">
        <div style="font-weight:600;font-size:.875rem;margin-bottom:.5rem">📜 Historial de Estados</div>
        ${(p.historialEstados || []).map(h => `
          <div style="display:flex;gap:.75rem;font-size:.8rem;padding:.35rem 0;border-bottom:1px solid var(--border-light)">
            <span style="color:var(--muted)">${Utils.formatDate(h.fecha, 'datetime')}</span>
            ${Utils.statusBadge(h.estado)}
          </div>
        `).join('') || '<p class="text-muted text-sm">Sin historial</p>'}
      </div>
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '🖨 Imprimir', cls: 'btn--secondary btn--sm', action: () => this.printPedido(p.id) }
    ], 'modal--lg');
  },

  cambiarEstadoPedido(pedidoId, nuevoEstado) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const session = Auth.getSession();
    const hist = [...(p.historialEstados || []), { estado: nuevoEstado, fecha: Utils.now(), usuario: session?.userId }];
    DB.update('pedidos', pedidoId, { estado: nuevoEstado, historialEstados: hist });
    Notify.notifyOrderStatus({ ...p, estado: nuevoEstado }, nuevoEstado, session?.userId);
    Audit.log('CAMBIAR_ESTADO_PEDIDO', 'pedido', pedidoId, { estado: nuevoEstado });
    Toast.success(`Estado actualizado: ${nuevoEstado.replace('_', ' ')}`);
    Modal.hide();
    Router.go('/admin/pedidos');
  },

  printPedido(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = DB.findById('clientes', p.clienteId);
    const lineasHtml = (p.lineas || []).map(l => `
      <tr><td>${Utils.esc(l.nombre || Utils.getProductoNombre(l.productoId))}</td>
      <td>${l.cantidad} ${l.unidadVenta || ''}</td>
      <td>${Utils.formatCurrency(l.precioUnitario)}</td>
      <td>${Utils.formatCurrency(l.subtotal)}</td></tr>
    `).join('');
    Utils.printSection(`
      <h1>Pollos Fuentes — Justificante de Pedido</h1>
      <p><strong>Cliente:</strong> ${Utils.esc(cli?.nombreNegocio || '')} | <strong>NIF/CIF:</strong> ${Utils.esc(cli?.nifCif || '')}</p>
      <p><strong>Fecha:</strong> ${Utils.formatDate(p.fecha)} | <strong>Estado:</strong> ${p.estado} | <strong>Ruta:</strong> ${Utils.esc(Utils.getRutaNombre(p.rutaId))}</p>
      ${p.observaciones ? `<p><strong>Observaciones:</strong> ${Utils.esc(p.observaciones)}</p>` : ''}
      <table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>${lineasHtml}</tbody></table>
      <div class="total"><strong>TOTAL: ${Utils.formatCurrency(p.total)}</strong></div>
      <p style="margin-top:16px;font-size:10px;color:#888">Generado el ${Utils.formatDate(new Date(), 'datetime')} · Pollos Fuentes S.L.</p>
    `, 'Justificante de Pedido');
  },

  // ─── INFORMES ────────────────────────────────────────────
  renderInformes() {
    document.getElementById('page-title').textContent = 'Informes y Exportaciones';
    document.getElementById('page-subtitle').textContent = 'Resúmenes diarios, ventas y análisis';
    document.getElementById('header-actions').innerHTML = '';

    const today = Utils.today();
    const pedidos = DB.get('pedidos');
    const todayPedidos = pedidos.filter(p => p.fecha === today);
    const rutas = DB.get('rutas');

    // Resumen por ruta del día
    const rutasSummary = rutas.map(r => {
      const rPedidos = todayPedidos.filter(p => p.rutaId === r.id);
      return {
        ruta: r.nombre,
        pedidos: rPedidos.length,
        total: rPedidos.reduce((s, p) => s + (p.total || 0), 0),
        entregados: rPedidos.filter(p => p.estado === 'entregado').length,
        incidencias: rPedidos.filter(p => p.estado === 'incidencia').length
      };
    });

    // Resumen por producto del día
    const prodCount = {};
    todayPedidos.forEach(p => (p.lineas || []).forEach(l => {
      if (!prodCount[l.productoId]) prodCount[l.productoId] = { nombre: l.nombre || Utils.getProductoNombre(l.productoId), qty: 0, importe: 0 };
      prodCount[l.productoId].qty += l.cantidad || 0;
      prodCount[l.productoId].importe += l.subtotal || 0;
    }));
    const prodSummary = Object.values(prodCount).sort((a, b) => b.qty - a.qty);

    return `
      <div class="tab-nav">
        <button class="tab-btn active" data-tab="tab-resumen-dia">📅 Resumen del Día</button>
        <button class="tab-btn" data-tab="tab-ventas">💶 Análisis de Ventas</button>
        <button class="tab-btn" data-tab="tab-productos-ranking">🏆 Ranking Productos</button>
      </div>

      <div id="tab-resumen-dia" class="tab-content active">
        <div class="section-header">
          <div>
            <div class="section-title">Resumen del ${Utils.formatDate(today, 'full')}</div>
            <div class="section-subtitle">${todayPedidos.length} pedidos · ${Utils.formatCurrency(todayPedidos.reduce((s,p)=>s+(p.total||0),0))} total</div>
          </div>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn--outline btn--sm" onclick="SuperAdmin.exportResumenDia()">📥 CSV</button>
            <button class="btn btn--outline btn--sm" onclick="SuperAdmin.exportResumenDiaExcel()">📊 Excel</button>
            <button class="btn btn--primary btn--sm" onclick="SuperAdmin.printResumenDia()">🖨️ Imprimir</button>
          </div>
        </div>

        <div class="grid-2" style="gap:1.5rem">
          <div class="card">
            <div class="card-header"><h3>📦 Por Ruta</h3></div>
            <div class="table-wrapper">
              <table class="data-table">
                <thead><tr><th>Ruta</th><th>Pedidos</th><th>Entregados</th><th>Incidencias</th><th>Total</th></tr></thead>
                <tbody>
                  ${rutasSummary.map(r => `<tr>
                    <td><strong>${Utils.esc(r.ruta)}</strong></td>
                    <td>${r.pedidos}</td>
                    <td>${r.entregados}</td>
                    <td>${r.incidencias > 0 ? `<span class="text-error font-bold">${r.incidencias}</span>` : '0'}</td>
                    <td><strong>${Utils.formatCurrency(r.total)}</strong></td>
                  </tr>`).join('')}
                  <tr class="summary-total-row">
                    <td><strong>TOTAL</strong></td>
                    <td><strong>${rutasSummary.reduce((s,r)=>s+r.pedidos,0)}</strong></td>
                    <td><strong>${rutasSummary.reduce((s,r)=>s+r.entregados,0)}</strong></td>
                    <td><strong>${rutasSummary.reduce((s,r)=>s+r.incidencias,0)}</strong></td>
                    <td><strong>${Utils.formatCurrency(rutasSummary.reduce((s,r)=>s+r.total,0))}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>📋 Por Productos (Hoy)</h3></div>
            <div class="table-wrapper">
              <table class="data-table">
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr></thead>
                <tbody>
                  ${prodSummary.length ? prodSummary.map(p => `<tr>
                    <td>${Utils.esc(p.nombre)}</td>
                    <td>${Utils.formatNumber(p.qty, 0)}</td>
                    <td>${Utils.formatCurrency(p.importe)}</td>
                  </tr>`).join('') : '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header"><h3>📋 Detalle de Pedidos del Día</h3></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Cliente</th><th>Ruta</th><th>Líneas</th><th>Total</th><th>Estado</th><th>Observaciones</th></tr></thead>
              <tbody>
                ${todayPedidos.map(p => {
                  const cli = DB.findById('clientes', p.clienteId);
                  return `<tr>
                    <td><strong>${Utils.esc(cli?.nombreNegocio || '—')}</strong></td>
                    <td style="font-size:.8rem">${Utils.esc(Utils.getRutaNombre(p.rutaId))}</td>
                    <td style="font-size:.8rem">${(p.lineas||[]).map(l => `${Utils.formatNumber(l.cantidad,0)} × ${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}`).join('<br>')}</td>
                    <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                    <td>${Utils.statusBadge(p.estado)}</td>
                    <td style="font-size:.8rem;color:var(--muted)">${Utils.esc(p.observaciones || '—')}</td>
                  </tr>`;
                }).join('') || '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Sin pedidos hoy</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="tab-ventas" class="tab-content">
        <div class="kpi-grid mb-4">
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--green">💶</div>
            <div class="kpi-info">
              <div class="kpi-value">${Utils.formatCurrency(pedidos.reduce((s,p)=>s+(p.total||0),0))}</div>
              <div class="kpi-label">Ventas Totales</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--orange">🛒</div>
            <div class="kpi-info">
              <div class="kpi-value">${pedidos.length}</div>
              <div class="kpi-label">Total Pedidos</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--blue">📈</div>
            <div class="kpi-info">
              <div class="kpi-value">${Utils.formatCurrency(pedidos.length ? pedidos.reduce((s,p)=>s+(p.total||0),0)/pedidos.length : 0)}</div>
              <div class="kpi-label">Ticket Medio</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--red">❌</div>
            <div class="kpi-info">
              <div class="kpi-value">${DB.count('pedidos', p => p.estado === 'cancelado')}</div>
              <div class="kpi-label">Cancelados</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Exportar Datos de Ventas</h3></div>
          <div class="card-body" style="display:flex;gap:.75rem;flex-wrap:wrap">
            <button class="btn btn--outline" onclick="SuperAdmin.exportAllPedidosCSV()">📥 Todos los pedidos (CSV)</button>
            <button class="btn btn--outline" onclick="SuperAdmin.exportAllPedidosExcel()">📊 Todos los pedidos (Excel)</button>
          </div>
        </div>
      </div>

      <div id="tab-productos-ranking" class="tab-content">
        <div class="card">
          <div class="card-header"><h3>🏆 Ranking de Productos (Todo el Historial)</h3></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Cantidad Total</th><th>Importe Total</th></tr></thead>
              <tbody>
                ${Object.entries((() => {
                  const cnt = {};
                  pedidos.forEach(p => (p.lineas||[]).forEach(l => {
                    if (!cnt[l.productoId]) cnt[l.productoId] = { nombre: l.nombre||Utils.getProductoNombre(l.productoId), catId: (DB.findById('productos',l.productoId)||{}).categoriaId, qty: 0, importe: 0 };
                    cnt[l.productoId].qty += l.cantidad||0;
                    cnt[l.productoId].importe += l.subtotal||0;
                  }));
                  return cnt;
                })()).sort((a,b)=>b[1].qty-a[1].qty).slice(0,15).map(([id, d], i) => `
                  <tr>
                    <td><strong>#${i+1}</strong></td>
                    <td>${Utils.esc(d.nombre)}</td>
                    <td style="font-size:.8rem">${Utils.esc(Utils.getCategoriaNombre(d.catId))}</td>
                    <td>${Utils.formatNumber(d.qty, 0)}</td>
                    <td><strong>${Utils.formatCurrency(d.importe)}</strong></td>
                  </tr>
                `).join('') || '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Sin datos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  exportResumenDia() {
    const today = Utils.today();
    const pedidos = DB.find('pedidos', p => p.fecha === today);
    const data = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Ruta: Utils.getRutaNombre(p.rutaId), Estado: p.estado, Total: p.total, Observaciones: p.observaciones||'' };
    });
    Utils.exportCSV(data, 'resumen_dia_' + today);
  },
  exportResumenDiaExcel() {
    const today = Utils.today();
    const pedidos = DB.find('pedidos', p => p.fecha === today);
    const data = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Ruta: Utils.getRutaNombre(p.rutaId), Estado: p.estado, Total: p.total };
    });
    Utils.exportExcel(data, 'resumen_dia_' + today);
  },
  exportAllPedidosCSV() {
    const pedidos = DB.get('pedidos');
    const data = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Ruta: Utils.getRutaNombre(p.rutaId), Estado: p.estado, Total: p.total };
    });
    Utils.exportCSV(data, 'pedidos_historico');
  },
  exportAllPedidosExcel() {
    const pedidos = DB.get('pedidos');
    const data = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Ruta: Utils.getRutaNombre(p.rutaId), Estado: p.estado, Total: p.total };
    });
    Utils.exportExcel(data, 'pedidos_historico');
  },
  printResumenDia() {
    const today = Utils.today();
    const pedidos = DB.find('pedidos', p => p.fecha === today);
    const total = pedidos.reduce((s,p) => s+(p.total||0), 0);
    const rows = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return `<tr><td>${Utils.esc(cli?.nombreNegocio||'')}</td><td>${Utils.esc(Utils.getRutaNombre(p.rutaId))}</td><td>${p.estado}</td><td>${Utils.formatCurrency(p.total)}</td></tr>`;
    }).join('');
    Utils.printSection(`
      <h1>Resumen Diario — ${Utils.formatDate(today, 'full')}</h1>
      <p>Total pedidos: ${pedidos.length} | Total: ${Utils.formatCurrency(total)}</p>
      <table><thead><tr><th>Cliente</th><th>Ruta</th><th>Estado</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    `, 'Resumen Diario');
  },

  // ─── AUDITORÍA ────────────────────────────────────────────
  renderAuditoria() {
    document.getElementById('page-title').textContent = 'Registro de Auditoría';
    document.getElementById('page-subtitle').textContent = 'Log de todas las acciones del sistema';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--outline btn--sm" id="btn-export-audit">📥 Exportar CSV</button>
    `;

    const records = Audit.getFiltered({});
    const acciones = Audit.getAcciones();

    setTimeout(() => {
      const apply = () => {
        const s = document.getElementById('audit-search')?.value.toLowerCase() || '';
        const a = document.getElementById('audit-accion')?.value || '';
        const desde = document.getElementById('audit-desde')?.value || '';
        const hasta = document.getElementById('audit-hasta')?.value || '';
        const filtered = Audit.getFiltered({ search: s, accion: a, desde, hasta });
        renderAuditTable(filtered);
      };
      ['audit-search','audit-accion','audit-desde','audit-hasta'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', apply);
      });
      document.getElementById('btn-export-audit')?.addEventListener('click', () => {
        const filtered = Audit.getFiltered({
          search: document.getElementById('audit-search')?.value || '',
          accion: document.getElementById('audit-accion')?.value || ''
        });
        Audit.exportCSV(filtered);
      });
    }, 0);

    const renderAuditTable = (recs) => {
      const tbody = document.getElementById('audit-tbody');
      if (!tbody) return;
      tbody.innerHTML = recs.slice(0, 100).map(r => `<tr>
        <td style="font-size:.8rem">${Utils.formatDate(r.timestamp, 'datetime')}</td>
        <td>
          <div style="font-size:.875rem;font-weight:500">${Utils.esc(r.usuarioEmail)}</div>
          <div>${Utils.rolBadge(r.usuarioRol)}</div>
        </td>
        <td>${Utils.auditIcon(r.accion)} ${Utils.esc(Utils.auditLabel(r.accion))}</td>
        <td style="font-size:.8rem">${Utils.esc(r.entidad)}</td>
        <td style="font-size:.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${Utils.esc(JSON.stringify(r.detalles||{}))}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Sin registros</td></tr>';
    };

    setTimeout(() => renderAuditTable(records), 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <div class="search-input" style="flex:1">
            <span class="search-icon">🔍</span>
            <input type="text" id="audit-search" placeholder="Buscar en auditoría...">
          </div>
          <select id="audit-accion" class="filter-select">
            <option value="">Todas las acciones</option>
            ${acciones.map(a => `<option value="${a}">${Utils.esc(Utils.auditLabel(a))}</option>`).join('')}
          </select>
          <input type="date" id="audit-desde" class="filter-select" style="min-width:130px" placeholder="Desde">
          <input type="date" id="audit-hasta" class="filter-select" style="min-width:130px" placeholder="Hasta">
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Fecha/Hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalles</th></tr></thead>
            <tbody id="audit-tbody"></tbody>
          </table>
        </div>
      </div>
    `;
  }
};
